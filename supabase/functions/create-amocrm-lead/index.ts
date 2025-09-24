import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function parseAllowedOrigins(): string[] {
  const siteUrl = (Deno.env.get('SITE_URL') || '').trim()
  const extra = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean)
  const defaults = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://localhost:8080',
    'https://127.0.0.1:8080',
  ]
  const all = [...new Set([...(siteUrl ? [siteUrl] : []), ...extra, ...defaults])]
  return all
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true // allow same-origin/no CORS requests
  const allowed = parseAllowedOrigins()
  return allowed.includes(origin)
}

function getAllowedCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

interface LeadRequest {
  name: string;
  email: string;
  phone: string;
  apartmentId: string;
  projectId: string;
}

interface AmoCRMSettings {
  id: string;
  client_id: string;
  client_secret: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  subdomain: string;
  pipeline_id: number;
  status_id?: number;
  responsible_user_id?: number;
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

async function getValidAccessToken(settings: AmoCRMSettings, supabase: any): Promise<string | null> {
  // Проверяем актуальность токена
  if (settings.access_token && settings.token_expires_at) {
    const expiresAt = new Date(settings.token_expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (expiresAt > fiveMinutesFromNow) {
      return settings.access_token;
    }
  }

  // Обновляем токен
  if (!settings.refresh_token) {
    console.error('No refresh token available');
    return null;
  }

  try {
    const tokenUrl = `https://${settings.subdomain}.amocrm.ru/oauth2/access_token`;
    const tokenData = {
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      grant_type: 'refresh_token',
      refresh_token: settings.refresh_token,
      redirect_uri: 'https://yourdomain.com' // Добавьте ваш redirect_uri
    };

    console.log('Refreshing token for subdomain:', settings.subdomain);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', { 
        status: response.status, 
        statusText: response.statusText,
        errorText 
      });
      return null;
    }

    const tokenResult: TokenResponse = await response.json();
    const expiresAt = new Date(Date.now() + (tokenResult.expires_in * 1000));

    // Обновляем токен в базе
    const { error: updateError } = await supabase
      .from('amocrm_settings')
      .update({
        access_token: tokenResult.access_token,
        refresh_token: tokenResult.refresh_token,
        token_expires_at: expiresAt.toISOString()
      })
      .eq('id', settings.id);

    if (updateError) {
      console.error('Failed to update token in database:', updateError);
    }

