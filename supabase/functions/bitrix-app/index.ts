// @ts-ignore - resolved in Supabase Edge (Deno) runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore - resolved in Supabase Edge (Deno) runtime
import { createClient } from "npm:@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";
import { createSignedToken, verifyAndDecodeToken } from "../_shared/sso-token.ts";

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

async function handleSsoCreate(opts: {
  svc: any;
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  jwtSecret: string;
  domain: string;
  memberId: string;
  origin: string | null;
}): Promise<Response> {
  const token = await generateSsoTokenForBitrixPortal({
    svc: opts.svc,
    supabaseUrl: opts.supabaseUrl,
    anonKey: opts.anonKey,
    serviceRoleKey: opts.serviceRoleKey,
    jwtSecret: opts.jwtSecret,
    domain: opts.domain,
    memberId: opts.memberId,
    origin: opts.origin,
  });

  if (token.status !== "ok") {
    return createJsonResponse({ error: token.error }, token.httpStatusCode, opts.origin);
  }

  return createJsonResponse({ sso: token.sso }, 200, opts.origin);
}

async function generateSsoTokenForBitrixPortal(opts: {
  svc: any;
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  jwtSecret: string;
  domain: string;
  memberId: string;
  origin: string | null;
}): Promise<
  | { status: "ok"; sso: string }
  | { status: "error"; httpStatusCode: number; error: string }
> {
  const domain = normalizeDomain(opts.domain);
  const memberId = String(opts.memberId ?? "");
  if (!domain) {
    return { status: "error", httpStatusCode: 400, error: "Missing domain" };
  }
  if (!opts.jwtSecret) {
    return { status: "error", httpStatusCode: 500, error: "Server configuration error (JWT_SECRET missing)" };
  }

  const subdomain = extractSubdomain(domain);

  // Resolve Gridix user by Bitrix portal (domain/subdomain). Prefer member_id match when available.
  let connection: any = null;
  const baseQuery = opts.svc
    .from("crm_connections")
    .select("id,user_id,crm_type,base_domain,subdomain,bitrix_member_id,updated_at")
    .eq("crm_type", "bitrix24")
    // SSO can only work for claimed connections (must have user_id). This also helps avoid duplicates.
    .not("user_id", "is", null);

  if (memberId) {
    const { data, error } = await baseQuery
      .or(`base_domain.eq.${domain},subdomain.eq.${subdomain}`)
      .eq("bitrix_member_id", memberId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("SSO: failed to load crm_connection (member_id)", error);
      return { status: "error", httpStatusCode: 500, error: "Failed to resolve connection" };
    }
    connection = data ?? null;
  }

  if (!connection) {
    const { data, error } = await baseQuery
      .or(`base_domain.eq.${domain},subdomain.eq.${subdomain}`)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("SSO: failed to load crm_connection", error);
      return { status: "error", httpStatusCode: 500, error: "Failed to resolve connection" };
    }
    connection = data ?? null;
  }

  if (!connection?.user_id) {
    return { status: "error", httpStatusCode: 404, error: "Connection not found" };
  }

  const { data: profile, error: profileErr } = await opts.svc
    .from("user_profiles")
    .select("email")
    .eq("id", connection.user_id)
    .maybeSingle();

  if (profileErr) {
    console.error("SSO: failed to load user profile", profileErr);
    return { status: "error", httpStatusCode: 404, error: "User profile not found" };
  }
  const email = profile?.email ?? null;
  if (!email) {
    return { status: "error", httpStatusCode: 404, error: "User email not found" };
  }

  // Generate magic link server-side (no user interaction), then immediately verify OTP to obtain a session.
  const adminClient = createClient(opts.supabaseUrl, opts.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      // Not used by our flow; required by API. Keep it on Supabase callback.
      redirectTo: `${opts.supabaseUrl}/auth/v1/callback`,
    },
  });

  const tokenHash = linkData?.properties?.hashed_token ?? null;
  if (linkError || !tokenHash) {
    console.error("SSO: generateLink failed", linkError);
    return { status: "error", httpStatusCode: 500, error: "Failed to generate magic link" };
  }

  const verifyClient = createClient(opts.supabaseUrl, opts.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: otpData, error: otpError } = await verifyClient.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });

  if (otpError || !otpData?.session) {
    console.error("SSO: verifyOtp failed", otpError);
    return { status: "error", httpStatusCode: 500, error: "Failed to create session" };
  }

  const session = otpData.session;
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: session.user,
    exp: now + 60, // 1 minute
    iat: now,
  };

  const signedToken = await createSignedToken(tokenPayload, opts.jwtSecret);
  return { status: "ok", sso: signedToken };
}

