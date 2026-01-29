// Thin wrapper around generated Supabase client.
// The goal is to keep a single import location for the client across the app.
//
// IMPORTANT:
// - By default, Supabase persists sessions in localStorage (shared across tabs).
// - For partner "login as client" links that contain `#access_token=...&refresh_token=...`,
//   we intentionally create a tab-scoped client that uses sessionStorage instead.
//   That keeps the partner's main session intact in other tabs.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@gridix/types/database';

// Get Supabase configuration from environment variables
// Uses import.meta.env (Vite) for browser environments
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (import.meta.env as Record<string, string | undefined>)[key] || '';
  }
  return '';
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY');

// Create the default Supabase client
const rawSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

export type SupabaseClientType = SupabaseClient<Database>;

export let supabase: SupabaseClientType = rawSupabase;

function parseHashParams(hash: string) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
}

function replaceUrlHash(params: URLSearchParams) {
  const newHash = params.toString();
  const nextUrl = window.location.pathname + window.location.search + (newHash ? `#${newHash}` : '');
  window.history.replaceState({}, '', nextUrl);
}

function getPartnerTabTokensFromHash(): { access_token: string; refresh_token: string } | null {
  try {
    const params = parseHashParams(window.location.hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) return null;
    return { access_token, refresh_token };
  } catch {
    return null;
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
  if (typeof window === 'undefined') return;

  const tokens = getPartnerTabTokensFromHash();
  if (!tokens) return;

  // Switch to tab-scoped client BEFORE any AuthProvider reads the session.
  supabase = createTabScopedSupabaseClient();

  try {
    const { error } = await supabase.auth.setSession(tokens);
    if (error) {
      console.error('Failed to set tab-scoped session from hash tokens:', error);
      return;
    }

    // Remove tokens from URL hash to avoid leaking them into history/screen recordings.
    const params = parseHashParams(window.location.hash);
    const keysToRemove = [
      'access_token',
      'refresh_token',
      'expires_at',
      'expires_in',
      'token_type',
      'type',
      'provider_token',
      'provider_refresh_token',
    ];
    keysToRemove.forEach((k) => params.delete(k));
    replaceUrlHash(params);
  } catch (e) {
    console.error('Unexpected error while initializing tab-scoped auth:', e);
  }
})();


