import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { verifyAndDecodeToken } from '../_shared/sso-token.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
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
    if (!body || !body.token) {
      return new Response(JSON.stringify({
        error: "Missing token"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    const amoSecret = Deno.env.get("AMOCRM_SSO_SECRET") ?? "";
    if (!amoSecret) {
      console.error("Missing AMOCRM_SSO_SECRET configuration");
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

    // Verify and decode the token
    const payload = await verifyAndDecodeToken(body.token, amoSecret);
    
    if (!payload) {
      return new Response(JSON.stringify({
        valid: false,
        error: "Invalid or expired token"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Token is valid
    return new Response(JSON.stringify({
      valid: true,
      payload: {
        user_id: payload.sub,
        amocrm_account_id: payload.amocrm_account_id,
        amocrm_user_id: payload.amocrm_user_id,
        amocrm_subdomain: payload.amocrm_subdomain,
        expires_at: payload.exp,
        issued_at: payload.iat
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    console.error("Unexpected error in amocrm-sso-verify", error);
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
