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
  custom_fields_values?: Array<{
    field_id: number;
    values: Array<{
      value: string;
      enum_id?: number;
    }>;
  }>;
  _embedded?: {
    contacts?: Array<{
      name: string;
      custom_fields_values?: Array<{
        field_id: number;
        values: Array<{
          value: string;
          enum_id?: number;
        }>;
      }>;
    }>;
  };
}

async function getValidAccessToken(settings: AmoCRMSettings, supabase: any): Promise<string | null> {
  if (settings.access_token && settings.token_expires_at) {
    const expiresAt = new Date(settings.token_expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    if (expiresAt > fiveMinutesFromNow) {
      return settings.access_token;
    }
  }

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
      refresh_token: settings.refresh_token
    };

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', { status: response.status, errorText });
      return null;
    }

    const tokenResult: TokenResponse = await response.json();
    const expiresAt = new Date(Date.now() + (tokenResult.expires_in * 1000));

    await supabase
      .from('amocrm_settings')
      .update({
        access_token: tokenResult.access_token,
        refresh_token: tokenResult.refresh_token,
        token_expires_at: expiresAt.toISOString()
      })
      .eq('id', settings.id);

    return tokenResult.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, apartmentId, projectId }: LeadRequest = await req.json();

    if (!name || !email || !phone || !apartmentId || !projectId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const { data: apartment, error: apartmentError } = await supabase
      .from('apartments')
      .select(`
        *,
        projects (
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

    const accessToken = await getValidAccessToken(settings, supabase);
    if (!accessToken) {
      console.error('Unable to get valid access token');
      return new Response(
        JSON.stringify({ error: 'AmoCRM authorization failed. Please re-authorize the integration.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let responsibleUserId = settings.responsible_user_id;
    if (!responsibleUserId) {
      try {
        const userInfoResponse = await fetch(`https://${settings.subdomain}.amocrm.ru/api/v4/account`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json();
          responsibleUserId = userInfo.current_user_id || userInfo._embedded?.users?.[0]?.id;
        }
      } catch (error) {
        console.error('Failed to get user info from AmoCRM:', error);
      }
    }

    let emailFieldId = 0; // Будем получать из API, если не найдено
    let phoneFieldId = 0;

    const { data: contactFields, error: fieldsError } = await supabase
      .from('amocrm_custom_fields')
      .select('*')
      .eq('project_id', projectId)
      .eq('entity_type', 'contacts');

    if (fieldsError) {
      console.error('Failed to get contact fields from database:', fieldsError);
    } else if (contactFields && contactFields.length > 0) {
      const emailField = contactFields.find((field: any) =>
        field.field_code === 'EMAIL' ||
        field.field_name?.toLowerCase().includes('email') ||
        field.field_name?.toLowerCase().includes('почта')
      );
      if (emailField) emailFieldId = emailField.field_id;

      const phoneField = contactFields.find((field: any) =>
        field.field_code === 'PHONE' ||
        field.field_name?.toLowerCase().includes('phone') ||
        field.field_name?.toLowerCase().includes('телефон')
      );
      if (phoneField) phoneFieldId = phoneField.field_id;
    }

    // Если поля не найдены, получите их из API
    if (!emailFieldId || !phoneFieldId) {
      const fieldsResponse = await fetch(`https://${settings.subdomain}.amocrm.ru/api/v4/contacts/custom_fields`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        const emailFieldData = fieldsData._embedded.custom_fields.find((f: any) => f.code === 'EMAIL');
        const phoneFieldData = fieldsData._embedded.custom_fields.find((f: any) => f.code === 'PHONE');
        if (emailFieldData) emailFieldId = emailFieldData.id;
        if (phoneFieldData) phoneFieldId = phoneFieldData.id;

        await supabase.from('amocrm_custom_fields').upsert([
          { project_id: projectId, entity_type: 'contacts', field_id: emailFieldId, field_code: 'EMAIL', field_name: 'Email' },
          { project_id: projectId, entity_type: 'contacts', field_id: phoneFieldId, field_code: 'PHONE', field_name: 'Phone' }
        ]);
      }
    }

    if (!responsibleUserId) {
      console.error('Unable to determine responsible user ID');
      return new Response(
        JSON.stringify({ error: 'Unable to determine responsible user for the lead. Please configure responsible_user_id in AmoCRM settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: leadFields } = await supabase
      .from('amocrm_custom_fields')
      .select('*')
      .eq('project_id', projectId)
      .eq('entity_type', 'leads');

    const leadCustomFields: Array<{
      field_id: number;
      values: Array<{ value: string; enum_id?: number }>;
    }> = [];

    if (leadFields && leadFields.length > 0) {
      const apartmentNumberField = leadFields.find((field: any) =>
        field.field_name?.toLowerCase().includes('квартир') ||
        field.field_name?.toLowerCase().includes('apartment') ||
        field.field_code === 'APARTMENT_NUMBER'
      );
      const projectField = leadFields.find((field: any) =>
        field.field_name?.toLowerCase().includes('проект') ||
        field.field_name?.toLowerCase().includes('project') ||
        field.field_code === 'PROJECT_NAME'
      );
      const areaField = leadFields.find((field: any) =>
        field.field_name?.toLowerCase().includes('площад') ||
        field.field_name?.toLowerCase().includes('area') ||
        field.field_code === 'AREA'
      );
      const priceField = leadFields.find((field: any) =>
        field.field_name?.toLowerCase().includes('цена') ||
        field.field_name?.toLowerCase().includes('price') ||
        field.field_code === 'PRICE'
      );

      if (apartmentNumberField && apartment.apartment_number) {
        leadCustomFields.push({
          field_id: apartmentNumberField.field_id,
          values: [{ value: apartment.apartment_number }]
        });
      }
      if (projectField && apartment.projects?.name) {
        leadCustomFields.push({
          field_id: projectField.field_id,
          values: [{ value: apartment.projects.name }]
        });
      }
      if (areaField && apartment.area) {
        leadCustomFields.push({
          field_id: areaField.field_id,
          values: [{ value: apartment.area.toString() }]
        });
      }
      if (priceField && apartment.price) {
        leadCustomFields.push({
          field_id: priceField.field_id,
          values: [{ value: apartment.price.toString() }]
        });
      }
    }

    const leadData: AmoCRMLead = {
      name: `Заявка на квартиру ${apartment.apartment_number} - ${apartment.projects?.name}`,
      pipeline_id: settings.pipeline_id,
      ...(settings.status_id && { status_id: settings.status_id }),
      responsible_user_id: responsibleUserId,
      ...(leadCustomFields.length > 0 && { custom_fields_values: leadCustomFields }),
      _embedded: {
        contacts: [
          {
            name,
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

    const amocrmUrl = `https://${settings.subdomain}.amocrm.ru/api/v4/leads/complex`;
    console.log('Sending lead to AmoCRM:', JSON.stringify(leadData, null, 2));

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
      console.error('AmoCRM API error:', { status: amocrmResponse.status, errorText });
      let errorMessage = 'Failed to create lead in AmoCRM';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorData.message || errorMessage;
        if (errorData['validation-errors']) {
          console.error('Validation errors:', errorData['validation-errors']);
        }
      } catch (e) {
        // Используем стандартное сообщение
      }
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amocrmResult = await amocrmResponse.json();
    console.log('AmoCRM lead created:', amocrmResult);

    // Добавление заметки
    if (amocrmResult[0]?.id) {
      const leadId = amocrmResult[0].id;
      const noteData = {
        entity_id: leadId,
        note_type: "common",
        params: {
          text: `Номер квартиры: ${apartment.apartment_number}${apartment.area ? `\nПлощадь: ${apartment.area} м²` : ''}${apartment.price ? `\nЦена: ${apartment.price}` : ''}${apartment.projects?.address ? `\nАдрес: ${apartment.projects.address}` : ''}`
        }
      };

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
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        leadId: amocrmResult[0]?.id,
        message: 'Lead successfully created in AmoCRM'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating AmoCRM lead:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});