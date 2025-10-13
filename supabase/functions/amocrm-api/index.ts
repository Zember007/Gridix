import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function getAllowedCorsHeaders(_origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400'
  }
  return headers
}

interface AmoCRMSettings {
  id?: string;
  project_id: string;
  subdomain: string;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AmoCRMPipeline {
  id: number;
  name: string;
  sort: number;
  is_main: boolean;
  is_archive: boolean;
  statuses: AmoCRMStatus[];
}

interface AmoCRMStatus {
  id: number;
  name: string;
  sort: number;
  color: string;
  type: number;
  pipeline_id: number;
}

interface AmoCRMUser {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  group: {
    id: number;
    name: string;
  };
}

interface AmoCRMData {
  account: {
    id: number;
    name: string;
    subdomain: string;
    country: string;
  };
  pipelines: AmoCRMPipeline[];
  users: AmoCRMUser[];
}

serve(async (req) => {
  const origin = req.headers.get('Origin')
  const corsHeaders = getAllowedCorsHeaders(origin)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    // No CORS origin checks — fully permissive

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { project_id, action } = await req.json();

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

    // Check if project exists and user has access via RLS
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

    // Escalate to service role to read sensitive tokens AFTER access check
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const svc = createClient(supabaseUrl, supabaseServiceKey);

    // Get AmoCRM settings for the project
    const { data: settings, error: settingsError } = await svc
      .from('amocrm_settings')
      .select('*')
      .eq('project_id', project_id)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: 'AmoCRM settings not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!settings.access_token || !settings.subdomain) {
      return new Response(
        JSON.stringify({ error: 'AmoCRM not authorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Ensure we have a valid token (refresh if expired or close to expiry)
    const { accessToken, tokenExpiresAt } = await getValidAccessToken(settings, svc);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'AmoCRM token refresh failed' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle different actions
    switch (action) {
      case 'fetch_data':
        return await fetchAmoCRMData({ ...settings, access_token: accessToken }, corsHeaders, tokenExpiresAt);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

  } catch (error) {
    console.error('AmoCRM API error:', error);
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

async function fetchAmoCRMData(settings: AmoCRMSettings, corsHeaders: Record<string, string>, tokenExpiresAt?: string | null): Promise<Response> {
  try {
    const baseUrl = `https://${settings.subdomain}.amocrm.ru/api/v4`;
    const headers = {
      'Authorization': `Bearer ${settings.access_token}`,
      'Content-Type': 'application/json'
    };

    // Fetch all data in parallel
    const [pipelinesResponse, usersResponse, accountResponse] = await Promise.all([
      fetch(`${baseUrl}/leads/pipelines`, { headers }),
      fetch(`${baseUrl}/users`, { headers }),
      fetch(`${baseUrl}/account`, { headers })
    ]);

    if (!pipelinesResponse.ok || !usersResponse.ok || !accountResponse.ok) {
      throw new Error('Failed to fetch data from AmoCRM API');
    }

    const [pipelinesData, usersData, accountData] = await Promise.all([
      pipelinesResponse.json(),
      usersResponse.json(),
      accountResponse.json()
    ]);

    const data: AmoCRMData = {
      account: {
        id: accountData.id,
        name: accountData.name,
        subdomain: accountData.subdomain,
        country: accountData.country
      },
      pipelines: pipelinesData._embedded?.pipelines || [],
      users: usersData._embedded?.users || []
    };

    return new Response(
      JSON.stringify({ data, token_expires_at: tokenExpiresAt || settings.token_expires_at || null }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching AmoCRM data:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch AmoCRM data',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function getValidAccessToken(settings: AmoCRMSettings, svc: any): Promise<{ accessToken: string | null, tokenExpiresAt: string | null }> {
  // Determine if token is expiring within 5 minutes
  const now = new Date();
  const threshold = new Date(now.getTime() + 5 * 60 * 1000);
  const currentExpiresAt = settings.token_expires_at ? new Date(settings.token_expires_at) : null;

  if (settings.access_token && currentExpiresAt && currentExpiresAt > threshold) {
    return { accessToken: settings.access_token, tokenExpiresAt: settings.token_expires_at! };
  }

  if (!settings.refresh_token) {
    console.error('No refresh token available for project', settings.project_id);
    return { accessToken: null, tokenExpiresAt: null };
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const redirectUri = `${supabaseUrl}/functions/v1/amocrm-oauth-callback`;
    const clientId = Deno.env.get('AMOCRM_CLIENT_ID');
    const clientSecret = Deno.env.get('AMOCRM_CLIENT_SECRET');


    if (!clientId || !clientSecret) {
      console.error('Missing AMOCRM client credentials');
      return { accessToken: null, tokenExpiresAt: null };
    }

    // Use global endpoint for refresh per AmoCRM docs
    const tokenUrl = `https://www.amocrm.ru/oauth2/access_token`;
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: settings.refresh_token!,
      redirect_uri: redirectUri,
    });

    console.log('Attempting token refresh for project:', settings.project_id, 'subdomain:', settings.subdomain);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', response.status, errorText);
      
      // If 401, the refresh token is invalid/revoked - clear tokens in DB so UI knows to re-authorize
      if (response.status === 401) {
        console.log('Refresh token invalid/revoked - clearing tokens for project:', settings.project_id);
        await svc
          .from('amocrm_settings')
          .update({
            access_token: null,
            refresh_token: null,
            token_expires_at: null,
          })
          .eq('project_id', settings.project_id);
      }
      
      return { accessToken: null, tokenExpiresAt: null };
    }

    const tokenResult: TokenResponse = await response.json();
    const expiresAt = new Date(Date.now() + tokenResult.expires_in * 1000).toISOString();

    const { error: updateError } = await svc
      .from('amocrm_settings')
      .update({
        access_token: tokenResult.access_token,
        refresh_token: tokenResult.refresh_token,
        token_expires_at: expiresAt,
      })
      .eq('project_id', settings.project_id);

    if (updateError) {
      console.error('Failed to persist refreshed token:', updateError);
    }

    return { accessToken: tokenResult.access_token, tokenExpiresAt: expiresAt };
  } catch (e) {
    console.error('Error refreshing token:', e);
    return { accessToken: null, tokenExpiresAt: null };
  }
}
