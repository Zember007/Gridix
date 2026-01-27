import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

export type OneSignalCreateUserRequest = {
  identity: {
    external_id: string;
  };
  properties?: {
    tags?: Record<string, string>;
    language?: string;
    timezone_id?: string;
    country?: string;
    first_active?: number;
    last_active?: number;
  };
  subscriptions: Array<{
    type: "Email";
    token: string;
    enabled?: boolean;
  }>;
};

export type OneSignalCreateUserResponse = {
  identity?: {
    onesignal_id?: string;
    external_id?: string;
    [k: string]: unknown;
  };
  properties?: {
    tags?: Record<string, string>;
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

export type OneSignalEmailSendRequest = {
  app_id: string;
  target_channel: "email";
  include_aliases: { external_id: string[] };
  email_subject: string;
  email_body: string;
  email_preheader?: string;
  name?: string;
  include_unsubscribed?: boolean;
  disable_email_click_tracking?: boolean;
  send_after?: string;
  idempotency_key?: string;
};

export type OneSignalEmailSendResponse = {
  id?: string;
  external_id?: string;
  errors?: unknown;
};

function getOneSignalApiKey(): string {
  const apiKey = Deno.env.get("ONESIGNAL_REST_API_KEY") ?? "";
  if (!apiKey) throw new Error("Missing ONESIGNAL_REST_API_KEY");
  return apiKey;
}

export function getOneSignalAppId(): string {
  const appId = Deno.env.get("ONESIGNAL_APP_ID") ?? "";
  if (!appId) throw new Error("Missing ONESIGNAL_APP_ID");
  return appId;
}

function getAuthHeaders(): Record<string, string> {
  const apiKey = getOneSignalApiKey();
  return {
    "Content-Type": "application/json",
    Authorization: `Key ${apiKey}`,
  };
}

export async function oneSignalCreateOrUpdateUser(
  appId: string,
  body: OneSignalCreateUserRequest
): Promise<OneSignalCreateUserResponse> {
  const resp = await fetch(`https://api.onesignal.com/apps/${appId}/users`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await resp.json().catch(() => ({}))) as OneSignalCreateUserResponse & {
    error?: string;
    errors?: unknown;
  };

  if (!resp.ok) {
    throw new Error(
      `OneSignal create user failed (${resp.status}): ${json?.error ?? JSON.stringify(json)}`
    );
  }

  return json;
}

export async function oneSignalSendEmail(
  req: OneSignalEmailSendRequest
): Promise<OneSignalEmailSendResponse> {
  const resp = await fetch("https://api.onesignal.com/notifications?c=email", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(req),
  });

  const json = (await resp.json().catch(() => ({}))) as OneSignalEmailSendResponse & {
    error?: string;
  };

  if (!resp.ok) {
    throw new Error(
      `OneSignal send email failed (${resp.status}): ${json?.error ?? JSON.stringify(json)}`
    );
  }

  return json;
}

