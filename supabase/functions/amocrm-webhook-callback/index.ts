import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";
import { createOrUpdateLocalFunnel, type AmoCRMPipeline, type AmoCRMStatus } from "../_shared/amocrm-funnel.ts";

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

  // Store by eventType+index so we can merge fields from multiple params
  const leadMap = new Map<string, ParsedAmoWebhookLead>();

  for (const [rawKey, rawValue] of params.entries()) {
    // Account fields
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

    // Lead fields: leads[update][0][id] etc
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
        // ignore unknown fields
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

async function getValidAccessToken(
  connection: CRMConnection,
  svc: any
): Promise<{ accessToken: string | null; tokenExpiresAt: string | null }> {
  // Determine if token is expiring within 5 minutes
  const now = new Date();
  const threshold = new Date(now.getTime() + 5 * 60 * 1000);
  const currentExpiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;

  if (connection.access_token && currentExpiresAt && currentExpiresAt > threshold) {
    return { accessToken: connection.access_token, tokenExpiresAt: connection.token_expires_at };
  }

  if (!connection.refresh_token) {
    console.error("No refresh token available for connection", connection.id);
    return { accessToken: null, tokenExpiresAt: null };
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const redirectUri = `${supabaseUrl}/functions/v1/amocrm-oauth-callback`;
    const clientId = Deno.env.get("AMOCRM_CLIENT_ID");
    const clientSecret = Deno.env.get("AMOCRM_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      console.error("Missing AMOCRM client credentials");
      return { accessToken: null, tokenExpiresAt: null };
    }

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
      const errorText = await response.text();
      console.error("Token refresh failed:", response.status, errorText);

      // If 401, the refresh token is invalid/revoked - clear tokens in DB so UI knows to re-authorize
      if (response.status === 401) {
        console.log("Refresh token invalid/revoked - clearing tokens for connection:", connection.id);
        await svc
          .from("crm_connections")
          .update({
            access_token: null,
            refresh_token: null,
            token_expires_at: null,
          })
          .eq("id", connection.id);
      }

      return { accessToken: null, tokenExpiresAt: null };
    }

    const tokenResult: TokenResponse = await response.json();
    const expiresAt = new Date(Date.now() + tokenResult.expires_in * 1000).toISOString();

    const { error: updateError } = await svc
      .from("crm_connections")
      .update({
        access_token: tokenResult.access_token,
        refresh_token: tokenResult.refresh_token,
        token_expires_at: expiresAt,
      })
      .eq("id", connection.id);

    if (updateError) {
      console.error("Failed to persist refreshed token:", updateError);
    }

    return { accessToken: tokenResult.access_token, tokenExpiresAt: expiresAt };
  } catch (e) {
    console.error("Error refreshing token:", e);
    return { accessToken: null, tokenExpiresAt: null };
  }
}

function normalizeAmoPipeline(pipelineId: number, raw: any): AmoCRMPipeline {
  const statusesRaw = raw?._embedded?.statuses ?? raw?.statuses ?? [];
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

  return {
    id: pipelineId,
    name: String(raw?.name ?? `Pipeline ${pipelineId}`),
    sort: Number(raw?.sort ?? 0),
    is_main: Boolean(raw?.is_main ?? false),
    is_archive: Boolean(raw?.is_archive ?? false),
    statuses,
  };
}

