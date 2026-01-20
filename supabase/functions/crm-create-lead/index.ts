// @ts-ignore - resolved in Supabase Edge (Deno) runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";

type LeadRequest = {
  name: string;
  email: string;
  phone: string;
  apartmentId: string;
  projectId: string;
};

type CRMConnection = {
  id: string;
  user_id: string;
  crm_type: string;
  subdomain: string;
  base_domain?: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
};

type ProjectCRMSettings = {
  project_id: string;
  crm_connection_id: string;
  pipeline_id: number;
  status_id?: number;
  responsible_user_id?: number;
  crm_connections?: CRMConnection;
};

type ProjectBitrixSettings = {
  project_id: string;
  crm_connection_id: string;
  category_id: number | null;
  stage_id: string | null;
  assigned_by_id: number | null;
  deal_link_uf_field: string | null;
};

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

type LocalTarget = {
  key: string;
  kind: "amocrm" | "bitrix" | "default";
  funnelId: string | null;
  firstStageId: string | null;
  // CRM-specific context
  amo?: { settings: ProjectCRMSettings; connection: CRMConnection };
  bitrix?: { settings: ProjectBitrixSettings; connection: CRMConnection };
};

function toInt(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
}

function normalizeDomain(raw: string): string {
  const d = String(raw || "").trim();
  return d.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

async function getValidAmoAccessToken(connection: CRMConnection, svc: any): Promise<string | null> {
  if (connection.access_token && connection.token_expires_at) {
    const expiresAt = new Date(connection.token_expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    if (expiresAt > fiveMinutesFromNow) return connection.access_token;
  }

  if (!connection.refresh_token) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const redirectUri = `${supabaseUrl}/functions/v1/amocrm-oauth-callback`;
  const clientId = Deno.env.get("AMOCRM_CLIENT_ID");
  const clientSecret = Deno.env.get("AMOCRM_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

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

  if (!response.ok) {
    if (response.status === 401) {
      await svc
        .from("crm_connections")
        .update({ access_token: null, refresh_token: null, token_expires_at: null })
        .eq("id", connection.id);
    }
    return null;
  }

  const tokenResult: TokenResponse = await response.json();
  const expiresAt = new Date(Date.now() + tokenResult.expires_in * 1000).toISOString();
  await svc
    .from("crm_connections")
    .update({ access_token: tokenResult.access_token, refresh_token: tokenResult.refresh_token, token_expires_at: expiresAt })
    .eq("id", connection.id);

  return tokenResult.access_token;
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

function extractAmoComplexLeadIds(payload: any): { leadId: number | null; contactId: number | null } {
  const lead = Array.isArray(payload) ? payload[0] : payload?._embedded?.leads?.[0] ?? payload?.leads?.[0] ?? null;
  const leadId = typeof lead?.id === "number" ? lead.id : null;
  const contactId = typeof lead?._embedded?.contacts?.[0]?.id === "number" ? lead._embedded.contacts[0].id : null;
  return { leadId, contactId };
}

async function resolveLocalFunnelAndFirstStage(opts: {
  svc: any;
  userId: string;
  externalFunnelId?: number | null;
  preferDefault?: boolean;
}): Promise<{ funnelId: string | null; firstStageId: string | null }> {
  if (opts.preferDefault) {
    const { data: df } = await opts.svc
      .from("crm_funnels")
      .select("id")
      .eq("user_id", opts.userId)
      .eq("is_default", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const funnelId = df?.id ? String(df.id) : null;
    if (!funnelId) return { funnelId: null, firstStageId: null };

    const { data: st } = await opts.svc
      .from("crm_funnel_stages")
      .select("id")
      .eq("funnel_id", funnelId)
      .order("order_index", { ascending: true })
      .limit(1)
      .maybeSingle();

    return { funnelId, firstStageId: st?.id ? String(st.id) : null };
  }

  const extId = typeof opts.externalFunnelId === "number" ? opts.externalFunnelId : null;
  if (!extId) return { funnelId: null, firstStageId: null };

  const { data: funnel } = await opts.svc
    .from("crm_funnels")
    .select("id, crm_funnel_id, amocrm_pipeline_id")
    .eq("user_id", opts.userId)
    // match either new generic column or legacy amocrm_pipeline_id
    .or(`crm_funnel_id.eq.${extId},amocrm_pipeline_id.eq.${extId}`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const funnelId = funnel?.id ? String(funnel.id) : null;
  if (!funnelId) return { funnelId: null, firstStageId: null };

  const { data: stage } = await opts.svc
    .from("crm_funnel_stages")
    .select("id")
    .eq("funnel_id", funnelId)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  return { funnelId, firstStageId: stage?.id ? String(stage.id) : null };
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return createCorsResponse(origin);

  try {
    const body = (await req.json().catch(() => null)) as LeadRequest | null;
    if (!body) return createJsonResponse({ error: "Invalid JSON body" }, 400, origin);

    const { name, email, phone, apartmentId, projectId } = body;
    if (!name || !email || !phone || !apartmentId || !projectId) {
      return createJsonResponse(
        { error: "Missing required fields", required: ["name", "email", "phone", "apartmentId", "projectId"] },
        400,
        origin
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const svc = createClient(supabaseUrl, serviceKey);

    // Load apartment + project details
    const { data: apartment, error: apartmentError } = await userClient
      .from("apartments")
      .select("*, projects!inner (id,name,address,currency,user_id)")
      .eq("id", apartmentId)
      .single();
    if (apartmentError || !apartment) return createJsonResponse({ error: "Apartment not found" }, 404, origin);

    const projectOwnerId = String((apartment as any)?.projects?.user_id ?? "");

    // Load CRM configs
    const { data: amoSettingsRows } = await svc
      .from("project_crm_settings")
      .select("*, crm_connections(*)")
      .eq("project_id", projectId);
    const amoSettingsList = (Array.isArray(amoSettingsRows) ? amoSettingsRows : []) as unknown as ProjectCRMSettings[];

    const { data: bitrixSettingsRow } = await svc
      .from("project_bitrix_settings")
      .select("project_id, crm_connection_id, category_id, stage_id, assigned_by_id, deal_link_uf_field")
      .eq("project_id", projectId)
      .maybeSingle();
    const bitrixSettings = (bitrixSettingsRow ?? null) as unknown as ProjectBitrixSettings | null;

    let bitrixConn: CRMConnection | null = null;
    if (bitrixSettings?.crm_connection_id) {
      const { data: conn } = await svc
        .from("crm_connections")
        .select("id, crm_type, subdomain, base_domain, access_token, refresh_token, token_expires_at")
        .eq("id", bitrixSettings.crm_connection_id)
        .maybeSingle();
      bitrixConn = (conn ?? null) as unknown as CRMConnection | null;
    }

    // Build local targets (one lead per integration funnel)
    const targets: LocalTarget[] = [];

    for (const row of amoSettingsList) {
      const conn = (row?.crm_connections ?? null) as unknown as CRMConnection | null;
      if (!row?.pipeline_id || !conn || conn.crm_type !== "amocrm") continue;
      const { funnelId, firstStageId } = await resolveLocalFunnelAndFirstStage({
        svc,
        userId: projectOwnerId,
        externalFunnelId: row.pipeline_id,
      });
      targets.push({
        key: `amo:${row.crm_connection_id}:${row.pipeline_id}`,
        kind: "amocrm",
        funnelId,
        firstStageId,
        amo: { settings: row, connection: conn },
      });
    }

    if (bitrixSettings && bitrixConn && bitrixConn.crm_type === "bitrix" && bitrixSettings.category_id) {
      const { funnelId, firstStageId } = await resolveLocalFunnelAndFirstStage({
        svc,
        userId: projectOwnerId,
        externalFunnelId: bitrixSettings.category_id,
      });
      targets.push({
        key: `bitrix:${bitrixSettings.crm_connection_id}:${bitrixSettings.category_id}`,
        kind: "bitrix",
        funnelId,
        firstStageId,
        bitrix: { settings: bitrixSettings, connection: bitrixConn },
      });
    }

    // Fallback to default funnel if no integrations configured/resolved
    if (targets.length === 0) {
      const { funnelId, firstStageId } = await resolveLocalFunnelAndFirstStage({
        svc,
        userId: projectOwnerId,
        preferDefault: true,
      });
      targets.push({
        key: "default",
        kind: "default",
        funnelId,
        firstStageId,
      });
    }

    // De-duplicate targets by funnelId (or key fallback)
    const uniqueTargets: LocalTarget[] = [];
    const seen = new Set<string>();
    for (const t of targets) {
      const sig = t.funnelId ? `${t.kind}:${t.funnelId}` : t.key;
      if (seen.has(sig)) continue;
      seen.add(sig);
      uniqueTargets.push(t);
    }

    // Fetch existing leads for this email+apartment, then map their stage -> funnel
    const { data: existingLeads } = await svc
      .from("leads")
      .select("id, created_at, pipeline_stage_id")
      .eq("email", email)
      .eq("apartment_id", apartmentId);

    const existingStageIds = (existingLeads || [])
      .map((l: any) => (l?.pipeline_stage_id ? String(l.pipeline_stage_id) : null))
      .filter(Boolean) as string[];

    const stageToFunnel = new Map<string, string>();
    if (existingStageIds.length > 0) {
      const { data: stageRows } = await svc
        .from("crm_funnel_stages")
        .select("id, funnel_id")
        .in("id", existingStageIds);
      for (const r of stageRows || []) {
        if (r?.id && r?.funnel_id) stageToFunnel.set(String(r.id), String(r.funnel_id));
      }
    }

    const existingFunnels = new Set<string>();
    for (const l of existingLeads || []) {
      const st = l?.pipeline_stage_id ? String(l.pipeline_stage_id) : "";
      const f = st ? stageToFunnel.get(st) : null;
      if (f) existingFunnels.add(String(f));
    }

    // Insert missing leads (one per target funnel)
    const inserts: Record<string, unknown>[] = [];
    const targetByIndex: LocalTarget[] = [];
    for (const t of uniqueTargets) {
      if (t.funnelId && existingFunnels.has(t.funnelId)) continue;
      const status = t.kind === "default" ? "saved_only" : "pending";
      const payload: Record<string, unknown> = {
        name,
        email,
        phone,
        project_id: projectId,
        apartment_id: apartmentId,
        status,
        source: "website",
        pipeline_stage_id: t.firstStageId || null,
      };
      inserts.push(payload);
      targetByIndex.push(t);
    }

    const created: any[] = [];
    if (inserts.length > 0) {
      const { data: createdRows, error: insErr } = await svc.from("leads").insert(inserts).select();
      if (insErr) return createJsonResponse({ error: "Failed to save lead(s)", details: insErr?.message }, 500, origin);
      created.push(...(createdRows || []));
    }

    // If everything already exists (same funnels), return 409 for compatibility
    if (created.length === 0 && (existingLeads || []).length > 0) {
      const first = (existingLeads || [])[0] as any;
      return createJsonResponse(
        { error: "Заявка с таким email на эту квартиру уже существует", existingLeadId: first?.id, existingLeadDate: first?.created_at },
        409,
        origin
      );
    }

    const results: any[] = [];
    const leadIds: string[] = [];

    for (let i = 0; i < created.length; i++) {
      const leadRow = created[i];
      const t = targetByIndex[i];
      const localLeadId = String(leadRow.id);
      leadIds.push(localLeadId);

      // Default target: nothing to send
      if (t.kind === "default") {
        results.push({ kind: "default", leadId: localLeadId, funnelId: t.funnelId, ok: true, crm: { ok: false } });
        continue;
      }

      // ---- AmoCRM send
      if (t.kind === "amocrm" && t.amo) {
        const { settings, connection } = t.amo;
        let amoResult: any = { ok: false };
        try {
          const accessToken = await getValidAmoAccessToken(connection, svc);
          if (!accessToken) throw new Error("AmoCRM authorization failed");

          // Fetch contact field ids (EMAIL/PHONE)
          let emailFieldId = 0;
          let phoneFieldId = 0;
          const fieldsResponse = await fetch(`https://${connection.subdomain}.amocrm.ru/api/v4/contacts/custom_fields`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (fieldsResponse.ok) {
            const fieldsData = await fieldsResponse.json();
            const list = fieldsData?._embedded?.custom_fields ?? [];
            const emailField = Array.isArray(list) ? list.find((f: any) => f.code === "EMAIL") : null;
            const phoneField = Array.isArray(list) ? list.find((f: any) => f.code === "PHONE") : null;
            emailFieldId = typeof emailField?.id === "number" ? emailField.id : 0;
            phoneFieldId = typeof phoneField?.id === "number" ? phoneField.id : 0;
          }

          if (!settings.pipeline_id || !emailFieldId || !phoneFieldId) throw new Error("AmoCRM contact fields not configured");

          const leadData = {
            name: `Apartment inquiry ${apartment.apartment_number} - ${apartment.projects?.name || "Project"}`,
            pipeline_id: settings.pipeline_id,
            price: Number(apartment.price ?? 0),
            ...(settings.status_id ? { status_id: settings.status_id } : {}),
            ...(settings.responsible_user_id ? { responsible_user_id: settings.responsible_user_id } : {}),
            _embedded: {
              contacts: [
                {
                  name,
                  custom_fields_values: [
                    { field_id: emailFieldId, values: [{ value: email }] },
                    { field_id: phoneFieldId, values: [{ value: phone }] },
                  ],
                },
              ],
            },
          };

          const amocrmUrl = `https://${connection.subdomain}.amocrm.ru/api/v4/leads/complex`;
          const amocrmResponse = await fetch(amocrmUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify([leadData]),
          });

          if (!amocrmResponse.ok) {
            const errText = await amocrmResponse.text();
            throw new Error(errText || "AmoCRM API error");
          }

          const payload = await amocrmResponse.json();
          const ids = extractAmoComplexLeadIds(payload);
          if (!ids.leadId) throw new Error("AmoCRM lead created but id missing");

          await svc
            .from("leads")
            .update({
              amocrm_lead_id: ids.leadId,
              amocrm_contact_id: ids.contactId,
              amocrm_sent_at: new Date().toISOString(),
              amocrm_error: null,
              status: "pending",
            })
            .eq("id", localLeadId);

          amoResult = { ok: true, id: ids.leadId, contactId: ids.contactId };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await svc
            .from("leads")
            .update({ status: "saved_only", amocrm_error: msg, amocrm_retries: 1, updated_at: new Date().toISOString() })
            .eq("id", localLeadId);
          amoResult = { ok: false, error: msg };
        }

        results.push({ kind: "amocrm", leadId: localLeadId, funnelId: t.funnelId, ok: true, crm: amoResult });
        continue;
      }

      // ---- Bitrix send
      if (t.kind === "bitrix" && t.bitrix) {
        const { settings, connection } = t.bitrix;
        let bitrixResult: any = { ok: false };
        try {
          const baseDomain = normalizeDomain(connection.base_domain ?? `${connection.subdomain}.bitrix24.ru`);
          const accessToken = await getValidBitrixAccessToken({
            svc,
            crmConnectionId: connection.id,
            baseDomain,
            accessToken: connection.access_token,
            refreshToken: connection.refresh_token,
            tokenExpiresAt: connection.token_expires_at,
          });
          if (!accessToken) throw new Error("Bitrix authorization failed");

          const ufField = settings.deal_link_uf_field || "UF_CRM_GRIDIX_APARTMENT_ID";
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
                CATEGORY_ID: settings.category_id ?? undefined,
                STAGE_ID: settings.stage_id ?? undefined,
                ASSIGNED_BY_ID: settings.assigned_by_id ?? undefined,
                OPPORTUNITY: Number(apartment.price ?? 0),
                CURRENCY_ID: String((apartment as any)?.projects?.currency ?? "RUB"),
                [ufField]: apartment.id,
              },
            },
          });

          const dealId = toInt(addResp?.result) ?? toInt(addResp?.result?.ID);
          if (!dealId) throw new Error("Bitrix deal id missing");

          await svc.from("bitrix_deal_links").insert({
            crm_connection_id: connection.id,
            bitrix_deal_id: dealId,
            project_id: projectId,
            apartment_id: apartment.id,
            lead_id: localLeadId,
          });

          await svc.from("leads").update({ updated_at: new Date().toISOString(), status: "pending" }).eq("id", localLeadId);

          const commentText = `🆕 Создана сделка из Gridix по квартире\n\n• Проект: ${projectName}\n${
            projectAddress ? `• Адрес: ${projectAddress}\n` : ""
          }• Квартира: ${apartment.apartment_number}\n• Цена: ${Number(apartment.price ?? 0).toLocaleString("ru-RU")} ${
            (apartment as any)?.projects?.currency ?? ""
          }\n\nИсточник: Gridix`;
          await callBitrixRest({
            domain: baseDomain,
            accessToken,
            method: "crm.timeline.comment.add",
            params: { fields: { ENTITY_TYPE: "deal", ENTITY_ID: dealId, COMMENT: commentText } },
          }).catch(() => null);

          bitrixResult = { ok: true, id: dealId };
        } catch (e) {
          bitrixResult = { ok: false, error: e instanceof Error ? e.message : String(e) };
        }

        results.push({ kind: "bitrix", leadId: localLeadId, funnelId: t.funnelId, ok: true, crm: bitrixResult });
        continue;
      }

      results.push({ kind: t.kind, leadId: localLeadId, funnelId: t.funnelId, ok: true, crm: { ok: false } });
    }

    return createJsonResponse(
      {
        success: true,
        leadId: leadIds[0] ?? null,
        leadIds,
        results,
      },
      200,
      origin
    );
  } catch (e) {
    console.error("crm-create-lead error", e);
    return createJsonResponse({ error: "internal_error", message: e instanceof Error ? e.message : String(e) }, 500, origin);
  }
});

