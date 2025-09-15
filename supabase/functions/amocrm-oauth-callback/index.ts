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
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!code || !state) {
      return new Response(JSON.stringify({ error: 'missing_code_or_state' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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
        return new Response(`<script>
window.parent.postMessage({
  type: 'AMOCRM_AUTH_SUCCESS',
  projectId: '${state}',
  timestamp: Date.now()
}, '*');
window.close();
</script>`, { 
          headers: { 'Content-Type': 'text/html; charset=utf-8' } 
        })
      } else {
        return new Response(JSON.stringify({ error: 'authorization_code_already_used' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
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
      return new Response(JSON.stringify({ error: 'token_exchange_failed', details: errorText }), {
        status: tokenResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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
      }, {
        onConflict: 'project_id'
      })

    if (upsertError) {
      console.error('Failed to save tokens:', upsertError)
      return new Response(JSON.stringify({ error: 'save_tokens_failed', details: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`✅ Успешная авторизация AmoCRM для проекта ${state}`)

    return new Response(`<script>
window.parent.postMessage({
  type: 'AMOCRM_AUTH_SUCCESS',
  projectId: '${state}',
  timestamp: Date.now()
}, '*');
window.close();
</script>`, { 
      headers: { 'Content-Type': 'text/html; charset=utf-8' } 
    })

  } catch (error) {
    console.error('OAuth callback error:', error)
    return new Response(JSON.stringify({ error: 'unexpected_error', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
