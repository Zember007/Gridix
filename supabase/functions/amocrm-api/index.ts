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
  account_name?: string | null;
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

    const requestBody = await req.json();
    const { project_id, action, pipeline_id, status_id, responsible_user_id } = requestBody;

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
      
      case 'save_settings':
        if (!pipeline_id) {
          return createJsonResponse({ error: 'pipeline_id is required for save_settings' }, 400, origin);
        }
        return await saveAmoCRMSettings(
          project_id, 
          pipeline_id, 
          status_id, 
          responsible_user_id, 
          crmConnection, 
          accessToken, 
          svc, 
          userClient,
          origin
        );
      
      case 'disconnect':
        return await disconnectAmoCRM(project_id, svc, origin);
      
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

    // Extract pipelines and ensure statuses arrays are initialized
    const rawPipelines = pipelinesData._embedded?.pipelines || [];
    const pipelines: AmoCRMPipeline[] = rawPipelines.map((pipeline: any) => ({
      ...pipeline,
      statuses: pipeline.statuses || []
    }));

    const data: AmoCRMData = {
      account: {
        id: accountData.id,
        name: accountData.name,
        subdomain: accountData.subdomain,
        country: accountData.country
      },
      pipelines: pipelines,
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

async function saveAmoCRMSettings(
  projectId: string,
  pipelineId: number,
  statusId: number | null,
  responsibleUserId: number | null,
  connection: CRMConnection,
  accessToken: string,
  svc: any,
  userClient: any,
  origin: string | null
): Promise<Response> {
  try {
    // Fetch AmoCRM data to get pipeline and status details
    const baseUrl = `https://${connection.subdomain}.amocrm.ru/api/v4`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // Fetch pipelines and users
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

    console.log('Raw pipelines data structure:', JSON.stringify(pipelinesData, null, 2));

    // Extract pipelines - statuses should be nested within each pipeline
    const rawPipelines = pipelinesData._embedded?.pipelines || pipelinesData || [];
    const pipelines: AmoCRMPipeline[] = Array.isArray(rawPipelines) ? rawPipelines : [];
    
    // Ensure each pipeline has statuses array (might be missing or null)
    pipelines.forEach(pipeline => {
      if (!pipeline.statuses) {
        pipeline.statuses = [];
      }
    });
    
    const users: AmoCRMUser[] = usersData._embedded?.users || [];

    console.log('Available pipelines:', pipelines.length);
    console.log('Looking for pipeline_id:', pipelineId);
    
    if (pipelines.length > 0) {
      console.log('First pipeline structure:', JSON.stringify(pipelines[0], null, 2));
    }

    // Find selected pipeline and status
    const selectedPipeline = pipelines.find(p => p.id === pipelineId);
    if (!selectedPipeline) {
      console.error('Pipeline not found. Available pipeline IDs:', pipelines.map(p => p.id));
      return createJsonResponse({ 
        error: 'Selected pipeline not found',
        available_pipelines: pipelines.map(p => ({ id: p.id, name: p.name }))
      }, 404, origin);
    }

    console.log('Selected pipeline:', selectedPipeline.name, 'Statuses count:', selectedPipeline.statuses?.length || 0);
    console.log('Selected pipeline full structure:', JSON.stringify(selectedPipeline, null, 2));

    // If statuses are missing, try to fetch them separately
    let pipelineStatuses = selectedPipeline.statuses || [];
    
    if (pipelineStatuses.length === 0) {
      console.log('Statuses not found in pipeline response, attempting to fetch separately...');
      try {
        const pipelineDetailResponse = await fetch(`${baseUrl}/leads/pipelines/${pipelineId}`, { headers });
        if (pipelineDetailResponse.ok) {
          const pipelineDetail = await pipelineDetailResponse.json();
          console.log('Pipeline detail response:', JSON.stringify(pipelineDetail, null, 2));
          pipelineStatuses = pipelineDetail._embedded?.statuses || pipelineDetail.statuses || [];
          // Update the selectedPipeline with fetched statuses
          selectedPipeline.statuses = pipelineStatuses;
        }
      } catch (fetchError) {
        console.error('Error fetching pipeline details:', fetchError);
      }
    }

    // Check if pipeline has statuses after attempting to fetch separately
    if (!pipelineStatuses || pipelineStatuses.length === 0) {
      console.error('Pipeline has no statuses after fetch attempt:', selectedPipeline);
      return createJsonResponse({ 
        error: 'Selected pipeline has no statuses. Please add at least one status to this pipeline in AmoCRM before configuring it.',
        pipeline: { id: selectedPipeline.id, name: selectedPipeline.name },
        suggestion: 'Go to your AmoCRM account and ensure the pipeline has at least one status configured.'
      }, 400, origin);
    }

    const selectedStatus = statusId 
      ? selectedPipeline.statuses.find(s => s.id === statusId)
      : selectedPipeline.statuses[0]; // Default to first status

    const selectedUser = responsibleUserId 
      ? users.find(u => u.id === responsibleUserId)
      : null;

    // Get project to find user_id
    const { data: project, error: projectError } = await svc
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return createJsonResponse({ error: 'Project not found' }, 404, origin);
    }

    // Update or create project CRM settings
    const { data: existingSettings } = await svc
      .from('project_crm_settings')
      .select('id')
      .eq('project_id', projectId)
      .single();

    const settingsData = {
      project_id: projectId,
      crm_connection_id: connection.id,
      pipeline_id: pipelineId,
      pipeline_name: selectedPipeline.name,
      status_id: selectedStatus?.id || null,
      status_name: selectedStatus?.name || null,
      responsible_user_id: responsibleUserId,
      user_name: selectedUser?.name || null,
      updated_at: new Date().toISOString()
    };

    if (existingSettings) {
      await svc
        .from('project_crm_settings')
        .update(settingsData)
        .eq('id', existingSettings.id);
    } else {
      await svc
        .from('project_crm_settings')
        .insert({ ...settingsData, created_at: new Date().toISOString() });
    }

    // Update account name in crm_connections if needed
    if (accountData.name && accountData.name !== connection.account_name) {
      await svc
        .from('crm_connections')
        .update({ account_name: accountData.name })
        .eq('id', connection.id);
    }

    // Create or update local funnel for this project
    await createOrUpdateLocalFunnel(
      projectId,
      project.user_id,
      selectedPipeline,
      svc
    );

    return createJsonResponse({ 
      success: true,
      message: 'AmoCRM settings saved successfully',
      settings: settingsData
    }, 200, origin);

  } catch (error) {
    console.error('Error saving AmoCRM settings:', error);
    return createJsonResponse({
      error: 'Failed to save AmoCRM settings',
      message: error.message
    }, 500, origin);
  }
}

