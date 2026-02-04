import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createCorsResponse, createJsonResponse } from '../_shared/cors.ts'
import { getSupabaseUser } from '../_shared/auth.ts'

interface PartnerProgramRequest {
  action: 'track_click' | 'track_referral' | 'get_stats' | 'admin_manage' | 'impersonate' | 'payout_request' | 'send_invitation'
  partner_code?: string
  partner_id?: string
  client_id?: string
  amount?: number
  payment_method?: string
  contact_info?: string
  admin_action?: 'list' | 'update_percentage' | 'suspend' | 'activate'
  payout_percentage?: number
  email?: string
  invitation_type?: 'referral' | 'managed'
  invitation_code?: string
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
}

function formatDateRu(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
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

    const {
      action,
      partner_code,
      partner_id,
      client_id,
      amount,
      payment_method,
      contact_info,
      admin_action,
      payout_percentage,
      email,
      invitation_type,
      invitation_code,
      utm_source,
      utm_medium,
      utm_campaign
    }: PartnerProgramRequest = await req.json()

    // Для отслеживания кликов авторизация пользователя не требуется
    if (action === 'track_click') {
      return await handleTrackClick(
        supabaseClient,
        partner_code,
        utm_source,
        utm_medium,
        utm_campaign,
        req.headers.get('origin')
      )
    }

    // Для всех остальных действий требуется авторизованный пользователь
    const user = await getSupabaseUser(req)
    if (!user) {
      return createJsonResponse(
        { error: 'Unauthorized' },
        401,
        req.headers.get('origin')
      )
    }

    switch (action) {
      case 'track_referral':
        return await handleTrackReferral(
          supabaseClient,
          user.id,
          partner_code,
          invitation_code,
          invitation_type,
          req.headers.get('origin'),
          utm_source,
          utm_medium,
          utm_campaign
        )
      
      case 'get_stats':
        return await handleGetStats(supabaseClient, user.id, partner_id, req.headers.get('origin'))
      
      case 'admin_manage':
        return await handleAdminManage(supabaseClient, user.id, admin_action, partner_id, payout_percentage, req.headers.get('origin'))
      
      case 'impersonate':
        return await handleImpersonate(supabaseClient, user.id, client_id, req.headers.get('origin'))
      
      case 'payout_request':
        return await handlePayoutRequest(supabaseClient, user.id, amount, payment_method, contact_info, req.headers.get('origin'))
      
      case 'send_invitation':
        return await handleSendInvitation(supabaseClient, user.id, email, invitation_type, req.headers.get('origin'))
      
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
async function handleTrackReferral(
  supabaseClient: any,
  userId: string,
  partnerCode?: string,
  invitationCode?: string,
  invitationType?: string,
  origin?: string | null,
  utmSource?: string | null,
  utmMedium?: string | null,
  utmCampaign?: string | null
) {
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

    let linkType = 'referral'
    let linkStatus = 'active'

    console.log('handleTrackReferral params:', { invitationCode, invitationType, partnerCode })

    // Если это приглашение, проверяем код приглашения
    if (invitationCode && invitationType === 'managed') {
      console.log('Processing managed invitation with code:', invitationCode, 'for partner:', partner.id)
      const { data: invitation, error: invitationError } = await supabaseClient
        .from('partner_invitations')
        .select('id, status, email, type')
        .eq('invitation_code', invitationCode)
        .eq('partner_id', partner.id)
        .eq('status', 'pending')
        .single()

      if (invitationError || !invitation) {
        console.error('Invitation not found or error:', invitationError)
        return createJsonResponse(
          { success: false, error: 'Invalid or expired invitation' },
          400,
          origin
        )
      }
      
      console.log('Found invitation:', invitation)

      // Проверяем, что приглашение имеет правильный тип
      if (invitation.type !== 'managed') {
        console.log('Invitation type mismatch - expected managed, got:', invitation.type)
        return createJsonResponse(
          { success: false, error: 'Invalid invitation type' },
          400,
          origin
        )
      }

      // Проверяем, что email совпадает (если указан)
      const { data: userProfile } = await supabaseClient
        .from('user_profiles')
        .select('email')
        .eq('id', userId)
        .single()

      console.log('User profile email:', userProfile?.email, 'Invitation email:', invitation.email)

      if (userProfile && invitation.email && userProfile.email !== invitation.email) {
        console.log('Email mismatch - user:', userProfile.email, 'invitation:', invitation.email)
        return createJsonResponse(
          { success: false, error: 'Email does not match invitation' },
          400,
          origin
        )
      }

      // Обновляем статус приглашения
      const { error: updateError } = await supabaseClient
        .from('partner_invitations')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)

      if (updateError) {
        console.error('Error updating invitation status:', updateError)
      } else {
        console.log('Invitation status updated to accepted')
      }

      linkType = 'managed'
      console.log('Set linkType to managed for invitation:', invitation.id)
    }

    // Создаём партнёрскую связь
    console.log('Creating partner link with type:', linkType)
    const { data: link, error: linkError } = await supabaseClient
      .from('partner_links')
      .insert({
        partner_id: partner.id,
        client_id: userId,
        type: linkType,
        status: linkStatus,
        accepted_at: new Date().toISOString(),
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null
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
    
    console.log('Partner link created successfully:', link)

    // Устанавливаем partner_id в профиле пользователя для всех будущих покупок
    const { error: updateProfileError } = await supabaseClient
      .from('user_profiles')
      .update({ partner_id: partner.id })
      .eq('id', userId)

    if (updateProfileError) {
      console.error('Error updating user profile with partner_id:', updateProfileError)
      // Не прерываем процесс, так как основная связь уже создана
    } else {
      console.log('User profile updated with partner_id:', partner.id)
    }

    // Получаем имя партнёра
    const { data: partnerUser } = await supabaseClient
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', partner.user_id)
      .single()

    const partnerName = partnerUser ? `${partnerUser.first_name} ${partnerUser.last_name}`.trim() : 'Unknown'

    console.log('Returning success response with link_type:', linkType)
    return createJsonResponse(
      { 
        success: true, 
        partner_name: partnerName,
        link_id: link.id,
        link_type: linkType
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

// Отслеживание кликов по реферальной ссылке (без авторизации пользователя)
async function handleTrackClick(
  supabaseClient: any,
  partnerCode?: string,
  utmSource?: string | null,
  utmMedium?: string | null,
  utmCampaign?: string | null,
  origin?: string | null
) {
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
      .select('id, status')
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

    const { error: clickError } = await supabaseClient
      .from('partner_clicks')
      .insert({
        partner_id: partner.id,
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null
      })

    if (clickError) {
      console.error('Error logging partner click:', clickError)
      return createJsonResponse(
        { success: false, error: 'Failed to log click' },
        500,
        origin
      )
    }

    return createJsonResponse(
      { success: true },
      200,
      origin
    )
  } catch (error) {
    console.error('Error in track_click:', error)
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
        utm_source,
        utm_medium,
        utm_campaign,
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

    // Получаем информацию о подписках клиентов по их проектам
    const clientIds = (links || []).map(link => link.client_id).filter(Boolean)
    let enrichedLinks = links || []

    let totalProjectsCount = 0

    if (clientIds.length > 0) {
      const { data: projects, error: projectsError } = await supabaseClient
        .from('projects')
        .select('id, name, user_id, subscription_status, subscription_expires_at')
        .in('user_id', clientIds)

      if (projectsError) {
        console.error('Error fetching client projects:', projectsError)
      } else if (projects) {
        totalProjectsCount = projects.length
        const projectsByClient: Record<string, any[]> = {}

        for (const project of projects) {
          if (!projectsByClient[project.user_id]) {
            projectsByClient[project.user_id] = []
          }
          projectsByClient[project.user_id].push(project)
        }

        enrichedLinks = enrichedLinks.map(link => {
          const clientProjects = projectsByClient[link.client_id] || []
          if (!clientProjects.length) {
            return link
          }

          let aggregatedStatus = 'none'
          let aggregatedExpiresAt: string | null = null

          // Определяем статус подписки: приоритет active > trialing > expired/trial_expired > остальные
          if (clientProjects.some(p => p.subscription_status === 'active')) {
            aggregatedStatus = 'active'
          } else if (clientProjects.some(p => p.subscription_status === 'trialing')) {
            aggregatedStatus = 'trialing'
          } else if (clientProjects.some(p => p.subscription_status === 'expired' || p.subscription_status === 'trial_expired')) {
            aggregatedStatus = 'expired'
          } else if (clientProjects[0]?.subscription_status) {
            aggregatedStatus = clientProjects[0].subscription_status
          }

          for (const project of clientProjects) {
            if (project.subscription_expires_at) {
              if (!aggregatedExpiresAt || project.subscription_expires_at > aggregatedExpiresAt) {
                aggregatedExpiresAt = project.subscription_expires_at
              }
            }
          }

          return {
            ...link,
            subscription_status: aggregatedStatus,
            subscription_expires_at: aggregatedExpiresAt,
            // Детальная информация по проектам клиента для фронтенда партнёра
            projects: clientProjects.map(project => ({
              id: project.id,
              name: project.name,
              subscription_status: project.subscription_status,
              subscription_expires_at: project.subscription_expires_at
            }))
          }
        })
      }
    }

    const referralClients = enrichedLinks.filter(link => link.type === 'referral') || []
    const managedClients = enrichedLinks.filter(link => link.type === 'managed') || []

    // Считаем количество кликов по реферальным ссылкам
    const { data: clicks, error: clicksError } = await supabaseClient
      .from('partner_clicks')
      .select('id')
      .eq('partner_id', partnerProfile.id)

    if (clicksError) {
      console.error('Error fetching partner clicks:', clicksError)
    }

    const totalClicks = clicks?.length || 0

    // Воронка конверсии
    const registrationsCount = enrichedLinks.length || 0
    const payingClientsCount = enrichedLinks.filter(link => link.subscription_status === 'active').length

    // ---------------- ПАРТНЁРСКИЕ УРОВНИ ----------------
    // Вся бизнес-логика по уровням должна опираться на таблицу commission_tiers,
    // где супер-админ настраивает промежутки и проценты комиссии.
    //
    // Здесь мы используем то же самое определение, что и в get_partner_commission_percentage:
    // количество ПРОЕКТОВ всех клиентов партнёра.
    // Уровни по-прежнему именуются хардкодом:
    // - Bronze Partner
    // - Silver Partner
    // - Gold Partner
    //
    // Но сами пороги берём из commission_tiers (для link_type = referral / NULL),
    // чтобы сообщение о максимальном уровне и прогрессе всегда совпадало с настройками супер-админа.
    const projectsCountForLevels = totalProjectsCount

    let partnerLevelName = 'Bronze Partner'
    let partnerLevelKey: 'bronze' | 'silver' | 'gold' = 'bronze'
    let nextLevelName: string | null = null
    let nextLevelRequiredActiveClients: number | null = null
    let clientsToNextLevel: number | null = null

    try {
      const { data: tiers, error: tiersError } = await supabaseClient
        .from('commission_tiers')
        .select('min_projects, max_projects, commission_percentage, link_type')
        .eq('is_active', true)
        .order('min_projects', { ascending: true })

      if (tiersError) {
        console.error('Error fetching commission_tiers:', tiersError)
      } else if (tiers && tiers.length > 0) {
        const sortedTiers = [...tiers].sort(
          (a: any, b: any) => (a.min_projects ?? 0) - (b.min_projects ?? 0)
        )

        let currentTierIndex = -1
        for (let i = 0; i < sortedTiers.length; i++) {
          const tier = sortedTiers[i]
          const min = tier.min_projects ?? 0
          const max = tier.max_projects

          if (projectsCountForLevels >= min && (max === null || projectsCountForLevels <= max)) {
            currentTierIndex = i
            break
          }
        }

        // Если не попали ни в один диапазон (например, активных клиентов меньше минимального),
        // используем самый первый уровень как базовый.
        if (currentTierIndex === -1) {
          currentTierIndex = 0
        }

        const nextTier =
          currentTierIndex < sortedTiers.length - 1
            ? sortedTiers[currentTierIndex + 1]
            : null

        // Маппинг индекса диапазона на имя уровня:
        // 0 → Bronze, 1 → Silver, 2+ → Gold
        if (currentTierIndex === 0) {
          partnerLevelName = 'Bronze Partner'
          partnerLevelKey = 'bronze'
        } else if (currentTierIndex === 1) {
          partnerLevelName = 'Silver Partner'
          partnerLevelKey = 'silver'
        } else {
          partnerLevelName = 'Gold Partner'
          partnerLevelKey = 'gold'
        }

        if (nextTier) {
          const target = nextTier.min_projects ?? projectsCountForLevels
          nextLevelRequiredActiveClients = target
          clientsToNextLevel = Math.max(target - projectsCountForLevels, 0)

          const nextIndex = currentTierIndex + 1
          if (nextIndex === 0) {
            nextLevelName = 'Bronze Partner'
          } else if (nextIndex === 1) {
            nextLevelName = 'Silver Partner'
          } else {
            nextLevelName = 'Gold Partner'
          }
        }
      }
    } catch (e) {
      console.error('Error calculating partner level from commission_tiers:', e)
    }

    // История комиссий и дохода
    const commissionClientIds = enrichedLinks.map(link => link.client_id).filter(Boolean)
    let commissions: { partner_commission_amount: number; created_at: string | null }[] = []

    if (commissionClientIds.length > 0) {
      const { data: commissionRows, error: commissionsError } = await supabaseClient
        .from('user_subscriptions')
        .select('partner_commission_amount, invoice_paid_at, created_at, user_id')
        .in('user_id', commissionClientIds)
        .not('partner_commission_amount', 'is', null)
        .order('created_at', { ascending: true })

      if (commissionsError) {
        console.error('Error fetching partner commissions:', commissionsError)
      } else if (commissionRows) {
        commissions = commissionRows.map((row: any) => ({
          partner_commission_amount: row.partner_commission_amount || 0,
          created_at: row.invoice_paid_at || row.created_at
        }))
      }
    }

    // Собираем историю дохода по дням (последние 30 дней)
    const incomeByDate: Record<string, number> = {}
    for (const c of commissions) {
      if (!c.created_at) continue
      const d = new Date(c.created_at)
      if (isNaN(d.getTime())) continue
      const key = d.toISOString().slice(0, 10)
      incomeByDate[key] = (incomeByDate[key] || 0) + (c.partner_commission_amount || 0)
    }

    const days = 30
    const incomeHistory: { date: string; amount: number }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      incomeHistory.push({
        date: key,
        amount: incomeByDate[key] || 0
      })
    }

    // История операций по счету (комиссии и выводы)
    const { data: payoutRows, error: payoutsError } = await supabaseClient
      .from('partner_payouts')
      .select('amount, status, created_at, requested_at, processed_at, payment_method')
      .eq('partner_id', partnerProfile.id)
      .order('created_at', { ascending: true })

    if (payoutsError) {
      console.error('Error fetching partner payouts:', payoutsError)
    }

    type LedgerEvent = {
      sortDate: string
      date: string
      sum: number
      comment: string
    }

    const ledgerEvents: LedgerEvent[] = []

    for (const c of commissions) {
      if (!c.created_at) continue
      const d = new Date(c.created_at)
      if (isNaN(d.getTime())) continue

      ledgerEvents.push({
        sortDate: d.toISOString(),
        date: formatDateRu(d),
        sum: c.partner_commission_amount || 0,
        comment: 'Начисление комиссии партнёра'
      })
    }

    for (const payout of payoutRows || []) {
      const baseDate = payout.processed_at || payout.requested_at || payout.created_at
      if (!baseDate) continue
      const d = new Date(baseDate)
      if (isNaN(d.getTime())) continue

      const statusLabel =
        payout.status === 'paid'
          ? 'Выплата завершена'
          : payout.status === 'approved'
          ? 'Выплата подтверждена'
          : payout.status === 'rejected'
          ? 'Выплата отклонена'
          : 'Запрос на вывод'

      const methodLabel = payout.payment_method ? ` (${payout.payment_method})` : ''

      ledgerEvents.push({
        sortDate: d.toISOString(),
        date: formatDateRu(d),
        sum: -Math.abs(payout.amount || 0),
        comment: `${statusLabel}${methodLabel}`
      })
    }

    ledgerEvents.sort((a, b) => a.sortDate.localeCompare(b.sortDate))

    let runningBalance = 0
    const transactions = ledgerEvents.map(event => {
      runningBalance += event.sum
      return {
        date: event.date,
        sum: event.sum,
        balance: runningBalance,
        comment: event.comment
      }
    })

    // Получаем доступный баланс для вывода
    const availableBalance = partnerProfile.total_earned - partnerProfile.total_withdrawn

    // Рассчитываем проценты комиссии по тем же правилам, что и в calculate_and_award_partner_commission
    // Используем хранимую функцию get_partner_commission_percentage(link_type, partner_id)
    let commissionPercentageReferral: number | null = null
    let commissionPercentageManaged: number | null = null

    try {
      const { data: referralPct } = await supabaseClient.rpc('get_partner_commission_percentage', {
        p_link_type: 'referral',
        partner_id_param: partnerProfile.id
      })

      if (typeof referralPct === 'number') {
        commissionPercentageReferral = referralPct
      }
    } catch (e) {
      console.error('Error getting referral commission percentage:', e)
    }

    try {
      const { data: managedPct } = await supabaseClient.rpc('get_partner_commission_percentage', {
        p_link_type: 'managed',
        partner_id_param: partnerProfile.id
      })

      if (typeof managedPct === 'number') {
        commissionPercentageManaged = managedPct
      }
    } catch (e) {
      console.error('Error getting managed commission percentage:', e)
    }

    return createJsonResponse(
      {
        total_clients: enrichedLinks.length || 0,
        referral_clients: referralClients.length,
        managed_clients: managedClients.length,
        total_earned: partnerProfile.total_earned,
        total_withdrawn: partnerProfile.total_withdrawn,
        available_for_withdrawal: availableBalance,
        total_clicks: totalClicks,
        clients: enrichedLinks || [],
        commissions,
        income_history: incomeHistory,
        transactions,
        funnel_registrations: registrationsCount,
        funnel_paying_clients: payingClientsCount,
        commission_percentage_referral: commissionPercentageReferral,
        commission_percentage_managed: commissionPercentageManaged,
        // Данные по партнёрским уровням и количеству проектов для фронтенда
        total_projects: totalProjectsCount,
        active_clients: totalProjectsCount,
        partner_level: partnerLevelName,
        partner_level_key: partnerLevelKey,
        next_level_name: nextLevelName,
        next_level_required_active_clients: nextLevelRequiredActiveClients,
        clients_to_next_level: clientsToNextLevel
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

async function handleAdminManage(supabaseClient: any, userId: string, adminAction?: string, targetPartnerId?: string, payoutPercentage?: number, origin?: string | null) {
  try {
    
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
              full_name,
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
        // Preserve partner's own session in other tabs:
        // the app will switch to a tab-scoped auth storage when `tab_session=1` is present.
        redirectTo: `${Deno.env.get('SITE_URL')}admin?tab_session=1`
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
async function handlePayoutRequest(supabaseClient: any, userId: string, amount?: number, paymentMethod?: string, contactInfo?: string, origin?: string | null) {
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
        contact_info: contactInfo
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

// Отправка приглашения клиенту
async function handleSendInvitation(supabaseClient: any, userId: string, email?: string, invitationType?: string, origin?: string | null) {
  if (!email) {
    return createJsonResponse(
      { error: 'Email required' },
      400,
      origin
    )
  }

  try {
    // Получаем профиль партнёра
    const { data: partnerProfile, error: partnerError } = await supabaseClient
      .from('partner_profiles')
      .select('id, partner_code, status')
      .eq('user_id', userId)
      .single()

    if (partnerError || !partnerProfile) {
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

    // Проверяем, существует ли пользователь с таким email
    const { data: existingUser } = await supabaseClient
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return createJsonResponse(
        { error: 'User with this email already exists' },
        400,
        origin
      )
    }

    // Создаём приглашение
    const invitationCode = `${partnerProfile.partner_code}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log('Creating invitation with type:', invitationType || 'managed', 'for email:', email)
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('partner_invitations')
      .insert({
        partner_id: partnerProfile.id,
        email: email,
        status: 'pending',
        invitation_code: invitationCode,
        type: invitationType || 'managed'
      })
      .select()
      .single()

    if (invitationError) {
      console.error('Error creating invitation:', invitationError)
      return createJsonResponse(
        { error: 'Failed to create invitation' },
        500,
        origin
      )
    }
    
    console.log('Invitation created successfully:', invitation)

    // Генерируем magic link для приглашения
    const siteUrl = Deno.env.get('SITE_URL') || 'https://gridix.live'
    const invitationLink = `${siteUrl}en/invitation?ref=${partnerProfile.partner_code}&invite=${invitationCode}&type=${invitationType || 'managed'}`

    const { data: inviteLinkData, error: magicLinkError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: invitationLink
    });

    console.log('Magic link data:', inviteLinkData)

    if (magicLinkError) {
      console.error('Error generating magic link:', magicLinkError)
      return createJsonResponse(
        { error: 'Failed to generate magic link' },
        500,
        origin
      )
    }

    return createJsonResponse(
      { 
        success: true, 
        invitation_id: invitation.id,
        invitation_link: invitationLink,
        invitation_code: invitationCode
      },
      200,
      origin
    )
  } catch (error) {
    console.error('Error in send_invitation:', error)
    return createJsonResponse(
      { error: 'Internal server error' },
      500,
      origin
    )
  }
}
