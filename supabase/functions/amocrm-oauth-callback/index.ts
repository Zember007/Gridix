import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, createCorsResponse, createJsonResponse } from '../_shared/cors.ts'

async function hmacVerify(inputB64: string, signature: string, secret: string): Promise<boolean> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const computed = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(inputB64))
  const bytes = new Uint8Array(computed)
  const b64 = btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
  return b64 === signature
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface AmoCRMPipeline {
  id: number;
  name: string;
  sort: number;
  is_main: boolean;
  is_archive: boolean;
}

interface AmoCRMAccountData {
  id: number;
  name: string;
  subdomain: string;
  _embedded?: {
    pipelines?: AmoCRMPipeline[];
  };
}
serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') {
    return createCorsResponse(origin);
  }

  try {
    const url = new URL(req.url)
    // CORS проверка убрана для упрощения - используем единую конфигурацию

    const code = url.searchParams.get('code')
    const signedState = url.searchParams.get('state')
    const referer = url.searchParams.get('referer') // важный параметр для определения субдомена
    const error = url.searchParams.get('error')
    const testMode = url.searchParams.get('test') === '1'

    console.log('AmoCRM callback received:', {
      hasCode: !!code,
      codeLength: code?.length,
      hasState: !!signedState,
      referer,
      error,
      testMode,
      fullUrl: req.url
    })

    if (error) {
      return createJsonResponse({ error }, 400, origin);
    }

    // Тестовый режим - возвращаем успешный ответ без реальной авторизации



    if (!code || !signedState) {
      /* return createJsonResponse({ error: 'missing_code_or_state' }, 400, origin); */
      return createJsonResponse({ data: { status: 'OK' } }, 200, origin);
    }

    // Verify signed state
    const stateSecret = Deno.env.get('AMOCRM_STATE_SECRET')
    if (!stateSecret) {
      return createJsonResponse({ error: 'server_misconfigured' }, 500, origin);
    }
    const parts = signedState.split('.')
    if (parts.length !== 2) {
      return createJsonResponse({ error: 'invalid_state' }, 400, origin);
    }
    const [payloadB64, signature] = parts
    const ok = await hmacVerify(payloadB64, signature, stateSecret)
    if (!ok) {
      return createJsonResponse({ error: 'invalid_state_signature' }, 400, origin);
    }
    const payloadJson = atob(payloadB64.replaceAll('-', '+').replaceAll('_', '/') + '==')
    let stateObj: { project_id: string; exp: number }
    try {
      stateObj = JSON.parse(payloadJson)
    } catch {
      return createJsonResponse({ error: 'invalid_state_payload' }, 400, origin);
    }
    if (!stateObj?.project_id || !stateObj?.exp || stateObj.exp < Math.floor(Date.now() / 1000)) {
      return createJsonResponse({ error: 'state_expired' }, 400, origin);
    }
    const state = stateObj.project_id

    // Инициализация supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Получаем проект и user_id
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', state)
      .single()

    if (projectError || !project) {
      console.error('Project not found:', state, projectError)
      return createJsonResponse({ error: 'project_not_found' }, 404, origin);
    }

    // Проверяем, не использовался ли уже этот код авторизации
    const { data: existingConnection, error: checkError } = await supabase
      .from('crm_connections')
      .select('authorization_code, access_token')
      .eq('user_id', project.user_id)
      .eq('crm_type', 'amocrm')
      .single()

    console.log('Existing connection check:', {
      found: !!existingConnection,
      hasAuthCode: !!existingConnection?.authorization_code,
      hasAccessToken: !!existingConnection?.access_token,
      codeMatch: existingConnection?.authorization_code === code,
      checkError: checkError?.message
    })

    // Если этот же код авторизации уже был использован, значит это повторный вызов
    if (existingConnection && existingConnection.authorization_code === code) {
      console.log('Same authorization code already processed for user:', project.user_id)

      // Если уже есть access_token, значит авторизация завершена успешно
      if (existingConnection.access_token) {
        return Response.redirect(`${Deno.env.get("SITE_URL")}admin/project/${state}?page=integrations`, 302);
      } else {
        return createJsonResponse({ error: 'authorization_code_already_used' }, 400, origin);
      }
    }

    // Получаем настройки AmoCRM
    const clientId = Deno.env.get('AMOCRM_CLIENT_ID') // Ваш client_id
    const clientSecret = Deno.env.get('AMOCRM_CLIENT_SECRET')
    const redirectUri = `${supabaseUrl}/functions/v1/amocrm-oauth-callback`

    if (!clientSecret) {
      return new Response(`<h1>Ошибка конфигурации</h1><p>Не настроен client_secret</p>`, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Определяем субдомен из referer или используем стандартный API endpoint
    let tokenUrl = 'https://www.amocrm.ru/oauth2/access_token'
    let subdomain = 'www'

    if (referer && referer.includes('.amocrm.ru')) {
      subdomain = referer.replace('.amocrm.ru', '')
      tokenUrl = `https://${referer}/oauth2/access_token`
    }

    const tokenData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    })

    console.log('Requesting tokens from:', tokenUrl)
    console.log('Token request data:', {
      client_id: clientId,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      codeLength: code?.length,
      hasClientSecret: !!clientSecret
    })

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenData.toString()
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorText,
        tokenUrl,
        requestData: {
          client_id: clientId,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          codeLength: code?.length
        }
      })
      return createJsonResponse({ error: 'token_exchange_failed', details: errorText }, tokenResponse.status, origin);
    }

    const tokenResult: TokenResponse = await tokenResponse.json()
    const expiresAt = new Date(Date.now() + tokenResult.expires_in * 1000)

    console.log('Tokens received successfully')

    // Получаем данные аккаунта и воронки из AmoCRM API
    let accountData: AmoCRMAccountData | null = null
    let pipelineId = 1 // fallback значение
    let pipelineName: string | null = null

    try {
      const accountUrl = `https://${subdomain}.amocrm.ru/api/v4/leads/pipelines`
      console.log('Fetching account data from:', accountUrl)

      const accountResponse = await fetch(accountUrl, {
        headers: {
          'Authorization': `Bearer ${tokenResult.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (accountResponse.ok) {
        accountData = await accountResponse.json() as AmoCRMAccountData

        // Находим первую активную воронку или главную воронку
        const pipelines = accountData?._embedded?.pipelines || []
        const mainPipeline = pipelines.find((p: AmoCRMPipeline) => p.is_main && !p.is_archive)
        const firstActivePipeline = pipelines.find((p: AmoCRMPipeline) => !p.is_archive)

        if (mainPipeline) {
          pipelineId = mainPipeline.id
          pipelineName = mainPipeline.name
          console.log('Using main pipeline:', { id: pipelineId, name: pipelineName })
        } else if (firstActivePipeline) {
          pipelineId = firstActivePipeline.id
          pipelineName = firstActivePipeline.name
          console.log('Using first active pipeline:', { id: pipelineId, name: pipelineName })
        }
      } else {
        console.warn('Failed to fetch account data:', accountResponse.status, await accountResponse.text())
      }
    } catch (error) {
      console.warn('Error fetching account data:', error)
    }



    // Сохраняем или обновляем CRM connection
    const { data: crmConnection, error: connectionError } = await supabase
      .from('crm_connections')
      .upsert({
        user_id: project.user_id,
        crm_type: 'amocrm',
        subdomain: subdomain,
        access_token: tokenResult.access_token,
        refresh_token: tokenResult.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        authorization_code: code,
      }, {
        onConflict: 'user_id,crm_type'
      })
      .select()
      .single()

    if (connectionError || !crmConnection) {
      console.error('Failed to save CRM connection:', connectionError)
      return createJsonResponse({ error: 'save_connection_failed', details: connectionError?.message }, 500, origin);
    }

    // Сохраняем настройки проекта
    const { error: projectSettingsError } = await supabase
      .from('project_crm_settings')
      .upsert({
        project_id: state,
        crm_connection_id: crmConnection.id,
        pipeline_id: pipelineId,
        pipeline_name: pipelineName,
      }, {
        onConflict: 'project_id,crm_connection_id'
      })

    if (projectSettingsError) {
      console.error('Failed to save project CRM settings:', projectSettingsError)
      return createJsonResponse({ error: 'save_project_settings_failed', details: projectSettingsError.message }, 500, origin);
    }

    console.log(`✅ Успешная авторизация AmoCRM для пользователя ${project.user_id} и проекта ${state}`)

    return Response.redirect(`${Deno.env.get("SITE_URL")}admin/project/${state}?page=integrations`, 302);

  } catch (error) {
    console.error('OAuth callback error:', error)
    return createJsonResponse({ error: 'unexpected_error', details: error.message }, 500, origin);
  }
})
