/**
 * Shared auth helpers for Supabase Edge Functions.
 *
 * Why: Supabase JWT Signing Keys (ES256/RS256) are incompatible with the platform-level
 * `verify_jwt` check for Edge Functions. We disable `verify_jwt` and verify inside code.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

export type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  [key: string]: unknown;
};

export function getBearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!auth) return null;

  const [scheme, token] = auth.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token.trim() || null;
}

/**
 * Validates a user JWT by calling Supabase Auth (`/auth/v1/user`).
 * Works with JWT Signing Keys (ES256/RS256) because the Auth server validates the signature.
 */
export async function getSupabaseUser(req: Request): Promise<SupabaseAuthUser | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const apiKey =
    Deno.env.get('SUPABASE_ANON_KEY') ??
    Deno.env.get('SB_PUBLISHABLE_KEY') ??
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ??
    '';

  if (!supabaseUrl || !apiKey) return null;

  const resp = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) return null;
  const user = (await resp.json().catch(() => null)) as SupabaseAuthUser | null;
  if (!user?.id) return null;
  return user;
}

/**
 * For internal jobs/endpoints where you want to allow only server-to-server calls:
 * the caller must send Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>.
 */
export function isServiceRoleRequest(req: Request): boolean {
  const token = getBearerToken(req);
  if (!token) return false;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return !!serviceKey && token === serviceKey;
}

