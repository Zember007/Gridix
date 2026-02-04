import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";
import { getSupabaseUser } from "../_shared/auth.ts";

type Action =
  | "get_project_drawer"
  | "upsert_partnership_settings"
  | "add_construction_update"
  | "delete_construction_update"
  | "add_media_item"
  | "delete_media_item";

type PartnershipSettingsPayload = {
  is_enabled: boolean;
  allow_partner_connect: boolean;
  commission_type: "percent" | "fixed";
  commission_value: number;
  payout_condition?: string | null;
  contract_url?: string | null;
};

type MediaKind = "render" | "video" | "presentation";

function asUuid(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return createCorsResponse(req.headers.get("origin"));

  const origin = req.headers.get("origin");

  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const action = String((body as any)?.action ?? "") as Action;

    const user = await getSupabaseUser(req);
    if (!user?.id) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

    const projectId = asUuid((body as any)?.project_id);
    if (!projectId) return createJsonResponse({ error: "Missing project_id" }, 400, origin);

    // Authorization: project must belong to current user.
    const { data: projectOwnerRow, error: ownerErr } = await supabaseAdmin
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .maybeSingle();
    if (ownerErr) throw ownerErr;
    if (!projectOwnerRow) return createJsonResponse({ error: "Project not found" }, 404, origin);
    if (String((projectOwnerRow as any).user_id ?? "") !== user.id) {
      return createJsonResponse({ error: "Forbidden" }, 403, origin);
    }

    if (action === "get_project_drawer") {
      const { data: project, error: projectErr } = await supabaseAdmin
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (projectErr) throw projectErr;

      const { data: settings, error: settingsErr } = await supabaseAdmin
        .from("project_partnership_settings")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
      if (settingsErr) throw settingsErr;

      const { data: mediaItems, error: mediaErr } = await supabaseAdmin
        .from("project_media_items")
        .select("id, kind, title, url, thumbnail_url, created_at, sort_index")
        .eq("project_id", projectId)
        .order("kind", { ascending: true })
        .order("sort_index", { ascending: true })
        .order("created_at", { ascending: false });
      if (mediaErr) throw mediaErr;

      const { data: construction, error: constructionErr } = await supabaseAdmin
        .from("project_construction_updates")
        .select("id, date, title, description, images, created_at")
        .eq("project_id", projectId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (constructionErr) throw constructionErr;

      const { data: apartments, error: aErr } = await supabaseAdmin
        .from("apartments")
        .select("status, area")
        .eq("project_id", projectId);
      if (aErr) throw aErr;

      const stats = (apartments ?? []).reduce(
        (acc: { totalUnits: number; availableUnits: number; soldUnits: number; bookedUnits: number; totalArea: number }, row: any) => {
          acc.totalUnits += 1;
          const st = String(row?.status ?? "");
          if (st === "available") acc.availableUnits += 1;
          // existing codebase uses "reserved" in places; UI expects "booked"
          if (st === "reserved" || st === "booked") acc.bookedUnits += 1;
          if (st === "sold") acc.soldUnits += 1;
          const area = typeof row?.area === "number" ? row.area : Number(row?.area ?? 0);
          acc.totalArea += Number.isFinite(area) ? area : 0;
          return acc;
        },
        { totalUnits: 0, availableUnits: 0, soldUnits: 0, bookedUnits: 0, totalArea: 0 },
      );

      const media = {
        renders: (mediaItems ?? [])
          .filter((i: any) => i.kind === "render")
          .map((i: any) => String(i.url)),
        videos: (mediaItems ?? [])
          .filter((i: any) => i.kind === "video")
          .map((i: any) => ({
            url: String(i.url),
            title: String(i.title ?? "Video"),
            thumbnail: i.thumbnail_url ? String(i.thumbnail_url) : undefined,
          })),
        presentations: (mediaItems ?? [])
          .filter((i: any) => i.kind === "presentation")
          .map((i: any) => ({
            id: String(i.id),
            title: String(i.title ?? "Document"),
            url: String(i.url),
            uploadedAt: i.created_at ? String(i.created_at) : undefined,
          })),
      };

      const partnershipSettings = settings
        ? {
            isEnabled: Boolean((settings as any).is_enabled),
            commissionType: ((settings as any).commission_type === "fixed" ? "fixed" : "percent") as "fixed" | "percent",
            commissionValue: Number((settings as any).commission_value ?? 5),
            payoutCondition: (settings as any).payout_condition ? String((settings as any).payout_condition) : undefined,
            contractUrl: (settings as any).contract_url ? String((settings as any).contract_url) : undefined,
            allowPartnerConnect: Boolean((settings as any).allow_partner_connect ?? true),
          }
        : {
            isEnabled: false,
            commissionType: "percent" as const,
            commissionValue: 5,
            payoutCondition: undefined,
            contractUrl: undefined,
            allowPartnerConnect: true,
          };

      return createJsonResponse(
        {
          success: true,
          project: {
            id: String((project as any).id),
            name: String((project as any).name ?? ""),
            slug: (project as any).slug ? String((project as any).slug) : null,
            location: (project as any).address ? String((project as any).address) : null,
            imageUrl: (project as any).building_image_url ? String((project as any).building_image_url) : null,
            description: (project as any).description ? String((project as any).description) : null,
            completionDate: (project as any).completion_date ? String((project as any).completion_date) : null,
            floors: typeof (project as any).floors === "number" ? (project as any).floors : null,
            minPrice: (project as any).min_price ?? null,
            yield: (project as any).yield_percent ?? null,
            stats,
            media,
            constructionProgress: (construction ?? []).map((u: any) => ({
              id: String(u.id),
              date: String(u.date),
              title: String(u.title ?? ""),
              description: String(u.description ?? ""),
              images: Array.isArray(u.images) ? (u.images as any[]).map((x) => String(x)) : undefined,
            })),
            partnershipSettings,
          },
        },
        200,
        origin,
      );
    }

    if (action === "upsert_partnership_settings") {
      const payload = (body as any)?.settings as PartnershipSettingsPayload | undefined;
      if (!payload) return createJsonResponse({ error: "Missing settings" }, 400, origin);

      const row = {
        project_id: projectId,
        is_enabled: Boolean(payload.is_enabled),
        allow_partner_connect: Boolean(payload.allow_partner_connect),
        commission_type: payload.commission_type === "fixed" ? "fixed" : "percent",
        commission_value: Number(payload.commission_value ?? 0),
        payout_condition: payload.payout_condition ?? null,
        contract_url: payload.contract_url ?? null,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      };

      const { error: upErr } = await supabaseAdmin.from("project_partnership_settings").upsert(row, { onConflict: "project_id" });
      if (upErr) throw upErr;

      return createJsonResponse({ success: true }, 200, origin);
    }

    if (action === "add_construction_update") {
      const date = String((body as any)?.date ?? "");
      const title = String((body as any)?.title ?? "");
      const description = String((body as any)?.description ?? "");
      const images = Array.isArray((body as any)?.images) ? ((body as any).images as unknown[]).map((x) => String(x)) : null;
      if (!date || !title || !description) return createJsonResponse({ error: "Missing fields" }, 400, origin);

      const { data, error } = await supabaseAdmin
        .from("project_construction_updates")
        .insert({
          project_id: projectId,
          date,
          title,
          description,
          images,
          created_by: user.id,
        })
        .select("id")
        .single();
      if (error) throw error;

      return createJsonResponse({ success: true, id: data?.id ?? null }, 200, origin);
    }

    if (action === "delete_construction_update") {
      const id = asUuid((body as any)?.id);
      if (!id) return createJsonResponse({ error: "Missing id" }, 400, origin);
      const { error } = await supabaseAdmin.from("project_construction_updates").delete().eq("id", id).eq("project_id", projectId);
      if (error) throw error;
      return createJsonResponse({ success: true }, 200, origin);
    }

    if (action === "add_media_item") {
      const kind = String((body as any)?.kind ?? "") as MediaKind;
      const url = String((body as any)?.url ?? "");
      const title = (body as any)?.title ? String((body as any).title) : null;
      const thumbnailUrl = (body as any)?.thumbnail_url ? String((body as any).thumbnail_url) : null;
      const sortIndex = Number((body as any)?.sort_index ?? 0);
      if (!(kind === "render" || kind === "video" || kind === "presentation")) {
        return createJsonResponse({ error: "Invalid kind" }, 400, origin);
      }
      if (!url) return createJsonResponse({ error: "Missing url" }, 400, origin);

      const { data, error } = await supabaseAdmin
        .from("project_media_items")
        .insert({
          project_id: projectId,
          kind,
          url,
          title,
          thumbnail_url: thumbnailUrl,
          sort_index: Number.isFinite(sortIndex) ? sortIndex : 0,
          created_by: user.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      return createJsonResponse({ success: true, id: data?.id ?? null }, 200, origin);
    }

    if (action === "delete_media_item") {
      const id = asUuid((body as any)?.id);
      if (!id) return createJsonResponse({ error: "Missing id" }, 400, origin);
      const { error } = await supabaseAdmin.from("project_media_items").delete().eq("id", id).eq("project_id", projectId);
      if (error) throw error;
      return createJsonResponse({ success: true }, 200, origin);
    }

    return createJsonResponse({ error: "Invalid action" }, 400, origin);
  } catch (e) {
    console.error("project-drawer error", e);
    return createJsonResponse({ error: "internal_error", message: e instanceof Error ? e.message : String(e) }, 500, origin);
  }
});

