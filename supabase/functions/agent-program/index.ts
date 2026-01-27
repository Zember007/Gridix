// @ts-ignore - resolved in Supabase Edge (Deno) runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";
import { isServiceRoleRequest } from "../_shared/auth.ts";
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

serve(async (req) => {
    const origin = req.headers.get("Origin");
    if (req.method === "OPTIONS") return createCorsResponse(origin);

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, serviceKey);

        const body = await req.json();
        const { developer_id, full_name, email, phone, bank_details, action } = body;

        if (!action || typeof action !== "string") {
            return createJsonResponse({ error: "Missing action" }, 400, origin);
        }

        /**
         * Public: list developer contract PDFs (no auth required).
         */
        if (action === "list_contracts") {
            if (!developer_id || typeof developer_id !== "string") {
                return createJsonResponse({ error: "Missing developer_id" }, 400, origin);
            }

            const bucket = "project-images";
            const basePath = `agent-contracts/${developer_id}`;

            const { data: files, error: listError } = await supabase.storage
                .from(bucket)
                .list(basePath, { limit: 100, offset: 0, sortBy: { column: "name", order: "asc" } });

            if (listError) {
                // If the folder doesn't exist yet, treat as no contracts.
                return createJsonResponse({ success: true, contracts: [] }, 200, origin);
            }

            const contracts = (files ?? [])
                .filter((f: any) => f && typeof f.name === "string" && f.name.toLowerCase().endsWith(".pdf"))
                .map((f: any) => {
                    const path = `${basePath}/${f.name}`;
                    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
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
         * Public: agent submits application (no auth required).
         */
        if (action === "submit_application") {


            if (!developer_id || !full_name || !email || !phone) {
                return createJsonResponse({ error: "Missing required fields" }, 400, origin);
            }

            const { data, error } = await supabase
                .from("agent_applications")
                .insert({
                    developer_user_id: developer_id,
                    full_name,
                    email,
                    phone,
                    bank_details: bank_details || {},
                    status: "pending"
                })
                .select()
                .single();

            if (error) throw error;
            return createJsonResponse({ success: true, data }, 200, origin);
        }

        /**
         * Service-only: developer approves application -> activates + sends email via OneSignal.
         *
         * IMPORTANT:
         * - No Supabase Auth invites/magic-links.
         * - No Supabase JWT auth checks. Use service role for moderation actions.
         */
        if (action === "approve_application") {
            if (!isServiceRoleRequest(req)) {
                return createJsonResponse({ error: "Unauthorized" }, 401, origin);
            }

            const applicationId = body?.application_id;
            const lang = typeof body?.lang === "string" && body.lang ? body.lang : "en";
            const requestSiteUrl = typeof body?.site_url === "string" ? body.site_url : null;
            const explicitTemplateKey =
                typeof body?.template_key === "string" && body.template_key.trim()
                    ? body.template_key.trim()
                    : null;
            const emailPreheader = typeof body?.email_preheader === "string" ? body.email_preheader : undefined;

            if (!applicationId || typeof applicationId !== "string") {
                return createJsonResponse({ error: "Missing application_id" }, 400, origin);
            }

            const { data: application, error: appError } = await supabase
                .from("agent_applications")
                .select("id, developer_user_id, email, full_name, status")
                .eq("id", applicationId)
                .single();

            if (appError || !application) {
                return createJsonResponse(
                    { error: "Application not found", details: appError?.message },
                    404,
                    origin
                );
            }

            const { error: updateError } = await supabase
                .from("agent_applications")
                // DB uses a CHECK constraint (typically: pending/approved/rejected)
                .update({ status: "approved", reviewed_at: new Date().toISOString() })
                .eq("id", applicationId);

            if (updateError) throw updateError;

            // Grant access to developer's projects by default (MVP)
            const { data: developerProjects, error: projectsError } = await supabase
                .from("projects")
                .select("id")
                .eq("user_id", (application as any)?.developer_user_id)
                .eq("is_public", true);

            if (projectsError) throw projectsError;

            const projectIds: string[] = (developerProjects ?? [])
                .map((p: any) => p?.id)
                .filter((id: any) => typeof id === "string");

            if (projectIds.length > 0) {
                const { data: existingAccess, error: accessError } = await supabase
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
                    const { error: insertError } = await supabase
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
                const exists = await loadEmailTemplate({ supabaseAdmin: supabase, templateKey: templateKeyToUse, locale: lang });
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
                    const exists = await loadEmailTemplate({ supabaseAdmin: supabase, templateKey: k, locale: lang });
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
                supabaseAdmin: supabase,
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
         * Service-only: developer updates application status.
         * Optionally sends OneSignal email using a template for the new status.
         */
        if (action === "update_application_status") {
            if (!isServiceRoleRequest(req)) {
                return createJsonResponse({ error: "Unauthorized" }, 401, origin);
            }

            const applicationId = body?.application_id;
            const status = body?.status;
            const lang = typeof body?.lang === "string" && body.lang ? body.lang : "en";
            const requestSiteUrl = typeof body?.site_url === "string" ? body.site_url : null;
            const shouldSendEmail = body?.send_email === true;
            const overrideTemplateKey =
                typeof body?.template_key === "string" && body.template_key.trim()
                    ? body.template_key.trim()
                    : null;

            if (!applicationId || typeof applicationId !== "string") {
                return createJsonResponse({ error: "Missing application_id" }, 400, origin);
            }

            // Align with DB constraint (commonly: pending/approved/rejected)
            if (status !== "approved" && status !== "pending" && status !== "rejected") {
                return createJsonResponse({ error: "Invalid status" }, 400, origin);
            }

            const { data: application, error: appError } = await supabase
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

            const { error: updateError } = await supabase
                .from("agent_applications")
                .update({ status, reviewed_at: new Date().toISOString() })
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
                    const exists = await loadEmailTemplate({ supabaseAdmin: supabase, templateKey, locale: lang });
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
                        const exists = await loadEmailTemplate({ supabaseAdmin: supabase, templateKey: k, locale: lang });
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
                    supabaseAdmin: supabase,
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

            const agentId = (typeof body?.agent_id === "string" && body.agent_id)
                ? body.agent_id
                : url.searchParams.get("agent_id");
            if (!agentId) {
                return createJsonResponse({ error: "Missing agent_id" }, 400, origin);
            }

            const { data: application, error: appError } = await supabase
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

            const { data, error } = await supabase
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
