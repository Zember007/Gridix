import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AmoCRMSettings {
  id?: string;
  project_id: string;
  subdomain: string;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { project_id, action } = await req.json();

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: 'project_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get AmoCRM settings for the project
    const { data: settings, error: settingsError } = await supabase
      .from('amocrm_settings')
      .select('*')
      .eq('project_id', project_id)
      .single();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: 'AmoCRM settings not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!settings.access_token || !settings.subdomain) {
      return new Response(
        JSON.stringify({ error: 'AmoCRM not authorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if token is expired
    const tokenExpired = settings.token_expires_at ? new Date(settings.token_expires_at) < new Date() : false;
    if (tokenExpired) {
      return new Response(
        JSON.stringify({ error: 'AmoCRM token expired' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle different actions
    switch (action) {
      case 'fetch_data':
        return await fetchAmoCRMData(settings);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

  } catch (error) {
    console.error('AmoCRM API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function fetchAmoCRMData(settings: AmoCRMSettings): Promise<Response> {
  try {
    const baseUrl = `https://${settings.subdomain}.amocrm.ru/api/v4`;
    const headers = {
      'Authorization': `Bearer ${settings.access_token}`,
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

    return new Response(
      JSON.stringify({ data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching AmoCRM data:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch AmoCRM data',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
