// @ts-ignore - resolved in Supabase Edge (Deno) runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1?target=es2022";
import { PDFDocument, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1?target=es2022";
import * as mammoth from "https://esm.sh/mammoth@1.11.0?target=es2022";
// @ts-ignore - resolved in Supabase Edge (Deno) runtime
import fontkit from "https://esm.sh/@pdf-lib/fontkit@1.1.1?target=es2022";
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

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PDF_MIME = "application/pdf";

const SUPPORTED_TEMPLATE_LANGS = ["EN", "RU"] as const;
type TemplateLang = (typeof SUPPORTED_TEMPLATE_LANGS)[number];

function normalizeTemplateLang(input: unknown): TemplateLang | null {
    if (typeof input !== "string") return null;
    const v = input.trim().toUpperCase();
    return (SUPPORTED_TEMPLATE_LANGS as readonly string[]).includes(v) ? (v as TemplateLang) : null;
}

function guessTemplateLangFromName(name: string): TemplateLang {
    const m = String(name ?? "").match(/[._-](EN|RU)[._-]/i);
    const g = m ? m[1]!.toUpperCase() : "";
    return normalizeTemplateLang(g) ?? "EN";
}

function getFileExtLower(nameOrPath: string): string {
    const s = String(nameOrPath ?? "").toLowerCase();
    if (s.endsWith(".docx")) return "docx";
    if (s.endsWith(".pdf")) return "pdf";
    return "";
}

function u8ToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    // TS in some setups treats Uint8Array as ArrayBufferLike (incl SharedArrayBuffer),
    // while BlobPart expects ArrayBuffer. Slice produces a real ArrayBuffer.
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function assertNonEmptyBytes(bytes: Uint8Array, label: string): void {
    if (!(bytes instanceof Uint8Array)) throw new Error(`${label}: expected Uint8Array`);
    if (bytes.byteLength <= 0) throw new Error(`${label}: empty output (refusing to overwrite storage object)`);
}

function decodeBasicHtmlEntities(input: string): string {
    return input
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

function htmlToPlainText(html: string): string {
    const s = String(html ?? "");
    // Preserve structure with newlines
    let out = s
        .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr)>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(ul|ol|table)>/gi, "\n")
        .replace(/<li[^>]*>/gi, "- ")
        .replace(/<[^>]+>/g, "");

    out = decodeBasicHtmlEntities(out);
    // Normalize whitespace
    out = out.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    out = out.replace(/[ \t]+\n/g, "\n");
    out = out.replace(/\n{3,}/g, "\n\n");
    return out.trim();
}

function escapeXml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function extractSectPr(existingDocumentXml: string): string | null {
    const m = existingDocumentXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
    return m ? m[0] : null;
}

function defaultSectPr(): string {
    // A4 defaults
    return (
        `<w:sectPr>` +
        `<w:pgSz w:w="11906" w:h="16838"/>` +
        `<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>` +
        `</w:sectPr>`
    );
}

function buildDocumentXmlFromPlainText(text: string, sectPr: string | null): string {
    const lines = String(text ?? "").split("\n");
    const bodyParts: string[] = [];

    for (const line of lines) {
        const trimmed = line; // keep spaces; Word needs xml:space preserve
        if (!trimmed) {
            bodyParts.push(`<w:p/>`);
            continue;
        }
        bodyParts.push(
            `<w:p><w:r><w:t xml:space="preserve">${escapeXml(trimmed)}</w:t></w:r></w:p>`
        );
    }

    const sect = sectPr ?? defaultSectPr();
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ` +
        `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<w:body>` +
        bodyParts.join("") +
        sect +
        `</w:body></w:document>`;
}

async function applyHtmlToExistingDocx(params: { templateBytes: Uint8Array; html: string }): Promise<Uint8Array> {
    const zip = await JSZip.loadAsync(params.templateBytes);
    const docPath = "word/document.xml";
    const docFile = zip.file(docPath);
    if (!docFile) throw new Error("Invalid DOCX: missing word/document.xml");

    const existingXml = await docFile.async("string");
    const sectPr = extractSectPr(existingXml);
    const plain = htmlToPlainText(params.html);
    const newXml = buildDocumentXmlFromPlainText(plain, sectPr);
    zip.file(docPath, newXml);

    return await zip.generateAsync({ type: "uint8array" });
}

async function createDocxFromHtml(params: { html: string }): Promise<Uint8Array> {
    const plain = htmlToPlainText(params.html);
    const docXml = buildDocumentXmlFromPlainText(plain, null);

    const zip = new JSZip();
    zip.file("[Content_Types].xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
        `</Types>`
    );
    zip.folder("_rels")?.file(".rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
        `</Relationships>`
    );
    zip.folder("word")?.file("document.xml", docXml);
    zip.folder("word")?.folder("_rels")?.file("document.xml.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`
    );

    return await zip.generateAsync({ type: "uint8array" });
}

function wrapTextToLines(text: string, maxWidth: number, measure: (s: string) => number): string[] {
    const out: string[] = [];
    const paragraphs = String(text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    for (const p of paragraphs) {
        const words = p.split(/\s+/).filter(Boolean);
        if (words.length === 0) {
            out.push("");
            continue;
        }
        let line = "";
        for (const w of words) {
            const candidate = line ? `${line} ${w}` : w;
            if (measure(candidate) <= maxWidth) {
                line = candidate;
                continue;
            }
            if (line) out.push(line);
            // If single word doesn't fit, hard-break it.
            if (measure(w) > maxWidth) {
                let cur = "";
                for (const ch of w) {
                    const cand2 = cur + ch;
                    if (measure(cand2) <= maxWidth) {
                        cur = cand2;
                    } else {
                        if (cur) out.push(cur);
                        cur = ch;
                    }
                }
                line = cur;
            } else {
                line = w;
            }
        }
        if (line) out.push(line);
    }
    return out;
}

let cachedUnicodeFontBytes: Uint8Array | null = null;
async function fetchFirstOk(urls: string[]): Promise<ArrayBuffer> {
    let lastErr: unknown = null;
    for (const url of urls) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.arrayBuffer();
        } catch (e) {
            lastErr = e;
        }
    }
    throw new Error(`Failed to fetch Unicode font: ${String((lastErr as any)?.message ?? lastErr ?? "unknown error")}`);
}

