import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";
import {
  createOrUpdateBitrixProjectFunnel,
  createOrUpdateLocalFunnel,
  type AmoCRMPipeline,
  type AmoCRMStatus,
  type BitrixStage,
} from "../_shared/crm-funnel.ts";

type AmoWebhookEventType = "update" | "status" | "add";

interface ParsedAmoWebhookLead {
  eventType: AmoWebhookEventType;
  id?: number;
  name?: string;
  status_id?: number;
  old_status_id?: number;
  price?: number;
  responsible_user_id?: number;
  pipeline_id?: number;
  account_id?: number;
  updated_at?: number;
  created_at?: number;
}

interface ParsedAmoWebhookPayload {
  account: {
    subdomain?: string;
    id?: number;
    selfUrl?: string;
  };
  leads: ParsedAmoWebhookLead[];
}

function parseAmoWebhookFormBody(bodyText: string): ParsedAmoWebhookPayload {
  const params = new URLSearchParams(bodyText);

  const payload: ParsedAmoWebhookPayload = {
    account: {},
    leads: [],
  };

  const leadMap = new Map<string, ParsedAmoWebhookLead>();

  for (const [rawKey, rawValue] of params.entries()) {
    if (rawKey === "account[subdomain]") {
      payload.account.subdomain = rawValue || undefined;
      continue;
    }
    if (rawKey === "account[id]") {
      const n = Number(rawValue);
      payload.account.id = Number.isFinite(n) ? n : undefined;
      continue;
    }
    if (rawKey === "account[_links][self]") {
      payload.account.selfUrl = rawValue || undefined;
      continue;
    }

    const m = rawKey.match(/^leads\[(update|status|add)\]\[(\d+)\]\[([^\]]+)\]$/);
    if (!m) continue;

    const eventType = m[1] as AmoWebhookEventType;
    const index = Number(m[2]);
    const field = m[3];
    const mapKey = `${eventType}:${index}`;

    const existing = leadMap.get(mapKey) ?? { eventType };

    const setNum = (k: keyof ParsedAmoWebhookLead) => {
      const n = Number(rawValue);
      if (Number.isFinite(n)) (existing as any)[k] = n;
    };

    switch (field) {
      case "id":
        setNum("id");
        break;
      case "name":
        existing.name = rawValue || undefined;
        break;
      case "status_id":
        setNum("status_id");
        break;
      case "old_status_id":
        setNum("old_status_id");
        break;
      case "price":
        setNum("price");
        break;
      case "responsible_user_id":
        setNum("responsible_user_id");
        break;
      case "pipeline_id":
        setNum("pipeline_id");
        break;
      case "account_id":
        setNum("account_id");
        break;
      case "updated_at":
      case "last_modified":
        setNum("updated_at");
        break;
      case "created_at":
      case "date_create":
        setNum("created_at");
        break;
      default:
        break;
    }

    leadMap.set(mapKey, existing);
  }

  payload.leads = Array.from(leadMap.values());
  return payload;
}

