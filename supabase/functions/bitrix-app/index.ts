import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";

type JsonRecord = Record<string, unknown>;

function normalizeDomain(raw: string): string {
  const d = String(raw || "").trim();
  return d.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function extractSubdomain(domain: string): string {
  const d = normalizeDomain(domain);
  return d.split(".")[0] ?? d;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function toInt(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
}

async function parseBody(req: Request): Promise<{ json: any | null; form: Record<string, string> }> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const json = await req.json().catch(() => null);
    return { json, form: {} };
  }

  // Bitrix events often post form-urlencoded
  const formData = await req.formData().catch(() => null);
  const form: Record<string, string> = {};
  if (formData) {
    for (const [k, v] of formData.entries()) form[k] = v.toString();
  }
  return { json: null, form };
}

function parseBitrixEvent(form: Record<string, string>): {
  domain?: string;
  memberId?: string;
  dealId?: number;
  stageId?: string;
} {
  const domain = form["auth[domain]"] ?? form["DOMAIN"] ?? form["domain"];
  const memberId = form["auth[member_id]"] ?? form["member_id"];

  // Typical: data[FIELDS][ID] and data[FIELDS][STAGE_ID]
  const dealId =
    toInt(form["data[FIELDS][ID]"]) ??
    toInt(form["data[ID]"]) ??
    toInt(form["data[id]"]) ??
    toInt(form["FIELDS[ID]"]) ??
    null;
  const stageId =
    form["data[FIELDS][STAGE_ID]"] ??
    form["FIELDS[STAGE_ID]"] ??
    form["data[STAGE_ID]"] ??
    form["STAGE_ID"] ??
    undefined;

  return {
    domain: domain ? normalizeDomain(domain) : undefined,
    memberId: memberId ?? undefined,
    dealId: dealId ?? undefined,
    stageId: stageId ?? undefined,
  };
}

async function callBitrixRest(opts: {
  domain: string;
  accessToken: string;
  method: string;
  params?: Record<string, unknown>;
}): Promise<any> {
  const domain = normalizeDomain(opts.domain);
  const url = `https://${domain}/rest/${opts.method}.json`;

  const body = new URLSearchParams();
  body.set("auth", opts.accessToken);
  if (opts.params) {
    for (const [k, v] of Object.entries(opts.params)) {
      if (v === undefined) continue;
      if (v === null) {
        body.set(k, "");
        continue;
      }
      if (typeof v === "object") {
        body.set(k, JSON.stringify(v));
        continue;
      }
      body.set(k, String(v));
    }
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await resp.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }

  if (!resp.ok) {
    console.error("Bitrix REST call failed", {
      url,
      status: resp.status,
      statusText: resp.statusText,
      body: text,
    });
    throw new Error(`Bitrix REST call failed: ${resp.status}`);
  }

  if (json?.error) {
    console.error("Bitrix REST returned error", { url, json });
    throw new Error(`Bitrix REST error: ${json.error}`);
  }

  return json;
}

