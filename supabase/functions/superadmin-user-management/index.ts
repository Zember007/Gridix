import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, createCorsResponse, createJsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return createCorsResponse(origin);
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return createJsonResponse({ error: 'Unauthorized' }, 401, origin);
    }

    // Check if user is superadmin
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = profile?.email === 'inbox@gridix.live';
    
    if (!isSuperAdmin) {
      return createJsonResponse({ error: 'Forbidden: Superadmin access required' }, 403, origin);
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case 'create_user': {
        const { email, password, full_name, company_name, phone } = params;

        // Create auth user
        const { data: authData, error: createError } = await supabaseClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (createError) {
          throw createError;
        }

        // Update user profile
        const { error: profileError } = await supabaseClient
          .from('user_profiles')
          .update({
            full_name,
            company_name,
            phone,
            email,
          })
          .eq('id', authData.user.id);

        if (profileError) {
          throw profileError;
        }

        return createJsonResponse({ success: true, user: authData.user }, 200, origin);
      }

      case 'impersonate_user': {
        const { user_id } = params;

        // Generate a new session for the target user
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.admin.generateLink({
          type: 'magiclink',
          email: (await supabaseClient.from('user_profiles').select('email').eq('id', user_id).single()).data?.email || '',
        });

        if (sessionError) {
          throw sessionError;
        }

        return createJsonResponse({ 
          success: true, 
          redirect_url: sessionData.properties?.action_link,
        }, 200, origin);
      }

      case 'unban_user': {
        const { user_id } = params;

        const { error: unbanError } = await supabaseClient
          .from('banned_users')
          .update({ unbanned_at: new Date().toISOString() })
          .eq('user_id', user_id)
          .is('unbanned_at', null);

        if (unbanError) {
          throw unbanError;
        }

        return createJsonResponse({ success: true }, 200, origin);
      }

      case 'create_subscription': {
        const { user_email, plan_id, duration_months } = params;

        // Find user by email
        const { data: userData, error: userError } = await supabaseClient
          .from('user_profiles')
          .select('id')
          .eq('email', user_email)
          .single();

        if (userError || !userData) {
          throw new Error('User not found');
        }

        // Get plan details
        const { data: planData, error: planError } = await supabaseClient
          .from('subscription_plans')
          .select('*')
          .eq('id', plan_id)
          .single();

        if (planError || !planData) {
          throw new Error('Plan not found');
        }

        // Calculate subscription end date
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + duration_months);

        // Create subscription
        const { data: subscriptionData, error: subscriptionError } = await supabaseClient
          .from('user_subscriptions')
          .insert({
            user_id: userData.id,
            plan_id: plan_id,
            status: 'active',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            created_at: startDate.toISOString(),
          })
          .select()
          .single();

        if (subscriptionError) {
          throw subscriptionError;
        }

        return createJsonResponse({ success: true, subscription: subscriptionData }, 200, origin);
      }

      case 'cancel_subscription': {
        const { subscription_id } = params;

        const { error: cancelError } = await supabaseClient
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            cancel_at_period_end: true,
            cancelled_at: new Date().toISOString(),
          })
          .eq('id', subscription_id);

        if (cancelError) {
          throw cancelError;
        }

        return createJsonResponse({ success: true }, 200, origin);
      }

      case 'refund_subscription': {
        const { subscription_id, refund_amount, reason } = params;

        // Get subscription details
        const { data: subscriptionData, error: subscriptionError } = await supabaseClient
          .from('user_subscriptions')
          .select('*, subscription_plans(*)')
          .eq('id', subscription_id)
          .single();

        if (subscriptionError || !subscriptionData) {
          throw new Error('Subscription not found');
        }

        // Create refund record
        const { data: refundData, error: refundError } = await supabaseClient
          .from('subscription_refunds')
          .insert({
            subscription_id: subscription_id,
            amount: refund_amount || subscriptionData.subscription_plans.price,
            reason: reason || 'Admin refund',
            processed_at: new Date().toISOString(),
            processed_by: user.id,
          })
          .select()
          .single();

        if (refundError) {
          throw refundError;
        }

        // Update subscription status
        const { error: updateError } = await supabaseClient
          .from('user_subscriptions')
          .update({
            status: 'refunded',
            refunded_at: new Date().toISOString(),
          })
          .eq('id', subscription_id);

        if (updateError) {
          throw updateError;
        }

        return createJsonResponse({ success: true, refund: refundData }, 200, origin);
      }

      default:
        return createJsonResponse({ error: 'Invalid action' }, 400, origin);
    }
  } catch (error) {
    return createJsonResponse({ error: error.message }, 500, origin);
  }
});