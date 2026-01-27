import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";
import { isServiceRoleRequest } from "../_shared/auth.ts";
import { getOneSignalAppId, oneSignalCreateOrUpdateUser } from "../_shared/onesignal.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

type SyncUserRequest = {
  supabase_user_id: string;
  email: string;
  enabled?: boolean;
  locale?: string;
  tags?: Record<string, string>;
};

type SupabaseDbWebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: Record<string, unknown> | null;
  old_record?: Record<string, unknown> | null;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeInput(
  raw: unknown
): (SyncUserRequest & { _source: "direct" | "supabase_webhook" }) | null {
  if (!raw || typeof raw !== "object") return null;

  // 1) Direct call shape
  const direct = raw as Partial<SyncUserRequest>;
  if (typeof direct.supabase_user_id === "string" && typeof direct.email === "string") {
    return {
      supabase_user_id: direct.supabase_user_id,
      email: direct.email,
      enabled: direct.enabled,
      locale: direct.locale,
      tags: direct.tags,
      _source: "direct",
    };
  }

  // 2) Supabase DB webhook default shape (record/old_record)
  const hook = raw as SupabaseDbWebhookPayload;
  const record = hook.record ?? null;
  if (record && typeof record === "object") {
    const id = record["id"];
    const email = record["email"];
    const accountType = record["account_type"];

    if (typeof id === "string" && typeof email === "string") {
      return {
        supabase_user_id: id,
        email,
        enabled: true,
        locale: "en",
        tags: typeof accountType === "string" ? { account_type: accountType } : undefined,
        _source: "supabase_webhook",
      };
    }
  }

  return null;
}

function requireWebhookOrServiceAuth(req: Request): void {
  if (isServiceRoleRequest(req)) return;

  const expected = Deno.env.get("JWT_SECRET") ?? "";
  const provided = req.headers.get("x-gridix-webhook-secret") ?? "";
  if (!expected || provided !== expected) {
    throw new Error("Unauthorized");
  }
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return createCorsResponse(origin);

  try {
    requireWebhookOrServiceAuth(req);

    const raw = (await req.json().catch(() => null)) as unknown;
    const body = normalizeInput(raw);
    if (!body) return createJsonResponse({ success: false, error: "Invalid JSON" }, 400, origin);

    const supabaseUserId = body.supabase_user_id?.trim();
    const email = body.email?.trim().toLowerCase();
    const enabled = body.enabled ?? true;

    if (!supabaseUserId) {
      return createJsonResponse({ success: false, error: "Missing supabase_user_id" }, 400, origin);
    }
    if (!email || !isValidEmail(email)) {
      return createJsonResponse({ success: false, error: "Invalid email" }, 400, origin);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const appId = getOneSignalAppId();

    const oneSignalResp = await oneSignalCreateOrUpdateUser(appId, {
      identity: { external_id: supabaseUserId },
      properties: {
        language: body.locale ?? "en",
        tags: body.tags ?? {},
      },
      subscriptions: [{ type: "Email", token: email, enabled }],
    });

    const onesignalId = oneSignalResp?.identity?.onesignal_id ?? null;

    const { error: upsertError } = await supabaseAdmin
      .from("onesignal_user_links")
      .upsert(
        {
          supabase_user_id: supabaseUserId,
          onesignal_id: onesignalId,
          email_subscription_id: null,
          email,
          enabled,
          last_synced_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "supabase_user_id" }
      );

    if (upsertError) {
      console.error("Failed to upsert onesignal_user_links", upsertError);
      return createJsonResponse(
        { success: false, error: "Failed to persist link", details: upsertError.message, onesignal_id: onesignalId },
        500,
        origin
      );
    }

    return createJsonResponse(
      { success: true, supabase_user_id: supabaseUserId, onesignal_id: onesignalId, source: body._source },
      200,
      origin
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return createJsonResponse({ success: false, error: message }, status, origin);
  }
});

