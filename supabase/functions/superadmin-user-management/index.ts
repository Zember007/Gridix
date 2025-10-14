import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user is superadmin
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = profile?.email === 'inbox@gridix.live';
    
    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Superadmin access required' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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

        return new Response(
          JSON.stringify({ success: true, user: authData.user }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
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

        return new Response(
          JSON.stringify({ 
            success: true, 
            redirect_url: sessionData.properties?.action_link,
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
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

        return new Response(
          JSON.stringify({ success: true }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
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

        return new Response(
          JSON.stringify({ success: true, subscription: subscriptionData }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
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

        return new Response(
          JSON.stringify({ success: true }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
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

        return new Response(
          JSON.stringify({ success: true, refund: refundData }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});