    return tokenResult.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

async function getContactFields(settings: AmoCRMSettings, accessToken: string) {
  let emailFieldId = 0;
  let phoneFieldId = 0;

  try {
    console.log('Fetching contact fields from AmoCRM API...');
    const fieldsResponse = await fetch(`https://${settings.subdomain}.amocrm.ru/api/v4/contacts/custom_fields`, {
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
  const corsHeaders = getAllowedCorsHeaders(origin)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (!isOriginAllowed(origin)) {
      return new Response(JSON.stringify({ error: 'origin_not_allowed' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const requestBody = await req.json();
    console.log('Received request:', requestBody);

    const { name, email, phone, apartmentId, projectId }: LeadRequest = requestBody;

    // Валидация обязательных полей
    if (!name || !email || !phone || !apartmentId || !projectId) {
      console.error('Missing required fields:', { name: !!name, email: !!email, phone: !!phone, apartmentId: !!apartmentId, projectId: !!projectId });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['name', 'email', 'phone', 'apartmentId', 'projectId']
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Инициализация Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
          address
        )
      `)
      .eq('id', apartmentId)
      .single();

    if (apartmentError || !apartment) {
      console.error('Apartment not found:', { apartmentId, apartmentError });
      return new Response(
        JSON.stringify({ error: 'Apartment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ 
          error: 'Заявка с таким email на эту квартиру уже существует',
          existingLeadId: existingLead.id,
          existingLeadDate: existingLead.created_at
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First, save the lead to our database
    console.log('Saving lead to database...');
    const { data: savedLead, error: leadSaveError } = await svc
      .from('leads')
      .insert({
        name,
        email,
        phone,
        project_id: projectId,
        apartment_id: apartmentId,
        status: 'pending',
        source: 'website'
      })
      .select()
      .single();

    if (leadSaveError || !savedLead) {
      console.error('Failed to save lead to database:', leadSaveError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save lead. Please try again.',
          details: leadSaveError?.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Lead saved to database with ID:', savedLead.id);

    // Получение настроек AmoCRM (после сохранения лида)
    console.log('Fetching AmoCRM settings for project:', projectId);
    const { data: amocrmSettings, error: settingsError } = await userClient
      .from('amocrm_settings')
      .select('*')
      .eq('project_id', projectId)
      .single();

    // If no AmoCRM settings found, just mark lead as saved_only and return success
    if (settingsError || !amocrmSettings) {
      console.log('AmoCRM settings not found for project:', projectId, 'Lead saved to DB only');

      await svc
        .from('leads')
        .update({ status: 'saved_only', amocrm_error: 'AmoCRM not configured for this project' })
        .eq('id', savedLead.id);

      return new Response(
        JSON.stringify({
          success: true,
          leadId: savedLead.id,
          message: 'Lead successfully saved. AmoCRM integration not configured for this project.',
          crmIntegration: false
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const settings = amocrmSettings as AmoCRMSettings;

    // Get valid access token for AmoCRM
    const accessToken = await getValidAccessToken(settings, svc);
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
      return new Response(
        JSON.stringify({ 
          success: true,
          leadId: savedLead.id,
          message: 'Lead successfully saved. AmoCRM authorization failed - please re-authorize the integration.',
          crmIntegration: false
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Определение ответственного пользователя
    let responsibleUserId = settings.responsible_user_id;
    if (!responsibleUserId) {
      try {
        console.log('Fetching user info from AmoCRM...');
        const userInfoResponse = await fetch(`https://${settings.subdomain}.amocrm.ru/api/v4/account`, {
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
      return new Response(
        JSON.stringify({ 
          success: true,
          leadId: savedLead.id,
          message: 'Lead successfully saved. Unable to determine responsible user for AmoCRM - please configure responsible_user_id.',
          crmIntegration: false
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Получение полей для контактов
    const { emailFieldId, phoneFieldId } = await getContactFields(settings, accessToken);

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
      return new Response(
        JSON.stringify({ 
          success: true,
          leadId: savedLead.id,
          message: 'Lead successfully saved. Unable to configure contact fields in AmoCRM.',
          crmIntegration: false
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Building lead payload (simple structure without custom lead fields)
    const leadData: AmoCRMLead = {
      name: `Apartment inquiry ${apartment.apartment_number} - ${apartment.projects?.name || 'Project'}`,
      pipeline_id: settings.pipeline_id,
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
    const amocrmUrl = `https://${settings.subdomain}.amocrm.ru/api/v4/leads/complex`;
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
      return new Response(
        JSON.stringify({ 
          success: true,
          leadId: savedLead.id,
          message: 'Lead successfully saved. Failed to send to AmoCRM - you can copy the details and add manually.',
          crmIntegration: false,
          crmError: errorMessage
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      const currentDate = new Date().toLocaleString('ru-RU', { 
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
${apartment.price ? `• Price: ${Number(apartment.price).toLocaleString('ru-RU')} RUB` : ''}
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
        const noteResponse = await fetch(`https://${settings.subdomain}.amocrm.ru/api/v4/leads/notes`, {
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
    return new Response(
      JSON.stringify({
        success: true,
        leadId: savedLead.id, // Our internal lead ID
        amocrmLeadId: amocrmResult[0]?.id, // AmoCRM lead ID
        contactId: amocrmResult[0]?._embedded?.contacts?.[0]?.id,
        message: 'Lead successfully created and sent to AmoCRM',
        crmIntegration: true,
        leadUrl: `https://${settings.subdomain}.amocrm.ru/leads/detail/${amocrmResult[0]?.id}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});