async function handleSsoVerify(opts: {
  jwtSecret: string;
  token: string;
  origin: string | null;
}): Promise<Response> {
  if (!opts.token) return createJsonResponse({ error: "Missing token" }, 400, opts.origin);
  if (!opts.jwtSecret) return createJsonResponse({ error: "Server configuration error" }, 500, opts.origin);

  const payload = await verifyAndDecodeToken(opts.token, opts.jwtSecret);
  if (!payload) return createJsonResponse({ error: "Invalid or expired token" }, 401, opts.origin);

  return createJsonResponse(
    {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_at: payload.expires_at,
      user: payload.user,
    },
    200,
    opts.origin
  );
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return createCorsResponse(origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const siteUrl = Deno.env.get("SITE_URL") ?? "";
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
    const baseSiteUrl = siteUrl ? (siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`) : "";
    if (!baseSiteUrl) {
      return new Response("Server configuration error (SITE_URL missing)", { status: 500 });
    }
    return Response.redirect(`${baseSiteUrl}embed/bitrix/projects`, 302);
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

  // ---- Non-authenticated API (UI -> Supabase): Bitrix SSO
  const parsedBody = await parseBody(req);
  const body = (parsedBody.json ?? parsedBody.form ?? {}) as JsonRecord;
  const action = String(body.action ?? "");

  console.log("req.method", req.method, event, req, parsedBody);

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

    const placement = String(form["PLACEMENT"] ?? body.PLACEMENT ?? "");
    const isDealTab =
      placement.toUpperCase().includes("DEAL") ||
      placement.toUpperCase().includes("CRM_DEAL") ||
      placement.toUpperCase().includes("DEAL_DETAIL");

    const targetPath = isDealTab ? "embed/bitrix/deal-tab" : "embed/bitrix/projects";

    // If we can create SSO -> redirect with ?sso=. Otherwise redirect to connect flow with domain/member_id.
    if (domain) {
      const token = await generateSsoTokenForBitrixPortal({
        svc,
        supabaseUrl,
        anonKey,
        serviceRoleKey,
        jwtSecret: webhookSecret,
        domain,
        memberId,
        origin,
      });

      if (token.status === "ok") {
        const dest = new URL(`${baseSiteUrl}${targetPath}`);
        dest.searchParams.set("sso", token.sso);
        dest.searchParams.set("domain", domain);
        if (memberId) dest.searchParams.set("member_id", memberId);
        return Response.redirect(dest.toString(), 303);
      }

      // Not connected yet (or missing mapping) -> connect page
      if (token.httpStatusCode === 404) {
        const connect = new URL(`${baseSiteUrl}embed/connect/bitrix24`);
        connect.searchParams.set("domain", domain);
        if (memberId) connect.searchParams.set("member_id", memberId);
        return Response.redirect(connect.toString(), 303);
      }

      // For other errors, keep JSON for debuggability
      return createJsonResponse({ error: token.error }, token.httpStatusCode, origin);
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

  if (action === "sso_create") {
    const domain = normalizeDomain(String(body.domain ?? ""));
    const memberId = String(body.member_id ?? body.memberId ?? "");
    return await handleSsoCreate({
      svc,
      supabaseUrl,
      anonKey,
      serviceRoleKey,
      jwtSecret: webhookSecret,
      domain,
      memberId,
      origin,
    });
  }

  if (action === "sso_verify") {
    const token = String(body.token ?? "");
    return await handleSsoVerify({ jwtSecret: webhookSecret, token, origin });
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

        const { error: attachErr } = await svc.from("project_bitrix_settings").upsert({
          project_id: projectId,
          crm_connection_id: connRow.id,
          updated_at: new Date().toISOString(),
        });
        if (attachErr) {
          console.error("claim_install_by_token: attach failed", attachErr);
          return createJsonResponse({ error: "Failed to attach to project" }, 500, origin);
        }

        await svc.from("bitrix_pending_installs").delete().eq("id", pending.id);

        return createJsonResponse({ success: true, crm_connection_id: connRow.id }, 200, origin);
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

        // Bitrix CRM deal userfields use UF_CRM_* prefix by convention.
        const ufField = settings?.deal_link_uf_field ?? "UF_CRM_GRIDIX_APARTMENT_ID";

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

        // Bitrix CRM deal userfields use UF_CRM_* prefix by convention.
        const ufField = settings?.deal_link_uf_field ?? "UF_CRM_GRIDIX_APARTMENT_ID";
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

