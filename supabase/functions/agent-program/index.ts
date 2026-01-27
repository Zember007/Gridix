// @ts-ignore - resolved in Supabase Edge (Deno) runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";
import { getSupabaseUser } from "../_shared/auth.ts";

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

        const user = await getSupabaseUser(req);
        if (!user) {
            return createJsonResponse({ error: "Unauthorized" }, 401, origin);
        }

        /**
         * Auth: developer approves application -> activates + sends email with magic link redirect.
         */
        if (action === "approve_application") {
            const applicationId = body?.application_id;
            const lang = typeof body?.lang === "string" && body.lang ? body.lang : "en";
            const requestSiteUrl = typeof body?.site_url === "string" ? body.site_url : null;

            if (!applicationId || typeof applicationId !== "string") {
                return createJsonResponse({ error: "Missing application_id" }, 400, origin);
            }

            const { data: application, error: appError } = await supabase
                .from("agent_applications")
                .select("id, developer_user_id, email, status")
                .eq("id", applicationId)
                .single();

            if (appError || !application) {
                return createJsonResponse(
                    { error: "Application not found", details: appError?.message },
                    404,
                    origin
                );
            }

            if (application.developer_user_id !== user.id) {
                return createJsonResponse({ error: "Forbidden" }, 403, origin);
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
                .eq("user_id", user.id)
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

            const { data: inviteLinkData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
                application.email,
                { redirectTo: accessLink }
            );

            if (inviteError) {
                console.error("approve_application inviteUserByEmail failed", inviteError);
                return createJsonResponse(
                    { error: "Failed to send email", details: inviteError.message, access_link: accessLink },
                    500,
                    origin
                );
            }

            return createJsonResponse(
                { success: true, status: "approved", access_link: accessLink, invite: inviteLinkData ?? null },
                200,
                origin
            );
        }

        /**
         * Auth: developer updates application status without sending email.
         */
        if (action === "update_application_status") {
            const applicationId = body?.application_id;
            const status = body?.status;

            if (!applicationId || typeof applicationId !== "string") {
                return createJsonResponse({ error: "Missing application_id" }, 400, origin);
            }

            // Align with DB constraint (commonly: pending/approved/rejected)
            if (status !== "approved" && status !== "pending" && status !== "rejected") {
                return createJsonResponse({ error: "Invalid status" }, 400, origin);
            }

            const { data: application, error: appError } = await supabase
                .from("agent_applications")
                .select("id, developer_user_id")
                .eq("id", applicationId)
                .single();

            if (appError || !application) {
                return createJsonResponse(
                    { error: "Application not found", details: appError?.message },
                    404,
                    origin
                );
            }

            if (application.developer_user_id !== user.id) {
                return createJsonResponse({ error: "Forbidden" }, 403, origin);
            }

            const { error: updateError } = await supabase
                .from("agent_applications")
                .update({ status, reviewed_at: new Date().toISOString() })
                .eq("id", applicationId);

            if (updateError) throw updateError;

            return createJsonResponse({ success: true, status }, 200, origin);
        }

        /**
         * Auth: agent (or owning developer) lists accessible projects.
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

            // Allow only the agent themselves OR the owning developer.
            const userEmail = typeof user.email === "string" ? user.email : null;
            const isAgent = !!userEmail && userEmail.toLowerCase() === String(application.email).toLowerCase();
            const isOwnerDeveloper = application.developer_user_id === user.id;

            if (!isAgent && !isOwnerDeveloper) {
                return createJsonResponse({ error: "Forbidden" }, 403, origin);
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
