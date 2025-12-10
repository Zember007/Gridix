import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createCorsResponse, createJsonResponse } from '../_shared/cors.ts'

interface CRMConnection {
  id: string;
  user_id: string;
  crm_type: string;
  subdomain: string;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
}

interface ProjectCRMSettings {
  id: string;
  project_id: string;
  crm_connection_id: string;
  pipeline_id?: number | null;
  pipeline_name?: string | null;
  status_id?: number | null;
  status_name?: string | null;
  responsible_user_id?: number | null;
  user_name?: string | null;
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
  if (req.method === 'OPTIONS') {
    return createCorsResponse(origin);
  }

  try {
    // No CORS origin checks — fully permissive

    if (req.method !== 'POST') {
      return createJsonResponse({ error: 'Method not allowed' }, 405, origin);
    }

    const { project_id, action } = await req.json();

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

    // Check if project exists and user has access via RLS
    const { data: project, error: projectError } = await userClient
      .from('projects')
      .select('id, user_id')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return createJsonResponse({ error: 'Project not found or access denied' }, 404, origin);
    }

    // Escalate to service role to read sensitive tokens AFTER access check
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const svc = createClient(supabaseUrl, supabaseServiceKey);

    // Get CRM connection and project settings
    // First get project CRM settings
    const { data: projectSettings, error: projectSettingsError } = await svc
      .from('project_crm_settings')
      .select('*, crm_connections(*)')
      .eq('project_id', project_id)
      .single();

    if (projectSettingsError || !projectSettings) {
      return createJsonResponse({ error: 'AmoCRM settings not found for this project' }, 404, origin);
    }

    const crmConnection = projectSettings.crm_connections as unknown as CRMConnection;
    
    if (!crmConnection || crmConnection.crm_type !== 'amocrm') {
      return createJsonResponse({ error: 'AmoCRM connection not found' }, 404, origin);
    }

    if (!crmConnection.access_token || !crmConnection.subdomain) {
      return createJsonResponse({ error: 'AmoCRM not authorized' }, 401, origin);
    }

    // Ensure we have a valid token (refresh if expired or close to expiry)
    const { accessToken, tokenExpiresAt } = await getValidAccessToken(crmConnection, svc);
    if (!accessToken) {
      return createJsonResponse({ error: 'AmoCRM token refresh failed' }, 401, origin);
    }

    // Handle different actions
    switch (action) {
      case 'fetch_data':
        return await fetchAmoCRMData(crmConnection, accessToken, origin, tokenExpiresAt);
      
      default:
        return createJsonResponse({ error: 'Invalid action' }, 400, origin);
    }

  } catch (error) {
    console.error('AmoCRM API error:', error);
    return createJsonResponse({
      error: 'Internal server error',
      message: error.message
    }, 500, origin);
  }
});

async function fetchAmoCRMData(connection: CRMConnection, accessToken: string, origin: string | null, tokenExpiresAt?: string | null): Promise<Response> {
  try {
    const baseUrl = `https://${connection.subdomain}.amocrm.ru/api/v4`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
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

    return createJsonResponse({ data, token_expires_at: tokenExpiresAt || connection.token_expires_at || null }, 200, origin);

  } catch (error) {
    console.error('Error fetching AmoCRM data:', error);
    return createJsonResponse({
      error: 'Failed to fetch AmoCRM data',
      message: error.message
    }, 500, origin);
  }
}

async function getValidAccessToken(connection: CRMConnection, svc: any): Promise<{ accessToken: string | null, tokenExpiresAt: string | null }> {
  // Determine if token is expiring within 5 minutes
  const now = new Date();
  const threshold = new Date(now.getTime() + 5 * 60 * 1000);
  const currentExpiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;

  if (connection.access_token && currentExpiresAt && currentExpiresAt > threshold) {
    return { accessToken: connection.access_token, tokenExpiresAt: connection.token_expires_at! };
  }

  if (!connection.refresh_token) {
    console.error('No refresh token available for connection', connection.id);
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

    // Use account subdomain endpoint for token refresh
    const tokenUrl = `https://${connection.subdomain}.amocrm.ru/oauth2/access_token`;
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: connection.refresh_token!,
      redirect_uri: redirectUri,
    });

    console.log('Attempting token refresh for connection:', connection.id, 'subdomain:', connection.subdomain);

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
        console.log('Refresh token invalid/revoked - clearing tokens for connection:', connection.id);
        await svc
          .from('crm_connections')
          .update({
            access_token: null,
            refresh_token: null,
            token_expires_at: null,
          })
          .eq('id', connection.id);
      }
      
      return { accessToken: null, tokenExpiresAt: null };
    }

    const tokenResult: TokenResponse = await response.json();
    const expiresAt = new Date(Date.now() + tokenResult.expires_in * 1000).toISOString();

    const { error: updateError } = await svc
      .from('crm_connections')
      .update({
        access_token: tokenResult.access_token,
        refresh_token: tokenResult.refresh_token,
        token_expires_at: expiresAt,
      })
      .eq('id', connection.id);

    if (updateError) {
      console.error('Failed to persist refreshed token:', updateError);
    }

    return { accessToken: tokenResult.access_token, tokenExpiresAt: expiresAt };
  } catch (e) {
    console.error('Error refreshing token:', e);
    return { accessToken: null, tokenExpiresAt: null };
  }
}
