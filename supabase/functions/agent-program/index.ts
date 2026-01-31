// @ts-ignore - resolved in Supabase Edge (Deno) runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1?target=es2022";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";
import { getSupabaseUser, isServiceRoleRequest } from "../_shared/auth.ts";
import { getOneSignalAppId, oneSignalCreateOrUpdateUser, oneSignalSendEmail } from "../_shared/onesignal.ts";
import { renderTemplate } from "../_shared/template.ts";

declare const Deno: {
    env: {
        get(key: string): string | undefined;
    };
};

type NotificationTemplateRow = {
    key: string;
    channel: "email";
    locale: string;
    subject_template: string;
    html_template: string;
    is_active: boolean;
};

async function loadEmailTemplate(params: {
    supabaseAdmin: ReturnType<typeof createClient>;
    templateKey: string;
    locale: string;
}): Promise<NotificationTemplateRow | null> {
    const locale = (params.locale || "en").toLowerCase();

    const { data: templateRow, error: templateErr } = await params.supabaseAdmin
        .from("notification_templates")
        .select("key, channel, locale, subject_template, html_template, is_active")
        .eq("key", params.templateKey)
        .eq("channel", "email")
        .eq("locale", locale)
        .eq("is_active", true)
        .maybeSingle<NotificationTemplateRow>();

    if (templateErr) throw new Error(`Failed to load template: ${templateErr.message}`);
    if (templateRow) return templateRow;

    if (locale !== "en") {
        const { data: fallback, error: fallbackErr } = await params.supabaseAdmin
            .from("notification_templates")
            .select("key, channel, locale, subject_template, html_template, is_active")
            .eq("key", params.templateKey)
            .eq("channel", "email")
            .eq("locale", "en")
            .eq("is_active", true)
            .maybeSingle<NotificationTemplateRow>();

        if (fallbackErr) throw new Error(`Failed to load fallback template: ${fallbackErr.message}`);
        return fallback ?? null;
    }

    return null;
}

async function sendAgentStatusEmail(params: {
    supabaseAdmin: ReturnType<typeof createClient>;
    templateKey: string;
    locale: string;
    agentApplicationId: string;
    agentEmail: string;
    payload: Record<string, unknown>;
    emailPreheader?: string;
    name?: string;
}): Promise<{ onesignal_message_id: string; onesignal_response: unknown }> {
    const tpl = await loadEmailTemplate({
        supabaseAdmin: params.supabaseAdmin,
        templateKey: params.templateKey,
        locale: params.locale,
    });

    if (!tpl) {
        throw new Error(`Template not found: ${params.templateKey} (email/${params.locale})`);
    }

    const subject = renderTemplate(tpl.subject_template, params.payload);
    const html = renderTemplate(tpl.html_template, params.payload);

    // Agents are not Supabase Auth users; we treat the application id as OneSignal external_id.
    const appId = getOneSignalAppId();
    await oneSignalCreateOrUpdateUser(appId, {
        identity: { external_id: params.agentApplicationId },
        properties: { language: params.locale },
        subscriptions: [{ type: "Email", token: params.agentEmail, enabled: true }],
    });

    const idempotencyKey = crypto.randomUUID();
    const oneSignalResp = await oneSignalSendEmail({
        app_id: appId,
        target_channel: "email",
        include_aliases: { external_id: [params.agentApplicationId] },
        email_subject: subject,
        email_body: html,
        email_preheader: params.emailPreheader,
        name: params.name ?? params.templateKey,
        idempotency_key: idempotencyKey,
    });

    const messageId = oneSignalResp?.id ?? "";
    if (!messageId) {
        throw new Error(
            "OneSignal accepted request but returned empty message id (no valid email subscriptions?)"
        );
    }

    return { onesignal_message_id: messageId, onesignal_response: oneSignalResp };
}

function getRequestIp(req: Request): string | null {
    const hdr =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-real-ip") ||
        req.headers.get("x-forwarded-for") ||
        null;
    if (!hdr) return null;
    // x-forwarded-for may contain multiple
    return hdr.split(",")[0]?.trim() || null;
}

function parseDataUrlImage(input: string): { mime: string; bytes: Uint8Array; ext: string } {
    const s = String(input || "");
    const m = s.match(/^data:(image\/png|image\/jpeg);base64,([a-zA-Z0-9+/=\n\r]+)$/);
    if (!m) throw new Error("Invalid signature data URL (expected data:image/png;base64,... or data:image/jpeg;base64,...)");
    const mime = m[1]!;
    const b64 = m[2]!.replace(/\s+/g, "");
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const ext = mime === "image/png" ? "png" : "jpg";
    return { mime, bytes, ext };
}

function bytesFromBlob(blob: Blob): Promise<Uint8Array> {
    return blob.arrayBuffer().then((b) => new Uint8Array(b));
}

function buildContractPayload(params: { application: any; developerId: string | null }): Record<string, unknown> {
    const app = params.application ?? {};
    const agent = {
        id: String(app.id ?? ""),
        full_name: String(app.full_name ?? ""),
        email: String(app.email ?? ""),
        phone: String(app.phone ?? ""),
    };

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    return {
        agent,
        application: {
            id: String(app.id ?? ""),
            created_at: String(app.created_at ?? ""),
        },
        developer: { id: params.developerId ? String(params.developerId) : "" },
        date: { today: `${yyyy}-${mm}-${dd}` },
    };
}

async function renderDocx(templateBytes: Uint8Array, payload: Record<string, unknown>): Promise<Uint8Array> {
    const zip = await JSZip.loadAsync(templateBytes);
    const docPath = "word/document.xml";
    const docFile = zip.file(docPath);
    if (!docFile) throw new Error("Invalid DOCX: missing word/document.xml");

    const xml = await docFile.async("string");
    const renderedXml = renderTemplate(xml, payload);
    zip.file(docPath, renderedXml);

    const out = await zip.generateAsync({ type: "uint8array" });
    return out;
}

async function canManageDeveloper(opts: {
    supabaseAdmin: ReturnType<typeof createClient>;
    userId: string;
    developerId: string | null;
}): Promise<boolean> {
    if (!opts.developerId) return false;
    if (opts.userId === opts.developerId) return true;

    const { data, error } = await opts.supabaseAdmin
        .from("manager_accounts")
        .select("id, status")
        .eq("manager_id", opts.userId)
        .eq("developer_id", opts.developerId)
        .limit(1)
        .maybeSingle();

    if (error) return false;
    return !!data?.id && String((data as any)?.status || "") === "active";
}

