import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createCorsResponse, createJsonResponse } from '../_shared/cors.ts'

interface PartnerProgramRequest {
  action: 'track_referral' | 'get_stats' | 'admin_manage' | 'impersonate' | 'payout_request'
  partner_code?: string
  partner_id?: string
  client_id?: string
  amount?: number
  payment_method?: string
  payment_details?: any
  admin_action?: 'list' | 'update_percentage' | 'suspend' | 'activate'
  payout_percentage?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return createCorsResponse(req.headers.get('origin'))
  }

  try {
    // Создаем клиент с сервисным ключом для обхода RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Создаем клиент с пользовательским токеном для проверки авторизации
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return createJsonResponse(
        { error: 'Unauthorized' },
        401,
        req.headers.get('origin')
      )
    }

    const { action, partner_code, partner_id, client_id, amount, payment_method, payment_details, admin_action, payout_percentage }: PartnerProgramRequest = await req.json()

    switch (action) {
      case 'track_referral':
        return await handleTrackReferral(supabaseClient, user.id, partner_code, req.headers.get('origin'))
      
      case 'get_stats':
        return await handleGetStats(supabaseClient, user.id, partner_id, req.headers.get('origin'))
      
      case 'admin_manage':
        return await handleAdminManage(supabaseClient, user.id, admin_action, partner_id, payout_percentage, req.headers.get('origin'))
      
      case 'impersonate':
        return await handleImpersonate(supabaseClient, user.id, client_id, req.headers.get('origin'))
      
      case 'payout_request':
        return await handlePayoutRequest(supabaseClient, user.id, amount, payment_method, payment_details, req.headers.get('origin'))
      
      default:
        return createJsonResponse(
          { error: 'Invalid action' },
          400,
          req.headers.get('origin')
        )
    }
  } catch (error) {
    console.error('Error:', error)
    return createJsonResponse(
      { error: 'Internal server error' },
      500,
      req.headers.get('origin')
    )
  }
})