async function getValidBitrixAccessToken(opts: {
  svc: any;
  crmConnectionId: string;
  baseDomain: string;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
}): Promise<string | null> {
  const now = Date.now();
  if (opts.accessToken && opts.tokenExpiresAt) {
    const exp = Date.parse(opts.tokenExpiresAt);
    if (Number.isFinite(exp) && exp > now + 5 * 60 * 1000) return opts.accessToken;
  }

  if (!opts.refreshToken) return opts.accessToken;

  const clientId = Deno.env.get("BITRIX_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("BITRIX_CLIENT_SECRET") ?? "";
  if (!clientId || !clientSecret) {
    console.warn("BITRIX_CLIENT_ID/SECRET not set; cannot refresh token");
    return opts.accessToken;
  }

  const url = new URL("https://oauth.bitrix.info/oauth/token/");
  url.searchParams.set("grant_type", "refresh_token");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("refresh_token", opts.refreshToken);

  const resp = await fetch(url.toString(), { method: "GET" });
  const json = await resp.json().catch(() => null);

  if (!resp.ok || !json?.access_token) {
    console.error("Bitrix token refresh failed", { status: resp.status, json });
    return opts.accessToken;
  }

  const nextAccess = String(json.access_token);
  const nextRefresh = isNonEmptyString(json.refresh_token) ? String(json.refresh_token) : opts.refreshToken;
  const expiresIn = toInt(json.expires_in);
  const nextExpiresAt =
    typeof expiresIn === "number" && expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

  await opts.svc
    .from("crm_connections")
    .update({
      access_token: nextAccess,
      refresh_token: nextRefresh,
      token_expires_at: nextExpiresAt,
      base_domain: opts.baseDomain,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opts.crmConnectionId);

  return nextAccess;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return createCorsResponse(origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const webhookSecret = Deno.env.get("BITRIX_WEBHOOK_SECRET") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return createJsonResponse({ error: "Server configuration error" }, 500, origin);
  }

  const url = new URL(req.url);
  const event = url.searchParams.get("event");
  const providedSecret = url.searchParams.get("secret");

  const svc = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ---- Webhook handler: Bitrix -> Gridix (no JWT)
  if (event === "deal_updated") {
    if (!webhookSecret || providedSecret !== webhookSecret) {
      return createJsonResponse({ error: "Unauthorized" }, 401, origin);
    }

    const { form } = await parseBody(req);
    const parsed = parseBitrixEvent(form);

    if (!parsed.dealId) {
      return createJsonResponse({ status: "ok", skipped: true, reason: "no_deal_id" }, 200, origin);
    }

    const domain = parsed.domain;
    const memberId = parsed.memberId;

    // Find connection by domain/member_id (if already claimed)
    const q = svc
      .from("crm_connections")
      .select("id, user_id, crm_type, subdomain, base_domain, access_token, refresh_token, token_expires_at, bitrix_member_id");

    let connResp = null as any;
    if (domain) {
      connResp = await q.eq("crm_type", "bitrix24").eq("base_domain", domain).maybeSingle();
    } else if (memberId) {
      connResp = await q.eq("crm_type", "bitrix24").eq("bitrix_member_id", memberId).maybeSingle();
    } else {
      connResp = await q.eq("crm_type", "bitrix24").eq("subdomain", "").maybeSingle();
    }

    const connection = connResp?.data ?? null;
    if (!connection) {
      return createJsonResponse({ status: "ok", skipped: true, reason: "no_connection" }, 200, origin);
    }

    const baseDomain = normalizeDomain(connection.base_domain ?? `${connection.subdomain}.bitrix24.ru`);
    const accessToken = await getValidBitrixAccessToken({
      svc,
      crmConnectionId: connection.id,
      baseDomain,
      accessToken: connection.access_token,
      refreshToken: connection.refresh_token,
      tokenExpiresAt: connection.token_expires_at,
    });

    if (!accessToken) {
      return createJsonResponse({ status: "ok", skipped: true, reason: "no_token" }, 200, origin);
    }

    // Fetch current deal stage (more reliable than parsing event)
    let stageId: string | null = parsed.stageId ?? null;
    try {
      const deal = await callBitrixRest({
        domain: baseDomain,
        accessToken,
        method: "crm.deal.get",
        params: { id: parsed.dealId },
      });
      stageId = String(deal?.result?.STAGE_ID ?? stageId ?? "");
    } catch (e) {
      console.warn("crm.deal.get failed; will use stageId from event if present", e);
    }

    if (!stageId) {
      return createJsonResponse({ status: "ok", skipped: true, reason: "no_stage_id" }, 200, origin);
    }

    // Find link and map stage -> local pipeline stage
    const { data: link } = await svc
      .from("bitrix_deal_links")
      .select("id, project_id, lead_id")
      .eq("crm_connection_id", connection.id)
      .eq("bitrix_deal_id", parsed.dealId)
      .maybeSingle();

    if (!link?.lead_id) {
      return createJsonResponse({ status: "ok", skipped: true, reason: "no_link" }, 200, origin);
    }

    const { data: mapping } = await svc
      .from("bitrix_stage_mapping")
      .select("lead_pipeline_stage_id")
      .eq("project_id", link.project_id)
      .eq("bitrix_stage_id", stageId)
      .maybeSingle();

    if (!mapping?.lead_pipeline_stage_id) {
      return createJsonResponse({ status: "ok", skipped: true, reason: "no_mapping" }, 200, origin);
    }

    await svc
      .from("leads")
      .update({ pipeline_stage_id: mapping.lead_pipeline_stage_id, updated_at: new Date().toISOString() })
      .eq("id", link.lead_id);

    await svc.from("lead_history").insert({
      lead_id: link.lead_id,
      type: "note",
      text: `Bitrix deal #${parsed.dealId} stage changed to ${stageId} (synced from Bitrix)`,
      user_id: null,
    });

    return createJsonResponse({ status: "ok" }, 200, origin);
  }

  // ---- Authenticated API (UI -> Supabase)
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser();
  const user = authData?.user ?? null;
  if (authError || !user) {
    return createJsonResponse({ error: "Unauthorized" }, 401, origin);
  }

  const { json } = await parseBody(req);
  const body = (json ?? {}) as JsonRecord;
  const action = String(body.action ?? "");

  try {
    switch (action) {
      case "claim_install": {
        const domain = normalizeDomain(String(body.domain ?? ""));
        const memberId = String(body.member_id ?? body.memberId ?? "");
        if (!domain || !memberId) return createJsonResponse({ error: "Missing domain/member_id" }, 400, origin);

        const { data: pending, error } = await svc
          .from("bitrix_pending_installs")
          .select("*")
          .eq("domain", domain)
          .eq("member_id", memberId)
          .maybeSingle();

        if (error || !pending) {
          return createJsonResponse({ error: "Pending install not found" }, 404, origin);
        }

        const { error: upsertErr } = await svc
          .from("crm_connections")
          .upsert(
            {
              user_id: user.id,
              crm_type: "bitrix24",
              subdomain: pending.subdomain,
              base_domain: pending.domain,
              access_token: pending.access_token,
              refresh_token: pending.refresh_token,
              token_expires_at: pending.token_expires_at,
              bitrix_member_id: pending.member_id,
            },
            { onConflict: "user_id,crm_type" }
          );

        if (upsertErr) return createJsonResponse({ error: "Failed to create connection" }, 500, origin);

        await svc.from("bitrix_pending_installs").delete().eq("id", pending.id);

        return createJsonResponse({ success: true }, 200, origin);
      }

      case "get_projects": {
        const { data, error } = await userClient
          .from("projects")
          .select("id,name,description,address,building_image_url,currency,slug")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return createJsonResponse({ projects: data ?? [] }, 200, origin);
      }

      case "get_apartments": {
        const projectId = String(body.project_id ?? body.projectId ?? "");
        if (!projectId) return createJsonResponse({ error: "Missing project_id" }, 400, origin);

        // Ensure project belongs to user
        const { data: project } = await userClient.from("projects").select("id").eq("id", projectId).eq("user_id", user.id).maybeSingle();
        if (!project) return createJsonResponse({ error: "Project not found" }, 404, origin);

        const { data, error } = await userClient
          .from("apartments")
          .select("id,apartment_number,floor_number,rooms,area,price,status,type,custom_fields")
          .eq("project_id", projectId)
          .order("floor_number", { ascending: true });
        if (error) throw error;
        return createJsonResponse({ apartments: data ?? [] }, 200, origin);
      }

      case "deal_context": {
        const dealId = toInt(body.bitrix_deal_id ?? body.dealId);
        if (!dealId) return createJsonResponse({ error: "Missing bitrix_deal_id" }, 400, origin);

        const { data: conn } = await svc
          .from("crm_connections")
          .select("id, subdomain, base_domain, access_token, refresh_token, token_expires_at")
          .eq("user_id", user.id)
          .eq("crm_type", "bitrix24")
          .maybeSingle();

        if (!conn) return createJsonResponse({ error: "Bitrix connection not found" }, 404, origin);

        const { data: link } = await svc
          .from("bitrix_deal_links")
          .select("id, project_id, apartment_id, lead_id, bitrix_deal_id")
          .eq("crm_connection_id", conn.id)
          .eq("bitrix_deal_id", dealId)
          .maybeSingle();

        return createJsonResponse({ connected: true, link: link ?? null }, 200, origin);
      }

      case "link_apartment_to_deal": {
        const dealId = toInt(body.bitrix_deal_id ?? body.dealId);
        const projectId = String(body.project_id ?? body.projectId ?? "");
        const apartmentId = String(body.apartment_id ?? body.apartmentId ?? "");
        if (!dealId || !projectId || !apartmentId) {
          return createJsonResponse({ error: "Missing deal_id/project_id/apartment_id" }, 400, origin);
        }

        // Ensure apartment belongs to user via project ownership
        const { data: apartment, error: aptErr } = await userClient
          .from("apartments")
          .select("id, apartment_number, floor_number, rooms, area, price, projects!inner(id,name,address,currency,user_id)")
          .eq("id", apartmentId)
          .eq("project_id", projectId)
          .single();
        if (aptErr || !apartment) return createJsonResponse({ error: "Apartment not found" }, 404, origin);

        const { data: settings } = await svc
          .from("project_bitrix_settings")
          .select("crm_connection_id, deal_link_uf_field")
          .eq("project_id", projectId)
          .maybeSingle();

        const { data: conn } = await svc
          .from("crm_connections")
          .select("id, subdomain, base_domain, access_token, refresh_token, token_expires_at")
          .eq("user_id", user.id)
          .eq("crm_type", "bitrix24")
          .maybeSingle();

        const crmConnectionId = settings?.crm_connection_id ?? conn?.id ?? null;
        if (!crmConnectionId) return createJsonResponse({ error: "Bitrix connection not found" }, 404, origin);

        const { data: realConn } = await svc
          .from("crm_connections")
          .select("id, subdomain, base_domain, access_token, refresh_token, token_expires_at")
          .eq("id", crmConnectionId)
          .maybeSingle();
        if (!realConn) return createJsonResponse({ error: "Bitrix connection not found" }, 404, origin);

        const baseDomain = normalizeDomain(realConn.base_domain ?? `${realConn.subdomain}.bitrix24.ru`);
        const accessToken = await getValidBitrixAccessToken({
          svc,
          crmConnectionId: realConn.id,
          baseDomain,
          accessToken: realConn.access_token,
          refreshToken: realConn.refresh_token,
          tokenExpiresAt: realConn.token_expires_at,
        });
        if (!accessToken) return createJsonResponse({ error: "Bitrix auth missing" }, 400, origin);

        const ufField = settings?.deal_link_uf_field ?? "UF_GRIDIX_APARTMENT_ID";

        // Update Bitrix deal fields + UF field
        await callBitrixRest({
          domain: baseDomain,
          accessToken,
          method: "crm.deal.update",
          params: {
            id: dealId,
            fields: {
              OPPORTUNITY: Number(apartment.price ?? 0),
              CURRENCY_ID: String((apartment as any)?.projects?.currency ?? "RUB"),
              [ufField]: apartment.id,
            },
          },
        });

        // Add comment
        const commentText = `✅ Связана квартира Gridix\n\n• Проект: ${(apartment as any)?.projects?.name ?? ""}\n• Квартира: ${apartment.apartment_number}\n• Цена: ${Number(apartment.price ?? 0).toLocaleString("ru-RU")} ${(apartment as any)?.projects?.currency ?? ""}\n• Площадь: ${apartment.area ?? ""} м²\n• Комнаты: ${apartment.rooms ?? ""}\n• Этаж: ${apartment.floor_number ?? ""}\n\nИсточник: Gridix`;
        await callBitrixRest({
          domain: baseDomain,
          accessToken,
          method: "crm.timeline.comment.add",
          params: {
            fields: {
              ENTITY_TYPE: "deal",
              ENTITY_ID: dealId,
              COMMENT: commentText,
            },
          },
        }).catch((e) => console.warn("timeline.comment.add failed:", e));

        // Create/update local lead placeholder
        const leadEmail = `bitrix-deal-${dealId}@gridix.local`;
        const leadPhone = `bitrix-deal-${dealId}`;
        const leadName = `Bitrix deal #${dealId}: ${(apartment as any)?.projects?.name ?? "Project"} / ${apartment.apartment_number}`;

        let leadId: string | null = null;
        const { data: existingLead } = await svc
          .from("leads")
          .select("id")
          .eq("email", leadEmail)
          .eq("apartment_id", apartment.id)
          .maybeSingle();

        if (existingLead?.id) {
          leadId = existingLead.id;
        } else {
          const { data: newLead, error: leadErr } = await svc
            .from("leads")
            .insert({
              name: leadName,
              email: leadEmail,
              phone: leadPhone,
              project_id: projectId,
              apartment_id: apartment.id,
              status: "pending",
              source: "website",
              notes: "Created automatically from Bitrix deal link",
            })
            .select("id")
            .single();
          if (leadErr) throw leadErr;
          leadId = newLead?.id ?? null;
        }

        const { data: link, error: linkErr } = await svc
          .from("bitrix_deal_links")
          .upsert(
            {
              crm_connection_id: realConn.id,
              bitrix_deal_id: dealId,
              project_id: projectId,
              apartment_id: apartment.id,
              lead_id: leadId,
            },
            { onConflict: "crm_connection_id,bitrix_deal_id" }
          )
          .select("id")
          .single();
        if (linkErr) throw linkErr;

        return createJsonResponse({ success: true, linkId: link?.id, leadId }, 200, origin);
      }

      case "create_deal_from_apartment": {
        const projectId = String(body.project_id ?? body.projectId ?? "");
        const apartmentId = String(body.apartment_id ?? body.apartmentId ?? "");
        if (!projectId || !apartmentId) return createJsonResponse({ error: "Missing project_id/apartment_id" }, 400, origin);

        const { data: apartment, error: aptErr } = await userClient
          .from("apartments")
          .select("id, apartment_number, floor_number, rooms, area, price, projects!inner(id,name,address,currency,user_id)")
          .eq("id", apartmentId)
          .eq("project_id", projectId)
          .single();
        if (aptErr || !apartment) return createJsonResponse({ error: "Apartment not found" }, 404, origin);

        const { data: settings } = await svc
          .from("project_bitrix_settings")
          .select("crm_connection_id, category_id, stage_id, assigned_by_id, deal_link_uf_field")
          .eq("project_id", projectId)
          .maybeSingle();

        const { data: conn } = await svc
          .from("crm_connections")
          .select("id, subdomain, base_domain, access_token, refresh_token, token_expires_at")
          .eq("user_id", user.id)
          .eq("crm_type", "bitrix24")
          .maybeSingle();

        const crmConnectionId = settings?.crm_connection_id ?? conn?.id ?? null;
        if (!crmConnectionId) return createJsonResponse({ error: "Bitrix connection not found" }, 404, origin);

        const { data: realConn } = await svc
          .from("crm_connections")
          .select("id, subdomain, base_domain, access_token, refresh_token, token_expires_at")
          .eq("id", crmConnectionId)
          .maybeSingle();
        if (!realConn) return createJsonResponse({ error: "Bitrix connection not found" }, 404, origin);

        const baseDomain = normalizeDomain(realConn.base_domain ?? `${realConn.subdomain}.bitrix24.ru`);
        const accessToken = await getValidBitrixAccessToken({
          svc,
          crmConnectionId: realConn.id,
          baseDomain,
          accessToken: realConn.access_token,
          refreshToken: realConn.refresh_token,
          tokenExpiresAt: realConn.token_expires_at,
        });
        if (!accessToken) return createJsonResponse({ error: "Bitrix auth missing" }, 400, origin);

        const ufField = settings?.deal_link_uf_field ?? "UF_GRIDIX_APARTMENT_ID";
        const title = `Gridix: ${(apartment as any)?.projects?.name ?? "Project"} / ${apartment.apartment_number}`;

        const addResp = await callBitrixRest({
          domain: baseDomain,
          accessToken,
          method: "crm.deal.add",
          params: {
            fields: {
              TITLE: title,
              CATEGORY_ID: settings?.category_id ?? undefined,
              STAGE_ID: settings?.stage_id ?? undefined,
              ASSIGNED_BY_ID: settings?.assigned_by_id ?? undefined,
              OPPORTUNITY: Number(apartment.price ?? 0),
              CURRENCY_ID: String((apartment as any)?.projects?.currency ?? "RUB"),
              [ufField]: apartment.id,
            },
          },
        });

        const dealId = toInt(addResp?.result) ?? toInt(addResp?.result?.ID);
        if (!dealId) return createJsonResponse({ error: "Failed to create deal" }, 500, origin);

        const commentText = `🆕 Создана сделка из Gridix по квартире\n\n• Проект: ${(apartment as any)?.projects?.name ?? ""}\n• Квартира: ${apartment.apartment_number}\n• Цена: ${Number(apartment.price ?? 0).toLocaleString("ru-RU")} ${(apartment as any)?.projects?.currency ?? ""}\n\nИсточник: Gridix`;
        await callBitrixRest({
          domain: baseDomain,
          accessToken,
          method: "crm.timeline.comment.add",
          params: {
            fields: {
              ENTITY_TYPE: "deal",
              ENTITY_ID: dealId,
              COMMENT: commentText,
            },
          },
        }).catch((e) => console.warn("timeline.comment.add failed:", e));

        // Local lead placeholder
        const leadEmail = `bitrix-deal-${dealId}@gridix.local`;
        const leadPhone = `bitrix-deal-${dealId}`;
        const leadName = `Bitrix deal #${dealId}: ${(apartment as any)?.projects?.name ?? "Project"} / ${apartment.apartment_number}`;

        const { data: newLead } = await svc
          .from("leads")
          .insert({
            name: leadName,
            email: leadEmail,
            phone: leadPhone,
            project_id: projectId,
            apartment_id: apartment.id,
            status: "pending",
            source: "website",
            notes: "Created automatically from Bitrix deal creation",
          })
          .select("id")
          .single();

        const leadId = newLead?.id ?? null;

        await svc.from("bitrix_deal_links").insert({
          crm_connection_id: realConn.id,
          bitrix_deal_id: dealId,
          project_id: projectId,
          apartment_id: apartment.id,
          lead_id: leadId,
        });

        return createJsonResponse({ success: true, bitrix_deal_id: dealId, leadId }, 200, origin);
      }

      case "push_lead_status_to_bitrix": {
        const leadId = String(body.lead_id ?? body.leadId ?? "");
        if (!leadId) return createJsonResponse({ error: "Missing lead_id" }, 400, origin);

        const { data: lead } = await svc
          .from("leads")
          .select("id, project_id, pipeline_stage_id")
          .eq("id", leadId)
          .maybeSingle();
        if (!lead) return createJsonResponse({ error: "Lead not found" }, 404, origin);

        // Ensure lead belongs to user via project ownership
        const { data: project } = await svc.from("projects").select("id,user_id").eq("id", lead.project_id).maybeSingle();
        if (!project || project.user_id !== user.id) return createJsonResponse({ error: "Forbidden" }, 403, origin);

        const { data: conn } = await svc
          .from("crm_connections")
          .select("id, subdomain, base_domain, access_token, refresh_token, token_expires_at")
          .eq("user_id", user.id)
          .eq("crm_type", "bitrix24")
          .maybeSingle();
        if (!conn) return createJsonResponse({ error: "Bitrix connection not found" }, 404, origin);

        const { data: link } = await svc
          .from("bitrix_deal_links")
          .select("bitrix_deal_id")
          .eq("crm_connection_id", conn.id)
          .eq("lead_id", lead.id)
          .maybeSingle();
        if (!link) return createJsonResponse({ error: "Link not found" }, 404, origin);

        if (!lead.pipeline_stage_id) return createJsonResponse({ error: "Lead has no pipeline_stage_id" }, 400, origin);

        const { data: mapping } = await svc
          .from("bitrix_stage_mapping")
          .select("bitrix_stage_id")
          .eq("project_id", lead.project_id)
          .eq("lead_pipeline_stage_id", lead.pipeline_stage_id)
          .maybeSingle();
        if (!mapping?.bitrix_stage_id) return createJsonResponse({ error: "No mapping for this stage" }, 400, origin);

        const baseDomain = normalizeDomain(conn.base_domain ?? `${conn.subdomain}.bitrix24.ru`);
        const accessToken = await getValidBitrixAccessToken({
          svc,
          crmConnectionId: conn.id,
          baseDomain,
          accessToken: conn.access_token,
          refreshToken: conn.refresh_token,
          tokenExpiresAt: conn.token_expires_at,
        });
        if (!accessToken) return createJsonResponse({ error: "Bitrix auth missing" }, 400, origin);

        await callBitrixRest({
          domain: baseDomain,
          accessToken,
          method: "crm.deal.update",
          params: {
            id: link.bitrix_deal_id,
            fields: { STAGE_ID: mapping.bitrix_stage_id },
          },
        });

        await callBitrixRest({
          domain: baseDomain,
          accessToken,
          method: "crm.timeline.comment.add",
          params: {
            fields: {
              ENTITY_TYPE: "deal",
              ENTITY_ID: link.bitrix_deal_id,
              COMMENT: `🔄 Статус обновлен из Gridix: ${mapping.bitrix_stage_id}`,
            },
          },
        }).catch((e) => console.warn("timeline.comment.add failed:", e));

        return createJsonResponse({ success: true }, 200, origin);
      }

      default:
        return createJsonResponse({ error: `Unsupported action: ${action}` }, 400, origin);
    }
  } catch (e) {
    console.error("bitrix-app error", e);
    return createJsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500, origin);
  }
});