serve(async (req) => {
    const origin = req.headers.get("Origin");
    if (req.method === "OPTIONS") return createCorsResponse(origin);

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        const contractsBucket = "project-files";
        const signaturesBucket = "project-images";

        const contentType = req.headers.get("content-type") ?? "";
        const isMultipart = contentType.toLowerCase().includes("multipart/form-data");

        const body = isMultipart ? null : await req.json().catch(() => null);
        const form = isMultipart ? await req.formData().catch(() => null) : null;

        const actionFromForm = form ? form.get("action") : null;
        const actionFromJson = body && typeof body === "object" ? (body as any)?.action : null;
        const action = typeof actionFromForm === "string" && actionFromForm ? actionFromForm : actionFromJson;

        if (!action || typeof action !== "string") {
            return createJsonResponse({ error: "Missing action" }, 400, origin);
        }

        const safeBody = (body && typeof body === "object") ? (body as Record<string, unknown>) : {};
        const developer_id = safeBody.developer_id;
        const full_name = safeBody.full_name;
        const email = safeBody.email;
        const phone = safeBody.phone;
        const bank_details = safeBody.bank_details;

        /**
         * Public: list developer contract PDFs (no auth required).
         */
        if (action === "list_contracts") {
            if (!developer_id || typeof developer_id !== "string") {
                return createJsonResponse({ error: "Missing developer_id" }, 400, origin);
            }

            const basePath = `agent-contracts/${developer_id}`;

            const { data: files, error: listError } = await supabaseAdmin.storage
                .from(contractsBucket)
                .list(basePath, { limit: 100, offset: 0, sortBy: { column: "name", order: "asc" } });

            if (listError) {
                // If the folder doesn't exist yet, treat as no contracts.
                return createJsonResponse({ success: true, contracts: [] }, 200, origin);
            }

            const contracts = (files ?? [])
                .filter((f: any) => {
                    if (!f || typeof f.name !== "string") return false;
                    const n = f.name.toLowerCase();
                    return n.endsWith(".pdf") || n.endsWith(".docx");
                })
                .map((f: any) => {
                    const path = `${basePath}/${f.name}`;
                    const { data: urlData } = supabaseAdmin.storage.from(contractsBucket).getPublicUrl(path);
                    return {
                        name: f.name,
                        path,
                        url: urlData?.publicUrl ?? null,
                        updated_at: f.updated_at ?? null,
                        created_at: f.created_at ?? null,
                        metadata: f.metadata ?? null,
                    };
                })
                .filter((c: any) => !!c.url);

            return createJsonResponse({ success: true, contracts }, 200, origin);
        }

        /**
         * Auth (agent): render a contract template with variables for preview.
         * Body: { action: 'render_contract', application_id, contract_path }
         *
         * Notes:
         * - For DOCX we render `{{...}}` placeholders inside word/document.xml and upload
         *   the rendered file to `project-files/agent-contracts-rendered/<appId>/preview.docx`.
         * - For PDF we return the original URL (no server-side replacement).
         */
        if (action === "render_contract") {
            const user = await getSupabaseUser(req);
            if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const applicationId = (body as any)?.application_id;
            const contractPath = (body as any)?.contract_path;
            if (!applicationId || typeof applicationId !== "string") {
                return createJsonResponse({ error: "Missing application_id" }, 400, origin);
            }
            if (!contractPath || typeof contractPath !== "string") {
                return createJsonResponse({ error: "Missing contract_path" }, 400, origin);
            }

            const { data: application, error: appError } = await supabaseAdmin
                .from("agent_applications")
                .select("id, agent_user_id, email, developer_user_id, full_name, phone, created_at, status")
                .eq("id", applicationId)
                .single();
            if (appError || !application) {
                return createJsonResponse({ error: "Application not found", details: appError?.message }, 404, origin);
            }

            const claimedAgentUserId = (application as any)?.agent_user_id ? String((application as any).agent_user_id) : null;
            const appEmail = String((application as any)?.email ?? "");
            const userEmail = typeof user.email === "string" ? user.email : "";
            const canView =
                claimedAgentUserId === user.id ||
                (!claimedAgentUserId && userEmail && appEmail && userEmail.toLowerCase() === appEmail.toLowerCase());
            if (!canView) return createJsonResponse({ error: "Forbidden" }, 403, origin);

            const developerUserId = (application as any)?.developer_user_id ? String((application as any).developer_user_id) : null;
            const expectedPrefix = `agent-contracts/${developerUserId ?? ""}/`;
            if (!developerUserId || !contractPath.startsWith(expectedPrefix)) {
                return createJsonResponse({ error: "Invalid contract_path" }, 400, origin);
            }

            const lower = contractPath.toLowerCase();
            const isDocx = lower.endsWith(".docx");
            const isPdf = lower.endsWith(".pdf");
            if (!isDocx && !isPdf) return createJsonResponse({ error: "Only PDF or DOCX allowed" }, 400, origin);

            if (isPdf) {
                const { data: urlData } = supabaseAdmin.storage.from(contractsBucket).getPublicUrl(contractPath);
                return createJsonResponse({ success: true, mime: "application/pdf", url: urlData?.publicUrl ?? null, path: contractPath }, 200, origin);
            }

            const { data: tplBlob, error: dlErr } = await supabaseAdmin.storage.from(contractsBucket).download(contractPath);
            if (dlErr) throw dlErr;
            if (!tplBlob) throw new Error("Failed to download DOCX template");

            const payload = buildContractPayload({ application, developerId: developerUserId });
            const renderedBytes = await renderDocx(await bytesFromBlob(tplBlob), payload);

            const previewPath = `agent-contracts-rendered/${applicationId}/preview.docx`;
            const { error: upErr } = await supabaseAdmin.storage.from(contractsBucket).upload(
                previewPath,
                new Blob([renderedBytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
                { upsert: true, contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
            );
            if (upErr) throw upErr;

            const { data: urlData } = supabaseAdmin.storage.from(contractsBucket).getPublicUrl(previewPath);
            return createJsonResponse(
                { success: true, mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", url: urlData?.publicUrl ?? null, path: previewPath },
                200,
                origin
            );
        }

        /**
         * Auth (developer/manager): list developer contracts/templates.
         */
        if (action === "list_developer_contracts") {
            const user = await getSupabaseUser(req);
            if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const developerUserId =
                typeof (safeBody as any)?.developer_user_id === "string" && (safeBody as any).developer_user_id
                    ? String((safeBody as any).developer_user_id)
                    : user.id;

            const allowed = await canManageDeveloper({ supabaseAdmin, userId: user.id, developerId: developerUserId });
            if (!allowed) return createJsonResponse({ error: "Forbidden" }, 403, origin);

            const basePath = `agent-contracts/${developerUserId}`;
            const { data: files, error: listError } = await supabaseAdmin.storage
                .from(contractsBucket)
                .list(basePath, { limit: 100, offset: 0, sortBy: { column: "name", order: "asc" } });
            if (listError) throw listError;

            const contracts = (files ?? [])
                .filter((f: any) => {
                    if (!f || typeof f.name !== "string") return false;
                    const n = f.name.toLowerCase();
                    return n.endsWith(".pdf") || n.endsWith(".docx");
                })
                .map((f: any) => {
                    const path = `${basePath}/${f.name}`;
                    const { data: urlData } = supabaseAdmin.storage.from(contractsBucket).getPublicUrl(path);
                    return { name: f.name, path, url: urlData?.publicUrl ?? null };
                })
                .filter((c: any) => !!c.url);

            return createJsonResponse({ success: true, contracts }, 200, origin);
        }

        /**
         * Auth (developer/manager): upload a contract template (DOCX/PDF) via multipart/form-data.
         * Fields: action=upload_developer_contract, developer_user_id?, file
         */
        if (action === "upload_developer_contract") {
            if (!form) return createJsonResponse({ error: "Expected multipart/form-data" }, 400, origin);
            const user = await getSupabaseUser(req);
            if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const developerUserIdRaw = form.get("developer_user_id");
            const developerUserId =
                typeof developerUserIdRaw === "string" && developerUserIdRaw
                    ? developerUserIdRaw
                    : user.id;

            const allowed = await canManageDeveloper({ supabaseAdmin, userId: user.id, developerId: developerUserId });
            if (!allowed) return createJsonResponse({ error: "Forbidden" }, 403, origin);

            const file = form.get("file");
            if (!(file instanceof File)) return createJsonResponse({ error: "Missing file" }, 400, origin);

            const lower = String(file.name || "").toLowerCase();
            const isPdf = lower.endsWith(".pdf");
            const isDocx = lower.endsWith(".docx");
            if (!isPdf && !isDocx) return createJsonResponse({ error: "Only PDF or DOCX allowed" }, 400, origin);

            const safeName = String(file.name || "contract")
                .trim()
                .replace(/\s+/g, "_")
                .replace(/[^a-zA-Z0-9._-]/g, "_")
                .replace(/_+/g, "_");

            const basePath = `agent-contracts/${developerUserId}`;
            const path = `${basePath}/${safeName}`;

            const contentType = isDocx
                ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                : "application/pdf";

            const { error: uploadError } = await supabaseAdmin.storage
                .from(contractsBucket)
                .upload(path, file, { upsert: true, contentType });
            if (uploadError) throw uploadError;

            // Create or update template metadata
            const nowIso = new Date().toISOString();
            const langMatch = safeName.match(/[._-](RU|EN|ru|en)[._-]/i);
            const lang = langMatch ? langMatch[1]!.toUpperCase() : "RU";

            const { data: existingTemplate } = await supabaseAdmin
                .from("agent_contract_templates")
                .select("id")
                .eq("developer_user_id", developerUserId)
                .eq("name", safeName)
                .maybeSingle();

            if (existingTemplate?.id) {
                // Update existing template
                await supabaseAdmin
                    .from("agent_contract_templates")
                    .update({ storage_path: path, updated_at: nowIso })
                    .eq("id", existingTemplate.id);
            } else {
                // Create new template
                await supabaseAdmin.from("agent_contract_templates").insert({
                    developer_user_id: developerUserId,
                    name: safeName,
                    lang,
                    storage_path: path,
                    content_html: null,
                });
            }

            const { data: urlData } = supabaseAdmin.storage.from(contractsBucket).getPublicUrl(path);
            return createJsonResponse({ success: true, contract: { name: safeName, path, url: urlData?.publicUrl ?? null } }, 200, origin);
        }

        /**
         * Auth (developer/manager): delete a contract by path.
         * Body: { action: 'delete_developer_contract', developer_user_id?, path }
         */
        if (action === "delete_developer_contract") {
            const user = await getSupabaseUser(req);
            if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const developerUserId =
                typeof (safeBody as any)?.developer_user_id === "string" && (safeBody as any).developer_user_id
                    ? String((safeBody as any).developer_user_id)
                    : user.id;
            const allowed = await canManageDeveloper({ supabaseAdmin, userId: user.id, developerId: developerUserId });
            if (!allowed) return createJsonResponse({ error: "Forbidden" }, 403, origin);

            const path = (safeBody as any)?.path;
            if (!path || typeof path !== "string") return createJsonResponse({ error: "Missing path" }, 400, origin);

            const prefix = `agent-contracts/${developerUserId}/`;
            if (!path.startsWith(prefix)) return createJsonResponse({ error: "Invalid path" }, 400, origin);

            const { error } = await supabaseAdmin.storage.from(contractsBucket).remove([path]);
            if (error) throw error;
            return createJsonResponse({ success: true }, 200, origin);
        }

        /**
         * Auth (developer/manager): upload developer signature/stamp via multipart/form-data.
         * Fields: action=upload_developer_asset, developer_user_id?, asset_type=signature|stamp, file(PNG)
         */
        if (action === "upload_developer_asset") {
            if (!form) return createJsonResponse({ error: "Expected multipart/form-data" }, 400, origin);
            const user = await getSupabaseUser(req);
            if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const developerUserIdRaw = form.get("developer_user_id");
            const developerUserId =
                typeof developerUserIdRaw === "string" && developerUserIdRaw
                    ? developerUserIdRaw
                    : user.id;

            const allowed = await canManageDeveloper({ supabaseAdmin, userId: user.id, developerId: developerUserId });
            if (!allowed) return createJsonResponse({ error: "Forbidden" }, 403, origin);

            const assetType = form.get("asset_type");
            if (assetType !== "signature" && assetType !== "stamp") {
                return createJsonResponse({ error: "Invalid asset_type" }, 400, origin);
            }

            const file = form.get("file");
            if (!(file instanceof File)) return createJsonResponse({ error: "Missing file" }, 400, origin);
            if (String(file.type) !== "image/png" && !String(file.name || "").toLowerCase().endsWith(".png")) {
                return createJsonResponse({ error: "Only PNG allowed" }, 400, origin);
            }

            const path = `agency-assets/${developerUserId}/${assetType}.png`;
            const { error: uploadError } = await supabaseAdmin.storage
                .from(signaturesBucket)
                .upload(path, file, { upsert: true, contentType: "image/png" });
            if (uploadError) throw uploadError;

            const patch =
                assetType === "signature"
                    ? { developer_signature_path: path }
                    : { developer_stamp_path: path };

            const { error: upErr } = await supabaseAdmin
                .from("agent_program_settings")
                .upsert({ developer_user_id: developerUserId, updated_at: new Date().toISOString(), ...patch }, { onConflict: "developer_user_id" });
            if (upErr) throw upErr;

            const { data: urlData } = supabaseAdmin.storage.from(signaturesBucket).getPublicUrl(path);
            return createJsonResponse({ success: true, path, url: urlData?.publicUrl ?? null }, 200, origin);
        }

        /**
         * Auth (developer/manager): clear developer signature/stamp.
         * Body: { action: 'clear_developer_asset', developer_user_id?, asset_type }
         */
        if (action === "clear_developer_asset") {
            const user = await getSupabaseUser(req);
            if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const developerUserId =
                typeof (safeBody as any)?.developer_user_id === "string" && (safeBody as any).developer_user_id
                    ? String((safeBody as any).developer_user_id)
                    : user.id;
            const allowed = await canManageDeveloper({ supabaseAdmin, userId: user.id, developerId: developerUserId });
            if (!allowed) return createJsonResponse({ error: "Forbidden" }, 403, origin);

            const assetType = (safeBody as any)?.asset_type;
            if (assetType !== "signature" && assetType !== "stamp") {
                return createJsonResponse({ error: "Invalid asset_type" }, 400, origin);
            }

            const column = assetType === "signature" ? "developer_signature_path" : "developer_stamp_path";
            const { data: current } = await supabaseAdmin
                .from("agent_program_settings")
                .select(column)
                .eq("developer_user_id", developerUserId)
                .maybeSingle();

            const currentPath = current ? String((current as any)[column] ?? "") : "";
            await supabaseAdmin
                .from("agent_program_settings")
                .upsert({ developer_user_id: developerUserId, updated_at: new Date().toISOString(), [column]: null }, { onConflict: "developer_user_id" });

            if (currentPath) {
                await supabaseAdmin.storage.from(signaturesBucket).remove([currentPath]).catch(() => null);
            }

            return createJsonResponse({ success: true }, 200, origin);
        }

        /**
         * Auth (developer/manager): list contract templates with metadata.
         * Body: { action: 'list_contract_templates', developer_user_id? }
         */
        if (action === "list_contract_templates") {
            const user = await getSupabaseUser(req);
            if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const developerUserId =
                typeof (safeBody as any)?.developer_user_id === "string" && (safeBody as any).developer_user_id
                    ? String((safeBody as any).developer_user_id)
                    : user.id;

            const allowed = await canManageDeveloper({ supabaseAdmin, userId: user.id, developerId: developerUserId });
            if (!allowed) return createJsonResponse({ error: "Forbidden" }, 403, origin);

            const { data: templates, error } = await supabaseAdmin
                .from("agent_contract_templates")
                .select("id, name, lang, content_html, storage_path, created_at, updated_at")
                .eq("developer_user_id", developerUserId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Get public URLs for storage paths
            const templatesWithUrls = (templates ?? []).map((t: any) => {
                const { data: urlData } = supabaseAdmin.storage.from(contractsBucket).getPublicUrl(t.storage_path);
                return {
                    ...t,
                    url: urlData?.publicUrl ?? null,
                    date: new Date(t.created_at).toISOString().split("T")[0],
                };
            });

            return createJsonResponse({ success: true, templates: templatesWithUrls }, 200, origin);
        }

        /**
         * Auth (developer/manager): create or update contract template.
         * Body: { action: 'save_contract_template', developer_user_id?, id?, name, lang?, content_html?, storage_path }
         */
        if (action === "save_contract_template") {
            const user = await getSupabaseUser(req);
            if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const developerUserId =
                typeof (safeBody as any)?.developer_user_id === "string" && (safeBody as any).developer_user_id
                    ? String((safeBody as any).developer_user_id)
                    : user.id;

            const allowed = await canManageDeveloper({ supabaseAdmin, userId: user.id, developerId: developerUserId });
            if (!allowed) return createJsonResponse({ error: "Forbidden" }, 403, origin);

            const templateId = typeof (safeBody as any)?.id === "number" ? Number((safeBody as any).id) : null;
            const name = typeof (safeBody as any)?.name === "string" ? String((safeBody as any).name) : null;
            const lang = typeof (safeBody as any)?.lang === "string" ? String((safeBody as any).lang) : "RU";
            const contentHtml = typeof (safeBody as any)?.content_html === "string" ? String((safeBody as any).content_html) : null;
            const storagePath = typeof (safeBody as any)?.storage_path === "string" ? String((safeBody as any).storage_path) : null;

            if (!name) return createJsonResponse({ error: "Missing name" }, 400, origin);

            const nowIso = new Date().toISOString();
            const payload: any = {
                developer_user_id: developerUserId,
                name,
                lang,
                updated_at: nowIso,
            };

            if (contentHtml !== null) payload.content_html = contentHtml;
            if (storagePath !== null) payload.storage_path = storagePath;

            let result;
            if (templateId) {
                // Update existing
                const { data, error } = await supabaseAdmin
                    .from("agent_contract_templates")
                    .update(payload)
                    .eq("id", templateId)
                    .eq("developer_user_id", developerUserId)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
            } else {
                // Create new
                if (!storagePath) return createJsonResponse({ error: "Missing storage_path for new template" }, 400, origin);
                payload.created_at = nowIso;
                const { data, error } = await supabaseAdmin.from("agent_contract_templates").insert(payload).select().single();
                if (error) throw error;
                result = data;
            }

            const { data: urlData } = supabaseAdmin.storage.from(contractsBucket).getPublicUrl(result.storage_path);
            return createJsonResponse(
                {
                    success: true,
                    template: {
                        ...result,
                        url: urlData?.publicUrl ?? null,
                        date: new Date(result.created_at).toISOString().split("T")[0],
                    },
                },
                200,
                origin
            );
        }

        /**
         * Auth (developer/manager): delete contract template.
         * Body: { action: 'delete_contract_template', developer_user_id?, id }
         */
        if (action === "delete_contract_template") {
            const user = await getSupabaseUser(req);
            if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const developerUserId =
                typeof (safeBody as any)?.developer_user_id === "string" && (safeBody as any).developer_user_id
                    ? String((safeBody as any).developer_user_id)
                    : user.id;

            const allowed = await canManageDeveloper({ supabaseAdmin, userId: user.id, developerId: developerUserId });
            if (!allowed) return createJsonResponse({ error: "Forbidden" }, 403, origin);

            const templateId = typeof (safeBody as any)?.id === "number" ? Number((safeBody as any).id) : null;
            if (!templateId) return createJsonResponse({ error: "Missing id" }, 400, origin);

            // Get storage path before deleting
            const { data: template, error: getErr } = await supabaseAdmin
                .from("agent_contract_templates")
                .select("storage_path")
                .eq("id", templateId)
                .eq("developer_user_id", developerUserId)
                .maybeSingle();
            if (getErr) throw getErr;
            if (!template) return createJsonResponse({ error: "Template not found" }, 404, origin);

            // Delete from database
            const { error: delErr } = await supabaseAdmin
                .from("agent_contract_templates")
                .delete()
                .eq("id", templateId)
                .eq("developer_user_id", developerUserId);
            if (delErr) throw delErr;

            // Optionally delete from storage (but keep it for now in case it's referenced)
            // await supabaseAdmin.storage.from(contractsBucket).remove([template.storage_path]).catch(() => null);

            return createJsonResponse({ success: true }, 200, origin);
        }

        /**
         * Public (legacy) + Auth (preferred): agent submits application.
         * If authenticated, we link it to `agent_user_id` and de-duplicate by (developer_user_id, agent_user_id).
         */
        if (action === "submit_application") {
            const devId = developer_id;
            if (!devId || typeof devId !== "string") {
                return createJsonResponse({ error: "Missing developer_id" }, 400, origin);
            }
            if (!full_name || typeof full_name !== "string" || !email || typeof email !== "string" || !phone || typeof phone !== "string") {
                return createJsonResponse({ error: "Missing required fields" }, 400, origin);
            }

            const authUser = await getSupabaseUser(req);
            const agentUserId = authUser?.id ?? null;

            // If authenticated, try to upsert by unique (developer_user_id, agent_user_id).
            if (agentUserId) {
                const { data: existing, error: existingErr } = await supabaseAdmin
                    .from("agent_applications")
                    .select("id, status")
                    .eq("developer_user_id", devId)
                    .eq("agent_user_id", agentUserId)
                    .limit(1)
                    .maybeSingle();
                if (existingErr) throw existingErr;

                if (existing?.id) {
                    const { data: updated, error: updErr } = await supabaseAdmin
                        .from("agent_applications")
                        .update({
                            full_name,
                            email,
                            phone,
                            bank_details: (bank_details && typeof bank_details === "object") ? bank_details : (bank_details ? { details: bank_details } : {}),
                        })
                        .eq("id", existing.id)
                        .select()
                        .single();
                    if (updErr) throw updErr;
                    return createJsonResponse({ success: true, data: updated }, 200, origin);
                }
            }

            const insertPayload: Record<string, unknown> = {
                developer_user_id: devId,
                full_name,
                email,
                phone,
                bank_details: (bank_details && typeof bank_details === "object") ? bank_details : (bank_details ? { details: bank_details } : {}),
                status: "pending",
            };
            if (agentUserId) insertPayload.agent_user_id = agentUserId;

            const { data, error } = await supabaseAdmin.from("agent_applications").insert(insertPayload).select().single();

            if (error) throw error;
            return createJsonResponse({ success: true, data }, 200, origin);
        }

        /**
         * Auth (agent): list my applications.
         */
        if (action === "list_my_applications") {
            const user = await getSupabaseUser(req);
            if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const userEmail = typeof user.email === "string" ? user.email : null;
            let q = supabaseAdmin
                .from("agent_applications")
                .select("id, developer_user_id, status, rejection_reason, full_name, email, phone, bank_details, type, commission_rate, agreement_signed, agreement_signed_at, signature_path, signature_method, contract_template_path, signed_contract_path, signed_contract_mime, signed_contract_created_at, created_at, reviewed_at")
                .order("created_at", { ascending: false });

            if (userEmail) {
                q = q.or(`agent_user_id.eq.${user.id},email.eq.${userEmail}`);
            } else {
                q = q.eq("agent_user_id", user.id);
            }

            const { data, error } = await q;
            if (error) throw error;

            const rows = (data ?? []).map((r: any) => {
                const signatureUrl = r?.signature_path
                    ? supabaseAdmin.storage.from(signaturesBucket).getPublicUrl(String(r.signature_path)).data.publicUrl
                    : null;
                const signedContractUrl = r?.signed_contract_path
                    ? supabaseAdmin.storage.from(contractsBucket).getPublicUrl(String(r.signed_contract_path)).data.publicUrl
                    : null;
                return { ...r, signature_url: signatureUrl, signed_contract_url: signedContractUrl };
            });

            return createJsonResponse({ success: true, applications: rows }, 200, origin);
        }

        /**
         * Auth (agent): sign agreement with drawn/uploaded signature image.
         */
        if (action === "sign_agreement") {
            const user = await getSupabaseUser(req);
            if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const applicationId = (body as any)?.application_id;
            const signatureDataUrl = (body as any)?.signature_data_url;
            const method = (body as any)?.signature_method;
            const accepted = (body as any)?.accepted === true;
            const contractTemplatePath =
                typeof (body as any)?.contract_template_path === "string" && (body as any).contract_template_path
                    ? String((body as any).contract_template_path)
                    : null;

            if (!applicationId || typeof applicationId !== "string") {
                return createJsonResponse({ error: "Missing application_id" }, 400, origin);
            }
            if (!signatureDataUrl || typeof signatureDataUrl !== "string") {
                return createJsonResponse({ error: "Missing signature_data_url" }, 400, origin);
            }
            if (method !== "draw" && method !== "upload") {
                return createJsonResponse({ error: "Invalid signature_method" }, 400, origin);
            }
            if (!accepted) {
                return createJsonResponse({ error: "Must accept agreement" }, 400, origin);
            }

            const { data: application, error: appError } = await supabaseAdmin
                .from("agent_applications")
                .select("id, agent_user_id, email, agreement_signed, developer_user_id, full_name, phone, created_at")
                .eq("id", applicationId)
                .single();
            if (appError || !application) {
                return createJsonResponse({ error: "Application not found", details: appError?.message }, 404, origin);
            }

            const claimedAgentUserId = (application as any)?.agent_user_id ? String((application as any).agent_user_id) : null;
            const appEmail = String((application as any)?.email ?? "");
            const userEmail = typeof user.email === "string" ? user.email : "";

            const canSign =
                claimedAgentUserId === user.id ||
                (!claimedAgentUserId && userEmail && appEmail && userEmail.toLowerCase() === appEmail.toLowerCase());
            if (!canSign) return createJsonResponse({ error: "Forbidden" }, 403, origin);

            const { mime, bytes, ext } = parseDataUrlImage(signatureDataUrl);
            const path = `agent-signatures/${applicationId}/signature.${ext}`;
            const blob = new Blob([bytes], { type: mime });

            const { error: uploadError } = await supabaseAdmin.storage.from(signaturesBucket).upload(path, blob, {
                upsert: true,
                contentType: mime,
            });
            if (uploadError) throw uploadError;

            const nowIso = new Date().toISOString();
            const signatureMeta = {
                signed_at: nowIso,
                ip: getRequestIp(req),
                user_agent: req.headers.get("user-agent") ?? null,
                accepted: true,
                contract_template_path: contractTemplatePath,
            };

            const updatePayload: Record<string, unknown> = {
                agreement_signed: true,
                agreement_signed_at: nowIso,
                signature_path: path,
                signature_method: method,
                signature_meta: signatureMeta,
            };
            if (!claimedAgentUserId) updatePayload.agent_user_id = user.id;

            // Snapshot filled contract at signing time (DOCX supported; PDF copied as-is).
            let signedContractPath: string | null = null;
            let signedContractMime: string | null = null;
            if (contractTemplatePath) {
                const developerUserId = (application as any)?.developer_user_id ? String((application as any).developer_user_id) : null;
                const expectedPrefix = `agent-contracts/${developerUserId ?? ""}/`;
                if (!developerUserId || !contractTemplatePath.startsWith(expectedPrefix)) {
                    return createJsonResponse({ error: "Invalid contract_template_path" }, 400, origin);
                }
                const lower = contractTemplatePath.toLowerCase();
                const isDocx = lower.endsWith(".docx");
                const isPdf = lower.endsWith(".pdf");
                if (!isDocx && !isPdf) return createJsonResponse({ error: "Only PDF or DOCX allowed" }, 400, origin);

                const { data: tplBlob, error: dlErr } = await supabaseAdmin.storage.from(contractsBucket).download(contractTemplatePath);
                if (dlErr) throw dlErr;
                if (!tplBlob) throw new Error("Failed to download contract template");

                const payload = buildContractPayload({ application, developerId: developerUserId });
                const outBytes = isDocx ? await renderDocx(await bytesFromBlob(tplBlob), payload) : await bytesFromBlob(tplBlob);

                const extOut = isDocx ? "docx" : "pdf";
                signedContractMime = isDocx
                    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    : "application/pdf";
                signedContractPath = `agent-signed-contracts/${applicationId}/contract-${nowIso.replace(/[:.]/g, "-")}.${extOut}`;

                const { error: upErr } = await supabaseAdmin.storage.from(contractsBucket).upload(
                    signedContractPath,
                    new Blob([outBytes], { type: signedContractMime }),
                    { upsert: true, contentType: signedContractMime }
                );
                if (upErr) throw upErr;

                updatePayload.contract_template_path = contractTemplatePath;
                updatePayload.signed_contract_path = signedContractPath;
                updatePayload.signed_contract_mime = signedContractMime;
                updatePayload.signed_contract_created_at = nowIso;
            }

            const { data: updated, error: updateErr } = await supabaseAdmin
                .from("agent_applications")
                .update(updatePayload)
                .eq("id", applicationId)
                .select()
                .single();
            if (updateErr) throw updateErr;

            const signatureUrl = supabaseAdmin.storage.from(signaturesBucket).getPublicUrl(path).data.publicUrl;
            const signedContractUrl = signedContractPath
                ? supabaseAdmin.storage.from(contractsBucket).getPublicUrl(signedContractPath).data.publicUrl
                : null;
            return createJsonResponse(
                { success: true, data: updated, signature_url: signatureUrl, signed_contract_url: signedContractUrl },
                200,
                origin
            );
        }

        /**
         * Auth (developer/manager): get agent program settings.
         */
        if (action === "get_agent_program_settings") {
            const user = await getSupabaseUser(req);
            if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const developerUserId =
                typeof (body as any)?.developer_user_id === "string" && (body as any).developer_user_id
                    ? String((body as any).developer_user_id)
                    : user.id;

            const allowed = await canManageDeveloper({ supabaseAdmin, userId: user.id, developerId: developerUserId });
            if (!allowed) return createJsonResponse({ error: "Forbidden" }, 403, origin);

            const { data, error } = await supabaseAdmin
                .from("agent_program_settings")
                .select("*")
                .eq("developer_user_id", developerUserId)
                .maybeSingle();
            if (error) throw error;

            const settings =
                data ??
                {
                    developer_user_id: developerUserId,
                    default_commission_rate: 4,
                    lead_lock_days: 30,
                    payout_terms: null,
                    developer_signature_path: null,
                    developer_stamp_path: null,
                };
            return createJsonResponse({ success: true, settings }, 200, origin);
        }

        /**
         * Auth (developer/manager): update agent program settings.
         */
        if (action === "update_agent_program_settings") {
            const user = await getSupabaseUser(req);
            if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const developerUserId =
                typeof (body as any)?.developer_user_id === "string" && (body as any).developer_user_id
                    ? String((body as any).developer_user_id)
                    : user.id;

            const allowed = await canManageDeveloper({ supabaseAdmin, userId: user.id, developerId: developerUserId });
            if (!allowed) return createJsonResponse({ error: "Forbidden" }, 403, origin);

            const defaultCommissionRate = (body as any)?.default_commission_rate;
            const leadLockDays = (body as any)?.lead_lock_days;
            const payoutTerms = (body as any)?.payout_terms;
            const developerSignaturePath = (body as any)?.developer_signature_path;
            const developerStampPath = (body as any)?.developer_stamp_path;

            const payload: Record<string, unknown> = {
                developer_user_id: developerUserId,
                updated_at: new Date().toISOString(),
            };
            if (typeof defaultCommissionRate === "number") payload.default_commission_rate = defaultCommissionRate;
            if (typeof leadLockDays === "number") payload.lead_lock_days = Math.max(0, Math.floor(leadLockDays));
            if (typeof payoutTerms === "string") payload.payout_terms = payoutTerms;
            if (typeof developerSignaturePath === "string" || developerSignaturePath === null) {
                payload.developer_signature_path = developerSignaturePath;
            }
            if (typeof developerStampPath === "string" || developerStampPath === null) {
                payload.developer_stamp_path = developerStampPath;
            }

            const { data, error } = await supabaseAdmin
                .from("agent_program_settings")
                .upsert(payload, { onConflict: "developer_user_id" })
                .select("*")
                .single();
            if (error) throw error;

            return createJsonResponse({ success: true, settings: data }, 200, origin);
        }

        /**
         * Auth (developer/manager): replace agent project access list.
         */
        if (action === "set_agent_access") {
            const user = await getSupabaseUser(req);
            if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const applicationId = (body as any)?.application_id;
            const projectIds = (body as any)?.project_ids;
            if (!applicationId || typeof applicationId !== "string") {
                return createJsonResponse({ error: "Missing application_id" }, 400, origin);
            }
            if (!Array.isArray(projectIds)) {
                return createJsonResponse({ error: "Missing project_ids" }, 400, origin);
            }

            const { data: application, error: appError } = await supabaseAdmin
                .from("agent_applications")
                .select("id, developer_user_id")
                .eq("id", applicationId)
                .single();
            if (appError || !application) {
                return createJsonResponse({ error: "Application not found", details: appError?.message }, 404, origin);
            }

            const developerUserId = (application as any)?.developer_user_id ? String((application as any).developer_user_id) : null;
            const allowed = await canManageDeveloper({ supabaseAdmin, userId: user.id, developerId: developerUserId });
            if (!allowed) return createJsonResponse({ error: "Forbidden" }, 403, origin);

            const requestedIds = projectIds.map((x: any) => String(x)).filter(Boolean);
            const { data: ownedProjects, error: ownedErr } = await supabaseAdmin
                .from("projects")
                .select("id")
                .eq("user_id", developerUserId)
                .in("id", requestedIds);
            if (ownedErr) throw ownedErr;

            const validIds = (ownedProjects ?? []).map((p: any) => String(p.id));

            const { error: delErr } = await supabaseAdmin.from("agent_access").delete().eq("agent_id", applicationId);
            if (delErr) throw delErr;

            if (validIds.length > 0) {
                const rows = validIds.map((pid) => ({ agent_id: applicationId, project_id: pid }));
                const { error: insErr } = await supabaseAdmin.from("agent_access").insert(rows);
                if (insErr) throw insErr;
            }

            return createJsonResponse({ success: true, project_ids: validIds }, 200, origin);
        }

        /**
         * Developer/manager: approve application -> activates + sends email via OneSignal.
         *
         * IMPORTANT:
         * - No Supabase Auth invites/magic-links.
         * - We still allow service-role calls for internal operations.
         */
        if (action === "approve_application") {
            const isService = isServiceRoleRequest(req);
            const user = isService ? null : await getSupabaseUser(req);
            if (!isService && !user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const applicationId = (body as any)?.application_id;
            const lang = typeof (body as any)?.lang === "string" && (body as any).lang ? (body as any).lang : "en";
            const requestSiteUrl = typeof (body as any)?.site_url === "string" ? (body as any).site_url : null;
            const explicitTemplateKey =
                typeof (body as any)?.template_key === "string" && String((body as any).template_key).trim()
                    ? String((body as any).template_key).trim()
                    : null;
            const emailPreheader = typeof (body as any)?.email_preheader === "string" ? (body as any).email_preheader : undefined;

            if (!applicationId || typeof applicationId !== "string") {
                return createJsonResponse({ error: "Missing application_id" }, 400, origin);
            }

            const { data: application, error: appError } = await supabaseAdmin
                .from("agent_applications")
                .select("id, developer_user_id, email, full_name, status, commission_rate")
                .eq("id", applicationId)
                .single();

            if (appError || !application) {
                return createJsonResponse(
                    { error: "Application not found", details: appError?.message },
                    404,
                    origin
                );
            }

            const developerUserId = (application as any)?.developer_user_id ? String((application as any).developer_user_id) : null;
            if (!isService && user?.id) {
                const allowed = await canManageDeveloper({ supabaseAdmin, userId: user.id, developerId: developerUserId });
                if (!allowed) return createJsonResponse({ error: "Forbidden" }, 403, origin);
            }

            // If commission is missing, set it from developer settings (fallback 4)
            let nextCommission = (application as any)?.commission_rate;
            if (nextCommission === null || nextCommission === undefined) {
                const { data: settings } = await supabaseAdmin
                    .from("agent_program_settings")
                    .select("default_commission_rate")
                    .eq("developer_user_id", developerUserId)
                    .maybeSingle();
                nextCommission = typeof (settings as any)?.default_commission_rate === "number" ? (settings as any).default_commission_rate : 4;
            }

            const { error: updateError } = await supabaseAdmin
                .from("agent_applications")
                // DB uses a CHECK constraint (typically: pending/approved/rejected)
                .update({ status: "approved", reviewed_at: new Date().toISOString(), commission_rate: nextCommission })
                .eq("id", applicationId);

            if (updateError) throw updateError;

            // Grant access to developer's projects by default (MVP)
            const { data: developerProjects, error: projectsError } = await supabaseAdmin
                .from("projects")
                .select("id")
                .eq("user_id", developerUserId)
                .eq("is_public", true);

            if (projectsError) throw projectsError;

            const projectIds: string[] = (developerProjects ?? [])
                .map((p: any) => p?.id)
                .filter((id: any) => typeof id === "string");

            if (projectIds.length > 0) {
                const { data: existingAccess, error: accessError } = await supabaseAdmin
                    .from("agent_access")
                    .select("project_id")
                    .eq("agent_id", applicationId);

                if (accessError) throw accessError;

                const existingIds = new Set(
                    (existingAccess ?? [])
                        .map((r: any) => r?.project_id)
                        .filter((id: any) => typeof id === "string")
                );

                const rowsToInsert = projectIds
                    .filter((projectId) => !existingIds.has(projectId))
                    .map((projectId) => ({
                        agent_id: applicationId,
                        project_id: projectId,
                    }));

                if (rowsToInsert.length > 0) {
                    const { error: insertError } = await supabaseAdmin
                        .from("agent_access")
                        .insert(rowsToInsert);
                    if (insertError) throw insertError;
                }
            }

            const envSiteUrl = Deno.env.get("SITE_URL") || "";
            const siteUrlRaw = requestSiteUrl || envSiteUrl || origin || "https://gridix.live";
            const siteUrl = siteUrlRaw.endsWith("/") ? siteUrlRaw.slice(0, -1) : siteUrlRaw;
            const accessLink = `${siteUrl}/${lang}/projects/agent/${applicationId}`;

            // Send email to agent with status + access link (via OneSignal templates)
            const payload: Record<string, unknown> = {
                app: { url: siteUrl },
                agent: {
                    id: applicationId,
                    status: "approved",
                    full_name: (application as any)?.full_name ?? "",
                    email: (application as any)?.email ?? "",
                    access_link: accessLink,
                },
                developer: { id: (application as any)?.developer_user_id ?? "" },
            };

            // If caller didn't specify a template, try known keys in order and use the first that exists.
            // This keeps backward compatibility with environments that already have generic templates.
            let templateKeyToUse: string | null = explicitTemplateKey;
            if (templateKeyToUse) {
                const exists = await loadEmailTemplate({ supabaseAdmin: supabaseAdmin, templateKey: templateKeyToUse, locale: lang });
                if (!exists) {
                    return createJsonResponse(
                        { error: "Template not found", template_key: templateKeyToUse, locale: lang },
                        404,
                        origin
                    );
                }
            } else {
                const candidates = ["agent_application_approved", "welcome_email", "test_welcome"];
                for (const k of candidates) {
                    const exists = await loadEmailTemplate({ supabaseAdmin: supabaseAdmin, templateKey: k, locale: lang });
                    if (exists) {
                        templateKeyToUse = k;
                        break;
                    }
                }
                if (!templateKeyToUse) {
                    return createJsonResponse(
                        { error: "Template not found", tried: candidates, locale: lang },
                        404,
                        origin
                    );
                }
            }

            const { onesignal_message_id, onesignal_response } = await sendAgentStatusEmail({
                supabaseAdmin: supabaseAdmin,
                templateKey: templateKeyToUse,
                locale: lang,
                agentApplicationId: applicationId,
                agentEmail: String((application as any)?.email ?? ""),
                payload,
                emailPreheader,
                name: "agent-program:approve_application",
            });

            return createJsonResponse(
                {
                    success: true,
                    status: "approved",
                    access_link: accessLink,
                    template_key: templateKeyToUse,
                    onesignal_message_id,
                    onesignal_response,
                },
                200,
                origin
            );
        }

        /**
         * Developer/manager: updates application status.
         * Optionally sends OneSignal email using a template for the new status.
         */
        if (action === "update_application_status") {
            const isService = isServiceRoleRequest(req);
            const user = isService ? null : await getSupabaseUser(req);
            if (!isService && !user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

            const applicationId = (body as any)?.application_id;
            const status = (body as any)?.status;
            const lang = typeof (body as any)?.lang === "string" && (body as any).lang ? (body as any).lang : "en";
            const requestSiteUrl = typeof (body as any)?.site_url === "string" ? (body as any).site_url : null;
            const shouldSendEmail = (body as any)?.send_email === true;
            const overrideTemplateKey =
                typeof (body as any)?.template_key === "string" && String((body as any).template_key).trim()
                    ? String((body as any).template_key).trim()
                    : null;

            if (!applicationId || typeof applicationId !== "string") {
                return createJsonResponse({ error: "Missing application_id" }, 400, origin);
            }

            // Align with DB constraint
            const allowedStatuses = new Set(["approved", "pending", "rejected", "blocked", "needs_correction"]);
            if (!allowedStatuses.has(String(status))) {
                return createJsonResponse({ error: "Invalid status" }, 400, origin);
            }

            const rejectionReason =
                typeof (body as any)?.rejection_reason === "string"
                    ? String((body as any).rejection_reason)
                    : null;
            if (status === "needs_correction" && (!rejectionReason || !rejectionReason.trim())) {
                return createJsonResponse({ error: "Missing rejection_reason" }, 400, origin);
            }

            const { data: application, error: appError } = await supabaseAdmin
                .from("agent_applications")
                .select("id, developer_user_id, email, full_name")
                .eq("id", applicationId)
                .single();

            if (appError || !application) {
                return createJsonResponse(
                    { error: "Application not found", details: appError?.message },
                    404,
                    origin
                );
            }

            const developerUserId = (application as any)?.developer_user_id ? String((application as any).developer_user_id) : null;
            if (!isService && user?.id) {
                const allowed = await canManageDeveloper({ supabaseAdmin, userId: user.id, developerId: developerUserId });
                if (!allowed) return createJsonResponse({ error: "Forbidden" }, 403, origin);
            }

            const updatePayload: Record<string, unknown> = {
                status,
                reviewed_at: new Date().toISOString(),
            };
            if (status === "needs_correction") updatePayload.rejection_reason = rejectionReason?.trim() ?? null;
            if (status === "approved") updatePayload.rejection_reason = null;

            const { error: updateError } = await supabaseAdmin
                .from("agent_applications")
                .update(updatePayload)
                .eq("id", applicationId);

            if (updateError) throw updateError;

            let emailResult: { template_key: string; onesignal_message_id: string } | null = null;
            if (shouldSendEmail && (status === "approved" || status === "rejected")) {
                const envSiteUrl = Deno.env.get("SITE_URL") || "";
                const siteUrlRaw = requestSiteUrl || envSiteUrl || origin || "https://gridix.live";
                const siteUrl = siteUrlRaw.endsWith("/") ? siteUrlRaw.slice(0, -1) : siteUrlRaw;
                const accessLink = `${siteUrl}/${lang}/projects/agent/${applicationId}`;

                // Resolve template: if override provided -> must exist; else try known keys in order.
                let templateKey: string | null = overrideTemplateKey;
                if (templateKey) {
                    const exists = await loadEmailTemplate({ supabaseAdmin: supabaseAdmin, templateKey, locale: lang });
                    if (!exists) {
                        return createJsonResponse(
                            { error: "Template not found", template_key: templateKey, locale: lang },
                            404,
                            origin
                        );
                    }
                } else {
                    const candidates =
                        status === "approved"
                            ? ["agent_application_approved", "welcome_email", "test_welcome"]
                            : ["agent_application_rejected", "welcome_email", "test_welcome"];
                    for (const k of candidates) {
                        const exists = await loadEmailTemplate({ supabaseAdmin: supabaseAdmin, templateKey: k, locale: lang });
                        if (exists) {
                            templateKey = k;
                            break;
                        }
                    }
                    if (!templateKey) {
                        return createJsonResponse(
                            { error: "Template not found", tried: candidates, locale: lang },
                            404,
                            origin
                        );
                    }
                }

                const payload: Record<string, unknown> = {
                    app: { url: siteUrl },
                    agent: {
                        id: applicationId,
                        status,
                        full_name: (application as any)?.full_name ?? "",
                        email: (application as any)?.email ?? "",
                        access_link: accessLink,
                    },
                    developer: { id: (application as any)?.developer_user_id ?? "" },
                };

                const { onesignal_message_id } = await sendAgentStatusEmail({
                    supabaseAdmin: supabaseAdmin,
                    templateKey,
                    locale: lang,
                    agentApplicationId: applicationId,
                    agentEmail: String((application as any)?.email ?? ""),
                    payload,
                    name: "agent-program:update_application_status",
                });

                emailResult = { template_key: templateKey, onesignal_message_id };
            }

            return createJsonResponse({ success: true, status, email: emailResult }, 200, origin);
        }

        /**
         * Public: agent lists accessible projects by `agent_id` (link-based access).
         */
        if (action === "list_projects") {
            const url = new URL(req.url);

            const agentId = (typeof (body as any)?.agent_id === "string" && (body as any).agent_id)
                ? (body as any).agent_id
                : url.searchParams.get("agent_id");
            if (!agentId) {
                return createJsonResponse({ error: "Missing agent_id" }, 400, origin);
            }

            const { data: application, error: appError } = await supabaseAdmin
                .from("agent_applications")
                .select("id, email, developer_user_id, status")
                .eq("id", agentId)
                .single();

            if (appError || !application) {
                return createJsonResponse(
                    { error: "Agent application not found", details: appError?.message },
                    404,
                    origin
                );
            }

            if (String(application.status) !== "approved") {
                return createJsonResponse({ error: "Agent not approved" }, 403, origin);
            }

            const { data, error } = await supabaseAdmin
                .from("agent_access")
                .select(`
          project_id,
          projects (
            id,
            name,
            slug,
            address,
            building_image_url
          )
        `)
                .eq("agent_id", agentId);

            if (error) throw error;

            const projects = data.map((item: any) => item.projects).filter(Boolean);
            return createJsonResponse({ success: true, projects }, 200, origin);
        }

        return createJsonResponse({ error: "Invalid action" }, 400, origin);
    } catch (e) {
        console.error("agent-program error", e);
        return createJsonResponse({ error: "internal_error", message: e instanceof Error ? e.message : String(e) }, 500, origin);
    }
});
