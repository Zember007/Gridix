import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, createCorsResponse, createJsonResponse } from '../_shared/cors.ts'
import { createOrUpdateLocalFunnel, type AmoCRMPipeline } from '../_shared/amocrm-funnel.ts'

function normalizeReturnTo(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Disallow absolute URLs / protocols (prevent open redirects)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return null;
  if (trimmed.startsWith('//')) return null;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function getBaseSiteUrl(): string | null {
  const raw =
    (Deno.env.get('SITE_URL') || Deno.env.get('SITE_DEV_URL') || '').trim();
  if (!raw) return null;
  return raw.endsWith('/') ? raw : `${raw}/`;
}

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

interface AmoCRMStatus {
  id: number;
  name: string;
  sort: number;
  color: string;
  type: number;
  pipeline_id: number;
}


interface AmoCRMAccountData {
  id: number;
  name: string;
  subdomain: string;
  _embedded?: {
    pipelines?: AmoCRMPipeline[];
  };
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
      return createJsonResponse({ error: 'missing_code_or_state' }, 400, origin);
    }

    // Verify signed state
    const stateSecret = Deno.env.get('JWT_SECRET')
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
    let stateObj: { project_id?: string | null; user_id?: string | null; return_to?: string | null; exp: number }
    try {
      stateObj = JSON.parse(payloadJson)
    } catch {
      return createJsonResponse({ error: 'invalid_state_payload' }, 400, origin);
    }
    if (!stateObj?.exp || stateObj.exp < Math.floor(Date.now() / 1000)) {
      return createJsonResponse({ error: 'state_expired' }, 400, origin);
    }
    const projectIdFromState = (typeof stateObj.project_id === 'string' && stateObj.project_id.trim() !== '')
      ? stateObj.project_id
      : null;
    const userIdFromState = (typeof stateObj.user_id === 'string' && stateObj.user_id.trim() !== '')
      ? stateObj.user_id
      : null;
    const returnToFromState = normalizeReturnTo(stateObj.return_to);

    // Инициализация supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Determine target user_id:
    // - If project_id is present: resolve owner from DB and (optionally) verify it matches state.user_id.
    // - Else: require state.user_id.
    let targetUserId: string | null = null;
    let projectOwnerUserId: string | null = null;
    if (projectIdFromState) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectIdFromState)
        .single()

      if (projectError || !project) {
        console.error('Project not found:', projectIdFromState, projectError)
        return createJsonResponse({ error: 'project_not_found' }, 404, origin);
      }

      projectOwnerUserId = project.user_id ?? null;
      targetUserId = projectOwnerUserId;

      if (userIdFromState && projectOwnerUserId && userIdFromState !== projectOwnerUserId) {
        return createJsonResponse({ error: 'state_user_mismatch' }, 400, origin);
      }
    } else {
      if (!userIdFromState) {
        return createJsonResponse({ error: 'missing_state_user_id' }, 400, origin);
      }
      targetUserId = userIdFromState;
    }

    if (!targetUserId) {
      return createJsonResponse({ error: 'missing_state_user_id' }, 400, origin);
    }
    const ensuredTargetUserId: string = targetUserId;

    // Проверяем, не использовался ли уже этот код авторизации
    const { data: existingConnection, error: checkError } = await supabase
      .from('crm_connections')
      .select('authorization_code, access_token')
      .eq('user_id', targetUserId)
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
      console.log('Same authorization code already processed for user:', targetUserId)

      // Если уже есть access_token, значит авторизация завершена успешно
      if (existingConnection.access_token) {
        const base = getBaseSiteUrl();
        if (!base) return new Response("Server configuration error (SITE_URL missing)", { status: 500 });
        const fallback = projectIdFromState ? `admin/project/${projectIdFromState}?page=integrations` : `admin?page=integrations&crm=amocrm&auth=success`;
        const targetPath = (returnToFromState ?? normalizeReturnTo(fallback) ?? `/${fallback}`).replace(/^\//, '');
        return Response.redirect(`${base}${targetPath}`, 302);
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

    // Проверяем, что этот поддомен ещё не привязан к другому аккаунту
    const { data: sameSubdomainConnections, error: sameSubdomainError } = await supabase
      .from('crm_connections')
      .select('id, user_id')
      .eq('crm_type', 'amocrm')
      .eq('subdomain', subdomain)
      .neq('user_id', targetUserId)
      .limit(1)

    if (sameSubdomainError) {
      console.error('Failed to check existing AmoCRM subdomain:', sameSubdomainError)
      return createJsonResponse({ error: 'subdomain_check_failed' }, 500, origin);
    }

    if (sameSubdomainConnections && sameSubdomainConnections.length > 0) {
      console.warn('AmoCRM subdomain already connected to another account:', {
        subdomain,
        currentUserId: targetUserId,
        existingUserId: sameSubdomainConnections[0].user_id,
      })

      return createJsonResponse({ error: 'subdomain_already_connected' }, 400, origin);
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

    // Получаем данные аккаунта, воронки и пользователей из AmoCRM API
    let accountData: AmoCRMAccountData | null = null
    let selectedPipeline: AmoCRMPipeline | null = null
    let pipelineId = 1 // fallback значение
    let pipelineName: string | null = null
    let responsibleUserId: number | null = null
    let responsibleUserName: string | null = null

    const baseUrl = `https://${subdomain}.amocrm.ru/api/v4`
    const headers = {
      'Authorization': `Bearer ${tokenResult.access_token}`,
      'Content-Type': 'application/json'
    }

    try {
      // Получаем список воронок
      const pipelinesUrl = `${baseUrl}/leads/pipelines`
      console.log('Fetching pipelines from:', pipelinesUrl)

      const pipelinesResponse = await fetch(pipelinesUrl, { headers })

      if (pipelinesResponse.ok) {
        accountData = await pipelinesResponse.json() as AmoCRMAccountData

        // Находим главную воронку или первую активную воронку
        const pipelines = accountData?._embedded?.pipelines || []
        const mainPipeline = pipelines.find((p: AmoCRMPipeline) => p.is_main && !p.is_archive)
        const firstActivePipeline = pipelines.find((p: AmoCRMPipeline) => !p.is_archive)

        const targetPipeline = mainPipeline || firstActivePipeline

        if (targetPipeline) {
          pipelineId = targetPipeline.id
          pipelineName = targetPipeline.name
          console.log('Using pipeline:', { id: pipelineId, name: pipelineName, is_main: targetPipeline.is_main })

          // Получаем полную информацию о воронке со статусами
          try {
            const pipelineDetailUrl = `${baseUrl}/leads/pipelines/${pipelineId}`
            console.log('Fetching pipeline details from:', pipelineDetailUrl)

            const pipelineDetailResponse = await fetch(pipelineDetailUrl, { headers })
            if (pipelineDetailResponse.ok) {
              const pipelineDetail = await pipelineDetailResponse.json()
              const statuses = pipelineDetail._embedded?.statuses || pipelineDetail.statuses || []
              
              selectedPipeline = {
                ...targetPipeline,
                statuses: statuses
              }
              console.log('Pipeline statuses count:', statuses.length)
            } else {
              console.warn('Failed to fetch pipeline details:', pipelineDetailResponse.status)
            }
          } catch (error) {
            console.warn('Error fetching pipeline details:', error)
          }
        }
      } else {
        console.warn('Failed to fetch pipelines:', pipelinesResponse.status, await pipelinesResponse.text())
      }

      // Получаем список пользователей для выбора ответственного
      try {
        const usersUrl = `${baseUrl}/users`
        console.log('Fetching users from:', usersUrl)

        const usersResponse = await fetch(usersUrl, { headers })
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          const users: AmoCRMUser[] = usersData._embedded?.users || []

          // Выбираем главного сотрудника (администратора или первого пользователя)
          const adminUser = users.find((u: AmoCRMUser) => u.is_admin)
          const mainUser = adminUser || users[0]

          if (mainUser) {
            responsibleUserId = mainUser.id
            responsibleUserName = mainUser.name
            console.log('Selected responsible user:', { id: responsibleUserId, name: responsibleUserName, is_admin: mainUser.is_admin })
          } else {
            console.warn('No users found in AmoCRM account')
          }
        } else {
          console.warn('Failed to fetch users:', usersResponse.status)
        }
      } catch (error) {
        console.warn('Error fetching users:', error)
      }
    } catch (error) {
      console.warn('Error fetching AmoCRM data:', error)
    }



    // Сохраняем или обновляем CRM connection
    const { data: crmConnection, error: connectionError } = await supabase
      .from('crm_connections')
      .upsert({
        user_id: targetUserId,
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
    if (projectIdFromState) {
      const { error: projectSettingsError } = await supabase
        .from('project_crm_settings')
        .upsert({
          project_id: projectIdFromState,
          crm_connection_id: crmConnection.id,
          pipeline_id: pipelineId,
          pipeline_name: pipelineName,
          responsible_user_id: responsibleUserId,
          user_name: responsibleUserName,
        }, {
          onConflict: 'project_id,crm_connection_id'
        })

      if (projectSettingsError) {
        console.error('Failed to save project CRM settings:', projectSettingsError)
        return createJsonResponse({ error: 'save_project_settings_failed', details: projectSettingsError.message }, 500, origin);
      }
    }

    // Создаем локальную воронку со статусами, если выбрана воронка
    if (projectIdFromState && selectedPipeline && selectedPipeline.statuses && selectedPipeline.statuses.length > 0) {
      try {
        await createOrUpdateLocalFunnel(
          projectIdFromState,
          projectOwnerUserId ?? ensuredTargetUserId,
          selectedPipeline,
          supabase
        )
        console.log('Local funnel created/updated successfully')
      } catch (error) {
        console.error('Failed to create/update local funnel:', error)
        // Не прерываем процесс, так как основная авторизация уже выполнена
      }
    } else {
      console.warn('Pipeline not selected or has no statuses, skipping local funnel creation')
    }

    console.log(`✅ Успешная авторизация AmoCRM для пользователя ${targetUserId}${projectIdFromState ? ` и проекта ${projectIdFromState}` : ''}`)

    const base = getBaseSiteUrl();
    if (!base) return new Response("Server configuration error (SITE_URL missing)", { status: 500 });

    const fallback = projectIdFromState ? `admin/project/${projectIdFromState}?page=integrations` : `admin?page=integrations&crm=amocrm&auth=success`;
    const targetPath = (returnToFromState ?? normalizeReturnTo(fallback) ?? `/${fallback}`).replace(/^\//, '');
    return Response.redirect(`${base}${targetPath}`, 302);

  } catch (error) {
    console.error('OAuth callback error:', error)
    return createJsonResponse({ error: 'unexpected_error', details: error.message }, 500, origin);
  }
})
