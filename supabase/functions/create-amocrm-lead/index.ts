import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, createCorsResponse, createJsonResponse } from '../_shared/cors.ts'

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
          currency
        )
      `)
      .eq('id', apartmentId)
      .single();

    if (apartmentError || !apartment) {
      console.error('Apartment not found:', { apartmentId, apartmentError });
      return createJsonResponse({ error: 'Apartment not found' }, 404, origin);
    }

    // Получение настроек AmoCRM ПЕРЕНЕСЕНО ниже после сохранения лида

    // Check for duplicate leads (same email + apartment)
    console.log('Checking for duplicate leads...');
    const { data: existingLead, error: duplicateCheckError } = await svc
      .from('leads')
      .select('id, name, email, created_at')
      .eq('email', email)
      .eq('apartment_id', apartmentId)
      .single();

    if (existingLead && !duplicateCheckError) {
      console.log('Duplicate lead found:', existingLead.id);
      return createJsonResponse({
        error: 'Заявка с таким email на эту квартиру уже существует',
        existingLeadId: existingLead.id,
        existingLeadDate: existingLead.created_at
      }, 409, origin);
    }

    // First, save the lead to our database
    // The trigger set_default_pipeline_stage_for_new_lead will automatically:
    // 1. Find CRM funnel for this project (if AmoCRM is configured)
    // 2. Or use default funnel for the project owner
    // 3. Set pipeline_stage_id to the first stage (by order_index)
    console.log('Saving lead to database...');
    const { data: savedLead, error: leadSaveError } = await svc
      .from('leads')
      .insert({
        name,
        email,
        phone,
        project_id: projectId,
        apartment_id: apartmentId,
        status: 'pending', // Technical status for CRM integration
        source: 'website'
        // pipeline_stage_id will be set automatically by trigger
      })
      .select()
      .single();

    if (leadSaveError || !savedLead) {
      console.error('Failed to save lead to database:', leadSaveError);
      return createJsonResponse({
        error: 'Failed to save lead. Please try again.',
        details: leadSaveError?.message
      }, 500, origin);
    }

    console.log('Lead saved to database with ID:', savedLead.id, 'pipeline_stage_id:', savedLead.pipeline_stage_id);

    // Получение настроек AmoCRM (после сохранения лида)
    // If project has AmoCRM configured, we also send the lead to AmoCRM
    // The local funnel stage is already set by trigger (either from CRM funnel or default funnel)
    console.log('Fetching CRM settings for project:', projectId);
    const { data: projectCRMSettings, error: settingsError } = await svc
      .from('project_crm_settings')
      .select('*, crm_connections(*)')
      .eq('project_id', projectId)
      .maybeSingle();

    if (settingsError) console.error('Error fetching CRM settings:', settingsError);
    
    // If no CRM settings found, the lead is already saved with pipeline_stage_id from default funnel
    // Just mark as saved_only and return success
    if (settingsError || !projectCRMSettings) {
      console.log('CRM settings not found for project:', projectId, 'Lead saved with default funnel stage');

      await svc
        .from('leads')
        .update({ status: 'saved_only', amocrm_error: 'AmoCRM not configured for this project' })
        .eq('id', savedLead.id);

      return createJsonResponse({
        success: true,
        leadId: savedLead.id,
        message: 'Lead successfully saved to local funnel.',
        crmIntegration: false
      }, 200, origin);
    }

    const settings = projectCRMSettings as ProjectCRMSettings;
    const connection = settings.crm_connections as unknown as CRMConnection;
    
    if (!connection || connection.crm_type !== 'amocrm') {
      console.log('AmoCRM connection not found for project:', projectId);
      await svc
        .from('leads')
        .update({ status: 'saved_only', amocrm_error: 'AmoCRM not configured for this project' })
        .eq('id', savedLead.id);

      return createJsonResponse({
        success: true,
        leadId: savedLead.id,
        message: 'Lead successfully saved. AmoCRM integration not configured for this project.',
        crmIntegration: false
      }, 200, origin);
    }

    // Get valid access token for AmoCRM
    const accessToken = await getValidAccessToken(connection, svc);
    if (!accessToken) {
      console.error('Unable to get valid access token');
      // Update lead status to saved_only (not failed, since DB save was successful)
      await svc
        .from('leads')
        .update({
          status: 'saved_only',
          amocrm_error: 'AmoCRM authorization failed. Please re-authorize the integration.'
        })
        .eq('id', savedLead.id);

      // Return success since lead was saved to DB
      return createJsonResponse({
        success: true,
        leadId: savedLead.id,
        message: 'Lead successfully saved. AmoCRM authorization failed - please re-authorize the integration.',
        crmIntegration: false
      }, 200, origin);
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
      console.error('Unable to determine responsible user ID');
      // Update lead status to saved_only (not failed, since DB save was successful)
      await svc
        .from('leads')
        .update({
          status: 'saved_only',
          amocrm_error: 'Unable to determine responsible user for the lead. Please configure responsible_user_id in AmoCRM settings.'
        })
        .eq('id', savedLead.id);

      // Return success since lead was saved to DB
      return createJsonResponse({
        success: true,
        leadId: savedLead.id,
        message: 'Lead successfully saved. Unable to determine responsible user for AmoCRM - please configure responsible_user_id.',
        crmIntegration: false
      }, 200, origin);
    }

    // Получение полей для контактов
    const { emailFieldId, phoneFieldId } = await getContactFields(connection, accessToken);

    if (!emailFieldId || !phoneFieldId) {
      console.error('Unable to get contact field IDs:', { emailFieldId, phoneFieldId });
      // Update lead status to saved_only (not failed, since DB save was successful)
      await svc
        .from('leads')
        .update({
          status: 'saved_only',
          amocrm_error: 'Unable to configure contact fields in AmoCRM'
        })
        .eq('id', savedLead.id);

      // Return success since lead was saved to DB
      return createJsonResponse({
        success: true,
        leadId: savedLead.id,
        message: 'Lead successfully saved. Unable to configure contact fields in AmoCRM.',
        crmIntegration: false
      }, 200, origin);
    }

    // Building lead payload (simple structure without custom lead fields)
    const leadData: AmoCRMLead = {
      name: `Apartment inquiry ${apartment.apartment_number} - ${apartment.projects?.name || 'Project'}`,
      pipeline_id: settings.pipeline_id || 0,
      ...(settings.status_id && { status_id: settings.status_id }),
      responsible_user_id: responsibleUserId,
      _embedded: {
        contacts: [
          {
            name: name,
            custom_fields_values: [
              {
                field_id: emailFieldId,
                values: [{ value: email }]
              },
              {
                field_id: phoneFieldId,
                values: [{ value: phone }]
              }
            ]
          }
        ]
      }
    };

    console.log('Creating lead in AmoCRM with data:', JSON.stringify(leadData, null, 2));

    // Отправка лида в AmoCRM
    const amocrmUrl = `https://${connection.subdomain}.amocrm.ru/api/v4/leads/complex`;
    const amocrmResponse = await fetch(amocrmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify([leadData])
    });

    if (!amocrmResponse.ok) {
      const errorText = await amocrmResponse.text();
      console.error('AmoCRM API error:', {
        status: amocrmResponse.status,
        statusText: amocrmResponse.statusText,
        errorText
      });

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

      // Update lead status to saved_only with error details (not failed, since DB save was successful)
      await svc
        .from('leads')
        .update({
          status: 'saved_only',
          amocrm_error: errorMessage,
          amocrm_retries: 1
        })
        .eq('id', savedLead.id);

      // Return success since lead was saved to DB
      return createJsonResponse({
        success: true,
        leadId: savedLead.id,
        message: 'Lead successfully saved. Failed to send to AmoCRM - you can copy the details and add manually.',
        crmIntegration: false,
        crmError: errorMessage
      }, 200, origin);
    }

    const amocrmResult = await amocrmResponse.json();
    console.log('AmoCRM lead created successfully:', amocrmResult);

    // Update lead status in database with AmoCRM IDs
    if (amocrmResult[0]?.id) {
      const amocrmLeadId = amocrmResult[0].id;
      const amocrmContactId = amocrmResult[0]._embedded?.contacts?.[0]?.id;

      await svc
        .from('leads')
        .update({
          status: 'sent_to_crm',
          amocrm_lead_id: amocrmLeadId,
          amocrm_contact_id: amocrmContactId,
          amocrm_sent_at: new Date().toISOString(),
          amocrm_error: null
        })
        .eq('id', savedLead.id);

      console.log('Lead status updated in database');
    }

    // Add a detailed note with apartment and client information
    if (amocrmResult[0]?.id) {
      const leadId = amocrmResult[0].id;

      // Create a detailed note with all the information
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

      const noteData = {
        entity_id: leadId,
        note_type: "common",
        params: {
          text: noteText
        }
      };

      try {
        const noteResponse = await fetch(`https://${connection.subdomain}.amocrm.ru/api/v4/leads/notes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify([noteData])
        });

        if (!noteResponse.ok) {
          console.error('Failed to create note:', await noteResponse.text());
        } else {
          console.log('Note added successfully to lead');
        }
      } catch (noteError) {
        console.error('Error adding note to lead:', noteError);
      }
    }

    // Возврат успешного результата
    return createJsonResponse({
      success: true,
      leadId: savedLead.id, // Our internal lead ID
      amocrmLeadId: amocrmResult[0]?.id, // AmoCRM lead ID
      contactId: amocrmResult[0]?._embedded?.contacts?.[0]?.id,
      message: 'Lead successfully created and sent to AmoCRM',
      crmIntegration: true,
      leadUrl: `https://${connection.subdomain}.amocrm.ru/leads/detail/${amocrmResult[0]?.id}`
    }, 200, origin);

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