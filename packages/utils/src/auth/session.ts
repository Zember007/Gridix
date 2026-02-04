import type { SupabaseClient } from "@supabase/supabase-js";

function parseHashParams(hash: string) {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
}

function replaceUrlHash(params: URLSearchParams) {
  const newHash = params.toString();
  const nextUrl =
    window.location.pathname +
    window.location.search +
    (newHash ? `#${newHash}` : "");
  window.history.replaceState({}, "", nextUrl);
}

function replaceUrlSearch(params: URLSearchParams) {
  const next =
    window.location.pathname +
    (params.toString() ? `?${params.toString()}` : "") +
    window.location.hash;
  window.history.replaceState({}, "", next);
}

export function hasAuthTokensInHash(): boolean {
  try {
    const params = parseHashParams(window.location.hash);
    return !!(params.get("access_token") && params.get("refresh_token"));
  } catch {
    return false;
  }
}

export async function consumeSupabaseSessionFromUrl(
  supabase: SupabaseClient,
): Promise<void> {
  if (typeof window === "undefined") return;

  // 1) PKCE flow: ?code=...
  try {
    const sp = new URLSearchParams(window.location.search);
    const code = sp.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      // Whether it succeeds or fails, remove code so we don't retry.
      sp.delete("code");
      sp.delete("error");
      sp.delete("error_code");
      sp.delete("error_description");
      replaceUrlSearch(sp);
      if (error) throw error;
    }
  } catch (e) {
    // Don't hard-fail app init; auth guard will handle missing session.
    console.error("Failed to exchange code for session:", e);
  }

  // 2) Implicit flow: #access_token=...&refresh_token=...
  try {
    const hp = parseHashParams(window.location.hash);
    const access_token = hp.get("access_token");
    const refresh_token = hp.get("refresh_token");
    if (access_token && refresh_token) {
      // If a session already exists in this storage, ensure we replace it.
      // This is required for cross-app redirects where a user can already be logged in as someone else.
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // ignore
      }
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      // Remove tokens from hash to avoid leaking them into history/screens.
      const keysToRemove = [
        "access_token",
        "refresh_token",
        "expires_at",
        "expires_in",
        "token_type",
        "type",
        "provider_token",
        "provider_refresh_token",
      ];
      keysToRemove.forEach((k) => hp.delete(k));
      replaceUrlHash(hp);
      if (error) throw error;
    }
  } catch (e) {
    console.error("Failed to set session from hash tokens:", e);
  }
}

