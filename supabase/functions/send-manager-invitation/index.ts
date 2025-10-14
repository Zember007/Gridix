import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders, createCorsResponse, createJsonResponse } from '../_shared/cors.ts'

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
  if (req.method === 'OPTIONS') {
    return createCorsResponse(origin);
  }

  try {
    // CORS проверка убрана для упрощения - используем единую конфигурацию

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
      return createJsonResponse({ success: false, error: 'Unauthorized' }, 401, origin);
    }

    const { email, full_name, phone, developer_name, company_name, invitation_token }: InvitationRequest = await req.json()

    // Создаем URL для принятия приглашения
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'
    const encodedToken = encodeURIComponent(invitation_token)
    const invitationUrl = `${siteUrl}/accept-invitation?token=${encodedToken}`

    console.log('Attempting to send magic link invitation to:', email)

    // Проверяем существует ли пользователь
    let userData = null
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      console.log('User already exists, updating metadata:', email)
      // Обновляем метаданные существующего пользователя
      const { data: updatedData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: {
            full_name,
            phone,
            developer_name,
            company_name,
            invitation_token,
            invited_by: user.id,
            requires_password_setup: true
          }
        }
      )
      
      if (updateError) {
        console.error('Error updating user metadata:', updateError)
        throw new Error(`Failed to update user: ${updateError.message}`)
      }
      
      userData = updatedData
    } else {
      console.log('Creating new user:', email)
      // Создаем нового пользователя
      const { data: newUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          full_name,
          phone,
          developer_name,
          company_name,
          invitation_token,
          invited_by: user.id,
          requires_password_setup: true
        }
      })

      if (createUserError) {
        console.error('Error creating user:', createUserError)
        throw new Error(`Failed to create user: ${createUserError.message}`)
      }
      
      userData = newUserData
    }

    console.log('User ready:', email)

    // Отправляем magic link через signInWithOtp
    const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: invitationUrl,
        data: {
          full_name,
          phone,
          developer_name,
          company_name,
          invitation_token,
          invited_by: user.id,
          requires_password_setup: true
        }
      }
    })

    if (otpError) {
      console.error('Error sending magic link:', otpError)
      throw new Error(`Failed to send magic link: ${otpError.message}`)
    }

    console.log('Magic link sent successfully to:', email)

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
    
    return createJsonResponse({
      success: true,
      message: 'Magic link invitation sent successfully',
      invitation_url: invitationUrl,
      email: email,
      user: userData?.user
    }, 200, origin);

  } catch (error) {
    console.error('Error sending invitation email:', error)
    
    return createJsonResponse({ 
      success: false, 
      error: error.message || 'Failed to send invitation email' 
    }, 400, origin);
  }
})