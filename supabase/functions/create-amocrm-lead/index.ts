import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Получение настроек AmoCRM
    console.log('Fetching AmoCRM settings for project:', projectId);
    const { data: amocrmSettings, error: settingsError } = await supabase
      .from('amocrm_settings')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (settingsError || !amocrmSettings) {
      console.error('AmoCRM settings not found:', { projectId, settingsError });
      return new Response(
        JSON.stringify({ error: 'AmoCRM integration not configured for this project' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Получение данных о квартире
    console.log('Fetching apartment data for:', apartmentId);
    const { data: apartment, error: apartmentError } = await supabase
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

    const settings = amocrmSettings as AmoCRMSettings;

    // Получение действующего токена доступа
    const accessToken = await getValidAccessToken(settings, supabase);
    if (!accessToken) {
      console.error('Unable to get valid access token');
      return new Response(
        JSON.stringify({ error: 'AmoCRM authorization failed. Please re-authorize the integration.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      return new Response(
        JSON.stringify({ error: 'Unable to determine responsible user for the lead. Please configure responsible_user_id in AmoCRM settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Получение полей для контактов
    const { emailFieldId, phoneFieldId } = await getContactFields(settings, accessToken);

    if (!emailFieldId || !phoneFieldId) {
      console.error('Unable to get contact field IDs:', { emailFieldId, phoneFieldId });
      return new Response(
        JSON.stringify({ error: 'Unable to configure contact fields in AmoCRM' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amocrmResult = await amocrmResponse.json();
    console.log('AmoCRM lead created successfully:', amocrmResult);

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
        leadId: amocrmResult[0]?.id,
        contactId: amocrmResult[0]?._embedded?.contacts?.[0]?.id,
        message: 'Lead successfully created in AmoCRM',
        leadUrl: `https://${settings.subdomain}.amocrm.ru/leads/detail/${amocrmResult[0]?.id}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error creating AmoCRM lead:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});