// Отслеживание реферала при регистрации
async function handleTrackReferral(supabaseClient: any, userId: string, partnerCode?: string, origin?: string | null) {
  if (!partnerCode) {
    return createJsonResponse(
      { success: false, error: 'Partner code required' },
      400,
      origin
    )
  }

  try {
    // Находим партнёра по коду
    const { data: partner, error: partnerError } = await supabaseClient
      .from('partner_profiles')
      .select('id, user_id, status')
      .eq('partner_code', partnerCode)
      .eq('status', 'active')
      .single()

    if (partnerError || !partner) {
      return createJsonResponse(
        { success: false, error: 'Invalid partner code' },
        400,
        origin
      )
    }

    // Проверяем, что пользователь не пытается зарегистрироваться по своему же коду
    if (partner.user_id === userId) {
      return createJsonResponse(
        { success: false, error: 'Cannot use own referral code' },
        400,
        origin
      )
    }

    // Создаём партнёрскую связь
    const { data: link, error: linkError } = await supabaseClient
      .from('partner_links')
      .insert({
        partner_id: partner.id,
        client_id: userId,
        type: 'referral',
        status: 'active',
        accepted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (linkError) {
      console.error('Error creating partner link:', linkError)
      return createJsonResponse(
        { success: false, error: 'Failed to create partner link' },
        500,
        origin
      )
    }

    // Получаем имя партнёра
    const { data: partnerUser } = await supabaseClient
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', partner.user_id)
      .single()

    const partnerName = partnerUser ? `${partnerUser.first_name} ${partnerUser.last_name}`.trim() : 'Unknown'

    return createJsonResponse(
      { 
        success: true, 
        partner_name: partnerName,
        link_id: link.id 
      },
      200,
      origin
    )
  } catch (error) {
    console.error('Error in track_referral:', error)
    return createJsonResponse(
      { success: false, error: 'Internal server error' },
      500,
      origin
    )
  }
}

// Получение статистики партнёра
async function handleGetStats(supabaseClient: any, userId: string, targetPartnerId?: string, origin?: string | null) {
  try {
    // Проверяем права доступа
    if (targetPartnerId && targetPartnerId !== userId) {
      const { data: userRole } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'superadmin')
        .single()

      if (!userRole) {
        return createJsonResponse(
          { error: 'Access denied' },
          403,
          origin
        )
      }
    }

    // Определяем, для какого партнера получаем статистику
    const targetUserId = targetPartnerId || userId

    // Получаем профиль партнёра
    console.log('Looking for partner profile for user_id:', targetUserId)
    const { data: partnerProfile, error: profileError } = await supabaseClient
      .from('partner_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .single()

    if (profileError) {
      console.error('Error fetching partner profile:', profileError)
      return createJsonResponse(
        { error: 'Failed to fetch partner profile' },
        500,
        origin
      )
    }

    if (!partnerProfile) {
      return createJsonResponse(
        { error: 'Partner profile not found' },
        404,
        origin
      )
    }

    console.log('Found partner profile:', partnerProfile.id)

    // Получаем статистику по клиентам
    console.log('Getting partner links for partner_id:', partnerProfile.id)
    const { data: links, error: linksError } = await supabaseClient
      .from('partner_links')
      .select(`
        id,
        type,
        status,
        created_at,
        client_id,
        user_profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('partner_id', partnerProfile.id)

    if (linksError) {
      console.error('Error fetching partner links:', linksError)
      return createJsonResponse(
        { error: 'Failed to fetch partner links' },
        500,
        origin
      )
    }

    console.log('Found partner links:', links?.length || 0)

      

    const referralClients = links?.filter(link => link.type === 'referral') || []
    const managedClients = links?.filter(link => link.type === 'managed') || []

    // Получаем статистику по комиссиям
    const { data: commissions } = await supabaseClient
      .from('user_subscriptions')
      .select('partner_commission_amount, created_at')
      .eq('partner_id', partnerProfile.id)
      .eq('partner_commission_paid', true)

    const totalCommissions = commissions?.reduce((sum, comm) => sum + (comm.partner_commission_amount || 0), 0) || 0

    // Получаем доступный баланс для вывода
    const availableBalance = partnerProfile.total_earned - partnerProfile.total_withdrawn

    return createJsonResponse(
      {
        total_clients: links?.length || 0,
        referral_clients: referralClients.length,
        managed_clients: managedClients.length,
        total_earned: partnerProfile.total_earned,
        total_withdrawn: partnerProfile.total_withdrawn,
        available_for_withdrawal: availableBalance,
        commissions: commissions || [],
        clients: links || []
      },
      200,
      origin
    )
  } catch (error) {
    console.error('Error in get_stats:', error)
    return createJsonResponse(
      { error: 'Internal server error' },
      500,
      origin
    )
  }
}

// Управление партнёрами (суперадмин)
async function handleAdminManage(supabaseClient: any, userId: string, adminAction?: string, targetPartnerId?: string, payoutPercentage?: number, origin?: string | null) {
  try {
    // Проверяем права суперадмина
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'superadmin')
      .single()

    if (!userRole) {
      return createJsonResponse(
        { error: 'Access denied' },
        403,
        origin
      )
    }

    switch (adminAction) {
      case 'list':
        const { data: partners } = await supabaseClient
          .from('partner_profiles')
          .select(`
            *,
            user_profiles!partner_profiles_user_id_fkey (
              id,
              first_name,
              last_name,
              email
            )
          `)
          .order('created_at', { ascending: false })

        return createJsonResponse(
          { partners: partners || [] },
          200,
          origin
        )

      case 'suspend':
        if (!targetPartnerId) {
          return createJsonResponse(
            { error: 'Partner ID required' },
            400,
            origin
          )
        }

        const { error: suspendError } = await supabaseClient
          .from('partner_profiles')
          .update({ status: 'suspended' })
          .eq('id', targetPartnerId)

        if (suspendError) {
          return createJsonResponse(
            { error: 'Failed to suspend partner' },
            500,
            origin
          )
        }

        return createJsonResponse(
          { success: true },
          200,
          origin
        )

      case 'activate':
        if (!targetPartnerId) {
          return createJsonResponse(
            { error: 'Partner ID required' },
            400,
            origin
          )
        }

        const { error: activateError } = await supabaseClient
          .from('partner_profiles')
          .update({ status: 'active' })
          .eq('id', targetPartnerId)

        if (activateError) {
          return createJsonResponse(
            { error: 'Failed to activate partner' },
            500,
            origin
          )
        }

        return createJsonResponse(
          { success: true },
          200,
          origin
        )

      default:
        return createJsonResponse(
          { error: 'Invalid admin action' },
          400,
          origin
        )
    }
  } catch (error) {
    console.error('Error in admin_manage:', error)
    return createJsonResponse(
      { error: 'Internal server error' },
      500,
      origin
    )
  }
}

// Авторизация от лица клиента
async function handleImpersonate(supabaseClient: any, userId: string, clientId?: string, origin?: string | null) {
  if (!clientId) {
    return createJsonResponse(
      { error: 'Client ID required' },
      400,
      origin
    )
  }

  try {
    // Проверяем, что у партнёра есть активная связь типа 'managed' с клиентом
    const { data: partnerProfile } = await supabaseClient
      .from('partner_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (!partnerProfile) {
      return createJsonResponse(
        { error: 'Partner profile not found' },
        404,
        origin
      )
    }

    const { data: link } = await supabaseClient
      .from('partner_links')
      .select('id, status')
      .eq('partner_id', partnerProfile.id)
      .eq('client_id', clientId)
      .eq('type', 'managed')
      .eq('status', 'active')
      .single()

    if (!link) {
      return createJsonResponse(
        { error: 'No managed relationship found' },
        403,
        origin
      )
    }

    // Создаём временный токен для клиента
    const { data: clientUser } = await supabaseClient.auth.admin.getUserById(clientId)
    
    if (!clientUser.user) {
      return createJsonResponse(
        { error: 'Client user not found' },
        404,
        origin
      )
    }

    // Генерируем токены для клиента
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: clientUser.user.email!,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL')}/dashboard`
      }
    })

    if (sessionError) {
      return createJsonResponse(
        { error: 'Failed to generate session' },
        500,
        origin
      )
    }

    return createJsonResponse(
      { 
        success: true,
        redirect_url: sessionData.properties.action_link
      },
      200,
      origin
    )
  } catch (error) {
    console.error('Error in impersonate:', error)
    return createJsonResponse(
      { error: 'Internal server error' },
      500,
      origin
    )
  }
}

