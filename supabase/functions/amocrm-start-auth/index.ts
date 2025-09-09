import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fixed AmoCRM OAuth2 credentials - you would set these in production
const AMOCRM_CLIENT_ID = Deno.env.get('AMOCRM_CLIENT_ID') || 'your-client-id';
const AMOCRM_CLIENT_SECRET = Deno.env.get('AMOCRM_CLIENT_SECRET') || 'your-client-secret';

serve(async (req) => {
  // Handle CORS preflight requests
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

    const { project_id } = await req.json();

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

    // Create or update AmoCRM settings record
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/amocrm-oauth-callback`;
    
    const { error: upsertError } = await supabase
      .from('amocrm_settings')
      .upsert({
        project_id: project_id,
        // subdomain/base_domain will be determined after authorization
        client_id: AMOCRM_CLIENT_ID,
        client_secret: AMOCRM_CLIENT_SECRET,
        pipeline_id: 0, // Will be set automatically after auth
        redirect_uri: redirectUri
      }, {
        onConflict: 'project_id'
      });

    if (upsertError) {
      console.error('Failed to save settings:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save settings' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate authorization URL using universal AmoCRM authorize endpoint
    const authUrl = `https://www.amocrm.ru/oauth2/authorize?` +
      `client_id=${encodeURIComponent(AMOCRM_CLIENT_ID)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `state=${encodeURIComponent(project_id)}`;

    return new Response(
      JSON.stringify({ auth_url: authUrl }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('AmoCRM start auth error:', error);
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
