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

async function getValidAccessToken(settings: AmoCRMSettings, supabase: any): Promise<string | null> {
  // Check if current token is still valid
  if (settings.access_token && settings.token_expires_at) {
    const expiresAt = new Date(settings.token_expires_at)
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    if (expiresAt > fiveMinutesFromNow) {
      return settings.access_token
    }
  }

  // Token expired or missing, try to refresh
  if (!settings.refresh_token) {
    console.error('No refresh token available')
    return null
  }

  try {
    const tokenUrl = `https://${settings.subdomain}.amocrm.ru/oauth2/access_token`
    const tokenData = {
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      grant_type: 'refresh_token',
      refresh_token: settings.refresh_token
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token refresh failed:', errorText)
      return null
    }

    const tokenResult: TokenResponse = await response.json()
    const expiresAt = new Date(Date.now() + (tokenResult.expires_in * 1000))

    // Update tokens in database
    await supabase
      .from('amocrm_settings')
      .update({
        access_token: tokenResult.access_token,
        refresh_token: tokenResult.refresh_token,
        token_expires_at: expiresAt.toISOString()
      })
      .eq('id', settings.id)

    return tokenResult.access_token
  } catch (error) {
    console.error('Error refreshing token:', error)
    return null
  }
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
  notes?: Array<{
    note_type: string;
    params: {
      text: string;
    };
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
    notes?: Array<{
      note_type: string;
      params: {
        text: string;
      };
    }>;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { name, email, phone, apartmentId, projectId }: LeadRequest = await req.json()

    // Validate required fields
    if (!name || !email || !phone || !apartmentId || !projectId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get AmoCRM settings for the project
    const { data: amocrmSettings, error: settingsError } = await supabase
      .from('amocrm_settings')
      .select('*')
      .eq('project_id', projectId)
      .single()

    if (settingsError || !amocrmSettings) {
      console.error('AmoCRM settings not found:', settingsError)
      return new Response(
        JSON.stringify({ error: 'AmoCRM integration not configured for this project' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get apartment and project details
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
      .single()

    if (apartmentError || !apartment) {
      console.error('Apartment not found:', apartmentError)
      return new Response(
        JSON.stringify({ error: 'Apartment not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const settings = amocrmSettings as AmoCRMSettings

    // Get valid access token (refresh if needed)
    const accessToken = await getValidAccessToken(settings, supabase)

    if (!accessToken) {
      console.error('Unable to get valid access token')
      return new Response(
        JSON.stringify({ error: 'AmoCRM authorization failed. Please re-authorize the integration.' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get current user info if responsible_user_id is not set
    let responsibleUserId = settings.responsible_user_id
    if (!responsibleUserId) {
      try {
        const userInfoResponse = await fetch(`https://${settings.subdomain}.amocrm.ru/api/v4/account`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })

        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json()
          responsibleUserId = userInfo.current_user_id || userInfo._embedded?.users?.[0]?.id
        }
      } catch (error) {
        console.error('Failed to get user info from AmoCRM:', error)
      }
    }

    // Get contact custom fields to find email and phone field IDs
    let emailFieldId = 1 // Default fallback
    let phoneFieldId = 2 // Default fallback

    try {
      const fieldsResponse = await fetch(`https://${settings.subdomain}.amocrm.ru/api/v4/contacts/custom_fields`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json()
        const fields = fieldsData._embedded?.custom_fields || []

        // Find email field
        const emailField = fields.find((field: any) =>
          field.code === 'EMAIL' ||
          field.name?.toLowerCase().includes('email') ||
          field.name?.toLowerCase().includes('почта')
        )
        if (emailField) emailFieldId = emailField.id

        // Find phone field  
        const phoneField = fields.find((field: any) =>
          field.code === 'PHONE' ||
          field.name?.toLowerCase().includes('phone') ||
          field.name?.toLowerCase().includes('телефон')
        )
        if (phoneField) phoneFieldId = phoneField.id
      }
    } catch (error) {
      console.error('Failed to get contact fields from AmoCRM:', error)
    }

    // Validate we have required fields
    if (!responsibleUserId) {
      console.error('Unable to determine responsible user ID')
      return new Response(
        JSON.stringify({ error: 'Unable to determine responsible user for the lead. Please configure responsible_user_id in AmoCRM settings.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare lead data for AmoCRM
    const leadData: AmoCRMLead = {
      name: `Заявка на квартиру ${apartment.apartment_number} - ${apartment.projects?.name}`,
      pipeline_id: settings.pipeline_id,
      status_id: settings.status_id || 142, // Default to first stage if not set
      responsible_user_id: responsibleUserId,
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
        ],
        notes: [
          {
            note_type: "common",
            params: {
              text: `Номер квартиры: ${apartment.apartment_number}`
            }
          }
        ]
      }
    }


    // Add apartment info to lead custom fields only if we have valid field mapping
    if (apartment.projects?.address && apartment.apartment_number) {
      /*   leadData.custom_fields_values = [
          // Add apartment address as a note/comment instead of custom field for now
          // Custom fields require proper field mapping from AmoCRM account
        ]
      } */

      // Send lead to AmoCRM
      const amocrmUrl = `https://${settings.subdomain}.amocrm.ru/api/v4/leads/complex`

      const amocrmResponse = await fetch(amocrmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify([leadData])
      })

      if (!amocrmResponse.ok) {
        const errorText = await amocrmResponse.text()
        console.error('AmoCRM API error:', errorText)

        // Try to parse error response
        let errorMessage = 'Failed to create lead in AmoCRM'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch (e) {
          // Use default error message
        }

        return new Response(
          JSON.stringify({ error: errorMessage }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const amocrmResult = await amocrmResponse.json()
      console.log('AmoCRM lead created:', amocrmResult)

      return new Response(
        JSON.stringify({
          success: true,
          leadId: amocrmResult[0]?.id,
          message: 'Lead successfully created in AmoCRM'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (error) {
      console.error('Error creating AmoCRM lead:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  })