serve(async (req) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return createCorsResponse(origin);
  }

  try {
    const method = req.method;
    const url = req.url;
    const headers = Object.fromEntries(req.headers.entries());
    const bodyText = await req.text();

    const parsed = parseAmoWebhookFormBody(bodyText);

    console.log("AmoCRM webhook received:", {
      method,
      url,
      headers,
      parsed,
      rawBody: bodyText,
    });

    if (req.method !== "POST") {
      return createJsonResponse({ status: "ok" }, 200, origin);
    }

    const subdomain = parsed.account.subdomain;
    if (!subdomain) {
      console.log("Webhook missing account[subdomain] - skipping sync");
      return createJsonResponse({ status: "ok" }, 200, origin);
    }

    if (!parsed.leads.length) {
      console.log("Webhook contains no leads payload - skipping sync");
      return createJsonResponse({ status: "ok" }, 200, origin);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const svc = createClient(supabaseUrl, supabaseServiceKey);

    const { data: connection, error: connectionError } = await svc
      .from("crm_connections")
      .select("id, crm_type, subdomain, access_token, refresh_token, token_expires_at")
      .eq("crm_type", "amocrm")
      .eq("subdomain", subdomain)
      .limit(1)
      .maybeSingle();

    if (connectionError || !connection) {
      console.log("No AmoCRM connection found for subdomain - skipping sync", { subdomain, connectionError });
      return createJsonResponse({ status: "ok" }, 200, origin);
    }

    const { accessToken } = await getValidAccessToken(connection as CRMConnection, svc);
    if (!accessToken) {
      console.log("Unable to get valid AmoCRM access token - skipping sync", { subdomain });
      return createJsonResponse({ status: "ok" }, 200, origin);
    }

    const baseUrl = `https://${subdomain}.amocrm.ru/api/v4`;
    const amoHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // Process all lead events in this webhook
    for (const e of parsed.leads) {
      if (!e.id) continue;
      if (!e.pipeline_id || !e.status_id) {
        console.log("Webhook lead missing pipeline_id/status_id - skipping lead sync", {
          amoLeadId: e.id,
          pipeline_id: e.pipeline_id,
          status_id: e.status_id,
        });
        continue;
      }

      // Find local lead by AmoCRM lead id
      const { data: localLead, error: localLeadError } = await svc
        .from("leads")
        .select("id, project_id, apartment_id, name, pipeline_stage_id")
        .eq("amocrm_lead_id", e.id)
        .maybeSingle();

      if (localLeadError || !localLead) {
        console.log("No local lead found for AmoCRM lead id - skipping", { amoLeadId: e.id, localLeadError });
        continue;
      }

      // Find project owner user_id (needed for funnel ownership)
      const { data: project, error: projectError } = await svc
        .from("projects")
        .select("user_id")
        .eq("id", localLead.project_id)
        .single();

      if (projectError || !project) {
        console.log("Project not found for local lead - skipping funnel sync", {
          localLeadId: localLead.id,
          projectId: localLead.project_id,
          projectError,
        });
        continue;
      }

      // Fetch pipeline details from AmoCRM and fully sync local funnel/stages
      const pipelineId = e.pipeline_id;
      const pipelineResp = await fetch(`${baseUrl}/leads/pipelines/${pipelineId}`, { headers: amoHeaders });
      if (!pipelineResp.ok) {
        console.log("Failed to fetch AmoCRM pipeline details - skipping funnel sync", {
          pipelineId,
          status: pipelineResp.status,
        });
        continue;
      }

      const pipelineJson = await pipelineResp.json();
      const amoPipeline = normalizeAmoPipeline(pipelineId, pipelineJson);

      await createOrUpdateLocalFunnel(localLead.project_id, project.user_id, amoPipeline, svc);

      // Find funnel + stage for this status
      const { data: funnel } = await svc
        .from("crm_funnels")
        .select("id")
        .eq("user_id", project.user_id)
        // Prefer new column `amo_funnel_id`, fallback to legacy `amocrm_pipeline_id`
        .or(`amo_funnel_id.eq.${pipelineId},amocrm_pipeline_id.eq.${pipelineId}`)
        .limit(1)
        .maybeSingle();

      let stageId: string | null = null;
      if (funnel?.id) {
        const { data: stage } = await svc
          .from("crm_funnel_stages")
          .select("id, name")
          .eq("funnel_id", funnel.id)
          .eq("amocrm_status_id", e.status_id)
          .limit(1)
          .maybeSingle();

        stageId = stage?.id ?? null;

        // Fallback: match by status name (if stage by id missing for some reason)
        if (!stageId) {
          const statusName = amoPipeline.statuses.find((s) => s.id === e.status_id)?.name;
          if (statusName) {
            const { data: stageByName } = await svc
              .from("crm_funnel_stages")
              .select("id")
              .eq("funnel_id", funnel.id)
              .eq("name", statusName)
              .limit(1)
              .maybeSingle();
            stageId = stageByName?.id ?? null;
          }
        }
      }

      const leadPatch: Record<string, unknown> = {};
      if (stageId && stageId !== localLead.pipeline_stage_id) {
        leadPatch.pipeline_stage_id = stageId;
      }
      if (e.name && e.name !== localLead.name) {
        leadPatch.name = e.name;
      }
      if (Object.keys(leadPatch).length > 0) {
        leadPatch.updated_at = new Date().toISOString();
        await svc.from("leads").update(leadPatch).eq("id", localLead.id);
      }

      // Price check: compare AmoCRM lead.price with apartment.price; log in lead_history if mismatch
      if (typeof e.price === "number") {
        const { data: apartment } = await svc
          .from("apartments")
          .select("price")
          .eq("id", localLead.apartment_id)
          .maybeSingle();

        const aptPrice = apartment?.price ?? null;
        if (typeof aptPrice === "number" && aptPrice !== e.price) {
          await svc.from("lead_history").insert({
            lead_id: localLead.id,
            type: "note",
            text: `AmoCRM price changed: ${e.price} (AmoCRM) vs ${aptPrice} (Gridix apartment)`,
            user_id: null,
          });
        }
      }

      console.log("Webhook sync done for lead", {
        amoLeadId: e.id,
        localLeadId: localLead.id,
        pipelineId,
        statusId: e.status_id,
        stageId,
      });
    }

    return createJsonResponse({ status: "ok" }, 200, origin);
  } catch (error) {
    console.error("Error handling AmoCRM webhook:", error);
    return createJsonResponse(
      { error: "internal_error", message: (error as Error).message },
      500,
      origin
    );
  }
});