async function getUnicodeFontBytes(): Promise<Uint8Array> {
    if (cachedUnicodeFontBytes) return cachedUnicodeFontBytes;
    const urls = [
        // Noto Sans Regular (supports Cyrillic)
        "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
        "https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
    ];
    const ab = await fetchFirstOk(urls);
    cachedUnicodeFontBytes = new Uint8Array(ab);
    return cachedUnicodeFontBytes;
}

async function createPdfFromHtml(params: { html: string }): Promise<Uint8Array> {
    const plain = htmlToPlainText(params.html);
    const pdfDoc = await PDFDocument.create();
    // StandardFonts use WinAnsi and can't encode Cyrillic ("Т", etc).
    // Use a Unicode TTF via fontkit.
    // @ts-ignore - pdf-lib types don't include registerFontkit in some setups
    pdfDoc.registerFontkit(fontkit);
    let font: any;
    try {
        const fontBytes = await getUnicodeFontBytes();
        font = await pdfDoc.embedFont(fontBytes, { subset: true });
    } catch (e) {
        // Fallback to Helvetica for Latin-only text; otherwise surface a clear error.
        const hasNonAscii = /[^\x00-\x7F]/.test(plain);
        if (hasNonAscii) {
            throw new Error(`PDF export failed: Unicode font unavailable (${String((e as any)?.message ?? e)})`);
        }
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    // A4 in points: 595.28 × 841.89
    const pageSize = { width: 595.28, height: 841.89 };
    const margin = 48;
    const fontSize = 11;
    const lineHeight = 14;
    const maxWidth = pageSize.width - margin * 2;

    let page = pdfDoc.addPage([pageSize.width, pageSize.height]);
    let y = pageSize.height - margin;

    const lines = wrapTextToLines(plain, maxWidth, (s) => font.widthOfTextAtSize(s, fontSize));
    for (const line of lines) {
        if (y - lineHeight < margin) {
            page = pdfDoc.addPage([pageSize.width, pageSize.height]);
            y = pageSize.height - margin;
        }
        page.drawText(line, { x: margin, y: y - fontSize, size: fontSize, font });
        y -= lineHeight;
    }

    const bytes = await pdfDoc.save();
    return new Uint8Array(bytes);
}

function templateGeneratedPath(params: { developerUserId: string; templateId: number; ext: "docx" | "pdf" }): string {
    return `agent-contracts/${params.developerUserId}/generated/templates/${params.templateId}.${params.ext}`;
}

function buildContractPayload(params: { application: any; developerId: string | null; developerProfile?: any | null }): Record<string, unknown> {
    const app = params.application ?? {};
    const agent = {
        id: String(app.id ?? ""),
        full_name: String(app.full_name ?? ""),
        company_name: String(app.company_name ?? ""),
        person_type: String(app.type ?? ""),
        tax_id: String(app.tax_id ?? ""),
        legal_address: String(app.legal_address ?? ""),
        email: String(app.email ?? ""),
        phone: String(app.phone ?? ""),
        bank_details: (app.bank_details && typeof app.bank_details === "object") ? app.bank_details : null,
    };

    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    const today = `${yyyy}-${mm}-${dd}`;

    // Backward-compatible aliases (older templates may use these)
    const commissionRate =
        app && (typeof app.commission_rate === "number" || typeof app.commission_rate === "string")
            ? String(app.commission_rate)
            : "";

    return {
        agent,
        application: {
            id: String(app.id ?? ""),
            created_at: String(app.created_at ?? ""),
        },
        developer: {
            id: params.developerId ? String(params.developerId) : "",
            full_name: params.developerProfile ? String(params.developerProfile?.full_name ?? "") : "",
            company_name: params.developerProfile ? String(params.developerProfile?.company_name ?? "") : "",
            tax_id: params.developerProfile ? String(params.developerProfile?.tax_id ?? "") : "",
            legal_address: params.developerProfile ? String(params.developerProfile?.legal_address ?? "") : "",
            phone: params.developerProfile ? String(params.developerProfile?.phone ?? "") : "",
            email: params.developerProfile ? String(params.developerProfile?.email ?? "") : "",
        },
        date: { today },
        // Aliases
        partner_id: String(app.id ?? ""),
        partner_name: agent.full_name,
        company_name: agent.company_name,
        tax_id: agent.tax_id,
        address: agent.legal_address,
        commission_rate: commissionRate,
        date_text: today,
    };
}

async function verifyPasswordWithAuth(params: {
    supabaseUrl: string;
    serviceKey: string;
    email: string;
    password: string;
}): Promise<{ ok: true; user_id: string } | { ok: false; error: string }> {
    const email = params.email.trim().toLowerCase();
    if (!email) return { ok: false, error: "Missing email" };
    if (!params.password) return { ok: false, error: "Missing password" };

    // Intentionally DO NOT return access/refresh tokens to avoid creating a client session.
    const res = await fetch(`${params.supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
            apikey: params.serviceKey,
            authorization: `Bearer ${params.serviceKey}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({ email, password: params.password }),
    });

    if (!res.ok) {
        // Avoid leaking details (e.g. "email not confirmed") in public flows.
        return { ok: false, error: "Invalid email or password" };
    }

    const data = (await res.json().catch(() => null)) as any;
    const userId = data?.user?.id ? String(data.user.id) : "";
    if (!userId) return { ok: false, error: "Invalid email or password" };

    return { ok: true, user_id: userId };
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
         * Public: list developer contract templates + assets for the invite wizard (no auth required).
         *
         * Body: { action: 'list_contract_templates_public', developer_id }
         *
         * Returns:
         * - templates: [{ id, name, lang, storage_path, content_html, url, created_at, updated_at }]
         * - developer_assets: { signature_path, signature_url, stamp_path, stamp_url }
         */
        if (action === "list_contract_templates_public") {
            if (!developer_id || typeof developer_id !== "string") {
                return createJsonResponse({ error: "Missing developer_id" }, 400, origin);
            }

            const developerUserId = developer_id;

            const { data: templates, error: tplErr } = await supabaseAdmin
                .from("agent_contract_templates")
                .select("id, name, lang, content_html, storage_path, created_at, updated_at")
                .eq("developer_user_id", developerUserId)
                .order("created_at", { ascending: false });
            if (tplErr) throw tplErr;

            const expectedPrefix = `agent-contracts/${developerUserId}/`;
            const templatesWithUrls = (templates ?? [])
                .filter((t: any) => typeof t?.storage_path === "string" && String(t.storage_path).startsWith(expectedPrefix))
                .map((t: any) => {
                    const storagePath = String(t.storage_path);
                    const { data: urlData } = supabaseAdmin.storage.from(contractsBucket).getPublicUrl(storagePath);
                    return { ...t, url: urlData?.publicUrl ?? null };
                });

            const { data: settings, error: settingsErr } = await supabaseAdmin
                .from("agent_program_settings")
                .select("developer_signature_path, developer_stamp_path")
                .eq("developer_user_id", developerUserId)
                .maybeSingle();
            if (settingsErr) throw settingsErr;

            const { data: developerProfile, error: devProfileErr } = await supabaseAdmin
                .from("user_profiles")
                .select("full_name, company_name, tax_id, legal_address, phone, email")
                .eq("id", developerUserId)
                .maybeSingle();
            if (devProfileErr) throw devProfileErr;

            const signaturePath = settings ? String((settings as any)?.developer_signature_path ?? "") : "";
            const stampPath = settings ? String((settings as any)?.developer_stamp_path ?? "") : "";
            const signatureUrl = signaturePath
                ? supabaseAdmin.storage.from(signaturesBucket).getPublicUrl(signaturePath).data.publicUrl
                : null;
            const stampUrl = stampPath
                ? supabaseAdmin.storage.from(signaturesBucket).getPublicUrl(stampPath).data.publicUrl
                : null;

            return createJsonResponse(
                {
                    success: true,
                    templates: templatesWithUrls,
                    developer_profile: developerProfile ?? null,
                    developer_assets: {
                        signature_path: signaturePath || null,
                        signature_url: signatureUrl,
                        stamp_path: stampPath || null,
                        stamp_url: stampUrl,
                    },
                },
                200,
                origin
            );
        }

        /**
         * Public: check whether a Supabase Auth user exists for an email.
         * Used by the invite wizard: onBlur(email) -> if exists, ask password.
         *
         * Body: { action: 'check_auth_user_exists', email }
         * Returns: { success: true, exists: boolean }
         */
        if (action === "check_auth_user_exists") {
            const rawEmail = (safeBody as any)?.email;
            if (!rawEmail || typeof rawEmail !== "string") {
                return createJsonResponse({ error: "Missing email" }, 400, origin);
            }
            const emailNorm = rawEmail.trim().toLowerCase();
            if (!emailNorm) return createJsonResponse({ error: "Missing email" }, 400, origin);

            // Can't query auth.users via PostgREST (auth schema not exposed).
            // Use Auth Admin API instead.
            const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
            if (listErr) throw listErr;
            const user = (usersData?.users ?? []).find((u: any) => String(u?.email ?? "").toLowerCase() === emailNorm) ?? null;
            if (!user?.id) {
                return createJsonResponse({ success: true, exists: false, account_type: null }, 200, origin);
            }

            const userId = String(user.id);
            const { data: profile, error: profileErr } = await supabaseAdmin
                .from("user_profiles")
                .select("account_type")
                .eq("id", userId)
                .maybeSingle();
            if (profileErr) throw profileErr;

            const accountType = profile && typeof (profile as any).account_type === "string" ? String((profile as any).account_type) : null;
            return createJsonResponse({ success: true, exists: true, account_type: accountType }, 200, origin);
        }

        /**
         * Public: verify password for an existing auth user WITHOUT creating a browser session.
         * Used by invite wizard: if email exists -> show password -> verify -> proceed.
         *
         * Body: { action: 'verify_auth_user_password', email, password }
         * Returns: { success: true, valid: boolean }
         */
        if (action === "verify_auth_user_password") {
            const rawEmail = (safeBody as any)?.email;
            const rawPassword = (safeBody as any)?.password;
            if (!rawEmail || typeof rawEmail !== "string") {
                return createJsonResponse({ error: "Missing email" }, 400, origin);
            }
            if (!rawPassword || typeof rawPassword !== "string") {
                return createJsonResponse({ error: "Missing password" }, 400, origin);
            }
            const emailNorm = rawEmail.trim().toLowerCase();
            if (!emailNorm) return createJsonResponse({ error: "Missing email" }, 400, origin);

            // Same guard as check_auth_user_exists: prevent verifying passwords for other account types.
            const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
            if (listErr) throw listErr;
            const user = (usersData?.users ?? []).find((u: any) => String(u?.email ?? "").toLowerCase() === emailNorm) ?? null;
            if (!user?.id) return createJsonResponse({ success: true, valid: false }, 200, origin);

            const userId = String(user.id);
            const { data: profile, error: profileErr } = await supabaseAdmin
                .from("user_profiles")
                .select("account_type")
                .eq("id", userId)
                .maybeSingle();
            if (profileErr) throw profileErr;

            const accountType = profile && typeof (profile as any).account_type === "string" ? String((profile as any).account_type) : null;
            if (accountType && accountType !== "agent") {
                return createJsonResponse({ success: true, valid: false }, 200, origin);
            }

            const verify = await verifyPasswordWithAuth({
                supabaseUrl,
                serviceKey,
                email: emailNorm,
                password: rawPassword,
            });
            if (!verify.ok) return createJsonResponse({ success: true, valid: false }, 200, origin);

            return createJsonResponse({ success: true, valid: true }, 200, origin);
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
                .select("id, agent_user_id, email, developer_user_id, full_name, company_name, type, tax_id, legal_address, phone, bank_details, created_at, status")
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

            const { data: developerProfile } = await supabaseAdmin
                .from("user_profiles")
                .select("full_name, company_name, tax_id, legal_address, phone, email")
                .eq("id", developerUserId)
                .maybeSingle();

            const payload = buildContractPayload({ application, developerId: developerUserId, developerProfile });
            const renderedBytes = await renderDocx(await bytesFromBlob(tplBlob), payload);

            const previewPath = `agent-contracts-rendered/${applicationId}/preview.docx`;
            const { error: upErr } = await supabaseAdmin.storage.from(contractsBucket).upload(
                previewPath,
                new Blob([u8ToArrayBuffer(renderedBytes)], { type: DOCX_MIME }),
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

            const contentType = isDocx ? DOCX_MIME : PDF_MIME;

            const { error: uploadError } = await supabaseAdmin.storage
                .from(contractsBucket)
                .upload(path, file, { upsert: true, contentType });
            if (uploadError) throw uploadError;

            // Auto-generate editable HTML (so it exists immediately after upload).
            // - DOCX: convert via mammoth
            // - PDF: skip (too lossy); can still be converted client-side when opening the editor
            let autoContentHtml: string | null = null;
            if (isDocx) {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    const value = typeof (result as any)?.value === "string" ? String((result as any).value) : "";
                    autoContentHtml = value || null;
                } catch (_e) {
                    autoContentHtml = null;
                }
            }

            // Create or update template metadata
            const nowIso = new Date().toISOString();
            const langFromForm = normalizeTemplateLang(form.get("lang"));
            const lang = langFromForm ?? guessTemplateLangFromName(safeName);

            const { data: existingTemplate } = await supabaseAdmin
                .from("agent_contract_templates")
                .select("id, content_html")
                .eq("developer_user_id", developerUserId)
                .eq("name", safeName)
                .maybeSingle();

            if (existingTemplate?.id) {
                // Update existing template
                await supabaseAdmin
                    .from("agent_contract_templates")
                    .update({
                        storage_path: path,
                        updated_at: nowIso,
                        // Only populate content_html if it's empty (don't override user's edited content).
                        content_html: (existingTemplate as any)?.content_html ? (existingTemplate as any).content_html : autoContentHtml,
                    })
                    .eq("id", existingTemplate.id);
            } else {
                // Create new template
                await supabaseAdmin.from("agent_contract_templates").insert({
                    developer_user_id: developerUserId,
                    name: safeName,
                    lang,
                    storage_path: path,
                    content_html: autoContentHtml,
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
            const lang = normalizeTemplateLang((safeBody as any)?.lang);
            const contentHtml = typeof (safeBody as any)?.content_html === "string" ? String((safeBody as any).content_html) : null;
            const storagePath = typeof (safeBody as any)?.storage_path === "string" ? String((safeBody as any).storage_path) : null;

            if (!name) return createJsonResponse({ error: "Missing name" }, 400, origin);
            const nameExt = getFileExtLower(name);
            if (nameExt !== "docx" && nameExt !== "pdf") return createJsonResponse({ error: "Template name must end with .docx or .pdf" }, 400, origin);

            const nowIso = new Date().toISOString();
            const payload: any = {
                developer_user_id: developerUserId,
                name,
                updated_at: nowIso,
            };
            if (lang) payload.lang = lang;

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
                if (!payload.lang) payload.lang = guessTemplateLangFromName(name);
                payload.created_at = nowIso;
                const { data, error } = await supabaseAdmin.from("agent_contract_templates").insert(payload).select().single();
                if (error) throw error;
                result = data;
            }

            // Keep Storage in sync: if content_html updated, overwrite the stored file,
            // and also generate the other format under /generated/.
            if (contentHtml !== null) {
                const finalStoragePath = String((result as any)?.storage_path ?? storagePath ?? "").trim();
                if (!finalStoragePath) throw new Error("Missing storage_path for template");

                const expectedPrefix = `agent-contracts/${developerUserId}/`;
                if (!finalStoragePath.startsWith(expectedPrefix)) {
                    return createJsonResponse({ error: "Invalid storage_path" }, 400, origin);
                }

                const originalExt = getFileExtLower(finalStoragePath) || nameExt;
                const idForGen = Number((result as any)?.id);
                const genDocxPath = Number.isFinite(idForGen) ? templateGeneratedPath({ developerUserId, templateId: idForGen, ext: "docx" }) : null;
                const genPdfPath = Number.isFinite(idForGen) ? templateGeneratedPath({ developerUserId, templateId: idForGen, ext: "pdf" }) : null;

                // DOCX bytes (either update existing docx to keep layout, or create from scratch for PDF-origin templates)
                let docxBytes: Uint8Array | null = null;
                if (originalExt === "docx") {
                    const { data: tplBlob, error: dlErr } = await supabaseAdmin.storage
                        .from(contractsBucket)
                        .download(finalStoragePath);
                    if (dlErr) throw dlErr;
                    if (!tplBlob) throw new Error("Failed to download template DOCX");
                    docxBytes = await applyHtmlToExistingDocx({ templateBytes: await bytesFromBlob(tplBlob), html: contentHtml });
                } else {
                    docxBytes = await createDocxFromHtml({ html: contentHtml });
                }
                assertNonEmptyBytes(docxBytes, "Template DOCX bytes");

                // PDF bytes (always generated from HTML)
                const pdfBytes = await createPdfFromHtml({ html: contentHtml });
                assertNonEmptyBytes(pdfBytes, "Template PDF bytes");

                // Overwrite original stored file with its own type
                if (originalExt === "docx") {
                    const { error: upErr } = await supabaseAdmin.storage.from(contractsBucket).upload(
                        finalStoragePath,
                        docxBytes,
                        { upsert: true, contentType: DOCX_MIME }
                    );
                    if (upErr) throw upErr;
                } else if (originalExt === "pdf") {
                    const { error: upErr } = await supabaseAdmin.storage.from(contractsBucket).upload(
                        finalStoragePath,
                        pdfBytes,
                        { upsert: true, contentType: PDF_MIME }
                    );
                    if (upErr) throw upErr;
                }

                // Always keep generated exports in sync too (so UI can download both formats)
                if (genDocxPath) {
                    const { error: genErr } = await supabaseAdmin.storage.from(contractsBucket).upload(
                        genDocxPath,
                        docxBytes,
                        { upsert: true, contentType: DOCX_MIME }
                    );
                    if (genErr) throw genErr;
                }
                if (genPdfPath) {
                    const { error: genErr } = await supabaseAdmin.storage.from(contractsBucket).upload(
                        genPdfPath,
                        pdfBytes,
                        { upsert: true, contentType: PDF_MIME }
                    );
                    if (genErr) throw genErr;
                }
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
         * Auth (developer/manager): get a fresh download URL for a contract template.
         * Ensures the stored DOCX matches latest `content_html` (if present).
         * Body: { action: 'get_contract_template_download_url', developer_user_id?, id }
         */
        if (action === "get_contract_template_download_url") {
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
            const format = typeof (safeBody as any)?.format === "string" ? String((safeBody as any).format).toLowerCase() : null;
            if (format && format !== "docx" && format !== "pdf") return createJsonResponse({ error: "Invalid format (expected docx|pdf)" }, 400, origin);

            const { data: template, error: tplErr } = await supabaseAdmin
                .from("agent_contract_templates")
                .select("id, name, content_html, storage_path")
                .eq("id", templateId)
                .eq("developer_user_id", developerUserId)
                .maybeSingle();
            if (tplErr) throw tplErr;
            if (!template) return createJsonResponse({ error: "Template not found" }, 404, origin);

            const storagePath = String((template as any)?.storage_path ?? "").trim();
            if (!storagePath) return createJsonResponse({ error: "Template has no storage_path" }, 400, origin);

            const expectedPrefix = `agent-contracts/${developerUserId}/`;
            if (!storagePath.startsWith(expectedPrefix)) return createJsonResponse({ error: "Invalid storage_path" }, 400, origin);

            const contentHtml = typeof (template as any)?.content_html === "string" ? String((template as any).content_html) : null;
            const name = String((template as any)?.name ?? "");
            const originalExt = getFileExtLower(storagePath) || getFileExtLower(name);
            const targetExt = (format as "docx" | "pdf" | null) ?? (originalExt === "pdf" ? "pdf" : "docx");
            const targetPath =
                targetExt === originalExt
                    ? storagePath
                    : templateGeneratedPath({ developerUserId, templateId, ext: targetExt });

            if (contentHtml !== null) {
                if (targetExt === "docx") {
                    let docxBytes: Uint8Array;
                    if (originalExt === "docx" && targetPath === storagePath) {
                        const { data: tplBlob, error: dlErr } = await supabaseAdmin.storage.from(contractsBucket).download(storagePath);
                        if (dlErr) throw dlErr;
                        if (!tplBlob) throw new Error("Failed to download template DOCX");
                        docxBytes = await applyHtmlToExistingDocx({ templateBytes: await bytesFromBlob(tplBlob), html: contentHtml });
                    } else {
                        docxBytes = await createDocxFromHtml({ html: contentHtml });
                    }
                    assertNonEmptyBytes(docxBytes, "Template DOCX bytes");
                    const { error: upErr } = await supabaseAdmin.storage.from(contractsBucket).upload(
                        targetPath,
                        docxBytes,
                        { upsert: true, contentType: DOCX_MIME }
                    );
                    if (upErr) throw upErr;
                } else {
                    const pdfBytes = await createPdfFromHtml({ html: contentHtml });
                    assertNonEmptyBytes(pdfBytes, "Template PDF bytes");
                    const { error: upErr } = await supabaseAdmin.storage.from(contractsBucket).upload(
                        targetPath,
                        pdfBytes,
                        { upsert: true, contentType: PDF_MIME }
                    );
                    if (upErr) throw upErr;
                }
            } else {
                // No edited content: only allow downloading the original file type.
                if (targetPath !== storagePath) {
                    return createJsonResponse({ error: "Template has no editable content to export into another format" }, 400, origin);
                }
            }

            const { data: signed, error: signedErr } = await supabaseAdmin.storage
                .from(contractsBucket)
                .createSignedUrl(targetPath, 60 * 10);
            if (!signedErr && signed?.signedUrl) {
                return createJsonResponse({ success: true, url: signed.signedUrl, path: targetPath, format: targetExt }, 200, origin);
            }

            const { data: urlData } = supabaseAdmin.storage.from(contractsBucket).getPublicUrl(targetPath);
            return createJsonResponse({ success: true, url: urlData?.publicUrl ?? null, path: targetPath, format: targetExt }, 200, origin);
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
            const emailNorm = typeof email === "string" ? email.trim().toLowerCase() : "";
            if (!emailNorm) {
                return createJsonResponse({ error: "Missing required fields" }, 400, origin);
            }

            const personType =
                typeof (safeBody as any)?.person_type === "string" ? String((safeBody as any).person_type) : null; // company|individual
            const companyName =
                typeof (safeBody as any)?.company_name === "string" ? String((safeBody as any).company_name).trim() : null;
            const taxId =
                typeof (safeBody as any)?.tax_id === "string" ? String((safeBody as any).tax_id).trim() : null;
            const legalAddress =
                typeof (safeBody as any)?.legal_address === "string" ? String((safeBody as any).legal_address).trim() : null;
            const useProfileDefaults = (safeBody as any)?.use_profile_defaults === true;
            const passwordMaybe =
                typeof (safeBody as any)?.password === "string" ? String((safeBody as any).password) : null;

            let resolvedFullName = typeof full_name === "string" ? full_name.trim() : "";
            let resolvedPhone = typeof phone === "string" ? phone.trim() : "";
            let resolvedPersonType = personType;
            let resolvedCompanyName = companyName;
            let resolvedTaxId = taxId;
            let resolvedLegalAddress = legalAddress;

            // If email belongs to an existing auth user and the UI hides other fields,
            // allow submitting using profile defaults (password required).
            if (useProfileDefaults || !resolvedFullName || !resolvedPhone) {
                if (!passwordMaybe) {
                    return createJsonResponse({ error: "Missing password" }, 400, origin);
                }

                const verify = await verifyPasswordWithAuth({
                    supabaseUrl,
                    serviceKey,
                    email: emailNorm,
                    password: passwordMaybe,
                });
                if (!verify.ok) {
                    return createJsonResponse({ error: "Invalid email or password" }, 403, origin);
                }

                const { data: profile, error: profileErr } = await supabaseAdmin
                    .from("user_profiles")
                    .select("full_name, company_name, phone, tax_id, legal_address, person_type, account_type")
                    .eq("id", verify.user_id)
                    .maybeSingle();
                if (profileErr) throw profileErr;
                if (profile && typeof (profile as any).account_type === "string" && String((profile as any).account_type) !== "agent") {
                    return createJsonResponse({ error: "Forbidden" }, 403, origin);
                }

                const pfFullName = typeof (profile as any)?.full_name === "string" ? String((profile as any).full_name) : "";
                const pfCompanyName = typeof (profile as any)?.company_name === "string" ? String((profile as any).company_name) : "";
                const pfPhone = typeof (profile as any)?.phone === "string" ? String((profile as any).phone) : "";
                const pfTaxId = typeof (profile as any)?.tax_id === "string" ? String((profile as any).tax_id) : "";
                const pfLegalAddress = typeof (profile as any)?.legal_address === "string" ? String((profile as any).legal_address) : "";
                const pfPersonType = typeof (profile as any)?.person_type === "string" ? String((profile as any).person_type) : null;

                resolvedPersonType = resolvedPersonType ?? pfPersonType;
                resolvedCompanyName = resolvedCompanyName ?? (pfCompanyName || null);
                resolvedTaxId = resolvedTaxId ?? (pfTaxId || null);
                resolvedLegalAddress = resolvedLegalAddress ?? (pfLegalAddress || null);
                resolvedPhone = resolvedPhone || pfPhone || "";

                if (!resolvedFullName) {
                    const isCompany = resolvedPersonType === "company";
                    resolvedFullName = (isCompany ? pfCompanyName : pfFullName) || pfFullName || pfCompanyName || "";
                }
            }

            if (!resolvedFullName || !resolvedPhone) {
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
                            full_name: resolvedFullName,
                            email: emailNorm,
                            phone: resolvedPhone,
                            type: resolvedPersonType,
                            company_name: resolvedCompanyName,
                            tax_id: resolvedTaxId,
                            legal_address: resolvedLegalAddress,
                            bank_details: (bank_details && typeof bank_details === "object") ? bank_details : (bank_details ? { details: bank_details } : {}),
                        })
                        .eq("id", existing.id)
                        .select()
                        .single();
                    if (updErr) throw updErr;
                    return createJsonResponse({ success: true, data: updated }, 200, origin);
                }
            }

            // If NOT authenticated, de-duplicate by (developer_user_id, email) for public invite flow.
            if (!agentUserId) {
                const { data: existingByEmail, error: existingEmailErr } = await supabaseAdmin
                    .from("agent_applications")
                    .select("id, status")
                    .eq("developer_user_id", devId)
                    .eq("email", emailNorm)
                    .is("agent_user_id", null)
                    .limit(1)
                    .maybeSingle();
                if (existingEmailErr) throw existingEmailErr;

                if (existingByEmail?.id) {
                    const { data: updated, error: updErr } = await supabaseAdmin
                        .from("agent_applications")
                        .update({
                            full_name: resolvedFullName,
                            email: emailNorm,
                            phone: resolvedPhone,
                            type: resolvedPersonType,
                            company_name: resolvedCompanyName,
                            tax_id: resolvedTaxId,
                            legal_address: resolvedLegalAddress,
                            bank_details: (bank_details && typeof bank_details === "object") ? bank_details : (bank_details ? { details: bank_details } : {}),
                        })
                        .eq("id", existingByEmail.id)
                        .select()
                        .single();
                    if (updErr) throw updErr;
                    return createJsonResponse({ success: true, data: updated }, 200, origin);
                }
            }

            const insertPayload: Record<string, unknown> = {
                developer_user_id: devId,
                full_name: resolvedFullName,
                email: emailNorm,
                phone: resolvedPhone,
                type: resolvedPersonType,
                company_name: resolvedCompanyName,
                tax_id: resolvedTaxId,
                legal_address: resolvedLegalAddress,
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
                .select("id, developer_user_id, status, rejection_reason, full_name, company_name, email, phone, tax_id, legal_address, bank_details, type, commission_rate, agreement_signed, agreement_signed_at, signature_path, signature_method, contract_template_path, signed_contract_path, signed_contract_mime, signed_contract_created_at, created_at, reviewed_at")
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
         * Public (preferred for invite wizard): sign multiple agreements for an application.
         *
         * For new agents without Supabase Auth session:
         * - allowed only if application.agent_user_id is NULL and the provided email matches application.email.
         *
         * For existing agents (application.agent_user_id is set):
         * - requires Supabase Auth session and the user must match agent_user_id (or email match fallback).
         */
        if (action === "sign_agreements_public") {
            const applicationId = (body as any)?.application_id;
            const signatureDataUrl = (body as any)?.signature_data_url;
            const method = (body as any)?.signature_method;
            const accepted = (body as any)?.accepted === true;
            const contractTemplatePaths = (body as any)?.contract_template_paths;
            const requestEmailRaw = (body as any)?.email;

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
            if (!Array.isArray(contractTemplatePaths) || contractTemplatePaths.length === 0) {
                return createJsonResponse({ error: "Missing contract_template_paths" }, 400, origin);
            }
            const requestedPaths = contractTemplatePaths.map((p: any) => String(p)).filter(Boolean);
            if (requestedPaths.length === 0) {
                return createJsonResponse({ error: "Missing contract_template_paths" }, 400, origin);
            }

            const requestEmail = typeof requestEmailRaw === "string" ? requestEmailRaw.trim().toLowerCase() : "";

            const { data: application, error: appError } = await supabaseAdmin
                .from("agent_applications")
                .select("id, agent_user_id, email, agreement_signed, developer_user_id, full_name, company_name, type, tax_id, legal_address, phone, bank_details, created_at")
                .eq("id", applicationId)
                .single();
            if (appError || !application) {
                return createJsonResponse({ error: "Application not found", details: appError?.message }, 404, origin);
            }

            const claimedAgentUserId = (application as any)?.agent_user_id ? String((application as any).agent_user_id) : null;
            const appEmail = String((application as any)?.email ?? "").trim().toLowerCase();

            // If application is already linked to an auth user, require auth.
            if (claimedAgentUserId) {
                const user = await getSupabaseUser(req);
                if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);
                const userEmail = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
                const canSign = claimedAgentUserId === user.id || (!!userEmail && userEmail === appEmail);
                if (!canSign) return createJsonResponse({ error: "Forbidden" }, 403, origin);
            } else {
                // No linked auth user yet -> allow only if email matches the application.
                if (!requestEmail || requestEmail !== appEmail) {
                    return createJsonResponse({ error: "Forbidden" }, 403, origin);
                }
            }

            const { mime, bytes, ext } = parseDataUrlImage(signatureDataUrl);
            const signaturePath = `agent-signatures/${applicationId}/signature.${ext}`;
            const signatureBlob = new Blob([u8ToArrayBuffer(bytes)], { type: mime });

            const { error: uploadError } = await supabaseAdmin.storage.from(signaturesBucket).upload(signaturePath, signatureBlob, {
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
                contract_template_paths: requestedPaths,
            };

            // Snapshot filled contracts at signing time (DOCX supported; PDF copied as-is).
            const developerUserId = (application as any)?.developer_user_id ? String((application as any).developer_user_id) : null;
            const expectedPrefix = `agent-contracts/${developerUserId ?? ""}/`;
            if (!developerUserId) {
                return createJsonResponse({ error: "Invalid developer_user_id" }, 400, origin);
            }

            const { data: developerProfile } = await supabaseAdmin
                .from("user_profiles")
                .select("full_name, company_name, tax_id, legal_address, phone, email")
                .eq("id", developerUserId)
                .maybeSingle();

            const signedContracts: Array<{ contract_template_path: string; signed_contract_path: string; signed_contract_mime: string; signed_contract_url: string | null }> = [];

            for (let i = 0; i < requestedPaths.length; i++) {
                const contractTemplatePath = requestedPaths[i]!;
                if (!contractTemplatePath.startsWith(expectedPrefix)) {
                    return createJsonResponse({ error: "Invalid contract_template_path" }, 400, origin);
                }
                const lower = contractTemplatePath.toLowerCase();
                const isDocx = lower.endsWith(".docx");
                const isPdf = lower.endsWith(".pdf");
                if (!isDocx && !isPdf) return createJsonResponse({ error: "Only PDF or DOCX allowed" }, 400, origin);

                const { data: tplBlob, error: dlErr } = await supabaseAdmin.storage.from(contractsBucket).download(contractTemplatePath);
                if (dlErr) throw dlErr;
                if (!tplBlob) throw new Error("Failed to download contract template");

                const payload = buildContractPayload({ application, developerId: developerUserId, developerProfile });
                const outBytes = isDocx ? await renderDocx(await bytesFromBlob(tplBlob), payload) : await bytesFromBlob(tplBlob);

                const extOut = isDocx ? "docx" : "pdf";
                const signedContractMime = isDocx ? DOCX_MIME : PDF_MIME;
                const signedContractPath = `agent-signed-contracts/${applicationId}/contract-${String(i + 1).padStart(2, "0")}-${nowIso.replace(/[:.]/g, "-")}.${extOut}`;

                const { error: upErr } = await supabaseAdmin.storage.from(contractsBucket).upload(
                    signedContractPath,
                    new Blob([u8ToArrayBuffer(outBytes)], { type: signedContractMime }),
                    { upsert: true, contentType: signedContractMime }
                );
                if (upErr) throw upErr;

                // Best-effort per-contract row (table may be added later by migration).
                const insertPayload: Record<string, unknown> = {
                    application_id: applicationId,
                    contract_template_path: contractTemplatePath,
                    signed_contract_path: signedContractPath,
                    signed_contract_mime: signedContractMime,
                    signed_at: nowIso,
                    signature_path: signaturePath,
                    signature_meta: signatureMeta,
                };
                const { error: perErr } = await supabaseAdmin.from("agent_application_contracts").insert(insertPayload).select("id").maybeSingle();
                if (perErr) {
                    const msg = String((perErr as any)?.message ?? perErr);
                    // Allow running before migration is applied.
                    if (!msg.toLowerCase().includes("does not exist")) throw perErr;
                }

                const signedContractUrl = supabaseAdmin.storage.from(contractsBucket).getPublicUrl(signedContractPath).data.publicUrl;
                signedContracts.push({
                    contract_template_path: contractTemplatePath,
                    signed_contract_path: signedContractPath,
                    signed_contract_mime: signedContractMime,
                    signed_contract_url: signedContractUrl,
                });
            }

            const first = signedContracts[0] ?? null;
            const updatePayload: Record<string, unknown> = {
                agreement_signed: true,
                agreement_signed_at: nowIso,
                signature_path: signaturePath,
                signature_method: method,
                signature_meta: signatureMeta,
            };
            if (first) {
                updatePayload.contract_template_path = first.contract_template_path;
                updatePayload.signed_contract_path = first.signed_contract_path;
                updatePayload.signed_contract_mime = first.signed_contract_mime;
                updatePayload.signed_contract_created_at = nowIso;
            }

            const { data: updated, error: updateErr } = await supabaseAdmin
                .from("agent_applications")
                .update(updatePayload)
                .eq("id", applicationId)
                .select()
                .single();
            if (updateErr) throw updateErr;

            const signatureUrl = supabaseAdmin.storage.from(signaturesBucket).getPublicUrl(signaturePath).data.publicUrl;
            return createJsonResponse(
                { success: true, data: updated, signature_url: signatureUrl, signed_contracts: signedContracts },
                200,
                origin
            );
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
                .select("id, agent_user_id, email, agreement_signed, developer_user_id, full_name, company_name, type, tax_id, legal_address, phone, bank_details, created_at")
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
            const blob = new Blob([u8ToArrayBuffer(bytes)], { type: mime });

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

                const { data: developerProfile } = await supabaseAdmin
                    .from("user_profiles")
                    .select("full_name, company_name, tax_id, legal_address, phone, email")
                    .eq("id", developerUserId)
                    .maybeSingle();

                const payload = buildContractPayload({ application, developerId: developerUserId, developerProfile });
                const outBytes = isDocx ? await renderDocx(await bytesFromBlob(tplBlob), payload) : await bytesFromBlob(tplBlob);

                const extOut = isDocx ? "docx" : "pdf";
                signedContractMime = isDocx
                    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    : "application/pdf";
                signedContractPath = `agent-signed-contracts/${applicationId}/contract-${nowIso.replace(/[:.]/g, "-")}.${extOut}`;

                const { error: upErr } = await supabaseAdmin.storage.from(contractsBucket).upload(
                    signedContractPath,
                    new Blob([u8ToArrayBuffer(outBytes)], { type: signedContractMime }),
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
            // Legacy endpoint: explicit per-project access was removed.
            // Agents have access to all projects for the developer linked to their approved application.
            return createJsonResponse({ error: "agent_access_removed" }, 410, origin);
        }

        /**
         * Developer/manager: approve application -> activates + sends email via OneSignal.
         *
         * IMPORTANT:
         * - We generate a Supabase magic link to agent-cabinet (temporary flow; SSO will be reworked later).
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
                .select("id, developer_user_id, email, full_name, company_name, type, tax_id, legal_address, phone, status, commission_rate")
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

            // Ensure agent has Supabase Auth user and user_profiles record.
            const nowIso = new Date().toISOString();
            const agentEmailRaw = String((application as any)?.email ?? "");
            const agentEmail = agentEmailRaw.trim().toLowerCase();
            if (!agentEmail) return createJsonResponse({ error: "Application email is missing" }, 400, origin);

            // Find existing auth user by email
            const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
            if (listErr) throw listErr;
            const existingUser = (usersData?.users ?? []).find((u: any) => String(u?.email ?? "").toLowerCase() === agentEmail) ?? null;

            let agentAuthUserId: string | null = existingUser?.id ? String(existingUser.id) : null;
            if (!agentAuthUserId) {
                // Create user WITHOUT password so encrypted_password stays NULL until first password setup.
                const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
                    email: agentEmail,
                    email_confirm: true,
                    user_metadata: { account_type: "agent", requires_password_setup: true },
                });
                if (createErr) throw createErr;
                agentAuthUserId = created?.user?.id ? String(created.user.id) : null;
            }
            if (!agentAuthUserId) throw new Error("Failed to resolve agent auth user id");

            // Link application to auth user (so agent-cabinet can load it after login)
            await supabaseAdmin
                .from("agent_applications")
                .update({ agent_user_id: agentAuthUserId })
                .eq("id", applicationId)
                .is("agent_user_id", null);

            // Ensure user_profiles row exists
            const { error: profileErr } = await supabaseAdmin
                .from("user_profiles")
                .upsert(
                    {
                        id: agentAuthUserId,
                        email: agentEmail,
                        full_name: (application as any)?.full_name ?? null,
                        company_name: (application as any)?.company_name ?? null,
                        phone: (application as any)?.phone ?? null,
                        tax_id: (application as any)?.tax_id ?? null,
                        legal_address: (application as any)?.legal_address ?? null,
                        person_type: (application as any)?.type ?? null,
                        account_type: "agent",
                        updated_at: nowIso,
                    },
                    { onConflict: "id" }
                );
            if (profileErr) throw profileErr;

            // Build agent-cabinet access link
            const agentCabinetEnv = Deno.env.get("AGENT_CABINET_URL") || "";
            const agentCabinetBaseRaw = agentCabinetEnv || requestSiteUrl || origin || "";
            const agentCabinetBase = agentCabinetBaseRaw.endsWith("/") ? agentCabinetBaseRaw.slice(0, -1) : agentCabinetBaseRaw;
            if (!agentCabinetBase) throw new Error("Missing AGENT_CABINET_URL");

            const redirectTo = `${agentCabinetBase}/${lang}/application?application_id=${encodeURIComponent(applicationId)}`;
            const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
                type: "magiclink",
                email: agentEmail,
                options: { redirectTo },
            });
            if (linkErr) throw linkErr;
            const accessLink =
                (linkData as any)?.properties?.action_link
                    ? String((linkData as any).properties.action_link)
                    : redirectTo;

            // Send email to agent with status + access link (via OneSignal templates)
            const payload: Record<string, unknown> = {
                app: { url: agentCabinetBase },
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
                const agentCabinetEnv = Deno.env.get("AGENT_CABINET_URL") || "";
                const baseRaw = agentCabinetEnv || requestSiteUrl || origin || "";
                const base = baseRaw.endsWith("/") ? baseRaw.slice(0, -1) : baseRaw;
                const accessLink = base ? `${base}/${lang}/application?application_id=${encodeURIComponent(applicationId)}` : "";

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
                    app: { url: base || "" },
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
         * Public: agent lists projects for the developer linked to the application.
         * agent_access table is removed; access is implicit to all developer projects.
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

            const developerUserId = (application as any)?.developer_user_id ? String((application as any).developer_user_id) : null;
            if (!developerUserId) {
                return createJsonResponse({ error: "Invalid developer_user_id" }, 400, origin);
            }

            const { data: projects, error } = await supabaseAdmin
                .from("projects")
                .select("id, name, slug, address, building_image_url")
                .eq("user_id", developerUserId)
                .eq("is_public", true);

            if (error) throw error;
            return createJsonResponse({ success: true, projects: projects ?? [] }, 200, origin);
        }

        return createJsonResponse({ error: "Invalid action" }, 400, origin);
    } catch (e) {
        console.error("agent-program error", e);
        return createJsonResponse({ error: "internal_error", message: e instanceof Error ? e.message : String(e) }, 500, origin);
    }
});
