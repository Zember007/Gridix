import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function getAllowedCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Origin': '*',
  }
  return headers
}

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
  const corsHeaders = getAllowedCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { project_id } = await req.json();

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
    const stateSecret = Deno.env.get('AMOCRM_STATE_SECRET')
    if (!stateSecret) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: missing AMOCRM_STATE_SECRET' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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

    return new Response(
      JSON.stringify({ auth_url: authUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('AmoCRM start auth error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
