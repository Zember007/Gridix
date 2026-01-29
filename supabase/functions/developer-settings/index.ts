import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";
import { getSupabaseUser } from "../_shared/auth.ts";

type Action = "export_backup" | "reset_settings" | "telegram_verify_username";

type RequestBody =
  | { action: "export_backup" }
  | { action: "reset_settings" }
  | { action: "telegram_verify_username"; username: string };

type ApiResponse = { success: boolean; error?: string } & Record<string, unknown>;

function normalizeUsername(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("@")) return trimmed;
  return `@${trimmed}`;
}

function isAction(v: unknown): v is Action {
  return v === "export_backup" || v === "reset_settings" || v === "telegram_verify_username";
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return createCorsResponse(origin);
  if (req.method !== "POST") return createJsonResponse({ success: false, error: "Method not allowed" } satisfies ApiResponse, 405, origin);

  try {
    const user = await getSupabaseUser(req);
    if (!user?.id) return createJsonResponse({ success: false, error: "Unauthorized" } satisfies ApiResponse, 401, origin);

    const body = (await req.json().catch(() => null)) as RequestBody | null;
    const action = body && typeof body === "object" && "action" in body ? (body as any).action : null;
    if (!isAction(action)) {
      return createJsonResponse({ success: false, error: "Invalid action" } satisfies ApiResponse, 400, origin);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return createJsonResponse({ success: false, error: "Missing Supabase env" } satisfies ApiResponse, 500, origin);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const developerId = user.id;

    if (action === "reset_settings") {
      const deletes = await Promise.all([
        supabaseAdmin.from("user_message_templates").delete().eq("user_id", developerId),
        supabaseAdmin.from("user_notification_preferences").delete().eq("user_id", developerId),
        supabaseAdmin.from("company_settings").delete().eq("user_id", developerId),
      ]);

      for (const r of deletes) {
        if (r.error) throw r.error;
      }

      return createJsonResponse({ success: true } satisfies ApiResponse, 200, origin);
    }

    if (action === "telegram_verify_username") {
      const rawUsername = (body as any).username as unknown;
      if (typeof rawUsername !== "string") {
        return createJsonResponse({ success: false, error: "Missing username" } satisfies ApiResponse, 400, origin);
      }

      const normalized = normalizeUsername(rawUsername);
      if (!normalized || normalized === "@") {
        return createJsonResponse({ success: false, error: "Invalid username" } satisfies ApiResponse, 400, origin);
      }

      const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
      const botUsername = Deno.env.get("TELEGRAM_BOT_USERNAME") ?? "gridix_bot";
      if (!botToken) {
        return createJsonResponse(
          { success: false, error: "Missing TELEGRAM_BOT_TOKEN", bot_username: botUsername } satisfies ApiResponse,
          500,
          origin
        );
      }

      const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: normalized, action: "typing" }),
      });

      const json = await resp.json().catch(() => null);
      const ok = !!(json as any)?.ok;

      // Store verification result for easy checks in DB.
      const nowIso = new Date().toISOString();
      const { error: upsertErr } = await supabaseAdmin
        .from("user_notification_preferences")
        .upsert(
          {
            user_id: developerId,
            channel_telegram: true,
            telegram_username: normalized,
            telegram_verified: ok,
            telegram_last_checked_at: nowIso,
            telegram_last_error: ok ? null : JSON.stringify((json as any) ?? null),
            updated_at: nowIso,
          },
          { onConflict: "user_id" }
        );

      if (upsertErr) {
        console.warn("Failed to persist telegram verification result", upsertErr);
      }

      return createJsonResponse(
        {
          success: true,
          ok,
          normalized_username: normalized,
          bot_username: botUsername,
          raw_telegram_error: ok ? null : json,
        } satisfies ApiResponse,
        200,
        origin
      );
    }

    // export_backup
    const backup: Record<string, unknown> = {
      meta: {
        generated_at: new Date().toISOString(),
        developer_id: developerId,
        version: 1,
      },
    };

    const { data: userProfile } = await supabaseAdmin.from("user_profiles").select("*").eq("id", developerId).maybeSingle();
    const { data: companySettings } = await supabaseAdmin.from("company_settings").select("*").eq("user_id", developerId).maybeSingle();
    const { data: notificationPreferences } = await supabaseAdmin
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", developerId)
      .maybeSingle();
    const { data: messageTemplates } = await supabaseAdmin
      .from("user_message_templates")
      .select("*")
      .eq("user_id", developerId)
      .order("created_at", { ascending: false });

    const { data: managerAccounts } = await supabaseAdmin.from("manager_accounts").select("*").eq("developer_id", developerId);
    const managerAccountIds = (managerAccounts ?? []).map((m: any) => m.id as string);

    const { data: managerPermissions } =
      managerAccountIds.length > 0
        ? await supabaseAdmin.from("manager_permissions").select("*").in("manager_account_id", managerAccountIds)
        : { data: [] as unknown[] };
    const { data: managerProjectAccess } =
      managerAccountIds.length > 0
        ? await supabaseAdmin.from("manager_project_access").select("*").in("manager_account_id", managerAccountIds)
        : { data: [] as unknown[] };

    backup.settings = {
      user_profile: userProfile ?? null,
      company_settings: companySettings ?? null,
      notification_preferences: notificationPreferences ?? null,
      message_templates: messageTemplates ?? [],
      manager_accounts: managerAccounts ?? [],
      manager_permissions: managerPermissions ?? [],
      manager_project_access: managerProjectAccess ?? [],
    };

    const { data: projects } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("user_id", developerId)
      .order("created_at", { ascending: true });
    const projectIds = (projects ?? []).map((p: any) => p.id as string);

    const selectByProject = async (table: string) => {
      if (projectIds.length === 0) return [];
      const { data } = await supabaseAdmin.from(table).select("*").in("project_id", projectIds);
      return data ?? [];
    };

    const floorPlans = await selectByProject("floor_plans");
    const facades = await selectByProject("project_facades");
    const buildingFloors = await selectByProject("building_floors");
    const layoutPhotos = await selectByProject("layout_photos");
    const projectDomains = await selectByProject("project_domains");
    const projectCustomFields = await selectByProject("project_custom_fields");
    const projectFieldSettings = await selectByProject("project_field_settings");
    const projectCrmSettings = await selectByProject("project_crm_settings");
    const projectBitrixSettings = await selectByProject("project_bitrix_settings");
    const projectSyncSettings = await selectByProject("project_sync_settings");
    const syncLogs = await selectByProject("sync_logs");

    const apartments =
      projectIds.length > 0 ? (await supabaseAdmin.from("apartments").select("*").in("project_id", projectIds)).data ?? [] : [];
    const apartmentIds = (apartments as any[]).map((a) => a.id as string);
    const apartmentPhotos =
      apartmentIds.length > 0
        ? (await supabaseAdmin.from("apartment_photos").select("*").in("apartment_id", apartmentIds)).data ?? []
        : [];

    backup.projects = {
      projects: projects ?? [],
      floor_plans: floorPlans,
      project_facades: facades,
      building_floors: buildingFloors,
      apartments,
      apartment_photos: apartmentPhotos,
      layout_photos: layoutPhotos,
      project_domains: projectDomains,
      project_custom_fields: projectCustomFields,
      project_field_settings: projectFieldSettings,
      project_crm_settings: projectCrmSettings,
      project_bitrix_settings: projectBitrixSettings,
      project_sync_settings: projectSyncSettings,
      sync_logs: syncLogs,
    };

    const leads =
      projectIds.length > 0 ? (await supabaseAdmin.from("leads").select("*").in("project_id", projectIds)).data ?? [] : [];
    const leadIds = (leads as any[]).map((l) => l.id as string);
    const leadTasks = leadIds.length > 0 ? (await supabaseAdmin.from("lead_tasks").select("*").in("lead_id", leadIds)).data ?? [] : [];
    const leadHistory =
      leadIds.length > 0 ? (await supabaseAdmin.from("lead_history").select("*").in("lead_id", leadIds)).data ?? [] : [];
    const { data: crmConnections } = await supabaseAdmin.from("crm_connections").select("*").eq("user_id", developerId);

    backup.crm = {
      leads,
      lead_tasks: leadTasks,
      lead_history: leadHistory,
      crm_connections: crmConnections ?? [],
    };

    const projectViews =
      projectIds.length > 0 ? (await supabaseAdmin.from("project_views").select("*").in("project_id", projectIds)).data ?? [] : [];
    const apartmentViews =
      projectIds.length > 0 ? (await supabaseAdmin.from("apartment_views").select("*").in("project_id", projectIds)).data ?? [] : [];
    const projectDailyMetrics =
      projectIds.length > 0
        ? (await supabaseAdmin.from("project_daily_metrics").select("*").in("project_id", projectIds)).data ?? []
        : [];
    const apartmentDailyViews =
      apartmentIds.length > 0
        ? (await supabaseAdmin.from("apartment_daily_views").select("*").in("apartment_id", apartmentIds)).data ?? []
        : [];

    backup.analytics = {
      project_views: projectViews,
      apartment_views: apartmentViews,
      project_daily_metrics: projectDailyMetrics,
      apartment_daily_views: apartmentDailyViews,
    };

    const { data: partnerProfile } = await supabaseAdmin
      .from("partner_profiles")
      .select("*")
      .eq("user_id", developerId)
      .maybeSingle();
    const partnerId = (partnerProfile as any)?.id as string | undefined;

    const partnerLinks = partnerId ? (await supabaseAdmin.from("partner_links").select("*").eq("partner_id", partnerId)).data ?? [] : [];
    const partnerInvitations =
      partnerId ? (await supabaseAdmin.from("partner_invitations").select("*").eq("partner_id", partnerId)).data ?? [] : [];
    const partnerClicks = partnerId ? (await supabaseAdmin.from("partner_clicks").select("*").eq("partner_id", partnerId)).data ?? [] : [];
    const partnerPayouts = partnerId ? (await supabaseAdmin.from("partner_payouts").select("*").eq("partner_id", partnerId)).data ?? [] : [];
    const { data: commissionTiers } = await supabaseAdmin.from("commission_tiers").select("*");

    backup.partners = {
      partner_profile: partnerProfile ?? null,
      partner_links: partnerLinks,
      partner_invitations: partnerInvitations,
      partner_clicks: partnerClicks,
      partner_payouts: partnerPayouts,
      commission_tiers: commissionTiers ?? [],
    };

    return createJsonResponse(
      {
        success: true,
        generated_at: (backup.meta as any).generated_at,
        developer_id: developerId,
        backup,
      } satisfies ApiResponse,
      200,
      origin
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("developer-settings error", err);
    return createJsonResponse({ success: false, error: message } satisfies ApiResponse, 500, origin);
  }
});

