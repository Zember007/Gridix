import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";
function requireWebhookSecret(req) {
  const expected = Deno.env.get("JWT_SECRET") ?? "";
  const provided = req.headers.get("x-gridix-webhook-secret") ?? "";
  if (!expected || provided !== expected) throw new Error("Unauthorized");
}
function extractMessageId(body) {
  // OneSignal payloads vary; try common keys.
  const candidates = [
    body["id"],
    body["notification_id"],
    body["message_id"],
    body["onesignal_message_id"]
  ];
  for (const c of candidates){
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}
function extractEventType(body) {
  const candidates = [
    body["event"],
    body["type"],
    body["event_type"]
  ];
  for (const c of candidates){
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return "unknown";
}
serve(async (req)=>{
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return createCorsResponse(origin);
  try {
    requireWebhookSecret(req);
    const body = await req.json().catch(()=>null);
    if (!body) return createJsonResponse({
      success: false,
      error: "Invalid JSON"
    }, 400, origin);
    const onesignalMessageId = extractMessageId(body);
    const eventType = extractEventType(body);
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    // Best-effort link to job by onesignal_message_id
    let jobId = null;
    if (onesignalMessageId) {
      const { data: job, error: jobErr } = await supabaseAdmin.from("notification_jobs").select("id").eq("onesignal_message_id", onesignalMessageId).maybeSingle();
      if (!jobErr && job?.id) jobId = job.id;
    }
    const { error: insertErr } = await supabaseAdmin.from("notification_events").insert({
      job_id: jobId,
      onesignal_message_id: onesignalMessageId,
      event_type: eventType,
      payload: body
    });
    if (insertErr) {
      console.error("Failed to insert notification_events", insertErr);
      return createJsonResponse({
        success: false,
        error: insertErr.message
      }, 500, origin);
    }
    return createJsonResponse({
      success: true
    }, 200, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return createJsonResponse({
      success: false,
      error: message
    }, status, origin);
  }
});
