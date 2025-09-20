import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function parseAllowedOrigins(): string[] {
  const siteUrl = (Deno.env.get('SITE_URL') || '').trim()
  const extra = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean)
  const defaults = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'https://localhost:8080',
    'https://127.0.0.1:8080',
  ]
  const all = [...new Set([...(siteUrl ? [siteUrl] : []), ...extra, ...defaults])]
  return all
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true // allow same-origin/no CORS requests
  const allowed = parseAllowedOrigins()
  return allowed.includes(origin)
}

function getAllowedCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

interface InvitationRequest {
  email: string
  full_name: string
  phone?: string
  developer_name: string
  company_name: string
  invitation_token: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  const origin = req.headers.get('Origin')
  const corsHeaders = getAllowedCorsHeaders(origin)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (origin && (!corsHeaders['Access-Control-Allow-Origin'] || corsHeaders['Access-Control-Allow-Origin'] === '*')) {
      return new Response(JSON.stringify({ success: false, error: 'origin_not_allowed' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Создаем клиент с service role key для административных операций
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Используем service role key
    )

    // Создаем обычный клиент для проверки аутентификации текущего пользователя
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } }
    )

    // Проверяем, что пользователь аутентифицирован
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { email, full_name, phone, developer_name, company_name, invitation_token }: InvitationRequest = await req.json()

    // Создаем URL для принятия приглашения
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'
    const encodedToken = encodeURIComponent(invitation_token)
    const invitationUrl = `${siteUrl}/accept-invitation?token=${encodedToken}`

    console.log('Attempting to send invitation email via Supabase Auth to:', email)

    // Отправляем приглашение через Supabase Auth
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: invitationUrl,
      data: {
        full_name,
        phone,
        developer_name,
        company_name,
        invitation_token,
        invited_by: user.id
      }
    })

    if (inviteError) {
      console.error('Supabase invitation error:', inviteError)
      throw new Error(`Failed to send invitation: ${inviteError.message}`)
    }

    console.log('Invitation sent successfully via Supabase Auth to:', email)

    // Опционально: сохраняем информацию о приглашении в базе данных
    try {
      const { error: dbError } = await supabaseAdmin
        .from('invitations') // Создайте эту таблицу, если нужно
        .insert({
          email,
          full_name,
          phone,
          developer_name,
          company_name,
          invitation_token,
          invited_by: user.id,
          invited_at: new Date().toISOString(),
          status: 'sent'
        })

      if (dbError) {
        console.warn('Failed to save invitation to database:', dbError)
        // Не прерываем выполнение, так как письмо уже отправлено
      }
    } catch (dbSaveError) {
      console.warn('Database save error:', dbSaveError)
      // Не критично, продолжаем
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully via Supabase',
        invitation_url: invitationUrl,
        user_id: inviteData?.user?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending invitation email:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send invitation email' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})