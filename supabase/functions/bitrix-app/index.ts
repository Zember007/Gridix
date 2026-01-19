// @ts-ignore - resolved in Supabase Edge (Deno) runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore - resolved in Supabase Edge (Deno) runtime
import { createClient } from "npm:@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";
import { createOrUpdateBitrixProjectFunnel } from "../_shared/crm-funnel.ts";

// TS in the web app workspace may not understand Supabase Edge runtime globals.
// In Edge runtime, `Deno` exists.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

type JsonRecord = Record<string, unknown>;

function normalizeDomain(raw: string): string {
  const d = String(raw || "").trim();
  return d.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function normalizeEmail(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase();
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

  const appendParam = (sp: URLSearchParams, key: string, value: unknown) => {
    if (value === undefined) return;
    if (value === null) {
      sp.set(key, "");
      return;
    }
    if (Array.isArray(value)) {
      // Keep arrays compact; Bitrix often accepts JSON for arrays.
      sp.set(key, JSON.stringify(value));
      return;
    }
    if (typeof value === "object") {
      // Bitrix expects nested params as fields[KEY]=... (not JSON strings) for many CRM methods.
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        appendParam(sp, `${key}[${k}]`, v);
      }
      return;
    }
    sp.set(key, String(value));
  };

  const body = new URLSearchParams();
  body.set("auth", opts.accessToken);
  if (opts.params) {
    for (const [k, v] of Object.entries(opts.params)) {
      appendParam(body, k, v);
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
    const desc = json?.error_description ? ` ${json.error_description}` : "";
    throw new Error(`Bitrix REST call failed: ${resp.status}${desc}`);
  }

  if (json?.error) {
    console.error("Bitrix REST returned error", { url, json });
    const desc = json?.error_description ? ` ${json.error_description}` : "";
    throw new Error(`Bitrix REST error: ${json.error}${desc}`);
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

function normalizeBitrixCategory(raw: any): { id: number; name: string; sort: number } | null {
  const idRaw = raw?.ID ?? raw?.id ?? raw?.Id;
  const n = toInt(idRaw);
  if (typeof n !== "number") return null;
  const name = String(raw?.NAME ?? raw?.name ?? `Category ${n}`);
  const sort = toInt(raw?.SORT ?? raw?.sort) ?? 0;
  return { id: n, name, sort };
}

function normalizeBitrixStage(raw: any): { stageId: string; name: string; sort: number; color: string } | null {
  const stageId = String(raw?.STATUS_ID ?? raw?.ID ?? raw?.id ?? "").trim();
  if (!stageId) return null;
  const name = String(raw?.NAME ?? raw?.name ?? stageId);
  const sort = toInt(raw?.SORT ?? raw?.sort) ?? 0;
  const color = String(raw?.COLOR ?? raw?.color ?? "#d5d8dd") || "#d5d8dd";
  return { stageId, name, sort, color };
}

async function getUserBitrixConnection(opts: {
  svc: any;
  userId: string;
  projectId?: string;
}): Promise<{
  id: string;
  subdomain: string;
  base_domain: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
} | null> {
  if (opts.projectId) {
    const { data: ps } = await opts.svc
      .from("project_bitrix_settings")
      .select("crm_connection_id")
      .eq("project_id", opts.projectId)
      .maybeSingle();
    const cid = ps?.crm_connection_id ?? null;
    if (cid) {
      const { data: c } = await opts.svc
        .from("crm_connections")
        .select("id, subdomain, base_domain, access_token, refresh_token, token_expires_at")
        .eq("id", cid)
        .maybeSingle();
      if (c?.id) return c as any;
    }
  }

  const { data: conn } = await opts.svc
    .from("crm_connections")
    .select("id, subdomain, base_domain, access_token, refresh_token, token_expires_at")
    .eq("user_id", opts.userId)
    .eq("crm_type", "bitrix24")
    .maybeSingle();
  return (conn ?? null) as any;
}

async function bitrixCallCategories(opts: { domain: string; accessToken: string }) {
  // Bitrix has two naming variants depending on environment.
  try {
    const r = await callBitrixRest({ domain: opts.domain, accessToken: opts.accessToken, method: "crm.dealcategory.list" });
    return r;
  } catch {
    return await callBitrixRest({ domain: opts.domain, accessToken: opts.accessToken, method: "crm.deal.category.list" });
  }
}

async function bitrixCallStages(opts: { domain: string; accessToken: string; categoryId: number }) {
  const entityId = opts.categoryId === 0 ? "DEAL_STAGE" : `DEAL_STAGE_${opts.categoryId}`;
  return await callBitrixRest({
    domain: opts.domain,
    accessToken: opts.accessToken,
    method: "crm.status.entity.items",
    params: { entityId },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return createCorsResponse(origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  // Prefer production SITE_URL; keep SITE_DEV_URL for local/backwards compatibility.
  const siteUrl = Deno.env.get("SITE_DEV_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const webhookSecret = Deno.env.get("JWT_SECRET") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return createJsonResponse({ error: "Server configuration error" }, 500, origin);
  }

  const url = new URL(req.url);
  const event = url.searchParams.get("event");
  const providedSecret = url.searchParams.get("secret");


  if (req.method === "GET" && !event) {
    // If Bitrix calls the handler without a POST body (some environments do), just send users to embed UI.
    // SSO requires domain/member_id (provided only in POST form payload), so we can't auto-login here.
    const baseSiteUrl = siteUrl ? (siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`) : "";
    if (!baseSiteUrl) return new Response("Server configuration error (SITE_URL missing)", { status: 500 });
    return Response.redirect(`${baseSiteUrl}embed/bitrix`, 302);
  }

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

    const domain = parsed.domain ? normalizeDomain(parsed.domain) : null;
    const memberId = parsed.memberId ? String(parsed.memberId) : null;

    if (!domain && !memberId) {
      return createJsonResponse(
        { status: "ok", skipped: true, reason: "no_domain_or_member_id" },
        200,
        origin
      );
    }

    // Find connection by member_id first (most stable), fallback to domain/subdomain.
    const q = svc
      .from("crm_connections")
      .select(
        "id, user_id, crm_type, subdomain, base_domain, access_token, refresh_token, token_expires_at, bitrix_member_id"
      )
      .eq("crm_type", "bitrix24");

    let connection: any | null = null;

    if (memberId) {
      const { data } = await q.eq("bitrix_member_id", memberId).maybeSingle();
      connection = data ?? null;
    }

    if (!connection && domain) {
      const sub = extractSubdomain(domain);
      const { data } = await q.or(`base_domain.eq.${domain},subdomain.eq.${sub}`).maybeSingle();
      connection = data ?? null;
    }

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

    // Fetch current deal stage + title (more reliable than parsing event)
    let stageId: string | null = parsed.stageId ?? null;
    let dealTitle: string | null = null;
    try {
      const deal = await callBitrixRest({
        domain: baseDomain,
        accessToken,
        method: "crm.deal.get",
        params: { id: parsed.dealId },
      });
      stageId = String(deal?.result?.STAGE_ID ?? stageId ?? "");
      dealTitle = deal?.result?.TITLE ? String(deal.result.TITLE) : null;
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

    const leadPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    leadPatch.pipeline_stage_id = mapping.lead_pipeline_stage_id;
    if (dealTitle) {
      leadPatch.name = dealTitle;
    }

    await svc
      .from("leads")
      .update(leadPatch)
      .eq("id", link.lead_id);

    await svc.from("lead_history").insert({
      lead_id: link.lead_id,
      type: "note",
      text: `Bitrix deal #${parsed.dealId} stage changed to ${stageId} (synced from Bitrix)`,
      user_id: null,
    });

    return createJsonResponse({ status: "ok" }, 200, origin);
  }

  // ---- Non-authenticated API (UI -> Supabase): Bitrix SSO
  const parsedBody = await parseBody(req);
  const body = (parsedBody.json ?? parsedBody.form ?? {}) as JsonRecord;
  console.log("parsed", body);
  const action = String(body.action ?? "");


  if (!event && req.method === "POST" && !action) {
    // Bitrix loads app iframe via POST + x-www-form-urlencoded and DOES NOT send `action`.
    // In that case we should redirect into the web app, optionally attaching ?sso=... if the portal is already connected.
    const baseSiteUrl = siteUrl ? (siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`) : "";
    if (!baseSiteUrl) {
      return new Response("Server configuration error (SITE_URL missing)", { status: 500 });
    }

    const form = parsedBody.form ?? {};
    const domainRaw =
      (typeof body.DOMAIN === "string" && body.DOMAIN) ||
      (typeof body.domain === "string" && body.domain) ||
      url.searchParams.get("DOMAIN") ||
      url.searchParams.get("domain") ||
      form["DOMAIN"] ||
      form["domain"] ||
      "";
    const memberIdRaw =
      (typeof body.member_id === "string" && body.member_id) ||
      (typeof body.memberId === "string" && body.memberId) ||
      form["member_id"] ||
      "";

    const domain = normalizeDomain(String(domainRaw || ""));
    const memberId = String(memberIdRaw || "");

    // We keep a single UI entrypoint; additionally, forward deal_id when available (for stable context).
    const targetPath = "embed/bitrix";
    let dealIdFromPlacement: string | null = null;
    try {
      const rawOpts = String(form["PLACEMENT_OPTIONS"] ?? body.PLACEMENT_OPTIONS ?? "");
      if (rawOpts) {
        const parsed = JSON.parse(rawOpts);
        const id = parsed?.ID ?? parsed?.id ?? null;
        const n = typeof id === "string" || typeof id === "number" ? Number(id) : NaN;
        if (Number.isFinite(n) && n > 0) dealIdFromPlacement = String(n);
      }
    } catch {
      // ignore
    }

    // We no longer generate SSO here (it's handled by shared `amocrm-sso-login` in the UI layer).
    // Redirect into the web app, forwarding domain/member_id so the frontend can SSO.
    if (domain) {
      const dest = new URL(`${baseSiteUrl}${targetPath}`);
      dest.searchParams.set("crm", "bitrix");
      dest.searchParams.set("domain", domain);
      if (memberId) dest.searchParams.set("member_id", memberId);
      if (dealIdFromPlacement) dest.searchParams.set("deal_id", dealIdFromPlacement);
      return Response.redirect(dest.toString(), 303);
    }

    // No domain -> fallback to projects
    return Response.redirect(`${baseSiteUrl}${targetPath}`, 303);
  }

  if (action === "install_status") {
    const domain = normalizeDomain(String(body.domain ?? ""));
    const memberId = String(body.member_id ?? body.memberId ?? "");
    if (!domain || !memberId) return createJsonResponse({ error: "Missing domain/member_id" }, 400, origin);

    const { data: pending, error: pendingErr } = await svc
      .from("bitrix_pending_installs")
      .select("id, domain, member_id, created_at, updated_at")
      .eq("domain", domain)
      .eq("member_id", memberId)
      .maybeSingle();

    if (pendingErr) {
      console.error("install_status: pending query failed", pendingErr);
      return createJsonResponse({ error: "Failed to load pending install" }, 500, origin);
    }

    const { data: conn, error: connErr } = await svc
      .from("crm_connections")
      .select("id, user_id, crm_type, base_domain, bitrix_member_id, updated_at")
      .eq("crm_type", "bitrix24")
      .eq("base_domain", domain)
      .eq("bitrix_member_id", memberId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (connErr) {
      console.error("install_status: connection query failed", connErr);
      return createJsonResponse({ error: "Failed to load connection" }, 500, origin);
    }

    const claimed = !!conn?.id && !!conn?.user_id;
    return createJsonResponse({ pending: !!pending?.id, claimed }, 200, origin);
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

  // Reuse the already-parsed JSON body to avoid reading the stream twice.

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

      case "get_pending_install": {
        const projectId = String(body.project_id ?? body.projectId ?? "");
        const domainInput = normalizeDomain(String(body.domain ?? body.base_domain ?? body.subdomain ?? ""));
        if (!projectId) return createJsonResponse({ error: "Missing project_id" }, 400, origin);
        if (!domainInput) return createJsonResponse({ error: "Missing domain" }, 400, origin);

        // Ensure project belongs to user
        const { data: project } = await userClient
          .from("projects")
          .select("id")
          .eq("id", projectId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!project) return createJsonResponse({ error: "Project not found" }, 404, origin);

        const subdomain = extractSubdomain(domainInput);
        const { data: pending, error } = await svc
          .from("bitrix_pending_installs")
          .select("domain,subdomain,member_id,claim_token,created_at,updated_at")
          .or(`domain.eq.${domainInput},subdomain.eq.${subdomain}`)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("get_pending_install error", error);
          return createJsonResponse({ error: "Failed to load pending install" }, 500, origin);
        }

        return createJsonResponse({ pending: pending ?? null }, 200, origin);
      }

      case "claim_install_by_token": {
        const projectId = String(body.project_id ?? body.projectId ?? "");
        const token = String(body.token ?? body.claim_token ?? "").trim();
        const emailInput = normalizeEmail(String(body.email ?? ""));
        if (!projectId) return createJsonResponse({ error: "Missing project_id" }, 400, origin);
        if (!token) return createJsonResponse({ error: "Missing token" }, 400, origin);
        if (!emailInput) return createJsonResponse({ error: "Missing email" }, 400, origin);

        // Ensure project belongs to user
        const { data: project } = await userClient
          .from("projects")
          .select("id")
          .eq("id", projectId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!project) return createJsonResponse({ error: "Project not found" }, 404, origin);

        const userEmail = normalizeEmail(user.email ?? "");
        if (!userEmail || userEmail !== emailInput) {
          return createJsonResponse({ error: "Email mismatch" }, 403, origin);
        }

        const { data: pending, error: pendingErr } = await svc
          .from("bitrix_pending_installs")
          .select("*")
          .eq("claim_token", token)
          .maybeSingle();

        if (pendingErr) {
          console.error("claim_install_by_token: pending query failed", pendingErr);
          return createJsonResponse({ error: "Failed to claim token" }, 500, origin);
        }
        if (!pending) return createJsonResponse({ error: "Invalid token" }, 404, origin);

        const { data: connRow, error: upsertErr } = await svc
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
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,crm_type" }
          )
          .select("id")
          .maybeSingle();

        if (upsertErr || !connRow?.id) {
          console.error("claim_install_by_token: connection upsert failed", upsertErr);
          return createJsonResponse({ error: "Failed to create connection" }, 500, origin);
        }

        const { error: attachErr } = await svc
          .from("project_bitrix_settings")
          .upsert(
            {
              project_id: projectId,
              crm_connection_id: connRow.id,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "project_id" }
          );
        if (attachErr) {
          console.error("claim_install_by_token: attach failed", attachErr);
          return createJsonResponse({ error: "Failed to attach to project" }, 500, origin);
        }

        await svc.from("bitrix_pending_installs").delete().eq("id", pending.id);

        return createJsonResponse({ success: true, crm_connection_id: connRow.id }, 200, origin);
      }

      case "bitrix_get_state": {
        const projectId = String(body.project_id ?? body.projectId ?? "");
        const overrideCategoryId = toInt(body.category_id ?? body.categoryId);
        if (!projectId) return createJsonResponse({ error: "Missing project_id" }, 400, origin);

        // Ensure project belongs to user
        const { data: project } = await userClient
          .from("projects")
          .select("id,user_id")
          .eq("id", projectId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!project) return createJsonResponse({ error: "Project not found" }, 404, origin);

        const { data: ps } = await svc
          .from("project_bitrix_settings")
          .select("id, project_id, crm_connection_id, category_id, stage_id, assigned_by_id")
          .eq("project_id", projectId)
          .maybeSingle();

        const conn = await getUserBitrixConnection({ svc, userId: user.id, projectId });

        const connection =
          conn?.id
            ? {
                id: conn.id,
                crm_type: "bitrix24",
                subdomain: conn.subdomain,
                base_domain: conn.base_domain,
                token_expires_at: conn.token_expires_at,
              }
            : null;

        // If no connection -> return minimal state (UI can show instructions)
        if (!conn) {
          return createJsonResponse(
            {
              connection: null,
              project_settings: ps ?? null,
              categories: [],
              stages: [],
            },
            200,
            origin
          );
        }

        const baseDomain = normalizeDomain(conn.base_domain ?? `${conn.subdomain}.bitrix24.ru`);
        const accessToken = await getValidBitrixAccessToken({
          svc,
          crmConnectionId: conn.id,
          baseDomain,
          accessToken: conn.access_token,
          refreshToken: conn.refresh_token,
          tokenExpiresAt: conn.token_expires_at,
        });

        if (!accessToken) {
          return createJsonResponse(
            {
              connection,
              project_settings: ps ?? null,
              categories: [],
              stages: [],
              token_valid: false,
            },
            200,
            origin
          );
        }

        // Categories
        const catResp = await bitrixCallCategories({ domain: baseDomain, accessToken });
        const itemsRaw = catResp?.result ?? catResp?._embedded?.items ?? [];
        const items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizeBitrixCategory).filter(Boolean) : [];
        const hasZero = (items as any[]).some((c) => c.id === 0);
        if (!hasZero) (items as any[]).unshift({ id: 0, name: "Default", sort: 0 });

        // Stages for selected category (from settings unless overridden)
        const selectedCategoryId = typeof overrideCategoryId === "number" ? overrideCategoryId : (ps?.category_id ?? null);
        let stages: any[] = [];
        if (typeof selectedCategoryId === "number") {
          const stageResp = await bitrixCallStages({ domain: baseDomain, accessToken, categoryId: selectedCategoryId });
          const raw = stageResp?.result ?? [];
          stages = Array.isArray(raw) ? raw.map(normalizeBitrixStage).filter(Boolean) : [];
          stages.sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));
        }

        return createJsonResponse(
          {
            connection,
            project_settings: ps ?? null,
            categories: items,
            stages,
            selected_category_id: selectedCategoryId,
            token_valid: true,
          },
          200,
          origin
        );
      }

      case "bitrix_attach_project": {
        const projectId = String(body.project_id ?? body.projectId ?? "");
        if (!projectId) return createJsonResponse({ error: "Missing project_id" }, 400, origin);

        // Ensure project belongs to user
        const { data: project } = await userClient
          .from("projects")
          .select("id")
          .eq("id", projectId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!project) return createJsonResponse({ error: "Project not found" }, 404, origin);

        const conn = await getUserBitrixConnection({ svc, userId: user.id });
        if (!conn) return createJsonResponse({ error: "Bitrix connection not found" }, 404, origin);

        const { error: psErr } = await svc
          .from("project_bitrix_settings")
          .upsert(
            { project_id: projectId, crm_connection_id: conn.id, updated_at: new Date().toISOString() },
            { onConflict: "project_id" }
          );
        if (psErr) return createJsonResponse({ error: "Failed to attach to project" }, 500, origin);

        return createJsonResponse({ success: true }, 200, origin);
      }

      case "bitrix_detach_project": {
        const projectId = String(body.project_id ?? body.projectId ?? "");
        if (!projectId) return createJsonResponse({ error: "Missing project_id" }, 400, origin);

        // Ensure project belongs to user
        const { data: project } = await userClient
          .from("projects")
          .select("id")
          .eq("id", projectId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!project) return createJsonResponse({ error: "Project not found" }, 404, origin);

        const { error } = await svc.from("project_bitrix_settings").delete().eq("project_id", projectId);
        if (error) return createJsonResponse({ error: "Failed to detach from project" }, 500, origin);

        return createJsonResponse({ success: true }, 200, origin);
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

        // Bitrix CRM deal userfields use UF_CRM_* prefix by convention.
        const ufField = settings?.deal_link_uf_field ?? "UF_CRM_GRIDIX_APARTMENT_ID";
        const projectName = String((apartment as any)?.projects?.name ?? "Project");
        const projectAddress = String((apartment as any)?.projects?.address ?? "");
        const dealTitle = `Gridix: ${projectName} / ${apartment.apartment_number}`;

        // Update Bitrix deal fields + UF field
        await callBitrixRest({
          domain: baseDomain,
          accessToken,
          method: "crm.deal.update",
          params: {
            id: dealId,
            fields: {
              TITLE: dealTitle,
              OPPORTUNITY: Number(apartment.price ?? 0),
              CURRENCY_ID: String((apartment as any)?.projects?.currency ?? "RUB"),
              [ufField]: apartment.id,
            },
          },
        });

        // Add comment
        const commentText = `✅ Связана квартира Gridix\n\n• Проект: ${projectName}\n${projectAddress ? `• Адрес: ${projectAddress}\n` : ""}• Квартира: ${apartment.apartment_number}\n• Цена: ${Number(apartment.price ?? 0).toLocaleString("ru-RU")} ${(apartment as any)?.projects?.currency ?? ""}\n• Площадь: ${apartment.area ?? ""} м²\n• Комнаты: ${apartment.rooms ?? ""}\n• Этаж: ${apartment.floor_number ?? ""}\n\nИсточник: Gridix`;
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
        const leadName = dealTitle;

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
              source: "bitrix",
              notes: `Linked from Bitrix deal #${dealId}`,
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

        // Bitrix CRM deal userfields use UF_CRM_* prefix by convention.
        const ufField = settings?.deal_link_uf_field ?? "UF_CRM_GRIDIX_APARTMENT_ID";
        const projectName = String((apartment as any)?.projects?.name ?? "Project");
        const projectAddress = String((apartment as any)?.projects?.address ?? "");
        const title = `Gridix: ${projectName} / ${apartment.apartment_number}`;

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

        const commentText = `🆕 Создана сделка из Gridix по квартире\n\n• Проект: ${projectName}\n${projectAddress ? `• Адрес: ${projectAddress}\n` : ""}• Квартира: ${apartment.apartment_number}\n• Цена: ${Number(apartment.price ?? 0).toLocaleString("ru-RU")} ${(apartment as any)?.projects?.currency ?? ""}\n• Площадь: ${apartment.area ?? ""} м²\n• Комнаты: ${apartment.rooms ?? ""}\n• Этаж: ${apartment.floor_number ?? ""}\n\nИсточник: Gridix`;
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
        const leadName = title;

        const { data: newLead } = await svc
          .from("leads")
          .insert({
            name: leadName,
            email: leadEmail,
            phone: leadPhone,
            project_id: projectId,
            apartment_id: apartment.id,
            status: "pending",
            source: "bitrix",
            notes: `Created from Bitrix deal #${dealId}`,
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
          .select("id, project_id, pipeline_stage_id, name")
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
            fields: { STAGE_ID: mapping.bitrix_stage_id, ...(lead.name ? { TITLE: String(lead.name) } : {}) },
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

      case "bitrix_fetch_categories": {
        const conn = await getUserBitrixConnection({ svc, userId: user.id });
        if (!conn) return createJsonResponse({ error: "Bitrix connection not found" }, 404, origin);

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

        const resp = await bitrixCallCategories({ domain: baseDomain, accessToken });
        const itemsRaw = resp?.result ?? resp?._embedded?.items ?? [];
        const items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizeBitrixCategory).filter(Boolean) : [];

        // Ensure default category 0 exists in list (Bitrix sometimes omits it).
        const hasZero = (items as any[]).some((c) => c.id === 0);
        if (!hasZero) (items as any[]).unshift({ id: 0, name: "Default", sort: 0 });

        return createJsonResponse({ categories: items }, 200, origin);
      }

      case "bitrix_fetch_stages": {
        const categoryId = toInt(body.category_id ?? body.categoryId);
        if (typeof categoryId !== "number") return createJsonResponse({ error: "Missing category_id" }, 400, origin);

        const conn = await getUserBitrixConnection({ svc, userId: user.id });
        if (!conn) return createJsonResponse({ error: "Bitrix connection not found" }, 404, origin);

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

        const resp = await bitrixCallStages({ domain: baseDomain, accessToken, categoryId });
        const raw = resp?.result ?? [];
        const stages = Array.isArray(raw) ? raw.map(normalizeBitrixStage).filter(Boolean) : [];
        stages.sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0));

        return createJsonResponse({ category_id: categoryId, stages }, 200, origin);
      }

      case "bitrix_sync_funnel": {
        const projectId = String(body.project_id ?? body.projectId ?? "");
        const categoryId = toInt(body.category_id ?? body.categoryId);
        if (!projectId) return createJsonResponse({ error: "Missing project_id" }, 400, origin);
        if (typeof categoryId !== "number") return createJsonResponse({ error: "Missing category_id" }, 400, origin);

        // Ensure project belongs to user, also get owner user_id for crm_funnels
        const { data: project } = await userClient
          .from("projects")
          .select("id,user_id,name")
          .eq("id", projectId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!project) return createJsonResponse({ error: "Project not found" }, 404, origin);

        const conn = await getUserBitrixConnection({ svc, userId: user.id, projectId });
        if (!conn) return createJsonResponse({ error: "Bitrix connection not found" }, 404, origin);

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

        // Resolve category name
        let categoryName = `Bitrix category ${categoryId}`;
        try {
          const catResp = await bitrixCallCategories({ domain: baseDomain, accessToken });
          const itemsRaw = catResp?.result ?? [];
          const items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizeBitrixCategory).filter(Boolean) : [];
          const found = (items as any[]).find((c) => c.id === categoryId);
          if (found?.name) categoryName = String(found.name);
          if (categoryId === 0 && !found) categoryName = "Default";
        } catch {
          // ignore
        }

        // Fetch stages for category
        const stageResp = await bitrixCallStages({ domain: baseDomain, accessToken, categoryId });
        const stageRaw = stageResp?.result ?? [];
        const stages = Array.isArray(stageRaw) ? stageRaw.map(normalizeBitrixStage).filter(Boolean) : [];
        if (!stages.length) return createJsonResponse({ error: "No stages returned from Bitrix" }, 400, origin);

        const synced = await createOrUpdateBitrixProjectFunnel({
          projectId,
          userId: project.user_id,
          categoryId,
          categoryName,
          stages: stages as any,
          svc,
        });

        // Persist project settings (category+start stage)
        const { error: psErr } = await svc
          .from("project_bitrix_settings")
          .upsert(
            {
              project_id: projectId,
              crm_connection_id: conn.id,
              category_id: categoryId,
              stage_id: synced.firstStageId,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "project_id" }
          );
        if (psErr) {
          console.error("bitrix_sync_funnel: project settings upsert failed", psErr);
          return createJsonResponse({ error: "Failed to save project settings" }, 500, origin);
        }

        return createJsonResponse(
          {
            success: true,
            funnel_id: synced.funnelId,
            category_id: categoryId,
            stage_id: synced.firstStageId,
            stages_count: stages.length,
            stages,
            project_settings: {
              project_id: projectId,
              crm_connection_id: conn.id,
              category_id: categoryId,
              stage_id: synced.firstStageId,
            },
          },
          200,
          origin
        );
      }

      default:
        return createJsonResponse({ error: `Unsupported action: ${action}` }, 400, origin);
    }
  } catch (e) {
    console.error("bitrix-app error", e);
    return createJsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500, origin);
  }
});

