import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, createCorsResponse, createJsonResponse } from '../_shared/cors.ts'
import { sendEmailNotificationIfEnabled } from "../_shared/user-notifications.ts";


interface LeadRequest {
  name: string;
  email: string;
  phone: string;
  apartmentId: string;
  projectId: string;
}

interface CRMConnection {
  id: string;
  user_id: string;
  crm_type: string;
  subdomain: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
}

interface ProjectCRMSettings {
  id: string;
  project_id: string;
  crm_connection_id: string;
  pipeline_id: number;
  status_id?: number;
  responsible_user_id?: number;
  crm_connections?: CRMConnection;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AmoCRMLead {
  name: string;
  pipeline_id: number;
  price?: number;
  status_id?: number;
  responsible_user_id?: number;
  _embedded?: {
    contacts?: Array<{
      name: string;
      custom_fields_values?: Array<{
        field_id: number;
        values: Array<{
          value: string;
        }>;
      }>;
    }>;
  };
}

function extractAmoComplexLeadIds(payload: any): { leadId: number | null; contactId: number | null } {
  // AmoCRM /api/v4/leads/complex may respond as:
  // - Array of leads
  // - Object with _embedded.leads
  // We handle both to avoid losing the created lead id.
  const lead = Array.isArray(payload)
    ? payload[0]
    : payload?._embedded?.leads?.[0] ?? payload?.leads?.[0] ?? null;

  const leadId = typeof lead?.id === 'number' ? lead.id : null;
  const contactId = typeof lead?._embedded?.contacts?.[0]?.id === 'number'
    ? lead._embedded.contacts[0].id
    : null;

  return { leadId, contactId };
}

async function resolveLocalFunnelAndFirstStage(opts: {
  svc: any;
  userId: string;
  externalFunnelId?: number | null;
  preferDefault?: boolean;
}): Promise<{ funnelId: string | null; firstStageId: string | null }> {
  if (opts.preferDefault) {
    const { data: df } = await opts.svc
      .from("crm_funnels")
      .select("id")
      .eq("user_id", opts.userId)
      .eq("is_default", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const funnelId = df?.id ? String(df.id) : null;
    if (!funnelId) return { funnelId: null, firstStageId: null };

    const { data: st } = await opts.svc
      .from("crm_funnel_stages")
      .select("id")
      .eq("funnel_id", funnelId)
      .order("order_index", { ascending: true })
      .limit(1)
      .maybeSingle();

    return { funnelId, firstStageId: st?.id ? String(st.id) : null };
  }

  const extId = typeof opts.externalFunnelId === "number" ? opts.externalFunnelId : null;
  if (!extId) return { funnelId: null, firstStageId: null };

  const { data: funnel } = await opts.svc
    .from("crm_funnels")
    .select("id, crm_funnel_id, amocrm_pipeline_id")
    .eq("user_id", opts.userId)
    .or(`crm_funnel_id.eq.${extId},amocrm_pipeline_id.eq.${extId}`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const funnelId = funnel?.id ? String(funnel.id) : null;
  if (!funnelId) return { funnelId: null, firstStageId: null };

  const { data: stage } = await opts.svc
    .from("crm_funnel_stages")
    .select("id")
    .eq("funnel_id", funnelId)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  return { funnelId, firstStageId: stage?.id ? String(stage.id) : null };
}

async function getValidAccessToken(connection: CRMConnection, supabase: any): Promise<string | null> {
  // Проверяем актуальность токена
  if (connection.access_token && connection.token_expires_at) {
    const expiresAt = new Date(connection.token_expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt > fiveMinutesFromNow) {
      return connection.access_token;
    }
  }

  // Обновляем токен
  if (!connection.refresh_token) {
    console.error('No refresh token available');
    return null;
  }

  try {
    // Use account subdomain endpoint for token refresh
    const tokenUrl = `https://${connection.subdomain}.amocrm.ru/oauth2/access_token`;
    // Use the same redirect_uri as used during authorization
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const redirectUri = `${supabaseUrl}/functions/v1/amocrm-oauth-callback`
    const clientId = Deno.env.get('AMOCRM_CLIENT_ID')
    const clientSecret = Deno.env.get('AMOCRM_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      console.error('AMOCRM client credentials are not configured');
      return null;
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: connection.refresh_token,
      redirect_uri: redirectUri,
    })

    console.log('Refreshing token for subdomain:', connection.subdomain, 'connection:', connection.id);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      
      // If 401, the refresh token is invalid/revoked - clear tokens in DB
      if (response.status === 401) {
        console.log('Refresh token invalid/revoked - clearing tokens for connection ID:', connection.id);
        await supabase
          .from('crm_connections')
          .update({
            access_token: null,
            refresh_token: null,
            token_expires_at: null,
          })
          .eq('id', connection.id);
      }
      
      return null;
    }

    const tokenResult: TokenResponse = await response.json();
    const expiresAt = new Date(Date.now() + (tokenResult.expires_in * 1000));

    // Обновляем токен в базе
    const { error: updateError } = await supabase
      .from('crm_connections')
      .update({
        access_token: tokenResult.access_token,
        refresh_token: tokenResult.refresh_token,
        token_expires_at: expiresAt.toISOString()
      })
      .eq('id', connection.id);

    if (updateError) {
      console.error('Failed to update token in database:', updateError);
    }

    return tokenResult.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

async function getContactFields(connection: CRMConnection, accessToken: string) {
  let emailFieldId = 0;
  let phoneFieldId = 0;

  try {
    console.log('Fetching contact fields from AmoCRM API...');
    const fieldsResponse = await fetch(`https://${connection.subdomain}.amocrm.ru/api/v4/contacts/custom_fields`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (fieldsResponse.ok) {
      const fieldsData = await fieldsResponse.json();
      if (fieldsData._embedded && fieldsData._embedded.custom_fields) {
        const emailFieldData = fieldsData._embedded.custom_fields.find((f: any) => f.code === 'EMAIL');
        const phoneFieldData = fieldsData._embedded.custom_fields.find((f: any) => f.code === 'PHONE');

        if (emailFieldData) emailFieldId = emailFieldData.id;
        if (phoneFieldData) phoneFieldId = phoneFieldData.id;

        console.log('Found contact fields:', { emailFieldId, phoneFieldId });
      }
    } else {
      console.error('Failed to fetch contact fields:', await fieldsResponse.text());
    }
  } catch (error) {
    console.error('Error fetching contact fields:', error);
  }

  return { emailFieldId, phoneFieldId };
}

serve(async (req) => {
  // Обработка CORS
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') {
    return createCorsResponse(origin);
  }

  try {
    // CORS is permissive; no origin restrictions

    const requestBody = await req.json();
    console.log('Received request:', requestBody);

    const { name, email, phone, apartmentId, projectId }: LeadRequest = requestBody;

    // Валидация обязательных полей
    if (!name || !email || !phone || !apartmentId || !projectId) {
      console.error('Missing required fields:', { name: !!name, email: !!email, phone: !!phone, apartmentId: !!apartmentId, projectId: !!projectId });
      return createJsonResponse({
        error: 'Missing required fields',
        required: ['name', 'email', 'phone', 'apartmentId', 'projectId']
      }, 400, origin);
    }

    // Инициализация Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      return createJsonResponse({ error: 'Server configuration error' }, 500, origin);
    }

    const authHeader = req.headers.get('Authorization') || ''
    const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    // Service role client for privileged DB operations
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const svc = createClient(supabaseUrl, supabaseServiceKey);

    // Получение данных о квартире
    console.log('Fetching apartment data for:', apartmentId);
    const { data: apartment, error: apartmentError } = await userClient
      .from('apartments')
      .select(`
        *,
        projects!inner (
          name,
          address,
          currency,
          user_id
        )
      `)
      .eq('id', apartmentId)
      .single();

    if (apartmentError || !apartment) {
      console.error('Apartment not found:', { apartmentId, apartmentError });
      return createJsonResponse({ error: 'Apartment not found' }, 404, origin);
    }

    // Получение настроек AmoCRM ПЕРЕНЕСЕНО ниже после сохранения лида

    const projectOwnerId = String(apartment.projects?.user_id || '');

    // Load all AmoCRM settings for the project (can be multiple integrations)
    console.log('Fetching CRM settings for project:', projectId);
    const { data: settingsRows, error: settingsError } = await svc
      .from('project_crm_settings')
      .select('*, crm_connections(*)')
      .eq('project_id', projectId);

    if (settingsError) console.error('Error fetching CRM settings:', settingsError);
    const amoSettings = (Array.isArray(settingsRows) ? settingsRows : []) as unknown as ProjectCRMSettings[];

    // Resolve local targets (one lead per integration funnel)
    const targets: Array<{
      key: string;
      funnelId: string | null;
      firstStageId: string | null;
      settings: ProjectCRMSettings;
      connection: CRMConnection;
    }> = [];

    for (const s of amoSettings) {
      const conn = s.crm_connections as unknown as CRMConnection;
      if (!conn || conn.crm_type !== 'amocrm' || !s.pipeline_id) continue;
      const { funnelId, firstStageId } = await resolveLocalFunnelAndFirstStage({
        svc,
        userId: projectOwnerId,
        externalFunnelId: s.pipeline_id,
      });
      targets.push({
        key: `amo:${s.crm_connection_id}:${s.pipeline_id}`,
        funnelId,
        firstStageId,
        settings: s,
        connection: conn,
      });
    }

    // If no AmoCRM targets found, create a single local lead in default funnel (if any)
    if (targets.length === 0) {
      const { funnelId, firstStageId } = await resolveLocalFunnelAndFirstStage({
        svc,
        userId: projectOwnerId,
        preferDefault: true,
      });

      const { data: savedLead, error: leadSaveError } = await svc
        .from('leads')
        .insert({
          name,
          email,
          phone,
          project_id: projectId,
          apartment_id: apartmentId,
          status: 'saved_only',
          source: 'website',
          pipeline_stage_id: firstStageId || null,
          amocrm_error: 'AmoCRM not configured for this project',
        })
        .select()
        .single();

      if (leadSaveError || !savedLead) {
        console.error('Failed to save lead to database:', leadSaveError);
        return createJsonResponse({ error: 'Failed to save lead. Please try again.', details: leadSaveError?.message }, 500, origin);
      }

      // ---- Email notification (best-effort): "new lead"
      try {
        const siteUrlRaw = (Deno.env.get("SITE_URL") || origin || "https://gridix.live").toString();
        const siteUrl = siteUrlRaw.endsWith("/") ? siteUrlRaw.slice(0, -1) : siteUrlRaw;

        await sendEmailNotificationIfEnabled({
          svc,
          recipientUserId: projectOwnerId,
          event: "new_lead",
          templateKey: "new_lead_created",
          name: "create-amocrm-lead:new_lead",
          payload: {
            app: { url: siteUrl },
            source: "website",
            lead: { name, email, phone, source: "website", agent_id: null },
            project: {
              id: (apartment as any)?.projects?.id ?? null,
              name: (apartment as any)?.projects?.name ?? null,
              address: (apartment as any)?.projects?.address ?? null,
              currency: (apartment as any)?.projects?.currency ?? null,
            },
            apartment: {
              id: (apartment as any)?.id ?? null,
              number: (apartment as any)?.apartment_number ?? null,
              floor_number: (apartment as any)?.floor_number ?? null,
              rooms: (apartment as any)?.rooms ?? null,
              area: (apartment as any)?.area ?? null,
              price: (apartment as any)?.price ?? null,
            },
          },
        });
      } catch (e) {
        console.warn("new lead email notification skipped/failed", e);
      }

      return createJsonResponse(
        {
          success: true,
          leadId: savedLead.id,
          leadIds: [savedLead.id],
          message: 'Lead successfully saved to local funnel.',
          crmIntegration: false,
          results: [{ kind: 'default', leadId: savedLead.id, funnelId, crm: { ok: false } }],
        },
        200,
        origin
      );
    }

    // De-duplicate by funnelId to avoid double inserts into the same local funnel
    const uniqueTargets: typeof targets = [];
    const seen = new Set<string>();
    for (const t of targets) {
      const sig = t.funnelId ? `amo:${t.funnelId}` : t.key;
      if (seen.has(sig)) continue;
      seen.add(sig);
      uniqueTargets.push(t);
    }

    // Fetch existing leads for this email+apartment and map their stage -> funnel
    console.log('Checking for duplicate leads per funnel...');
    const { data: existingLeads } = await svc
      .from('leads')
      .select('id, created_at, pipeline_stage_id')
      .eq('email', email)
      .eq('apartment_id', apartmentId);

    const existingStageIds = (existingLeads || [])
      .map((l: any) => (l?.pipeline_stage_id ? String(l.pipeline_stage_id) : null))
      .filter(Boolean) as string[];

    const stageToFunnel = new Map<string, string>();
    if (existingStageIds.length > 0) {
      const { data: stageRows } = await svc
        .from('crm_funnel_stages')
        .select('id, funnel_id')
        .in('id', existingStageIds);
      for (const r of stageRows || []) {
        if (r?.id && r?.funnel_id) stageToFunnel.set(String(r.id), String(r.funnel_id));
      }
    }

    const existingFunnels = new Set<string>();
    for (const l of existingLeads || []) {
      const st = l?.pipeline_stage_id ? String(l.pipeline_stage_id) : '';
      const f = st ? stageToFunnel.get(st) : null;
      if (f) existingFunnels.add(String(f));
    }

    // Insert missing leads (one per funnel)
    const insertPayloads: Record<string, unknown>[] = [];
    const targetByIndex: typeof uniqueTargets = [];
    for (const t of uniqueTargets) {
      if (t.funnelId && existingFunnels.has(t.funnelId)) continue;
      insertPayloads.push({
        name,
        email,
        phone,
        project_id: projectId,
        apartment_id: apartmentId,
        status: 'pending',
        source: 'website',
        pipeline_stage_id: t.firstStageId || null,
      });
      targetByIndex.push(t);
    }

    const createdLeads: any[] = [];
    if (insertPayloads.length > 0) {
      console.log('Saving leads to database (per integration)...');
      const { data: createdRows, error: leadSaveError } = await svc.from('leads').insert(insertPayloads).select();
      if (leadSaveError) {
        console.error('Failed to save leads to database:', leadSaveError);
        return createJsonResponse({ error: 'Failed to save lead(s). Please try again.', details: leadSaveError?.message }, 500, origin);
      }
      createdLeads.push(...(createdRows || []));

      // ---- Email notification (best-effort): "new lead"
      try {
        const siteUrlRaw = (Deno.env.get("SITE_URL") || origin || "https://gridix.live").toString();
        const siteUrl = siteUrlRaw.endsWith("/") ? siteUrlRaw.slice(0, -1) : siteUrlRaw;

        await sendEmailNotificationIfEnabled({
          svc,
          recipientUserId: projectOwnerId,
          event: "new_lead",
          templateKey: "new_lead_created",
          name: "create-amocrm-lead:new_lead",
          payload: {
            app: { url: siteUrl },
            source: "website",
            lead: { name, email, phone, source: "website", agent_id: null },
            project: {
              id: (apartment as any)?.projects?.id ?? null,
              name: (apartment as any)?.projects?.name ?? null,
              address: (apartment as any)?.projects?.address ?? null,
              currency: (apartment as any)?.projects?.currency ?? null,
            },
            apartment: {
              id: (apartment as any)?.id ?? null,
              number: (apartment as any)?.apartment_number ?? null,
              floor_number: (apartment as any)?.floor_number ?? null,
              rooms: (apartment as any)?.rooms ?? null,
              area: (apartment as any)?.area ?? null,
              price: (apartment as any)?.price ?? null,
            },
          },
        });
      } catch (e) {
        console.warn("new lead email notification skipped/failed", e);
      }
    }

    // If all funnels already had a lead, keep old behaviour: 409
    if (createdLeads.length === 0 && (existingLeads || []).length > 0) {
      const first = (existingLeads || [])[0] as any;
      console.log('Duplicate lead found (all target funnels already have leads):', first?.id);
      return createJsonResponse(
        { error: 'Заявка с таким email на эту квартиру уже существует', existingLeadId: first?.id, existingLeadDate: first?.created_at },
        409,
        origin
      );
    }

    const results: any[] = [];
    const leadIds: string[] = [];
    let anyCrmOk = false;

    for (let i = 0; i < createdLeads.length; i++) {
      const localLead = createdLeads[i] as any;
      const t = targetByIndex[i];
      const localLeadId = String(localLead.id);
      leadIds.push(localLeadId);

      const settings = t.settings;
      const connection = t.connection;

      // Get valid access token for AmoCRM
      const accessToken = await getValidAccessToken(connection, svc);
      if (!accessToken) {
        console.error('Unable to get valid access token for lead:', localLeadId);
        await svc
          .from('leads')
          .update({ status: 'saved_only', amocrm_error: 'AmoCRM authorization failed. Please re-authorize the integration.' })
          .eq('id', localLeadId);
        results.push({ kind: 'amocrm', leadId: localLeadId, funnelId: t.funnelId, crm: { ok: false, error: 'auth_failed' } });
        continue;
      }

      // Определение ответственного пользователя
      let responsibleUserId = settings.responsible_user_id;
      if (!responsibleUserId) {
        try {
          console.log('Fetching user info from AmoCRM...');
          const userInfoResponse = await fetch(`https://${connection.subdomain}.amocrm.ru/api/v4/account`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (userInfoResponse.ok) {
            const userInfo = await userInfoResponse.json();
            responsibleUserId = userInfo.current_user_id || userInfo._embedded?.users?.[0]?.id;
            console.log('Got responsible user ID:', responsibleUserId);
          } else {
            console.error('Failed to get user info:', await userInfoResponse.text());
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
        }
      }

      if (!responsibleUserId) {
        console.error('Unable to determine responsible user ID for lead:', localLeadId);
        await svc
          .from('leads')
          .update({
            status: 'saved_only',
            amocrm_error: 'Unable to determine responsible user for the lead. Please configure responsible_user_id in AmoCRM settings.'
          })
          .eq('id', localLeadId);

        results.push({ kind: 'amocrm', leadId: localLeadId, funnelId: t.funnelId, crm: { ok: false, error: 'no_responsible_user' } });
        continue;
      }

      // Получение полей для контактов
      const { emailFieldId, phoneFieldId } = await getContactFields(connection, accessToken);
      if (!emailFieldId || !phoneFieldId) {
        console.error('Unable to get contact field IDs:', { emailFieldId, phoneFieldId });
        await svc
          .from('leads')
          .update({ status: 'saved_only', amocrm_error: 'Unable to configure contact fields in AmoCRM' })
          .eq('id', localLeadId);

        results.push({ kind: 'amocrm', leadId: localLeadId, funnelId: t.funnelId, crm: { ok: false, error: 'no_contact_fields' } });
        continue;
      }

      // Building lead payload
      const leadData: AmoCRMLead = {
        name: `Apartment inquiry ${apartment.apartment_number} - ${apartment.projects?.name || 'Project'}`,
        pipeline_id: settings.pipeline_id || 0,
        price: Number(apartment.price ?? 0),
        ...(settings.status_id && { status_id: settings.status_id }),
        responsible_user_id: responsibleUserId,
        _embedded: {
          contacts: [
            {
              name: name,
              custom_fields_values: [
                { field_id: emailFieldId, values: [{ value: email }] },
                { field_id: phoneFieldId, values: [{ value: phone }] }
              ]
            }
          ]
        }
      };

      console.log('Creating lead in AmoCRM with data:', JSON.stringify(leadData, null, 2));
      const amocrmUrl = `https://${connection.subdomain}.amocrm.ru/api/v4/leads/complex`;
      const amocrmResponse = await fetch(amocrmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify([leadData])
      });

      if (!amocrmResponse.ok) {
        const errorText = await amocrmResponse.text();
        console.error('AmoCRM API error:', { status: amocrmResponse.status, statusText: amocrmResponse.statusText, errorText });

        let errorMessage = 'Failed to create lead in AmoCRM';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.detail) errorMessage = errorData.detail;
          else if (errorData.message) errorMessage = errorData.message;
          if (errorData['validation-errors']) {
            console.error('Validation errors:', JSON.stringify(errorData['validation-errors'], null, 2));
            errorMessage += '. Validation errors: ' + JSON.stringify(errorData['validation-errors']);
          }
        } catch (e) {
          console.error('Failed to parse error response');
        }

        await svc
          .from('leads')
          .update({ status: 'saved_only', amocrm_error: errorMessage, amocrm_retries: 1 })
          .eq('id', localLeadId);

        results.push({ kind: 'amocrm', leadId: localLeadId, funnelId: t.funnelId, crm: { ok: false, error: errorMessage } });
        continue;
      }

      const amocrmResult = await amocrmResponse.json();
      const { leadId: amocrmLeadId, contactId: amocrmContactId } = extractAmoComplexLeadIds(amocrmResult);

      if (!amocrmLeadId) {
        const diagnostic = `AmoCRM lead created but id not found in response. Response keys: ${Object.keys(amocrmResult || {}).join(',') || '(non-object)'}`;
        console.error(diagnostic);
        await svc
          .from('leads')
          .update({ status: 'saved_only', amocrm_error: diagnostic, amocrm_retries: 1 })
          .eq('id', localLeadId);
        results.push({ kind: 'amocrm', leadId: localLeadId, funnelId: t.funnelId, crm: { ok: false, error: diagnostic } });
        continue;
      }

      // Update local lead with AmoCRM IDs
      await svc
        .from('leads')
        .update({
          status: 'pending',
          amocrm_lead_id: amocrmLeadId,
          amocrm_contact_id: amocrmContactId,
          amocrm_sent_at: new Date().toISOString(),
          amocrm_error: null
        })
        .eq('id', localLeadId);

      // Add a detailed note with apartment and client information
      try {
        const currentDate = new Date().toLocaleString('en-US', {
          timeZone: 'Europe/Moscow',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const noteText = `📋 APARTMENT INQUIRY | ${currentDate}

👤 CLIENT:
• Name: ${name}
• Phone: ${phone}
• Email: ${email}

🏠 APARTMENT:
• Apartment number: ${apartment.apartment_number}
• Project: ${apartment.projects?.name || 'Not specified'}
${apartment.area ? `• Area: ${apartment.area} m²` : ''}
${apartment.price ? `• Price: ${Number(apartment.price).toLocaleString('en-US')} ${apartment.projects?.currency}` : ''}
${apartment.floor ? `• Floor: ${apartment.floor}` : ''}
${apartment.rooms ? `• Rooms: ${apartment.rooms}` : ''}
${apartment.projects?.address ? `• Address: ${apartment.projects.address}` : ''}

💡 Inquiry created automatically via website`;

        const noteData = { entity_id: amocrmLeadId, note_type: "common", params: { text: noteText } };
        const noteResponse = await fetch(`https://${connection.subdomain}.amocrm.ru/api/v4/leads/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify([noteData])
        });

        if (!noteResponse.ok) console.error('Failed to create note:', await noteResponse.text());
      } catch (noteError) {
        console.error('Error adding note to lead:', noteError);
      }

      anyCrmOk = true;
      results.push({
        kind: 'amocrm',
        leadId: localLeadId,
        funnelId: t.funnelId,
        crm: { ok: true, amocrmLeadId, contactId: amocrmContactId, leadUrl: `https://${connection.subdomain}.amocrm.ru/leads/detail/${amocrmLeadId}` }
      });
    }

    return createJsonResponse(
      {
        success: true,
        leadId: leadIds[0] ?? null,
        leadIds,
        message: anyCrmOk ? 'Lead(s) successfully created and sent to AmoCRM' : 'Lead(s) successfully saved. AmoCRM sending failed for all integrations.',
        crmIntegration: anyCrmOk,
        results,
      },
      200,
      origin
    );

  } catch (error) {
    console.error('Unexpected error creating AmoCRM lead:', error);

    // Try to update lead status if we have a saved lead
    try {
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const svc = createClient(supabaseUrl, supabaseServiceKey);

      // We need to extract savedLead.id from the scope, but it might not be available
      // So we'll just log the error for now
      console.log('Unable to update lead status due to unexpected error');
    } catch (updateError) {
      console.error('Failed to update lead status after error:', updateError);
    }

    return createJsonResponse({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500, origin);
  }
});