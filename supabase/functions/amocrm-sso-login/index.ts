import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createSignedToken } from '../_shared/sso-token.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({
        error: "Invalid JSON body"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    
    const { source, account_id, user_id, subdomain } = body;
    
    if (source !== "amocrm") {
      return new Response(JSON.stringify({
        error: "Unsupported source"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    
    if (!account_id || !user_id) {
      return new Response(JSON.stringify({
        error: "Missing account_id or user_id"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const amoSecret = Deno.env.get("AMOCRM_SSO_SECRET") ?? "";
    
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !amoSecret) {
      console.error("Missing Supabase env configuration");
      return new Response(JSON.stringify({
        error: "Server configuration error"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    
    const normalizedAccountId = String(account_id);
    const normalizedUserId = String(user_id);
    
    // Create service role client to query crm_connections
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Find user in crm_connections table by AmoCRM credentials
    // We need to find by subdomain and crm_type, as the account_id and user_id
    // are metadata stored in user_metadata when connection was created
    console.log('Looking up CRM connection for:', {
      subdomain,
      account_id: normalizedAccountId,
      user_id: normalizedUserId
    });
    
    const { data: connections, error: connectionsError } = await adminClient
      .from('crm_connections')
      .select('user_id, subdomain, account_name')
      .eq('crm_type', 'amocrm')
      .eq('subdomain', subdomain || '');
    
    if (connectionsError) {
      console.error('Error querying crm_connections:', connectionsError);
      return new Response(JSON.stringify({
        error: "Database error",
        details: connectionsError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    
    if (!connections || connections.length === 0) {
      console.log('No CRM connection found for subdomain:', subdomain);
      return new Response(JSON.stringify({
        error: "User not found",
        message: "No AmoCRM connection found for this account. Please connect your AmoCRM account first."
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    
    // Get the first matching connection (should be only one per subdomain and crm_type)
    const connection = connections[0];
    const gridixUserId = connection.user_id;
    
    console.log('Found CRM connection for Gridix user:', gridixUserId);
    
    // Query user_profiles to get email
    const { data: profileData, error: profileError } = await adminClient
      .from('user_profiles')
      .select('email')
      .eq('id', gridixUserId)
      .single();
    
    if (profileError || !profileData?.email) {
      console.error('Error fetching user profile:', profileError);
      return new Response(JSON.stringify({
        error: "User profile not found",
        details: profileError?.message || "No email found for user"
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    
    console.log('Found user email:', profileData.email);
    
    // For SSO, we don't need actual Supabase session tokens in the SSO token
    // The SSO token itself will be used by the widget to authenticate
    // We'll include the user_id which can be used to create a session later if needed
    
    const session = {
      user: {
        id: gridixUserId,
        email: profileData.email
      },
      expires_in: 3600 // 1 hour
    };
    
    console.log('Successfully found user:', gridixUserId);
    
    // Calculate expiration timestamp
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + session.expires_in;
    
    // Create signed payload with standard JWT claims
    const ssoPayload = {
      // Standard JWT claims
      iat: issuedAt,
      exp: expiresAt,
      sub: session.user.id,
      email: session.user.email,
      
      // Expiration
      expires_in: session.expires_in,
      
      // AmoCRM metadata
      amocrm_account_id: normalizedAccountId,
      amocrm_user_id: normalizedUserId,
      amocrm_subdomain: subdomain ?? null,
      amocrm_connection_subdomain: connection.subdomain,
      amocrm_account_name: connection.account_name
    };
    
    // Create signed token using HMAC-SHA256
    const token = await createSignedToken(ssoPayload, amoSecret);
    
    console.log('SSO token generated successfully for user:', gridixUserId);
    
    return new Response(JSON.stringify({
      token,
      expires_at: expiresAt,
      expires_in: session.expires_in,
      user_id: session.user.id,
      email: session.user.email
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Unexpected error in amocrm-sso-login", error);
    return new Response(JSON.stringify({
      error: "Unexpected server error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
