import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createCorsResponse, createJsonResponse } from '../_shared/cors.ts'
import { createOrUpdateLocalFunnel, type AmoCRMPipeline } from '../_shared/amocrm-funnel.ts'
import { getSupabaseUser } from '../_shared/auth.ts'

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

    // Supabase projects using JWT Signing Keys (ES256/RS256) are incompatible with the platform-level
    // `verify_jwt` check for Edge Functions. We disable `verify_jwt` and validate inside code.
    const user = await getSupabaseUser(req);
    if (!user) {
      return createJsonResponse({ error: 'Unauthorized' }, 401, origin);
    }

    const authHeader = req.headers.get('Authorization') || '';

    const requestBody = await req.json();
    const {
      project_id,
      action,
      pipeline_id,
      status_id,
      responsible_user_id,
      lead_id,
      apartment_id,
      data,
    } = requestBody as Record<string, unknown>;

    // Initialize Supabase user client (RLS enforced)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Escalate to service role to read sensitive tokens AFTER access check
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const svc = createClient(supabaseUrl, supabaseServiceKey);

    const normalizeAmoLeadId = (input: unknown): number | null => {
      if (typeof input === 'number' && Number.isFinite(input)) return input;
      if (typeof input === 'string' && input.trim() !== '' && Number.isFinite(Number(input))) {
        return Number(input);
      }
      return null;
    };

    const maybeAwardAgentCommissionOnSold = async (args: {
      leadId: string;
      agentId: string | null;
      apartmentId: string | null;
      oldStageId: string | null;
      newStageId: string;
    }) => {
      try {
        if (!args.agentId) return;
        if (!args.apartmentId) return;
        if (!args.newStageId) return;
        if (args.oldStageId === args.newStageId) return;

        // Check whether this stage has "apartment_status = sold" trigger.
        const { data: triggers, error: triggersError } = await svc
          .from('crm_funnel_triggers')
          .select('id, icon, config')
          .eq('stage_id', args.newStageId)
          .eq('icon', 'apartment_status');
        if (triggersError) throw triggersError;

        const hasSoldTrigger = (triggers || []).some((t: any) => {
          const cfg = (t?.config && typeof t.config === 'object') ? t.config : {};
          return String((cfg as any).apartmentStatus || '').toLowerCase() === 'sold';
        });
        if (!hasSoldTrigger) return;

        // Idempotency: one payout per lead sale.
        const method = `sale:${args.leadId}`;
        const { data: existing } = await svc
          .from('agent_payouts')
          .select('id')
          .eq('agent_id', args.agentId)
          .eq('method', method)
          .limit(1)
          .maybeSingle();
        if (existing?.id) return;

        const [{ data: agentApp }, { data: apartment }] = await Promise.all([
          svc
            .from('agent_applications')
            .select('commission_rate')
            .eq('id', args.agentId)
            .maybeSingle(),
          svc
            .from('apartments')
            .select('price')
            .eq('id', args.apartmentId)
            .maybeSingle(),
        ]);

        const rate = typeof agentApp?.commission_rate === 'number' ? agentApp.commission_rate : 4;
        const price = typeof apartment?.price === 'number' ? apartment.price : null;
        if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return;

        const raw = (price * rate) / 100;
        const amount = Math.round(raw * 100) / 100;
        if (!Number.isFinite(amount) || amount <= 0) return;

        const nowIso = new Date().toISOString();
        const { error: insertError } = await svc.from('agent_payouts').insert({
          agent_id: args.agentId,
          amount,
          status: 'pending',
          method,
          payout_date: nowIso,
        });
        if (insertError) throw insertError;

        // Best-effort: add activity entry for visibility in UI.
        await svc.from('lead_activities').insert({
          lead_id: args.leadId,
          user_id: null,
          type: 'automation',
          description: `Agent commission accrued: ${amount} (${rate}% of ${price})`,
          metadata: { agent_id: args.agentId, apartment_id: args.apartmentId, stage_id: args.newStageId, method },
        });
      } catch (e) {
        console.error('maybeAwardAgentCommissionOnSold failed:', e);
      }
    };

    const buildLeadBindingResponse = (row: any) => {
      const project = row?.projects;
      const apartment = row?.apartments;

      return {
        bound: true,
        lead: {
          id: row?.id,
          amocrm_lead_id: row?.amocrm_lead_id ?? null,
        },
        project: project
          ? {
            id: project.id,
            slug: project.slug ?? null,
            name: project.name ?? null,
            project_type: project.project_type ?? null,
          }
          : null,
        apartment: apartment
          ? {
            id: apartment.id,
            apartment_number: apartment.apartment_number ?? null,
          }
          : null,
      };
    };

    // Special action: update lead (local + remote AmoCRM)
    if (action === 'update_lead') {
      if (!lead_id) {
        return createJsonResponse({ error: 'lead_id is required for update_lead' }, 400, origin);
      }

      const allowedKeys = new Set([
        'name',
        'pipeline_stage_id',
        'email',
        'phone',
        'notes',
        'tags',
        'assigned_to_user_id',
      ]);

      const inputPatch = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
      const localPatch: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(inputPatch)) {
        if (allowedKeys.has(k)) localPatch[k] = v;
      }

      if (Object.keys(localPatch).length === 0) {
        return createJsonResponse({ success: true, message: 'Nothing to update' }, 200, origin);
      }

      // Check lead access via RLS
      const { data: lead, error: leadError } = await userClient
        .from('leads')
        .select('id, project_id, amocrm_lead_id, apartment_id, agent_id, pipeline_stage_id')
        .eq('id', lead_id)
        .single();

      if (leadError || !lead) {
        return createJsonResponse({ error: 'Lead not found or access denied' }, 404, origin);
      }

      // Best-effort remote sync (only for name/stage, only if lead is linked to AmoCRM and project has AmoCRM configured)
      const remoteName = typeof localPatch.name === 'string' ? localPatch.name : undefined;
      const remoteStageId = typeof localPatch.pipeline_stage_id === 'string' ? localPatch.pipeline_stage_id : undefined;

      if (lead.amocrm_lead_id && (remoteName || remoteStageId)) {
        const { data: projectSettings } = await svc
          .from('project_crm_settings')
          .select('*, crm_connections(*)')
          .eq('project_id', lead.project_id)
          .maybeSingle();

        const crmConnection = projectSettings?.crm_connections as unknown as CRMConnection | undefined;

        if (crmConnection?.crm_type === 'amocrm' && crmConnection.subdomain) {
          const { accessToken } = await getValidAccessToken(crmConnection, svc);
          if (accessToken) {
            const baseUrl = `https://${crmConnection.subdomain}.amocrm.ru/api/v4`;
            const headers = {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            };

            const amoPatch: Record<string, unknown> = { id: lead.amocrm_lead_id };
            if (remoteName) amoPatch.name = remoteName;

            if (remoteStageId) {
              // Map local stage -> AmoCRM status/pipeline
              const { data: stage, error: stageError } = await svc
                .from('crm_funnel_stages')
                .select('funnel_id, crm_stage_id, crm_funnel_id, crm_pipeline_id, amocrm_pipeline_id')
                .eq('id', remoteStageId)
                .single();

              const stagePipelineId = stage?.crm_funnel_id ?? stage?.crm_pipeline_id ?? stage?.amocrm_pipeline_id ?? null;
              if (!stageError && stage?.crm_stage_id && stagePipelineId) {
                // Ensure stage belongs to the same project funnel
                const { data: funnel } = await svc
                  .from('crm_funnels')
                  .select('id, project_id')
                  .eq('id', stage.funnel_id)
                  .maybeSingle();

                // AmoCRM funnels can be shared across projects (project_id may be NULL).
                if (!funnel?.project_id || funnel.project_id === lead.project_id) {
                  const statusId = Number(String(stage.crm_stage_id));
                  if (Number.isFinite(statusId)) amoPatch.status_id = statusId;
                  amoPatch.pipeline_id = stagePipelineId;
                }
              }
            }

            // Only call AmoCRM if we have something besides id
            if (Object.keys(amoPatch).length > 1) {
              const amoResp = await fetch(`${baseUrl}/leads`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify([amoPatch]),
              });

              if (!amoResp.ok) {
                const errText = await amoResp.text();
                console.error('Failed to update lead in AmoCRM:', amoResp.status, errText);
                return createJsonResponse({
                  error: 'Failed to update lead in AmoCRM',
                  status: amoResp.status,
                  details: errText,
                }, 502, origin);
              }
            }
          }
        }
      }

      // Update locally AFTER remote success (to keep them consistent)
      const { error: updateError } = await userClient
        .from('leads')
        .update({ ...localPatch, updated_at: new Date().toISOString() })
        .eq('id', lead_id);

      if (updateError) {
        return createJsonResponse({ error: updateError.message }, 400, origin);
      }

      // Award agent commission when entering a stage with apartment_status=sold trigger.
      if (typeof remoteStageId === 'string' && remoteStageId) {
        await maybeAwardAgentCommissionOnSold({
          leadId: lead.id,
          agentId: (lead as any).agent_id ?? null,
          apartmentId: (lead as any).apartment_id ?? null,
          oldStageId: (lead as any).pipeline_stage_id ?? null,
          newStageId: remoteStageId,
        });
      }

      return createJsonResponse({ success: true }, 200, origin);
    }

    // Special action: check if AmoCRM lead is already bound to a local Gridix lead/apartment
    if (action === 'lead_binding_status') {
      const amoLeadId = normalizeAmoLeadId(lead_id);
      if (!amoLeadId) {
        return createJsonResponse({ error: 'lead_id (amo lead id) is required for lead_binding_status' }, 400, origin);
      }

      // RLS-protected: the caller must be the user associated with this account (via SSO)
      const { data: existing, error } = await userClient
        .from('leads')
        .select(
          'id, amocrm_lead_id, project_id, apartment_id, projects(id, slug, name, project_type), apartments(id, apartment_number)',
        )
        .eq('amocrm_lead_id', amoLeadId)
        .maybeSingle();

      if (error) {
        return createJsonResponse({ error: error.message }, 400, origin);
      }

      if (!existing) {
        return createJsonResponse({ bound: false }, 200, origin);
      }

      return createJsonResponse(buildLeadBindingResponse(existing), 200, origin);
    }

    // Special action: bind an AmoCRM lead to a Gridix apartment and create local lead if missing
    if (action === 'bind_lead_to_apartment') {
      const amoLeadId = normalizeAmoLeadId(lead_id);
      if (!amoLeadId) {
        return createJsonResponse({ error: 'lead_id (amo lead id) is required for bind_lead_to_apartment' }, 400, origin);
      }
      if (typeof project_id !== 'string' || !project_id) {
        return createJsonResponse({ error: 'project_id is required for bind_lead_to_apartment' }, 400, origin);
      }
      if (typeof apartment_id !== 'string' || !apartment_id) {
        return createJsonResponse({ error: 'apartment_id is required for bind_lead_to_apartment' }, 400, origin);
      }

      // Access check via RLS
      const { data: project, error: projectError } = await userClient
        .from('projects')
        .select('id, slug, name, project_type')
        .eq('id', project_id)
        .single();

      if (projectError || !project) {
        return createJsonResponse({ error: 'Project not found or access denied' }, 404, origin);
      }

      const { data: apartment, error: apartmentError } = await userClient
        .from('apartments')
        .select('id, apartment_number, project_id')
        .eq('id', apartment_id)
        .single();

      if (apartmentError || !apartment) {
        return createJsonResponse({ error: 'Apartment not found or access denied' }, 404, origin);
      }

      if (apartment.project_id !== project.id) {
        return createJsonResponse({ error: 'Apartment does not belong to selected project' }, 400, origin);
      }

      // Idempotency: if already exists, do not overwrite (return conflict if mismatched)
      const { data: existing, error: existingError } = await svc
        .from('leads')
        .select('id, project_id, apartment_id, amocrm_lead_id, projects(id, slug, name, project_type), apartments(id, apartment_number)')
        .eq('amocrm_lead_id', amoLeadId)
        .maybeSingle();

      if (existingError) {
        return createJsonResponse({ error: existingError.message }, 400, origin);
      }

      if (existing) {
        if (existing.project_id !== project.id || existing.apartment_id !== apartment.id) {
          return createJsonResponse(
            {
              error: 'Lead is already bound to another apartment',
              ...buildLeadBindingResponse(existing),
            },
            409,
            origin,
          );
        }

        return createJsonResponse(buildLeadBindingResponse(existing), 200, origin);
      }

      const placeholderEmail = `amocrm-lead-${amoLeadId}@gridix.local`;
      const placeholderPhone = '';
      const placeholderName = `AmoCRM Lead #${amoLeadId}`;

      const { data: created, error: createError } = await svc
        .from('leads')
        .insert({
          name: placeholderName,
          email: placeholderEmail,
          phone: placeholderPhone,
          project_id: project.id,
          apartment_id: apartment.id,
          status: 'pending',
          source: 'amocrm_widget',
          amocrm_lead_id: amoLeadId,
        })
        .select('id, amocrm_lead_id, project_id, apartment_id, projects(id, slug, name, project_type), apartments(id, apartment_number)')
        .single();

      if (createError || !created) {
        return createJsonResponse({ error: createError?.message || 'Failed to create lead' }, 500, origin);
      }

      return createJsonResponse(buildLeadBindingResponse(created), 200, origin);
    }

    // Verify user is authenticated
    if (!user || !user.id) {
      return createJsonResponse({ error: 'Unauthorized' }, 401, origin);
    }

    // Special action: Disconnect entire user connection (Admin Panel)
    if (action === 'disconnect_user_connection') {
      const { data: connection } = await svc
        .from('crm_connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('crm_type', 'amocrm')
        .maybeSingle();

      if (!connection) {
        return createJsonResponse({ success: true, message: 'Already disconnected' }, 200, origin);
      }

      // Delete all settings linked to this connection
      await svc.from('project_crm_settings').delete().eq('crm_connection_id', connection.id);

      // Delete connection
      await svc.from('crm_connections').delete().eq('id', connection.id);

      return createJsonResponse({ success: true }, 200, origin);
    }

    // Special action: Check connection status (Admin Panel)
    if (action === 'get_connection') {
      const { data: connection } = await svc
        .from('crm_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('crm_type', 'amocrm')
        .maybeSingle();

      return createJsonResponse({ connection }, 200, origin);
    }

    // Determine target user based on project_id or current user
    let targetUserId = user.id;

    if (project_id) {
      if (typeof project_id !== 'string') {
        return createJsonResponse({ error: 'Invalid project_id' }, 400, origin);
      }

      // Check if project exists and user has access via RLS
      const { data: project, error: projectError } = await userClient
        .from('projects')
        .select('id, user_id')
        .eq('id', project_id)
        .single();

      if (projectError || !project) {
        return createJsonResponse({ error: 'Project not found or access denied' }, 404, origin);
      }
      targetUserId = project.user_id;
    }

    // Get AmoCRM connection for the target user
    const { data: crmConnection, error: connectionError } = await svc
      .from('crm_connections')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('crm_type', 'amocrm')
      .maybeSingle();

    if (connectionError) throw connectionError;

    if (!crmConnection) {
      // If we are just fetching data/settings and no connection exists, return appropriate response
      if (action === 'fetch_data') {
        return createJsonResponse({
          error: 'not_connected',
          data: null
        }, 200, origin);
      }
      return createJsonResponse({ error: 'AmoCRM connection not found' }, 404, origin);
    }

    if (!crmConnection.access_token || !crmConnection.subdomain) {
      return createJsonResponse({ error: 'AmoCRM not authorized' }, 401, origin);
    }

    // Ensure we have a valid token
    const { accessToken, tokenExpiresAt } = await getValidAccessToken(crmConnection as CRMConnection, svc);
    if (!accessToken) {
      return createJsonResponse({ error: 'AmoCRM token refresh failed' }, 401, origin);
    }

    // Handle actions
    switch (action) {
      case 'fetch_data':
        return await fetchAmoCRMData(crmConnection, accessToken, origin, tokenExpiresAt);

      case 'initialize_project_settings':
        if (!project_id) return createJsonResponse({ error: 'project_id required' }, 400, origin);
        // Will fetch data and set defaults if missing
        return await saveAmoCRMSettings(
          project_id,
          // Pass -1 or similar to indicate "pick default"
          -1,
          null,
          null,
          crmConnection,
          accessToken,
          svc,
          userClient,
          origin,
          true // isInitialization flag
        );

      case 'save_settings':
        if (!project_id) return createJsonResponse({ error: 'project_id required' }, 400, origin);
        if (typeof pipeline_id !== 'number') return createJsonResponse({ error: 'pipeline_id required' }, 400, origin);

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
        if (!project_id) return createJsonResponse({ error: 'project_id required' }, 400, origin);
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
  origin: string | null,
  isInitialization: boolean = false
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

    // If initialization, verify project settings don't exist yet (or we just overwrite/fill missing)

    // Find selected pipeline and status
    // If initialization (pipelineId = -1), pick the first one
    let targetPipelineId = pipelineId;
    if (pipelineId === -1 && pipelines.length > 0) {
      targetPipelineId = pipelines[0].id;
    }

    const selectedPipeline = pipelines.find(p => p.id === targetPipelineId);

    if (!selectedPipeline) {
      console.error('Pipeline not found. Available:', pipelines.map(p => p.id));
      if (pipelineId === -1) {
        return createJsonResponse({ error: 'No pipelines found in AmoCRM' }, 404, origin);
      }
      return createJsonResponse({
        error: 'Selected pipeline not found',
        available_pipelines: pipelines.map(p => ({ id: p.id, name: p.name }))
      }, 404, origin);
    }

    console.log('Selected pipeline:', selectedPipeline.name);

    // If statuses are missing, try to fetch them separately
    let pipelineStatuses = selectedPipeline.statuses || [];

    if (pipelineStatuses.length === 0) {
      console.log('Statuses not found in pipeline response, attempting to fetch separately...');
      try {
        const pipelineDetailResponse = await fetch(`${baseUrl}/leads/pipelines/${targetPipelineId}`, { headers });
        if (pipelineDetailResponse.ok) {
          const pipelineDetail = await pipelineDetailResponse.json();
          console.log('Pipeline detail response:', JSON.stringify(pipelineDetail, null, 2));
          pipelineStatuses = pipelineDetail._embedded?.statuses || pipelineDetail.statuses || [];
          selectedPipeline.statuses = pipelineStatuses;
        }
      } catch (fetchError) { console.error('Error fetching pipeline details:', fetchError); }
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

    // For initialization, pick first admin or any user if not specified
    let targetUserId = responsibleUserId;
    if (targetUserId === null && users.length > 0) {
      // Prefer admin or first user
      // const admin = users.find(u => u.is_admin); // AmoCRM users don't always expose is_admin in list easily without checking keys
      // valid user is enough
      targetUserId = users[0].id; // fallback
    }

    const selectedUser = targetUserId
      ? users.find(u => u.id === targetUserId)
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
    const { data: existingSettings, error: existingSettingsError } = await svc
      .from('project_crm_settings')
      .select('id')
      .eq('project_id', projectId)
      .eq('crm_connection_id', connection.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSettingsError && existingSettingsError.code !== 'PGRST116') {
      throw existingSettingsError;
    }

    const settingsData = {
      project_id: projectId,
      crm_connection_id: connection.id,
      pipeline_id: targetPipelineId,
      pipeline_name: selectedPipeline.name,
      status_id: selectedStatus?.id || null,
      status_name: selectedStatus?.name || null,
      responsible_user_id: targetUserId,
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

async function disconnectAmoCRM(
  projectId: string,
  svc: any,
  origin: string | null
): Promise<Response> {
  try {
    // Get user_id from the project
    const { data: project } = await svc
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .maybeSingle();

    const userId = project?.user_id ?? null;
    if (!userId) {
      throw new Error('Project not found or user not identified');
    }

    // Get the user's AmoCRM connection
    const { data: connection } = await svc
      .from('crm_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('crm_type', 'amocrm')
      .maybeSingle();

    if (!connection) {
      // Already disconnected
      return createJsonResponse({
        success: true,
        message: 'AmoCRM already disconnected'
      }, 200, origin);
    }

    // Get all pipeline IDs used by this user (for funnel cleanup)
    const { data: allSettings } = await svc
      .from('project_crm_settings')
      .select('pipeline_id')
      .eq('crm_connection_id', connection.id);

    const pipelineIds = [...new Set(
      (allSettings || [])
        .map((s: any) => s.pipeline_id)
        .filter((id: any) => typeof id === 'number')
    )];

    // Delete all project CRM settings for this connection (all projects)
    const { error: settingsError } = await svc
      .from('project_crm_settings')
      .delete()
      .eq('crm_connection_id', connection.id);

    if (settingsError) {
      throw settingsError;
    }

    // Delete the CRM connection itself
    const { error: connectionError } = await svc
      .from('crm_connections')
      .delete()
      .eq('id', connection.id);

    if (connectionError) {
      throw connectionError;
    }

    // Cleanup all funnels for these pipelines
    if (pipelineIds.length > 0) {
      for (const pipelineId of pipelineIds) {
        await svc
          .from('crm_funnels')
          .delete()
          .eq('user_id', userId)
          // Prefer generic `crm_funnel_id` (migration 2026-01-19), fallback to legacy `amocrm_pipeline_id`
          .or(`crm_funnel_id.eq.${pipelineId},amocrm_pipeline_id.eq.${pipelineId}`);
      }
    }

    return createJsonResponse({
      success: true,
      message: 'AmoCRM disconnected successfully from all projects'
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
