import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, createCorsResponse, createJsonResponse } from '../_shared/cors.ts'

async function hmacSign(input: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(input))
  const bytes = new Uint8Array(signature)
  // base64url
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

serve(async (req) => {
  const origin = req.headers.get('Origin')

  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return createCorsResponse(origin);
  }

  try {
    

    if (req.method !== 'POST') {
      return createJsonResponse({ error: 'Method not allowed' }, 405, origin);
    }

    const { project_id } = await req.json();

    if (!project_id) {
      return createJsonResponse({ error: 'project_id is required' }, 400, origin);
    }

    // Initialize Supabase user client (RLS enforced)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization') || ''
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Check if project exists and user has access (via RLS)
    const { data: project, error: projectError } = await userClient
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // AmoCRM OAuth настройки
    const clientId = Deno.env.get('AMOCRM_CLIENT_ID') ;
    const stateSecret = Deno.env.get('JWT_SECRET')
    if (!stateSecret) {
      return createJsonResponse({ error: 'Server configuration error: missing JWT_SECRET' }, 500, origin);
    }

    const redirectUri = `${supabaseUrl}/functions/v1/amocrm-oauth-callback`;

    // Build signed state with short expiration
    const payload = JSON.stringify({ project_id, exp: Math.floor(Date.now() / 1000) + 10 * 60 })
    const payloadB64 = btoa(payload).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
    const signature = await hmacSign(payloadB64, stateSecret)
    const signedState = `${payloadB64}.${signature}`

    // Генерируем URL для авторизации AmoCRM
    const authUrl = `https://www.amocrm.ru/oauth?` +
      `client_id=${clientId}&` +
      `state=${signedState}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}`;

    return createJsonResponse({ auth_url: authUrl }, 200, origin);

  } catch (error) {
    console.error('AmoCRM start auth error:', error);
    return createJsonResponse({
      error: 'Internal server error',
      message: error.message
    }, 500, origin);
  }
});
