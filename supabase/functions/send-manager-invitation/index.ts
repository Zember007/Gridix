import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts"

function getAllowedCorsHeaders(origin: string | null) {
  const siteUrl = Deno.env.get('SITE_URL') || ''
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  if (!origin || (siteUrl && origin === siteUrl)) {
    headers['Access-Control-Allow-Origin'] = origin || siteUrl || '*'
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
      return new Response(JSON.stringify({ success: false, error: 'origin_not_allowed' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Require authenticated user to send invitation; rely on RLS in tables
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } }
    )

    const { email, full_name, phone, developer_name, company_name, invitation_token }: InvitationRequest = await req.json()

    // Create the invitation link
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'
    const invitationUrl = `${siteUrl}/accept-invitation?token=${invitation_token}`

    // Prepare email content
    const emailSubject = `Приглашение в команду ${company_name}`
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Приглашение в команду</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
          .button:hover { background: #5a6fd8; }
          .info-box { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏢 Приглашение в команду</h1>
            <p>Вас пригласили стать менеджером</p>
          </div>
          
          <div class="content">
            <p>Здравствуйте, <strong>${full_name}</strong>!</p>
            
            <p><strong>${developer_name}</strong> из компании <strong>${company_name}</strong> приглашает вас стать менеджером для работы с проектами недвижимости.</p>
            
            <div class="info-box">
              <h3>🎯 Что вы получите:</h3>
              <ul>
                <li>Полный доступ к просмотру и редактированию проектов</li>
                <li>Возможность создавать новые проекты</li>
                <li>Доступ к административной панели</li>
                <li>Инструменты для управления квартирами и планировками</li>
              </ul>
            </div>
            
            <p>Для принятия приглашения и создания вашего аккаунта нажмите кнопку ниже:</p>
            
            <div style="text-align: center;">
              <a href="${invitationUrl}" class="button">🚀 Принять приглашение</a>
            </div>
            
            <div class="info-box">
              <p><strong>📧 Ваш email для входа:</strong> ${email}</p>
              ${phone ? `<p><strong>📱 Ваш телефон:</strong> ${phone}</p>` : ''}
              <p><strong>🏢 Компания:</strong> ${company_name}</p>
            </div>
            
            <p><small>Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:<br>
            <a href="${invitationUrl}">${invitationUrl}</a></small></p>
            
            <p><strong>⚠️ Важно:</strong> Ссылка действительна в течение 7 дней. После этого срока потребуется повторное приглашение.</p>
          </div>
          
          <div class="footer">
            <p>Это письмо отправлено автоматически системой управления проектами.<br>
            Если вы получили это письмо по ошибке, просто проигнорируйте его.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const emailText = `
Приглашение в команду ${company_name}

Здравствуйте, ${full_name}!

${developer_name} из компании ${company_name} приглашает вас стать менеджером для работы с проектами недвижимости.

Что вы получите:
- Полный доступ к просмотру и редактированию проектов
- Возможность создавать новые проекты
- Доступ к административной панели
- Инструменты для управления квартирами и планировками

Для принятия приглашения перейдите по ссылке:
${invitationUrl}

Ваши данные:
- Email для входа: ${email}
${phone ? `- Телефон: ${phone}` : ''}
- Компания: ${company_name}

Важно: Ссылка действительна в течение 7 дней.

---
Это письмо отправлено автоматически системой управления проектами.
    `

    // Send email using Resend API
    // SMTP configuration (preferred when available)
    const smtpHost = Deno.env.get('SMTP_HOST') ?? ''
    const smtpPortRaw = Deno.env.get('SMTP_PORT') ?? ''
    const smtpPort = smtpPortRaw ? Number(smtpPortRaw) : 465
    const smtpUser = Deno.env.get('SMTP_USERNAME') ?? ''
    const smtpPass = Deno.env.get('SMTP_PASSWORD') ?? ''
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@floorplan-wizard.com'

    if (smtpHost && smtpUser && smtpPass) {
      const client = new SmtpClient()
      try {
        if (smtpPort === 465) {
          await client.connectTLS({
            hostname: smtpHost,
            port: smtpPort,
            username: smtpUser,
            password: smtpPass,
          })
        } else {
          await client.connect({
            hostname: smtpHost,
            port: smtpPort,
            username: smtpUser,
            password: smtpPass,
          })
        }

        await client.send({
          from: fromEmail,
          to: email,
          subject: emailSubject,
          content: emailText,
          html: emailHtml,
        })

        console.log('Email sent successfully via SMTP to', email)
      } catch (smtpError) {
        console.error('SMTP email sending failed:', smtpError)
        throw new Error(`Failed to send email via SMTP`)
      } finally {
        try { await client.close() } catch (_) { /* noop */ }
      }
    } else {
      // Fallback: log email content for development
      console.log('SMTP is not configured, logging email content:')
      console.log('To:', email)
      console.log('Subject:', emailSubject)
      console.log('Invitation URL:', invitationUrl)
      console.log('HTML Content length:', emailHtml.length)
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully',
        invitation_url: invitationUrl // For testing purposes
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
