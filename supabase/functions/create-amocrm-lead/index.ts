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

    // Prepare lead data for AmoCRM
    const leadData: AmoCRMLead = {
      name: `Заявка на квартиру ${apartment.apartment_number} - ${apartment.projects?.name}`,
      pipeline_id: settings.pipeline_id,
      status_id: settings.status_id,
      responsible_user_id: settings.responsible_user_id,
      custom_fields_values: [
        {
          field_id: 0, // Will be replaced with actual field IDs based on AmoCRM setup
          values: [{ value: `${apartment.projects?.address}, кв. ${apartment.apartment_number}` }]
        }
      ],
      _embedded: {
        contacts: [
          {
            name: name,
            custom_fields_values: [
              {
                field_id: 0, // Email field ID (typically 1)
                values: [{ value: email }]
              },
              {
                field_id: 0, // Phone field ID (typically 2)
                values: [{ value: phone }]
              }
            ]
          }
        ]
      }
    }

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
