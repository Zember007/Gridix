// @ts-ignore - resolved in Supabase Edge (Deno) runtime
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export type UserNotificationPreferencesRow = {
  channel_email: boolean;
  notify_new_lead: boolean;
  notify_task_due: boolean;
  notify_payment_received: boolean;
  notify_system_update: boolean;
};

export type UserNotificationEvent = "new_lead" | "task_due" | "payment_received" | "system_update";

const DEFAULT_PREFS: UserNotificationPreferencesRow = {
  // Match defaults from the UI (`AdminSettings.tsx`)
  channel_email: true,
  notify_new_lead: true,
  notify_task_due: true,
  notify_payment_received: true,
  notify_system_update: false,
};

function getEventFlagKey(event: UserNotificationEvent): keyof UserNotificationPreferencesRow {
  switch (event) {
    case "new_lead":
      return "notify_new_lead";
    case "task_due":
      return "notify_task_due";
    case "payment_received":
      return "notify_payment_received";
    case "system_update":
      return "notify_system_update";
  }
}

export async function loadUserNotificationPreferences(
  svc: { from: (table: string) => any },
  userId: string
): Promise<UserNotificationPreferencesRow> {
  const { data, error } = await svc
    .from("user_notification_preferences")
    .select("channel_email, notify_new_lead, notify_task_due, notify_payment_received, notify_system_update")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // Don't block primary flows (lead creation/payment confirmation) on notification prefs errors.
    console.warn("Failed to load user_notification_preferences", { userId, error });
    return DEFAULT_PREFS;
  }

  if (!data) return DEFAULT_PREFS;

  return {
    channel_email: !!data.channel_email,
    notify_new_lead: !!data.notify_new_lead,
    notify_task_due: !!data.notify_task_due,
    notify_payment_received: !!data.notify_payment_received,
    notify_system_update: !!data.notify_system_update,
  };
}

export async function loadUserPreferredLocale(
  svc: { from: (table: string) => any },
  userId: string
): Promise<string> {
  const { data, error } = await svc
    .from("user_profiles")
    .select("preferred_locale")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Failed to load user_profiles.preferred_locale", { userId, error });
    return "en";
  }

  const raw = (data as { preferred_locale?: unknown } | null)?.preferred_locale;
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!v) return "en";
  return v;
}

export async function sendEmailNotificationIfEnabled(opts: {
  svc: { from: (table: string) => any };
  recipientUserId: string;
  event: UserNotificationEvent;
  templateKey: string;
  payload: Record<string, unknown>;
  locale?: string;
  name?: string;
  emailPreheader?: string;
  includeUnsubscribed?: boolean;
  disableEmailClickTracking?: boolean;
  sendAfter?: string;
}): Promise<{ attempted: boolean; reason?: string; status?: number }> {
  const recipientUserId = String(opts.recipientUserId || "").trim();
  if (!recipientUserId) return { attempted: false, reason: "missing_recipient" };

  const prefs = await loadUserNotificationPreferences(opts.svc, recipientUserId);

  if (!prefs.channel_email) return { attempted: false, reason: "channel_email_disabled" };

  const flagKey = getEventFlagKey(opts.event);
  if (!prefs[flagKey]) return { attempted: false, reason: `event_disabled:${opts.event}` };

  const locale = (opts.locale && opts.locale.trim() ? opts.locale.trim().toLowerCase() : "")
    || (await loadUserPreferredLocale(opts.svc, recipientUserId));

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for email notifications");
    return { attempted: false, reason: "missing_supabase_env" };
  }

  const fnUrl = `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/notifications-send-email`;

  try {
    const resp = await fetch(fnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        template_key: opts.templateKey,
        recipient_user_id: recipientUserId,
        payload: opts.payload,
        locale,
        name: opts.name,
        email_preheader: opts.emailPreheader,
        include_unsubscribed: opts.includeUnsubscribed,
        disable_email_click_tracking: opts.disableEmailClickTracking,
        send_after: opts.sendAfter,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.warn("notifications-send-email failed", { status: resp.status, body: text });
      return { attempted: true, status: resp.status, reason: "send_failed" };
    }

    return { attempted: true, status: resp.status };
  } catch (e) {
    console.warn("notifications-send-email request failed", e);
    return { attempted: true, reason: "send_error" };
  }
}

