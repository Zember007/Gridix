import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";
import { getSupabaseUser, isServiceRoleRequest } from "../_shared/auth.ts";
import { getOneSignalAppId, oneSignalSendEmail, oneSignalCreateOrUpdateUser } from "../_shared/onesignal.ts";
import { renderTemplate } from "../_shared/template.ts";

type SendEmailRequest = {
  template_key: string;
  recipient_user_id: string;
  payload?: Record<string, unknown>;
  locale?: string;
  name?: string;
  email_preheader?: string;
  include_unsubscribed?: boolean;
  disable_email_click_tracking?: boolean;
  send_after?: string;
};

type NotificationTemplateRow = {
  key: string;
  channel: "email";
  locale: string;
  subject_template: string;
  html_template: string;
  is_active: boolean;
};

function asStringRecord(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object") return {};
  return v as Record<string, unknown>;
}

async function ensureOneSignalEmailSubscription(params: {
  supabaseAdmin: ReturnType<typeof createClient>;
  supabaseUserId: string;
  locale: string;
}): Promise<{ email: string | null }> {
  // If link already exists, we assume OneSignal has the subscription.
  const { data: existingLink, error: linkErr } = await params.supabaseAdmin
    .from("onesignal_user_links")
    .select("email, last_synced_at")
    .eq("supabase_user_id", params.supabaseUserId)
    .maybeSingle();

  if (linkErr) {
    console.warn("onesignal_user_links lookup failed", linkErr);
  }

  if (existingLink?.email) return { email: existingLink.email };

  // Fallback: get email from user_profiles and upsert OneSignal user.
  const { data: profile, error: profileErr } = await params.supabaseAdmin
    .from("user_profiles")
    .select("email")
    .eq("id", params.supabaseUserId)
    .maybeSingle();

  if (profileErr) throw new Error(`Failed to load recipient profile: ${profileErr.message}`);
  const email = (profile?.email as string | null) ?? null;
  if (!email) return { email: null };

  try {
    const appId = getOneSignalAppId();
    const oneSignalResp = await oneSignalCreateOrUpdateUser(appId, {
      identity: { external_id: params.supabaseUserId },
      properties: { language: params.locale },
      subscriptions: [{ type: "Email", token: email, enabled: true }],
    });

    const onesignalId = oneSignalResp?.identity?.onesignal_id ?? null;
    const { error: upsertError } = await params.supabaseAdmin
      .from("onesignal_user_links")
      .upsert(
        {
          supabase_user_id: params.supabaseUserId,
          onesignal_id: onesignalId,
          email_subscription_id: null,
          email,
          enabled: true,
          last_synced_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "supabase_user_id" }
      );

    if (upsertError) console.warn("onesignal_user_links upsert failed", upsertError);
  } catch (e) {
    console.warn("OneSignal auto-sync failed", e);
  }

  return { email };
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return createCorsResponse(origin);

  try {
    const isService = isServiceRoleRequest(req);
    const user = isService ? null : await getSupabaseUser(req);
    if (!isService && !user) return createJsonResponse({ success: false, error: "Unauthorized" }, 401, origin);

    const body = (await req.json().catch(() => null)) as SendEmailRequest | null;
    if (!body) return createJsonResponse({ success: false, error: "Invalid JSON" }, 400, origin);

    const templateKey = body.template_key?.trim();
    const recipientUserId = body.recipient_user_id?.trim();
    const locale = (body.locale?.trim() || "en").toLowerCase();
    const payload = asStringRecord(body.payload);

    if (!templateKey) return createJsonResponse({ success: false, error: "Missing template_key" }, 400, origin);
    if (!recipientUserId) return createJsonResponse({ success: false, error: "Missing recipient_user_id" }, 400, origin);

    // If called by an end-user, only allow sending to self.
    if (!isService && user?.id !== recipientUserId) {
      return createJsonResponse({ success: false, error: "Forbidden" }, 403, origin);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Load template (locale-specific, fallback to en)
    const { data: templateRow, error: templateErr } = await supabaseAdmin
      .from("notification_templates")
      .select("key, channel, locale, subject_template, html_template, is_active")
      .eq("key", templateKey)
      .eq("channel", "email")
      .eq("locale", locale)
      .eq("is_active", true)
      .maybeSingle<NotificationTemplateRow>();

    let tpl = templateRow;
    if (templateErr) throw new Error(`Failed to load template: ${templateErr.message}`);
    if (!tpl && locale !== "en") {
      const { data: fallback, error: fallbackErr } = await supabaseAdmin
        .from("notification_templates")
        .select("key, channel, locale, subject_template, html_template, is_active")
        .eq("key", templateKey)
        .eq("channel", "email")
        .eq("locale", "en")
        .eq("is_active", true)
        .maybeSingle<NotificationTemplateRow>();
      if (fallbackErr) throw new Error(`Failed to load fallback template: ${fallbackErr.message}`);
      tpl = fallback ?? null;
    }

    if (!tpl) return createJsonResponse({ success: false, error: "Template not found" }, 404, origin);

    // Ensure we have OneSignal subscription for recipient
    const { email: recipientEmail } = await ensureOneSignalEmailSubscription({
      supabaseAdmin,
      supabaseUserId: recipientUserId,
      locale,
    });

    const subject = renderTemplate(tpl.subject_template, payload);
    const html = renderTemplate(tpl.html_template, payload);

    const jobId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const { error: insertErr } = await supabaseAdmin.from("notification_jobs").insert({
      id: jobId,
      idempotency_key: jobId,
      channel: "email",
      template_key: templateKey,
      locale,
      recipient_user_id: recipientUserId,
      recipient_email: recipientEmail,
      payload,
      status: "sending",
      attempts: 1,
      updated_at: nowIso,
    });

    if (insertErr) throw new Error(`Failed to create job: ${insertErr.message}`);

    const appId = getOneSignalAppId();
    const oneSignalResp = await oneSignalSendEmail({
      app_id: appId,
      target_channel: "email",
      include_aliases: { external_id: [recipientUserId] },
      email_subject: subject,
      email_body: html,
      email_preheader: body.email_preheader,
      name: body.name ?? templateKey,
      include_unsubscribed: body.include_unsubscribed,
      disable_email_click_tracking: body.disable_email_click_tracking,
      send_after: body.send_after,
      idempotency_key: jobId,
    });

    const messageId = oneSignalResp?.id ?? "";

    if (!messageId) {
      const { error: updateErr } = await supabaseAdmin
        .from("notification_jobs")
        .update({
          status: "failed",
          last_error: "OneSignal accepted request but returned empty message id (no valid email subscriptions?)",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (updateErr) console.warn("Failed to update job status", updateErr);

      return createJsonResponse(
        {
          success: false,
          job_id: jobId,
          error: "Message not sent (empty OneSignal message id). Check recipient subscription.",
          onesignal_response: oneSignalResp,
        },
        422,
        origin
      );
    }

    const { error: updateErr } = await supabaseAdmin
      .from("notification_jobs")
      .update({
        status: "sent",
        onesignal_message_id: messageId,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (updateErr) console.warn("Failed to update job status", updateErr);

    return createJsonResponse(
      { success: true, job_id: jobId, onesignal_message_id: messageId, onesignal_response: oneSignalResp },
      200,
      origin
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("notifications-send-email error", err);
    return createJsonResponse({ success: false, error: message }, 500, origin);
  }
});

