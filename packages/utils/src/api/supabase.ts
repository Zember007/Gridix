// Thin wrapper around generated Supabase client.
// The goal is to keep a single import location for the client across the app.
//
// IMPORTANT:
// - By default, Supabase persists sessions in localStorage (shared across tabs).
// - For partner "login as client" links that contain `#access_token=...&refresh_token=...`,
//   we intentionally create a tab-scoped client that uses sessionStorage instead.
//   That keeps the partner's main session intact in other tabs.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@gridix/types/database";
import {
  consumeSupabaseSessionFromUrl,
  hasAuthTokensInHash,
} from "../auth/session";

// Get Supabase configuration from environment variables
// Uses import.meta.env (Vite) for browser environments
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return (import.meta.env as Record<string, string | undefined>)[key] || "";
  }
  return "";
};

const SUPABASE_URL = getEnvVar("VITE_SUPABASE_URL");
const SUPABASE_ANON_KEY =
  getEnvVar("VITE_SUPABASE_PUBLISHABLE_KEY") ||
  getEnvVar("VITE_SUPABASE_ANON_KEY");

// Create the default Supabase client
const rawSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

export type SupabaseClientType = SupabaseClient<Database>;

export let supabase: SupabaseClientType = rawSupabase;

function hasExistingLocalSession(): boolean {
  try {
    // Supabase stores session under keys like: sb-<project-ref>-auth-token
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
        const v = localStorage.getItem(k);
        if (v) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function createTabScopedSupabaseClient(): SupabaseClientType {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: sessionStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabaseAuthInitPromise: Promise<void> = (async () => {
  // Only run in browser
  if (typeof window === "undefined") return;

  try {
    // If URL contains hash tokens and there is already a local session:
    // - default behavior: overwrite session (re-login) so that new tokens always win.
    // - preserve legacy "login as client" behavior only when explicitly requested by URL param.
    const sp = new URLSearchParams(window.location.search);
    const preserveLocalSession = sp.get("tab_session") === "1";

    if (
      hasAuthTokensInHash() &&
      hasExistingLocalSession() &&
      preserveLocalSession
    ) {
      supabase = createTabScopedSupabaseClient();
    }

    await consumeSupabaseSessionFromUrl(supabase as unknown as SupabaseClient);
  } catch (e) {
    console.error("Unexpected error while initializing auth from URL:", e);
  }
})();
