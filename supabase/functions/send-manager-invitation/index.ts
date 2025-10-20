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
  project_ids?: string[] // Массив ID проектов для доступа
  password?: string // Пароль для нового пользователя
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

    const { email, full_name, phone, developer_name, company_name, invitation_token, project_ids, password }: InvitationRequest = await req.json()

    const developerId = user.id

    console.log('Processing manager invitation for:', email)

    // ===== ПРОВЕРКИ ПЕРЕД СОЗДАНИЕМ =====

    // 1. Проверяем, существует ли уже менеджер с таким email
    const { data: existingManager, error: managerCheckError } = await supabaseAdmin
      .from('manager_accounts')
      .select('id, status')
      .eq('developer_id', developerId)
      .eq('email', email)
      .maybeSingle()

    if (managerCheckError) {
      console.error('Error checking existing manager:', managerCheckError)
      throw new Error(`Failed to check existing manager: ${managerCheckError.message}`)
    }

    if (existingManager) {
      if (existingManager.status === 'active') {
        return createJsonResponse({
          success: false,
          error: 'Manager with this email already exists and is active'
        }, 400, origin);
      } else if (existingManager.status === 'suspended') {
        return createJsonResponse({
          success: false,
          error: 'Manager with this email is suspended. Please reactivate them instead.'
        }, 400, origin);
      }
    }

    // 2. (Пропущено) Система приглашений больше не используется — менеджер активируется сразу

    // 3. Проверяем, существует ли пользователь в user_profiles
    const { data: existingUserProfile, error: userProfileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (userProfileError) {
      console.error('Error checking user profile:', userProfileError)
      throw new Error(`Failed to check user profile: ${userProfileError.message}`)
    }

    // URL редиректа после входа (без шага принятия)
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'
    const invitationUrl = `${siteUrl}en/admin`

    // ===== ОБРАБОТКА В ЗАВИСИМОСТИ ОТ НАЛИЧИЯ ПОЛЬЗОВАТЕЛЯ =====

    if (existingUserProfile) {
      console.log('User already registered, creating manager account directly:', email)

      // Пользователь уже зарегистрирован - создаем manager_account сразу
      const { data: managerAccountData, error: accountError } = await supabaseAdmin
        .from('manager_accounts')
        .insert({
          developer_id: developerId,
          manager_id: existingUserProfile.id,
          email: email,
          full_name: full_name,
          phone: phone,
          status: 'active',
          accepted_at: new Date().toISOString()
        })
        .select()
        .single()

      if (accountError) {
        console.error('Error creating manager account:', accountError)
        throw new Error(`Failed to create manager account: ${accountError.message}`)
      }

      // Сохраняем доступ к проектам, если выбраны конкретные проекты
      if (project_ids && project_ids.length > 0 && managerAccountData) {
        const accessRecords = project_ids.map(projectId => ({
          manager_account_id: managerAccountData.id,
          project_id: projectId
        }))

        const { error: accessError } = await supabaseAdmin
          .from('manager_project_access')
          .insert(accessRecords)

        if (accessError) {
          console.error('Error creating project access:', accessError)
          throw new Error(`Failed to create project access: ${accessError.message}`)
        }
      }

      return createJsonResponse({
        success: true,
        message: 'Manager account created successfully',
        manager_account: managerAccountData,
        already_registered: true
      }, 200, origin);
    }

    // ===== ПОЛЬЗОВАТЕЛЬ НЕ ЗАРЕГИСТРИРОВАН - СОЗДАЕМ УЧЕТНУЮ ЗАПИСЬ И АКТИВИРУЕМ СРАЗУ =====

    console.log('User not registered, creating account and activating:', email)

    // Проверяем существует ли пользователь в auth
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
      const createUserOptions: any = {
        email: email,
        email_confirm: true,
        user_metadata: {
          full_name,
          phone,
          developer_name,
          company_name,
          invitation_token,
          invited_by: user.id,
          account_type: 'manager'
        }
      }

      // Если есть пароль, используем его, иначе требуем настройку пароля
      if (password) {
        createUserOptions.password = password
        createUserOptions.user_metadata.requires_password_setup = false
      } else {
        createUserOptions.user_metadata.requires_password_setup = true
      }

      const { data: newUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser(createUserOptions)

      if (createUserError) {
        console.error('Error creating user:', createUserError)
        throw new Error(`Failed to create user: ${createUserError.message}`)
      }

      userData = newUserData
    }

    console.log('User ready:', userData)

    // Отправляем magic link через signInWithOtp (только для удобного входа)
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
        }
      }
    })

    if (otpError) {
      console.error('Error sending magic link:', otpError)
    } else {
      console.log('Magic link sent successfully to:', email)
    }


    // Обновляем user_profiles с account_type для нового пользователя
    if (userData && userData.user) {
      try {
        const { error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .upsert({
            id: userData.user.id,
            email: userData.user.email,
            full_name,
            company_name: '',
            phone,
            account_type: 'manager'
          })

        if (profileError) {
          console.error('Failed to update user profile:', profileError)
          // Не прерываем процесс, так как основная задача выполнена
        }
      } catch (profileError) {
        console.error('Error updating user profile:', profileError)
        // Не прерываем процесс
      }
    }

    // Создаем/активируем manager_account сразу и выдаем доступ к проектам
    try {
      const managerId = userData?.user?.id
      if (!managerId) throw new Error('No manager user id available')

      // Проверяем, нет ли уже аккаунта менеджера у этого застройщика
      const { data: existingAccount } = await supabaseAdmin
        .from('manager_accounts')
        .select('id')
        .eq('developer_id', developerId)
        .eq('manager_id', managerId)
        .maybeSingle()

      let managerAccountId = existingAccount?.id

      if (!managerAccountId) {
        const { data: createdAccount, error: createAccErr } = await supabaseAdmin
          .from('manager_accounts')
          .insert({
            developer_id: developerId,
            manager_id: managerId,
            email,
            full_name,
            phone,
            status: 'active',
            accepted_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (createAccErr) throw new Error(`Failed to create manager account: ${createAccErr.message}`)
        managerAccountId = createdAccount.id
      }

      // Выдать доступ к проектам сразу
      if (project_ids && project_ids.length > 0 && managerAccountId) {
        const accessRows = project_ids.map(projectId => ({ manager_account_id: managerAccountId!, project_id: projectId }))
        const { error: accessErr } = await supabaseAdmin
          .from('manager_project_access')
          .insert(accessRows)
        if (accessErr) throw new Error(`Failed to grant project access: ${accessErr.message}`)
      }

      return createJsonResponse({
        success: true,
        message: 'Manager activated and access granted',
        invitation_url: invitationUrl,
        email: email,
        already_registered: false
      }, 200, origin)
    } catch (activateErr: any) {
      console.error('Activation error:', activateErr)
      throw activateErr
    }

  } catch (error) {
    console.error('Error sending invitation email:', error)

    return createJsonResponse({
      success: false,
      error: error.message || 'Failed to send invitation email'
    }, 400, origin);
  }
})