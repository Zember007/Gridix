import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // project_id
    const referer = url.searchParams.get('referer') // важный параметр для определения субдомена
    const error = url.searchParams.get('error')

    console.log('AmoCRM callback received:', { 
      hasCode: !!code, 
      codeLength: code?.length, 
      state, 
      referer, 
      error,
      fullUrl: req.url 
    })

    if (error) {
      return new Response(`
        <html>
          <head>
            <meta charset="utf-8">
            <title>Ошибка авторизации AmoCRM</title>
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: red;">Ошибка авторизации: ${error}</h1>
            <script>
              if (window.parent !== window) {
                window.parent.postMessage({
                  type: 'AMOCRM_AUTH_ERROR',
                  error: '${error}',
                  timestamp: Date.now()
                }, '*');
              }
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }

    if (!code || !state) {
      return new Response(`
        <html>
          <head>
            <meta charset="utf-8">
            <title>Ошибка авторизации AmoCRM</title>
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: red;">Ошибка</h1>
            <p>Отсутствует код авторизации или идентификатор проекта</p>
            <script>
              if (window.parent !== window) {
                window.parent.postMessage({
                  type: 'AMOCRM_AUTH_ERROR',
                  error: 'Отсутствует код авторизации или идентификатор проекта',
                  timestamp: Date.now()
                }, '*');
              }
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }

    // Инициализация supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Проверяем, не использовался ли уже этот код авторизации
    const { data: existingSettings, error: checkError } = await supabase
      .from('amocrm_settings')
      .select('authorization_code, access_token')
      .eq('project_id', state)
      .single()

    console.log('Existing settings check:', { 
      found: !!existingSettings, 
      hasAuthCode: !!existingSettings?.authorization_code,
      hasAccessToken: !!existingSettings?.access_token,
      codeMatch: existingSettings?.authorization_code === code,
      checkError: checkError?.message 
    })

    // Если этот же код авторизации уже был использован, значит это повторный вызов
    if (existingSettings && existingSettings.authorization_code === code) {
      console.log('Same authorization code already processed for project:', state)
      
      // Если уже есть access_token, значит авторизация завершена успешно
      if (existingSettings.access_token) {
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'
        const redirectUrl = `${frontendUrl}/ru/admin/project/${state}`
        
        return new Response(`
          <html>
            <head>
              <meta charset="utf-8">
              <title>Авторизация AmoCRM</title>
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: green;">Авторизация уже выполнена! ✅</h1>
              <p>AmoCRM интеграция уже настроена для этого проекта.</p>
              <p>Перенаправляем вас обратно к проекту...</p>
              <script>
                if (window.parent !== window) {
                  window.parent.postMessage({
                    type: 'AMOCRM_AUTH_SUCCESS',
                    projectId: '${state}',
                    timestamp: Date.now()
                  }, '*');
                }
                setTimeout(() => {
                  if (window.parent !== window) {
                    window.parent.location.href = '${redirectUrl}';
                  } else {
                    window.location.href = '${redirectUrl}';
                  }
                }, 1500);
              </script>
            </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      } else {
        // Если код тот же, но токена нет, значит предыдущая попытка провалилась
        // Показываем ошибку и просим начать заново
        return new Response(`
          <html>
            <head>
              <meta charset="utf-8">
              <title>Ошибка авторизации AmoCRM</title>
            </head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: red;">Код авторизации уже использован</h1>
              <p>Пожалуйста, начните процесс авторизации заново.</p>
              <script>
                if (window.parent !== window) {
                  window.parent.postMessage({
                    type: 'AMOCRM_AUTH_ERROR',
                    error: 'Код авторизации уже использован',
                    timestamp: Date.now()
                  }, '*');
                }
                setTimeout(() => window.close(), 3000);
              </script>
            </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      }
    }

    // Получаем настройки AmoCRM
    const clientId = 'fdefa9e6-c28d-41df-9ead-06e388d9dcf0' // Ваш client_id
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
      return new Response(`<h1>Ошибка получения токена</h1><p>${errorText}</p>`, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    const tokenResult: TokenResponse = await tokenResponse.json()
    const expiresAt = new Date(Date.now() + tokenResult.expires_in * 1000)

    console.log('Tokens received successfully')

    // Получаем данные аккаунта и воронки из AmoCRM API
    let accountData: AmoCRMAccountData | null = null
    let pipelineId = 1 // fallback значение
    let pipelineName: string | null = null
    let accountName: string | null = null

    try {
      const accountUrl = `https://${subdomain}.amocrm.ru/api/v4/account?with=pipelines`
      console.log('Fetching account data from:', accountUrl)
      
      const accountResponse = await fetch(accountUrl, {
        headers: {
          'Authorization': `Bearer ${tokenResult.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (accountResponse.ok) {
        accountData = await accountResponse.json() as AmoCRMAccountData

        

        console.log('Account data received:', {
          name: accountData?.name,
          pipelinesCount: accountData?._embedded?.pipelines?.length || 0
        })
        
        accountName = accountData?.name
        
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

    // Сохраняем или обновляем настройки AmoCRM
    const { error: upsertError } = await supabase
      .from('amocrm_settings')
      .upsert({
        project_id: state,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        access_token: tokenResult.access_token,
        refresh_token: tokenResult.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        authorization_code: code,
        subdomain: subdomain,
        pipeline_id: pipelineId,
        pipeline_name: pipelineName,
        account_name: accountName
      }, {
        onConflict: 'project_id'
      })

    if (upsertError) {
      console.error('Failed to save tokens:', upsertError)
      return new Response(`<h1>Ошибка сохранения токенов</h1><p>${upsertError.message}</p>`, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    console.log(`✅ Успешная авторизация AmoCRM для проекта ${state}`)

    // Определяем URL для редиректа обратно к проекту
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'
    const redirectUrl = `${frontendUrl}/ru/admin/project/${state}`

    return new Response(`
      <html>
        <head>
          <meta charset="utf-8">
          <title>Авторизация AmoCRM</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: green;">Авторизация успешна! 🎉</h1>
          <p>AmoCRM интеграция настроена для вашего проекта.</p>
          <p>Перенаправляем вас обратно к проекту...</p>
          <script>
            // Отправляем сообщение родительскому окну
            if (window.parent !== window) {
              window.parent.postMessage({
                type: 'AMOCRM_AUTH_SUCCESS',
                projectId: '${state}',
                timestamp: Date.now()
              }, '*');
            }
            
            // Перенаправляем через 1.5 секунды
            setTimeout(() => {
              if (window.parent !== window) {
                window.parent.location.href = '${redirectUrl}';
              } else {
                window.location.href = '${redirectUrl}';
              }
            }, 1500);
          </script>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

  } catch (error) {
    console.error('OAuth callback error:', error)
    return new Response(`
      <html>
        <head>
          <meta charset="utf-8">
          <title>Ошибка авторизации AmoCRM</title>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: red;">Ошибка авторизации</h1>
          <p>${error.message}</p>
          <script>
            // Отправляем сообщение об ошибке родительскому окну
            if (window.parent !== window) {
              window.parent.postMessage({
                type: 'AMOCRM_AUTH_ERROR',
                error: '${error.message}',
                timestamp: Date.now()
              }, '*');
            }
            
            setTimeout(() => {
              if (window.parent !== window) {
                window.parent.focus();
              }
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
})
