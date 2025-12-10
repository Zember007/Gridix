import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
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
    const body = await req.json().catch(()=>null);
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
    // Synthetic, non-login email used only for SSO-based accounts
    const email = `${normalizedUserId}.${normalizedAccountId}@amocrm.gridix.internal`;
    // Deterministic, secret-based password so that the Edge Function can
    // re-authenticate the user later, without ever exposing this value.
    const password = `${amoSecret}:${normalizedAccountId}:${normalizedUserId}`;
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    // Ensure a Supabase Auth user exists for this AmoCRM identity
    const { data: existingUserData, error: getUserError } = await adminClient.auth.admin.getUserByEmail(email);
    if (getUserError && !getUserError.message?.includes("User not found")) {
      console.error("Error fetching user by email", getUserError);
      return new Response(JSON.stringify({
        error: "Internal error (get user)"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    if (!existingUserData?.user) {
      const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          source: "amocrm",
          amocrm_account_id: normalizedAccountId,
          amocrm_user_id: normalizedUserId,
          amocrm_subdomain: subdomain ?? null
        }
      });
      if (createError || !createdUser?.user) {
        console.error("Error creating AmoCRM SSO user", createError);
        return new Response(JSON.stringify({
          error: "Internal error (create user)"
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    }
    // Sign in as this user to obtain a Supabase session
    const publicClient = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const { data: signInData, error: signInError } = await publicClient.auth.signInWithPassword({
      email,
      password
    });
    if (signInError || !signInData?.session) {
      console.error("Error signing in AmoCRM SSO user", signInError);
      return new Response(JSON.stringify({
        error: "Internal error (sign in)"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const session = signInData.session;
    const ssoPayload = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      token_type: session.token_type
    };
    const token = btoa(JSON.stringify(ssoPayload));
    return new Response(JSON.stringify({
      token
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