// Запрос на выплату
async function handlePayoutRequest(supabaseClient: any, userId: string, amount?: number, paymentMethod?: string, paymentDetails?: any, origin?: string | null) {
  if (!amount || amount <= 0) {
    return createJsonResponse(
      { error: 'Valid amount required' },
      400,
      origin
    )
  }

  try {
    // Получаем профиль партнёра
    const { data: partnerProfile } = await supabaseClient
      .from('partner_profiles')
      .select('id, total_earned, total_withdrawn, status')
      .eq('user_id', userId)
      .single()

    if (!partnerProfile) {
      return createJsonResponse(
        { error: 'Partner profile not found' },
        404,
        origin
      )
    }

    if (partnerProfile.status !== 'active') {
      return createJsonResponse(
        { error: 'Partner account is not active' },
        403,
        origin
      )
    }

    // Проверяем доступный баланс
    const availableBalance = partnerProfile.total_earned - partnerProfile.total_withdrawn
    if (amount > availableBalance) {
      return createJsonResponse(
        { error: 'Insufficient balance' },
        400,
        origin
      )
    }

    // Создаём запрос на выплату
    const { data: payout, error: payoutError } = await supabaseClient
      .from('partner_payouts')
      .insert({
        partner_id: partnerProfile.id,
        amount: amount,
        status: 'pending',
        payment_method: paymentMethod,
        payment_details: paymentDetails
      })
      .select()
      .single()

    if (payoutError) {
      console.error('Error creating payout request:', payoutError)
      return createJsonResponse(
        { error: 'Failed to create payout request' },
        500,
        origin
      )
    }

    return createJsonResponse(
      { 
        success: true, 
        payout_id: payout.id 
      },
      200,
      origin
    )
  } catch (error) {
    console.error('Error in payout_request:', error)
    return createJsonResponse(
      { error: 'Internal server error' },
      500,
      origin
    )
  }
}
