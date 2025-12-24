import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";

/**
 * Internal runner for CRM funnel automation jobs.
 *
 * Security model:
 * - Requires Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 * - Performs DB-side processing via `public.crm_run_automation_jobs(p_limit)`
 */
serve(async (req) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return createCorsResponse(origin);
  }

  if (req.method !== "POST") {
    return createJsonResponse({ error: "method_not_allowed" }, 405, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") || "";
  if (authHeader !== `Bearer ${serviceKey}`) {
    return createJsonResponse({ error: "forbidden" }, 403, origin);
  }

  let limit = 50;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (typeof body.limit === "number" && Number.isFinite(body.limit)) {
      limit = Math.max(1, Math.min(500, Math.floor(body.limit)));
    }
  } catch {
    // ignore body parse errors; use default limit
  }

  const svc = createClient(supabaseUrl, serviceKey);
  const { data, error } = await svc.rpc("crm_run_automation_jobs", {
    p_limit: limit,
  });

  if (error) {
    return createJsonResponse(
      { error: "runner_failed", message: error.message },
      500,
      origin,
    );
  }

  return createJsonResponse({ ok: true, result: data }, 200, origin);
});









