// @ts-ignore - resolved in Supabase Edge (Deno) runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";
import { isServiceRoleRequest } from "../_shared/auth.ts";
import { sendEmailNotificationIfEnabled } from "../_shared/user-notifications.ts";

type RequestBody = {
  window_hours?: number;
  include_overdue?: boolean;
  max_users?: number;
  max_tasks_per_user?: number;
  locale?: string;
};

type LeadTaskRow = {
  id: string;
  text: string;
  due_date: string;
  lead_id: string;
  assigned_to_user_id: string | null;
  leads?: {
    id: string;
    project_id: string;
    projects?: { id: string; name: string; user_id: string | null } | null;
  } | null;
};

function clampInt(v: unknown, def: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : Number(String(v ?? ""));
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return createCorsResponse(origin);
  if (req.method !== "POST") return createJsonResponse({ error: "method_not_allowed" }, 405, origin);
  if (!isServiceRoleRequest(req)) return createJsonResponse({ error: "forbidden" }, 403, origin);

  try {
    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const windowHours = clampInt(body.window_hours, 24, 1, 168);
    const includeOverdue = body.include_overdue !== false;
    const maxUsers = clampInt(body.max_users, 200, 1, 2000);
    const maxTasksPerUser = clampInt(body.max_tasks_per_user, 10, 1, 50);
    const locale = (typeof body.locale === "string" && body.locale.trim() ? body.locale.trim() : "en").toLowerCase();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return createJsonResponse({ error: "missing_supabase_env" }, 500, origin);
    }

    const svc = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const nowIso = now.toISOString();
    const endIso = new Date(now.getTime() + windowHours * 60 * 60 * 1000).toISOString();

    let q = svc
      .from("lead_tasks")
      .select(
        "id, text, due_date, lead_id, assigned_to_user_id, leads!inner ( id, project_id, projects!inner ( id, name, user_id ) )"
      )
      .eq("completed", false)
      .lte("due_date", endIso)
      .order("due_date", { ascending: true })
      .limit(2000);

    if (!includeOverdue) {
      q = q.gte("due_date", nowIso);
    }

    const { data, error } = await q;
    if (error) {
      return createJsonResponse({ error: "query_failed", message: error.message }, 500, origin);
    }

    const rows = (Array.isArray(data) ? data : []) as unknown as LeadTaskRow[];

    const tasksByRecipient = new Map<string, LeadTaskRow[]>();
    for (const t of rows) {
      const ownerUserId = t.leads?.projects?.user_id ? String(t.leads.projects.user_id) : "";
      const recipient = (t.assigned_to_user_id ? String(t.assigned_to_user_id) : ownerUserId).trim();
      if (!recipient) continue;
      const arr = tasksByRecipient.get(recipient) ?? [];
      arr.push(t);
      tasksByRecipient.set(recipient, arr);
    }

    const siteUrlRaw = (Deno.env.get("SITE_URL") || origin || "https://gridix.live").toString();
    const siteUrl = siteUrlRaw.endsWith("/") ? siteUrlRaw.slice(0, -1) : siteUrlRaw;

    let notifiedUsers = 0;
    let attemptedUsers = 0;

    const entries = Array.from(tasksByRecipient.entries()).slice(0, maxUsers);
    for (const [recipientUserId, tasks] of entries) {
      const topTasks = tasks.slice(0, maxTasksPerUser);
      const summary = topTasks
        .map((t) => {
          const due = t.due_date ? new Date(t.due_date).toISOString().replace("T", " ").slice(0, 16) : "";
          const projectName = t.leads?.projects?.name ? String(t.leads.projects.name) : "Project";
          const text = String(t.text || "").trim();
          return `• ${due} — ${projectName} — ${text}`;
        })
        .join("\n");

      attemptedUsers++;
      const result = await sendEmailNotificationIfEnabled({
        svc,
        recipientUserId,
        event: "task_due",
        templateKey: "task_due_digest",
        name: "notifications-task-due:digest",
        payload: {
          app: { url: siteUrl },
          window: { from: nowIso, to: endIso, include_overdue: includeOverdue },
          tasks: { count: tasks.length, summary: summary || "(no tasks)" },
        },
      });

      if (result.attempted && !result.reason) {
        notifiedUsers++;
      }
    }

    return createJsonResponse(
      {
        success: true,
        window_hours: windowHours,
        include_overdue: includeOverdue,
        users_total: tasksByRecipient.size,
        users_attempted: attemptedUsers,
        users_notified: notifiedUsers,
        tasks_total: rows.length,
      },
      200,
      origin
    );
  } catch (e) {
    console.error("notifications-task-due error", e);
    return createJsonResponse({ error: "internal_error", message: e instanceof Error ? e.message : String(e) }, 500, origin);
  }
});

