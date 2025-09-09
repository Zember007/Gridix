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
  base_domain?: string; // Returned by AmoCRM when using the universal endpoint
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // Contains project_id
    const error = url.searchParams.get('error')

    if (error) {
      console.error('OAuth error:', error)
      return new Response(`
        <html>
          <body>
            <h1>Ошибка авторизации</h1>
            <p>Произошла ошибка при авторизации в AmoCRM: ${error}</p>
            <script>window.close();</script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    if (!code || !state) {
      return new Response(`
        <html>
          <body>
            <h1>Ошибка</h1>
            <p>Отсутствует код авторизации или state параметр</p>
            <script>window.close();</script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get AmoCRM settings by project_id (from state)
    const { data: settings, error: settingsError } = await supabase
      .from('amocrm_settings')
      .select('*')
      .eq('project_id', state)
      .single()

    if (settingsError || !settings) {
      console.error('Settings not found:', settingsError)
      return new Response(`
        <html>
          <body>
            <h1>Ошибка</h1>
            <p>Настройки AmoCRM не найдены</p>
            <script>window.close();</script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Exchange authorization code for access token using universal endpoint
    const tokenUrl = `https://www.amocrm.ru/oauth2/access_token`
    const tokenData = {
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: settings.redirect_uri
    }

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData)
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return new Response(`
        <html>
          <body>
            <h1>Ошибка получения токена</h1>
            <p>Не удалось обменять код авторизации на токен: ${errorText}</p>
            <script>window.close();</script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    const tokenResult: TokenResponse = await tokenResponse.json()

    // Determine account base domain and subdomain
    const baseDomain = (tokenResult as any).base_domain || `${settings.subdomain}.amocrm.ru`
    const derivedSubdomain = baseDomain.replace(/\.amocrm\.ru$/i, '')

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + (tokenResult.expires_in * 1000))

    // Save tokens to database
    const { error: updateError } = await supabase
      .from('amocrm_settings')
      .update({
        access_token: tokenResult.access_token,
        refresh_token: tokenResult.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        authorization_code: code,
        subdomain: derivedSubdomain
      })
      .eq('project_id', state)

    if (updateError) {
      console.error('Failed to save tokens:', updateError)
      return new Response(`
        <html>
          <body>
            <h1>Ошибка сохранения</h1>
            <p>Не удалось сохранить токены в базе данных</p>
            <script>window.close();</script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Automatically fetch AmoCRM data and configure integration
    try {
      console.log('Auto-configuring AmoCRM integration for project:', state)
      
      // Get account info and pipelines
      const [accountResponse, pipelinesResponse] = await Promise.all([
        fetch(
          `https://${baseDomain}/api/v4/account?with=users`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${tokenResult.access_token}`,
              'Content-Type': 'application/json',
            }
          }
        ),
        fetch(
          `https://${baseDomain}/api/v4/leads/pipelines?with=statuses`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${tokenResult.access_token}`,
              'Content-Type': 'application/json',
            }
          }
        )
      ]);

      if (accountResponse.ok && pipelinesResponse.ok) {
        const accountData = await accountResponse.json()
        const pipelinesData = await pipelinesResponse.json()
        
        const pipelines = pipelinesData._embedded?.pipelines || []
        const users = accountData._embedded?.users || []
        
        // Auto-select best options
        const mainPipeline = pipelines.find((p: any) => p.is_main) || pipelines[0]
        const firstStatus = mainPipeline?._embedded?.statuses?.[0]
        const activeUsers = users.filter((u: any) => u.is_active && !u.is_free)
        const firstUser = activeUsers.find((u: any) => u.is_admin) || activeUsers[0]
        
        if (mainPipeline) {
          // Update settings with auto-detected values and names for display
          const updateData = {
            pipeline_id: mainPipeline.id,
            status_id: firstStatus?.id || null,
            responsible_user_id: firstUser?.id || null,
            pipeline_name: mainPipeline.name,
            status_name: firstStatus?.name || null,
            user_name: firstUser?.name || null,
            account_name: accountData.name
          };
          
          await supabase
            .from('amocrm_settings')
            .update(updateData)
            .eq('project_id', state)
          
          console.log('Auto-configured AmoCRM integration:', {
            account: accountData.name,
            pipeline: mainPipeline.name,
            status: firstStatus?.name,
            user: firstUser?.name
          })
        } else {
          console.warn('No pipelines found in AmoCRM account')
        }
      } else {
        console.error('Failed to fetch AmoCRM data:', {
          accountStatus: accountResponse.status,
          pipelinesStatus: pipelinesResponse.status
        })
      }
    } catch (dataError) {
      console.error('Failed to auto-configure AmoCRM integration:', dataError)
      // Don't fail the whole process if auto-configuration fails
    }

    console.log('OAuth2 authorization successful for project:', state)

    // Redirect back to frontend with query parameters
    const frontendBase = Deno.env.get('FRONTEND_URL') || ''
    if (frontendBase) {
      const params = new URLSearchParams({
        amocrm: 'success',
        project_id: String(state),
      })
      // Optionally include some display data
      try {
        const settingsAfter = await supabase
          .from('amocrm_settings')
          .select('pipeline_id,pipeline_name,status_id,status_name,user_name,account_name')
          .eq('project_id', state)
          .single()
        if (!('error' in settingsAfter) && settingsAfter.data) {
          const s: any = settingsAfter.data
          if (s.account_name) params.set('account', s.account_name)
          if (s.pipeline_id) params.set('pipeline_id', String(s.pipeline_id))
          if (s.pipeline_name) params.set('pipeline', s.pipeline_name)
          if (s.status_id) params.set('status_id', String(s.status_id))
        }
      } catch {}
      const redirectUrl = `${frontendBase}?${params.toString()}`
      return Response.redirect(redirectUrl, 302)
    }

    // Fallback: simple HTML if FRONTEND_URL is not configured
    return new Response(`
      <html>
        <body>
          <h1>Авторизация успешна</h1>
          <p>Вы можете закрыть эту страницу и вернуться в приложение.</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } })

  } catch (error) {
    console.error('OAuth callback error:', error)
    return new Response(`
      <html>
        <body>
          <h1>Внутренняя ошибка сервера</h1>
          <p>Произошла неожиданная ошибка</p>
          <script>window.close();</script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
})

