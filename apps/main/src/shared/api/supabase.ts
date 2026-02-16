// Thin wrapper around generated Supabase client.
// The goal is to keep a single import location for the client across the app.
//
// IMPORTANT:
// - By default, Supabase persists sessions in localStorage (shared across tabs).
// - For partner "login as client" links that contain `#access_token=...&refresh_token=...`,
//   we intentionally create a tab-scoped client that uses sessionStorage instead.
//   That keeps the partner's main session intact in other tabs.
export {
  supabase,
  supabaseAuthInitPromise,
  type SupabaseClientType,
} from "@gridix/utils/api";