interface CRMConnection {
  id: string;
  crm_type: string;
  subdomain: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

function normalizeDomain(raw: string): string {
  const d = String(raw || "").trim();
  return d.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function extractSubdomain(domain: string): string {
  const d = normalizeDomain(domain);
  return d.split(".")[0] ?? d;
}

function toInt(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
}

async function maybeAwardAgentCommissionOnSold(opts: {
  svc: any;
  leadId: string;
  agentId: string | null;
  apartmentId: string | null;
  oldStageId: string | null;
  newStageId: string | null;
}) {
  try {
    if (!opts.newStageId) return;
    if (!opts.agentId) return;
    if (!opts.apartmentId) return;
    if (opts.oldStageId === opts.newStageId) return;

    const { data: triggers, error: triggersError } = await opts.svc
      .from("crm_funnel_triggers")
      .select("id, icon, config")
      .eq("stage_id", opts.newStageId)
      .eq("icon", "apartment_status");
    if (triggersError) throw triggersError;

    const hasSoldTrigger = (triggers || []).some((t: any) => {
      const cfg = (t?.config && typeof t.config === "object") ? t.config : {};
      return String((cfg as any).apartmentStatus || "").toLowerCase() === "sold";
    });
    if (!hasSoldTrigger) return;

    const method = `sale:${opts.leadId}`;
    const { data: existing } = await opts.svc
      .from("agent_payouts")
      .select("id")
      .eq("agent_id", opts.agentId)
      .eq("method", method)
      .limit(1)
      .maybeSingle();
    if (existing?.id) return;

    const [{ data: agentApp }, { data: apartment }] = await Promise.all([
      opts.svc
        .from("agent_applications")
        .select("commission_rate")
        .eq("id", opts.agentId)
        .maybeSingle(),
      opts.svc
        .from("apartments")
        .select("price")
        .eq("id", opts.apartmentId)
        .maybeSingle(),
    ]);

    const rate = typeof agentApp?.commission_rate === "number" ? agentApp.commission_rate : 4;
    const price = typeof apartment?.price === "number" ? apartment.price : null;
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) return;

    const raw = (price * rate) / 100;
    const amount = Math.round(raw * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0) return;

    const nowIso = new Date().toISOString();
    const { error: insertError } = await opts.svc.from("agent_payouts").insert({
      agent_id: opts.agentId,
      amount,
      status: "pending",
      method,
      payout_date: nowIso,
    });
    if (insertError) throw insertError;

    await opts.svc.from("lead_activities").insert({
      lead_id: opts.leadId,
      user_id: null,
      type: "automation",
      description: `Agent commission accrued: ${amount} (${rate}% of ${price})`,
      metadata: { agent_id: opts.agentId, apartment_id: opts.apartmentId, stage_id: opts.newStageId, method },
    });
  } catch (e) {
    console.error("maybeAwardAgentCommissionOnSold failed:", e);
  }
}

async function parseBody(req: Request): Promise<{ json: any | null; form: Record<string, string> }> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const json = await req.json().catch(() => null);
    return { json, form: {} };
  }

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
      sp.set(key, JSON.stringify(value));
      return;
    }
    if (typeof value === "object") {
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
    for (const [k, v] of Object.entries(opts.params)) appendParam(body, k, v);
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

  if (!resp.ok || json?.error) {
    const desc = json?.error_description ? ` ${json.error_description}` : "";
    throw new Error(`Bitrix REST error: ${resp.status}${desc}`);
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
  if (!clientId || !clientSecret) return opts.accessToken;

  const url = new URL("https://oauth.bitrix.info/oauth/token/");
  url.searchParams.set("grant_type", "refresh_token");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("refresh_token", opts.refreshToken);

  const resp = await fetch(url.toString(), { method: "GET" });
  const json = await resp.json().catch(() => null);

  if (!resp.ok || !json?.access_token) return opts.accessToken;

  const nextAccess = String(json.access_token);
  const nextRefresh = typeof json.refresh_token === "string" && json.refresh_token ? String(json.refresh_token) : opts.refreshToken;
  const expiresIn = toInt(json.expires_in);
  const nextExpiresAt =
    typeof expiresIn === "number" && expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

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

async function handleAmo(req: Request, origin: string | null): Promise<Response> {
  // Amo webhooks are form-urlencoded
  const bodyText = await req.text();
  const parsed = parseAmoWebhookFormBody(bodyText);

  if (req.method !== "POST") return createJsonResponse({ status: "ok" }, 200, origin);

  const subdomain = parsed.account.subdomain;
  if (!subdomain || !parsed.leads.length) return createJsonResponse({ status: "ok" }, 200, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const svc = createClient(supabaseUrl, serviceKey);

  const { data: connection } = await svc
    .from("crm_connections")
    .select("id, crm_type, subdomain, access_token, refresh_token, token_expires_at")
    .eq("crm_type", "amocrm")
    .eq("subdomain", subdomain)
    .limit(1)
    .maybeSingle();

  if (!connection) return createJsonResponse({ status: "ok" }, 200, origin);

  // Token refresh logic (copied from old function)
  const now = new Date();
  const threshold = new Date(now.getTime() + 5 * 60 * 1000);
  const currentExpiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
  let accessToken: string | null = connection.access_token;
  let tokenExpiresAt: string | null = connection.token_expires_at;

  if (!accessToken || !currentExpiresAt || currentExpiresAt <= threshold) {
    if (!connection.refresh_token) return createJsonResponse({ status: "ok" }, 200, origin);

    const redirectUri = `${supabaseUrl}/functions/v1/amocrm-oauth-callback`;
    const clientId = Deno.env.get("AMOCRM_CLIENT_ID");
    const clientSecret = Deno.env.get("AMOCRM_CLIENT_SECRET");
    if (!clientId || !clientSecret) return createJsonResponse({ status: "ok" }, 200, origin);

    const tokenUrl = `https://${connection.subdomain}.amocrm.ru/oauth2/access_token`;
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
      redirect_uri: redirectUri,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) return createJsonResponse({ status: "ok" }, 200, origin);
    const tokenResult: TokenResponse = await response.json();
    tokenExpiresAt = new Date(Date.now() + tokenResult.expires_in * 1000).toISOString();
    accessToken = tokenResult.access_token;

    await svc
      .from("crm_connections")
      .update({ access_token: tokenResult.access_token, refresh_token: tokenResult.refresh_token, token_expires_at: tokenExpiresAt })
      .eq("id", connection.id);
  }

  if (!accessToken) return createJsonResponse({ status: "ok" }, 200, origin);

  const baseUrl = `https://${subdomain}.amocrm.ru/api/v4`;
  const amoHeaders = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

  for (const e of parsed.leads) {
    if (!e.id) continue;
    if (!e.pipeline_id || !e.status_id) continue;

    const { data: localLead } = await svc
      .from("leads")
      .select("id, project_id, apartment_id, agent_id, name, pipeline_stage_id")
      .eq("amocrm_lead_id", e.id)
      .maybeSingle();
    if (!localLead) continue;

    const { data: project } = await svc.from("projects").select("user_id").eq("id", localLead.project_id).maybeSingle();
    if (!project) continue;

    // Fetch pipeline details and sync local funnel/stages
    const pipelineId = e.pipeline_id;
    const pipelineResp = await fetch(`${baseUrl}/leads/pipelines/${pipelineId}`, { headers: amoHeaders });
    if (!pipelineResp.ok) continue;
    const pipelineJson = await pipelineResp.json();

    const statusesRaw = pipelineJson?._embedded?.statuses ?? pipelineJson?.statuses ?? [];
    const statuses: AmoCRMStatus[] = Array.isArray(statusesRaw)
      ? statusesRaw
          .map((s: any) => ({
            id: Number(s?.id),
            name: String(s?.name ?? ""),
            sort: Number(s?.sort ?? 0),
            color: String(s?.color ?? "#d5d8dd"),
            type: Number(s?.type ?? 0),
            pipeline_id: Number(s?.pipeline_id ?? pipelineId),
          }))
          .filter((s: AmoCRMStatus) => Number.isFinite(s.id) && !!s.name)
      : [];

    const amoPipeline: AmoCRMPipeline = {
      id: pipelineId,
      name: String(pipelineJson?.name ?? `Pipeline ${pipelineId}`),
      sort: Number(pipelineJson?.sort ?? 0),
      is_main: Boolean(pipelineJson?.is_main ?? false),
      is_archive: Boolean(pipelineJson?.is_archive ?? false),
      statuses,
    };

    await createOrUpdateLocalFunnel(localLead.project_id, project.user_id, amoPipeline, svc);

    const { data: funnel } = await svc
      .from("crm_funnels")
      .select("id")
      .eq("user_id", project.user_id)
      // Prefer generic `crm_funnel_id` (migration 2026-01-19), fallback to legacy `amocrm_pipeline_id`
      .or(`crm_funnel_id.eq.${pipelineId},amocrm_pipeline_id.eq.${pipelineId}`)
      .limit(1)
      .maybeSingle();

    let stageId: string | null = null;
    if (funnel?.id) {
      const { data: stage } = await svc
        .from("crm_funnel_stages")
        .select("id")
        .eq("funnel_id", funnel.id)
        .eq("crm_stage_id", String(e.status_id))
        .limit(1)
        .maybeSingle();
      stageId = stage?.id ?? null;
    }

    const leadPatch: Record<string, unknown> = {};
    const stageChanged = !!stageId && stageId !== localLead.pipeline_stage_id;
    if (stageChanged) leadPatch.pipeline_stage_id = stageId;
    if (e.name && e.name !== localLead.name) leadPatch.name = e.name;
    if (Object.keys(leadPatch).length > 0) {
      leadPatch.updated_at = new Date().toISOString();
      await svc.from("leads").update(leadPatch).eq("id", localLead.id);
    }

    if (stageChanged) {
      await maybeAwardAgentCommissionOnSold({
        svc,
        leadId: localLead.id,
        agentId: (localLead as any).agent_id ?? null,
        apartmentId: (localLead as any).apartment_id ?? null,
        oldStageId: (localLead as any).pipeline_stage_id ?? null,
        newStageId: stageId,
      });
    }
  }

  return createJsonResponse({ status: "ok" }, 200, origin);
}

async function handleBitrix(req: Request, origin: string | null): Promise<Response> {
  const webhookSecret = Deno.env.get("JWT_SECRET") ?? "";
  const url = new URL(req.url);
  const providedSecret = url.searchParams.get("secret") ?? "";
  const event = url.searchParams.get("event") ?? "";

  if (event !== "deal_updated") return createJsonResponse({ status: "ok", skipped: true }, 200, origin);
  if (!webhookSecret || providedSecret !== webhookSecret) return createJsonResponse({ error: "Unauthorized" }, 401, origin);

  const { form } = await parseBody(req);
  const parsed = parseBitrixEvent(form);
  if (!parsed.dealId) return createJsonResponse({ status: "ok", skipped: true, reason: "no_deal_id" }, 200, origin);

  const domain = parsed.domain ? normalizeDomain(parsed.domain) : null;
  const memberId = parsed.memberId ? String(parsed.memberId) : null;
  if (!domain && !memberId) return createJsonResponse({ status: "ok", skipped: true, reason: "no_domain_or_member_id" }, 200, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const svc = createClient(supabaseUrl, serviceKey);

  const q = svc
    .from("crm_connections")
    .select("id, user_id, crm_type, subdomain, base_domain, access_token, refresh_token, token_expires_at, bitrix_member_id")
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
  if (!connection) return createJsonResponse({ status: "ok", skipped: true, reason: "no_connection" }, 200, origin);

  const baseDomain = normalizeDomain(connection.base_domain ?? `${connection.subdomain}.bitrix24.ru`);
  const accessToken = await getValidBitrixAccessToken({
    svc,
    crmConnectionId: connection.id,
    baseDomain,
    accessToken: connection.access_token,
    refreshToken: connection.refresh_token,
    tokenExpiresAt: connection.token_expires_at,
  });
  if (!accessToken) return createJsonResponse({ status: "ok", skipped: true, reason: "no_token" }, 200, origin);

  // Fetch current deal stage + title
  let stageId: string | null = parsed.stageId ?? null;
  let dealTitle: string | null = null;
  let categoryId: number | null = null;
  try {
    const deal = await callBitrixRest({ domain: baseDomain, accessToken, method: "crm.deal.get", params: { id: parsed.dealId } });
    stageId = String(deal?.result?.STAGE_ID ?? stageId ?? "");
    dealTitle = deal?.result?.TITLE ? String(deal.result.TITLE) : null;
    categoryId = toInt(deal?.result?.CATEGORY_ID);
  } catch {
    // ignore
  }

  if (!stageId) return createJsonResponse({ status: "ok", skipped: true, reason: "no_stage_id" }, 200, origin);

  const { data: link } = await svc
    .from("bitrix_deal_links")
    .select("id, project_id, lead_id")
    .eq("crm_connection_id", connection.id)
    .eq("bitrix_deal_id", parsed.dealId)
    .maybeSingle();
  if (!link?.lead_id) return createJsonResponse({ status: "ok", skipped: true, reason: "no_link" }, 200, origin);

  // Always check for updates: ensure Bitrix funnel/stages are synced for this project before mapping stage_id.
  // This keeps `bitrix_stage_mapping` fresh even when stages change in Bitrix24.
  try {
    const { data: ps } = await svc
      .from("project_bitrix_settings")
      .select("category_id")
      .eq("project_id", link.project_id)
      .maybeSingle();
    const configuredCategoryId = typeof ps?.category_id === "number" ? ps.category_id : null;
    const syncCategoryId = configuredCategoryId ?? categoryId;
    if (typeof syncCategoryId === "number") {
      // Resolve category name (best effort)
      let categoryName = `Category ${syncCategoryId}`;
      try {
        const catResp = await callBitrixRest({ domain: baseDomain, accessToken, method: "crm.deal.category.list" });
        const raw = catResp?.result ?? [];
        const found = Array.isArray(raw) ? raw.find((c: any) => Number(c?.ID) === syncCategoryId) : null;
        if (found?.NAME) categoryName = String(found.NAME);
      } catch {
        // ignore
      }
      if (syncCategoryId === 0 && categoryName === "Category 0") categoryName = "Default";

      const entityId = syncCategoryId === 0 ? "DEAL_STAGE" : `DEAL_STAGE_${syncCategoryId}`;
      const stResp = await callBitrixRest({
        domain: baseDomain,
        accessToken,
        method: "crm.status.entity.items",
        params: { entityId },
      });
      const rawStages = stResp?.result ?? [];
      const stages: BitrixStage[] = Array.isArray(rawStages)
        ? rawStages
            .map((r: any) => ({
              stageId: String(r?.STATUS_ID ?? r?.ID ?? r?.id ?? "").trim(),
              name: String(r?.NAME ?? r?.name ?? ""),
              sort: toInt(r?.SORT ?? r?.sort) ?? 0,
              color: String(r?.COLOR ?? r?.color ?? "#d5d8dd"),
            }))
            .filter((s: BitrixStage) => !!s.stageId && !!s.name)
        : [];

      if (stages.length > 0) {
        await createOrUpdateBitrixProjectFunnel({
          projectId: link.project_id,
          userId: connection.user_id,
          categoryId: syncCategoryId,
          categoryName,
          stages,
          svc,
        });
      }
    }
  } catch {
    // best effort; don't break webhook processing
  }

  const { data: mapping } = await svc
    .from("bitrix_stage_mapping")
    .select("lead_pipeline_stage_id")
    .eq("project_id", link.project_id)
    .eq("bitrix_stage_id", stageId)
    .maybeSingle();
  if (!mapping?.lead_pipeline_stage_id) return createJsonResponse({ status: "ok", skipped: true, reason: "no_mapping" }, 200, origin);

  const { data: leadBefore } = await svc
    .from("leads")
    .select("id, agent_id, apartment_id, pipeline_stage_id")
    .eq("id", link.lead_id)
    .maybeSingle();

  const leadPatch: Record<string, unknown> = { updated_at: new Date().toISOString(), pipeline_stage_id: mapping.lead_pipeline_stage_id };
  if (dealTitle) leadPatch.name = dealTitle;
  await svc.from("leads").update(leadPatch).eq("id", link.lead_id);

  if (leadBefore?.id && mapping.lead_pipeline_stage_id && mapping.lead_pipeline_stage_id !== leadBefore.pipeline_stage_id) {
    await maybeAwardAgentCommissionOnSold({
      svc,
      leadId: leadBefore.id,
      agentId: (leadBefore as any).agent_id ?? null,
      apartmentId: (leadBefore as any).apartment_id ?? null,
      oldStageId: (leadBefore as any).pipeline_stage_id ?? null,
      newStageId: mapping.lead_pipeline_stage_id,
    });
  }

  return createJsonResponse({ status: "ok" }, 200, origin);
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return createCorsResponse(origin);

  const url = new URL(req.url);
  const pathname = url.pathname || "";

  // Expected: /functions/v1/crm-webhook-callback/amo or /functions/v1/crm-webhook-callback/bitrix
  if (pathname.endsWith("/amo")) {
    return await handleAmo(req, origin);
  }
  if (pathname.endsWith("/bitrix")) {
    return await handleBitrix(req, origin);
  }

  return createJsonResponse({ error: "Unknown webhook route" }, 404, origin);
});