async function createOrUpdateLocalFunnel(
  projectId: string,
  userId: string,
  amoPipeline: AmoCRMPipeline,
  svc: any
): Promise<void> {
  try {
    // Check if funnel already exists for this project and AmoCRM pipeline
    const { data: existingFunnel } = await svc
      .from('crm_funnels')
      .select('id, name')
      .eq('project_id', projectId)
      .eq('amocrm_pipeline_id', amoPipeline.id)
      .single();

    // Sort statuses by sort order for comparison
    const sortedStatuses = [...amoPipeline.statuses].sort((a, b) => a.sort - b.sort);

    // If funnel exists, check if name and statuses match
    if (existingFunnel) {
      // Get existing stages with full details
      const { data: existingStages } = await svc
        .from('crm_funnel_stages')
        .select('id, name, amocrm_status_id, order_index, color')
        .eq('funnel_id', existingFunnel.id)
        .order('order_index', { ascending: true });

      // Check if name matches
      const nameMatches = existingFunnel.name === amoPipeline.name;

      // Check if statuses match (same count, same IDs, same names, same order)
      const statusesMatch = 
        existingStages?.length === sortedStatuses.length &&
        existingStages.every((stage: any, index: number) => {
          const expectedStatus = sortedStatuses[index];
          return (
            stage.amocrm_status_id === expectedStatus.id &&
            stage.name === expectedStatus.name &&
            stage.order_index === index
          );
        });

      // If both name and statuses match exactly, skip update
      if (nameMatches && statusesMatch) {
        console.log(`Funnel already synchronized for project ${projectId}, AmoCRM pipeline ${amoPipeline.id} - skipping update`);
        return;
      }
    }

    let funnelId: string;

    if (existingFunnel) {
      funnelId = existingFunnel.id;
      // Update funnel name if it changed
      if (existingFunnel.name !== amoPipeline.name) {
        await svc
          .from('crm_funnels')
          .update({ 
            name: amoPipeline.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', funnelId);
      }
    } else {
      // Create new funnel
      const { data: newFunnel, error: funnelError } = await svc
        .from('crm_funnels')
        .insert({
          user_id: userId,
          project_id: projectId,
          name: amoPipeline.name,
          amocrm_pipeline_id: amoPipeline.id,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (funnelError || !newFunnel) {
        throw new Error('Failed to create funnel');
      }

      funnelId = newFunnel.id;
    }

    // Get existing stages for this funnel
    const { data: existingStages } = await svc
      .from('crm_funnel_stages')
      .select('id, amocrm_status_id')
      .eq('funnel_id', funnelId);

    const existingStageMap = new Map(
      (existingStages || []).map(s => [s.amocrm_status_id, s.id])
    );

    // Process each status
    for (let i = 0; i < sortedStatuses.length; i++) {
      const status = sortedStatuses[i];
      const existingStageId = existingStageMap.get(status.id);

      // Map AmoCRM color to Tailwind color
      const color = mapAmoCRMColorToTailwind(status.color);

      if (existingStageId) {
        // Update existing stage
        await svc
          .from('crm_funnel_stages')
          .update({
            name: status.name,
            color: color,
            order_index: i,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStageId);

        existingStageMap.delete(status.id);
      } else {
        // Create new stage
        await svc
          .from('crm_funnel_stages')
          .insert({
            funnel_id: funnelId,
            name: status.name,
            color: color,
            order_index: i,
            amocrm_status_id: status.id,
            amocrm_pipeline_id: amoPipeline.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    }

    // Delete stages that no longer exist in AmoCRM
    if (existingStageMap.size > 0) {
      const stageIdsToDelete = Array.from(existingStageMap.values());
      await svc
        .from('crm_funnel_stages')
        .delete()
        .in('id', stageIdsToDelete);
    }

    console.log(`Local funnel synchronized for project ${projectId}, AmoCRM pipeline ${amoPipeline.id}`);
  } catch (error) {
    console.error('Error creating/updating local funnel:', error);
    throw error;
  }
}

function mapAmoCRMColorToTailwind(amoColor: string): string {
  // AmoCRM uses hex colors, we map them to Tailwind color names
  const colorMap: Record<string, string> = {
    '#fffeb2': 'yellow',    // light yellow
    '#fffd7f': 'yellow',    // yellow
    '#ff8a00': 'orange',    // orange
    '#e6e8ff': 'blue',      // light blue/purple
    '#c1e0ff': 'blue',      // blue
    '#99ccff': 'blue',      // blue
    '#d6f9dd': 'green',     // light green
    '#ccff66': 'green',     // green
    '#ace2ce': 'green',     // teal/green
    '#ffc8c8': 'red',       // light red
    '#ff8f92': 'red',       // red
    '#eb93ff': 'purple',    // purple
    '#ccc8f9': 'purple',    // light purple
    '#d5d8dd': 'slate',     // grey
  };

  return colorMap[amoColor.toLowerCase()] || 'slate';
}

async function disconnectAmoCRM(
  projectId: string,
  svc: any,
  origin: string | null
): Promise<Response> {
  try {
    // Delete project CRM settings
    const { error } = await svc
      .from('project_crm_settings')
      .delete()
      .eq('project_id', projectId);

    if (error) {
      throw error;
    }

    // Delete local CRM funnel for this project (keep default funnel)
    await svc
      .from('crm_funnels')
      .delete()
      .eq('project_id', projectId)
      .not('amocrm_pipeline_id', 'is', null);

    return createJsonResponse({ 
      success: true,
      message: 'AmoCRM disconnected successfully'
    }, 200, origin);

  } catch (error) {
    console.error('Error disconnecting AmoCRM:', error);
    return createJsonResponse({
      error: 'Failed to disconnect AmoCRM',
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
