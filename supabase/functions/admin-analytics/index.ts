import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse, getCorsHeaders } from "../_shared/cors.ts";
import { getSupabaseUser } from "../_shared/auth.ts";

type DateRange = "7" | "30" | "90" | "all";

interface AdminAnalyticsRequestBody {
  dateRange?: DateRange;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  selectedProject?: string; // 'all' | uuid
  isManagerMode?: boolean;
  developerId?: string | null; // for manager mode
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function parseDateInput(value: string): Date | null {
  // Accept 'YYYY-MM-DD' (safe to pass into Date constructor in most runtimes; keep extra validation)
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return createCorsResponse(origin);
  }

  try {
    const user = await getSupabaseUser(req);
    if (!user) {
      return createJsonResponse({ error: "Unauthorized" }, 401, origin);
    }

    const body = (await req.json().catch(() => ({}))) as AdminAnalyticsRequestBody;
    const dateRange: DateRange = body.dateRange ?? "30";
    const selectedProject = body.selectedProject ?? "all";
    const isManagerMode = Boolean(body.isManagerMode);
    const developerId = typeof body.developerId === "string" ? body.developerId : null;

    // Range (same logic as old frontend)
    let startTs: string | null = null;
    const now = new Date();
    let end = endOfDay(now);

    const dateFrom = typeof body.dateFrom === "string" ? body.dateFrom : "";
    const dateTo = typeof body.dateTo === "string" ? body.dateTo : "";
    if (dateFrom && dateTo) {
      const startParsed = parseDateInput(dateFrom);
      const endParsed = parseDateInput(dateTo);
      if (!startParsed || !endParsed) {
        return createJsonResponse({ error: "Invalid dateFrom/dateTo" }, 400, origin);
      }
      const start = startOfDay(startParsed);
      end = endOfDay(endParsed);
      startTs = start.toISOString();
    } else if (dateRange !== "all") {
      const days = Number.parseInt(dateRange, 10);
      if (!Number.isFinite(days) || days <= 0) {
        return createJsonResponse({ error: "Invalid dateRange" }, 400, origin);
      }
      const start = startOfDay(new Date(now));
      start.setDate(start.getDate() - days);
      startTs = start.toISOString();
    }

    const selectedProjectId =
      selectedProject && selectedProject !== "all" ? selectedProject : null;

    const { data, error } = await supabase.rpc("get_admin_analytics", {
      p_auth_user_id: user.id,
      p_is_manager_mode: isManagerMode,
      p_developer_id: developerId,
      p_selected_project_id: selectedProjectId,
      p_start_ts: startTs,
      p_end_ts: end.toISOString(),
    });

    if (error) {
      console.error("admin-analytics RPC error:", error);
      return createJsonResponse({ error: error.message }, 500, origin);
    }

    return new Response(JSON.stringify(data ?? {}), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.error("admin-analytics error:", e);
    return createJsonResponse(
      { error: e instanceof Error ? e.message : "Internal server error" },
      500,
      origin,
    );
  }
});

