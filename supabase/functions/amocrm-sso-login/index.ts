import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { createCorsResponse, createJsonResponse } from "../_shared/cors.ts";
import { createSignedToken, verifyAndDecodeToken } from "../_shared/sso-token.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return createCorsResponse(origin);
  }

  if (req.method !== "POST") {
    return createJsonResponse(
      { error: "Method not allowed" },
      405,
      origin
    );
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return createJsonResponse(
        { error: "Invalid JSON body" },
        400,
        origin
      );
    }

    const { action, ...actionParams } = body;

    if (!action) {
      return createJsonResponse(
        { error: "Missing action parameter" },
        400,
        origin
      );
    }

    // Route to appropriate handler based on action
    switch (action) {
      case "amocrm":
        return await handleAmoCrmSSO(actionParams, origin);
      case "verify":
        return await handleVerifyToken(actionParams, origin);
      // Add more actions here in the future
      // case "bitrix24":
      //   return await handleBitrix24SSO(actionParams, origin);
      default:
        return createJsonResponse(
          { error: `Unsupported action: ${action}` },
          400,
          origin
        );
    }
  } catch (error) {
    console.error("Unexpected error in sso-login", error);
    return createJsonResponse(
      { error: "Unexpected server error" },
      500,
      origin
    );
  }
});

/**
 * Handle AmoCRM SSO login
 */
async function handleAmoCrmSSO(params: any, origin: string | null): Promise<Response> {
  const { account_id, user_id, subdomain } = params;

  if (!account_id || !user_id) {
    return createJsonResponse(
      { error: "Missing account_id or user_id" },
      400,
      origin
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const jwtSecret = Deno.env.get("JWT_SECRET") ?? "";

  if (!supabaseUrl || !serviceRoleKey || !jwtSecret) {
    console.error("Missing Supabase env configuration");
    return createJsonResponse(
      { error: "Server configuration error" },
      500,
      origin
    );
  }

  const normalizedAccountId = String(account_id);
  const normalizedUserId = String(user_id);

  // Create service role client to query crm_connections
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Find user in crm_connections table by AmoCRM credentials
  console.log("Looking up CRM connection for:", {
    subdomain,
    account_id: normalizedAccountId,
    user_id: normalizedUserId,
  });

  const { data: connections, error: connectionsError } = await adminClient
    .from("crm_connections")
    .select("user_id, subdomain, account_name")
    .eq("crm_type", "amocrm")
    .eq("subdomain", subdomain || "");

  if (connectionsError) {
    console.error("Error querying crm_connections:", connectionsError);
    return createJsonResponse(
      {
        error: "Database error",
        details: connectionsError.message,
      },
      500,
      origin
    );
  }

  if (!connections || connections.length === 0) {
    console.log("No CRM connection found for subdomain:", subdomain);
    return createJsonResponse(
      {
        error: "User not found",
        message:
          "No AmoCRM connection found for this account. Please connect your AmoCRM account first.",
      },
      404,
      origin
    );
  }

  // Get the first matching connection
  const connection = connections[0];
  const gridixUserId = connection.user_id;

  console.log("Found CRM connection for Gridix user:", gridixUserId);


  // Query user_profiles to get email
  const { data: profileData, error: profileError } = await adminClient
    .from("user_profiles")
    .select("email")
    .eq("id", gridixUserId)
    .single();

  if (profileError || !profileData?.email) {
    console.error("Error fetching user profile:", profileError);
    return createJsonResponse(
      {
        error: "User profile not found",
        details: profileError?.message || "No email found for user",
      },
      404,
      origin
    );
  }

  console.log("Found user email:", profileData.email);


  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: profileData.email,
    options: {
      // Для SSO: не используем redirectTo, чтобы не ломать flow
      redirectTo: `${Deno.env.get('SUPABASE_URL')}/auth/v1/callback`, // Фиктивный, игнорируется
    },
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    throw new Error('Ошибка генерации magiclink')
  }

  // Шаг 3: "Верифицируем" OTP на сервере (создаёт сессию без email)
  // Важно: используй ОДИН И ТОТ ЖЕ клиент (не admin здесь!)
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!, // Anon key для verifyOtp
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { data: otpData, error: otpError } = await supabaseClient.auth.verifyOtp({
    type: 'magiclink',
    token_hash: linkData.properties.hashed_token,
  })

  if (otpError || !otpData?.session) {
    throw otpError || new Error('Ошибка верификации OTP — сессия не создана')
  }

  const session = otpData.session

  // Создаем подписанный токен с данными сессии
  // Токен будет содержать access_token, refresh_token и expires_at
  const tokenPayload = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: session.user,
    // Добавляем время истечения токена (1 минута)
    exp: Math.floor(Date.now() / 1000) + 60,
    iat: Math.floor(Date.now() / 1000),
  };

  const signedToken = await createSignedToken(tokenPayload, jwtSecret);

  // Возвращаем подписанный токен вместо прямых токенов
  // Виджет ожидает поле 'sso' в ответе
  return createJsonResponse(
    {
      sso: signedToken,
    },
    200,
    origin
  )
}

/**
 * Handle token verification and return session data
 */
async function handleVerifyToken(params: any, origin: string | null): Promise<Response> {
  const { token } = params;

  if (!token) {
    return createJsonResponse(
      { error: "Missing token parameter" },
      400,
      origin
    );
  }

  const jwtSecret = Deno.env.get("JWT_SECRET") ?? "";

  if (!jwtSecret) {
    console.error("Missing JWT_SECRET configuration");
    return createJsonResponse(
      { error: "Server configuration error" },
      500,
      origin
    );
  }

  // Verify and decode the token
  const payload = await verifyAndDecodeToken(token, jwtSecret);

  if (!payload) {
    return createJsonResponse(
      { error: "Invalid or expired token" },
      401,
      origin
    );
  }

  // Return session data from token payload
  return createJsonResponse(
    {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_at: payload.expires_at,
      user: payload.user,
    },
    200,
    origin
  );
}
