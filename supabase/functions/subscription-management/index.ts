import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, createCorsResponse, createJsonResponse } from '../_shared/cors.ts';

const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

async function calculatePrice(basePriceStr, durationMonths) {
  const basePrice = parseFloat(basePriceStr);
  // Get discount for duration
  const { data: discount } = await supabase.from("subscription_discounts").select("discount_percentage").eq("duration_months", durationMonths).eq("is_active", true).single();
  const discountPercentage = discount?.discount_percentage || 0;
  const discountAmount = basePrice * discountPercentage / 100;
  const finalPrice = (basePrice - discountAmount) * durationMonths;
  return {
    finalPrice,
    discountPercentage
  };
}
async function handleRequestInvoice(req, body, corsHeaders) {
  const origin = req.headers.get('Origin');
  try {
    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createJsonResponse({ error: "Missing authorization header" }, 401, origin);
    }
    
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return createJsonResponse({ error: "Invalid token" }, 401, origin);
    }

    // Expect project_id, plan_id, and duration_months in request body
    // Body is now passed as parameter

    const projectId = body.project_id as string | undefined;
    const planId = body.plan_id as string | undefined;
    const durationMonths = body.duration_months as number | undefined;

    if (!projectId || !planId || !durationMonths) {
      return createJsonResponse({ error: "Missing required fields: project_id, plan_id, duration_months", data: body }, 400, origin);
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return createJsonResponse({ error: "Project not found or access denied" }, 404, origin);
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return createJsonResponse({ error: "Plan not found" }, 404, origin);
    }

    // Calculate pricing
    const { finalPrice, discountPercentage } = await calculatePrice(plan.base_price, durationMonths);

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${projectId.substring(0, 8)}`;

    // Create or update subscription with invoice request
    const { data: existingSub } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    let subscriptionId;
    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({
          plan_id: planId,
          duration_months: durationMonths,
          discount_percentage: discountPercentage,
          final_price: finalPrice,
          status: 'pending_payment',
          invoice_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", existingSub.id);
      
      if (updateError) {
        throw updateError;
      }
      subscriptionId = existingSub.id;
    } else {
      // Create new subscription request
      const { data: newSubscription, error: insertError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: user.id,
          project_id: projectId,
          plan_id: planId,
          duration_months: durationMonths,
          discount_percentage: discountPercentage,
          final_price: finalPrice,
          status: 'pending_payment',
          invoice_requested_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (insertError) {
        throw insertError;
      }
      subscriptionId = newSubscription.id;
    }

    return createJsonResponse({
      success: true,
      invoice: {
        subscription_id: subscriptionId,
        invoice_number: invoiceNumber,
        project_name: project.name,
        plan_name: plan.name,
        duration_months: durationMonths,
        monthly_price: parseFloat(plan.base_price),
        discount_percentage: discountPercentage,
        total_price: finalPrice,
        status: 'pending_payment'
      }
    }, 200, origin);
  } catch (error) {
    console.error("Request invoice error:", error);
    return createJsonResponse({ error: "Internal server error" }, 500, origin);
  }
}

async function handleGetSubscription(req, body, corsHeaders) {
  try {
    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Missing authorization header", {
        status: 401
      });
    }
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return new Response("Invalid token", {
        status: 401,
        headers: corsHeaders
      });
    }
    // Expect project_id in body for per-project subscription
    // Body is now passed as parameter
    const projectId = body.project_id as string | undefined;
    if (!projectId) {
      return new Response("project_id is required", {
        status: 400,
        headers: corsHeaders
      });
    }
    // Get user subscription with plan details
    const { data: subscription, error: subError } = await supabase.from("user_subscriptions").select(`
        *,
        subscription_plans (
          name,
          slug,
          description,
          base_price,
          features
        )
      `).eq("user_id", user.id).eq("project_id", projectId).maybeSingle();
    if (subError) {
      return new Response("Subscription not found", {
        status: 404,
        headers: corsHeaders
      });
    }
    // Check if trial has expired
    const now = new Date();
    const trialEndsAt = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
    const isTrialExpired = trialEndsAt && now > trialEndsAt;
    // Update status if trial expired
    if (subscription && subscription.status === 'trialing' && isTrialExpired) {
      await supabase.from("user_subscriptions").update({
        status: 'trial_expired'
      }).eq("id", subscription.id);
      subscription.status = 'trial_expired';
    }
    return new Response(JSON.stringify({
      subscription,
      isTrialActive: subscription ? (subscription.status === 'trialing' && !isTrialExpired) : false,
      trialDaysRemaining: trialEndsAt && !isTrialExpired ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return new Response("Internal server error", {
      status: 500,
      headers: corsHeaders
    });
  }
}
async function handleGetProjectSubscriptions(req, corsHeaders) {
  const origin = req.headers.get('Origin');
  try {
    console.log("handleGetProjectSubscriptions: Starting request");
    
    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("handleGetProjectSubscriptions: Missing authorization header");
      return createJsonResponse({ error: "Missing authorization header" }, 401, origin);
    }
    
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      console.log("handleGetProjectSubscriptions: Invalid token or user error:", userError);
      return createJsonResponse({ error: "Invalid token" }, 401, origin);
    }
    
    console.log("handleGetProjectSubscriptions: User authenticated:", user.id);

    // Get all projects for user with their subscription status
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select(`
        id,
        name,
        subscription_status,
        subscription_expires_at,
        user_id,
        user_profiles (
          id,
          email,
          full_name,
          company_name
        ),
        user_subscriptions (
          id,
          status,
          current_period_end,
          invoice_number,
          invoice_url,
          invoice_requested_at,
          plan_id,
          final_price,
          subscription_plans (
            name,
            slug,
            base_price
          )
        )
      `)
      .eq("user_id", user.id)
      .order('created_at', { ascending: false });

    console.log("handleGetProjectSubscriptions: Projects query result:", { projects, projectsError });

    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
      return createJsonResponse({ error: "Failed to fetch projects: " + projectsError.message }, 500, origin);
    }

    console.log("handleGetProjectSubscriptions: Returning projects:", projects?.length || 0);
    return createJsonResponse({
      projects: projects || []
    }, 200, origin);
  } catch (error) {
    console.error("Get project subscriptions error:", error);
    return createJsonResponse({ error: "Internal server error" }, 500, origin);
  }
}
async function handleGetPlans(req, corsHeaders) {
  try {
    // Get all active plans with discounts
    // No authentication required for viewing plans
    const { data: plans, error: plansError } = await supabase.from("subscription_plans").select("*").eq("is_active", true).order("base_price");
    const { data: discounts, error: discountsError } = await supabase.from("subscription_discounts").select("*").eq("is_active", true).order("duration_months");
    if (plansError || discountsError) {
      console.error("Error fetching plans:", plansError || discountsError);
      return new Response("Failed to fetch plans", {
        status: 500,
        headers: corsHeaders
      });
    }
    // Calculate prices for each plan and duration combination
    const plansWithPricing = plans.map((plan)=>({
        ...plan,
        pricing: discounts.map((discount)=>{
          const { finalPrice, discountPercentage } = {
            finalPrice: parseFloat(plan.base_price) * (100 - discount.discount_percentage) / 100 * discount.duration_months,
            discountPercentage: discount.discount_percentage
          };
          return {
            durationMonths: discount.duration_months,
            discountPercentage,
            monthlyPrice: parseFloat(plan.base_price),
            totalPrice: finalPrice,
            savings: parseFloat(plan.base_price) * discount.duration_months - finalPrice
          };
        })
      }));
    return new Response(JSON.stringify({
      plans: plansWithPricing,
      discounts
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Get plans error:", error);
    return new Response("Internal server error", {
      status: 500,
      headers: corsHeaders
    });
  }
}

async function handleGenerateInvoice(req: Request, body: any, corsHeaders: Record<string, string>) {
  const origin = req.headers.get('Origin');
  
  try {
    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createJsonResponse({ error: "Missing authorization header" }, 401, origin);
    }
    
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return createJsonResponse({ error: "Invalid token" }, 401, origin);
    }

    const { subscription_id } = body;
    if (!subscription_id) {
      return createJsonResponse({ error: "Missing subscription_id" }, 400, origin);
    }

    // Call the generate-invoice function
    const { data, error } = await supabase.functions.invoke('generate-invoice', {
      body: { subscription_id },
      headers: {
        'Authorization': `Bearer ${jwt}`,
      },
    });

    if (error) {
      return createJsonResponse({ error: error.message }, 500, origin);
    }

    return createJsonResponse(data, 200, origin);
  } catch (error) {
    console.error("Generate invoice error:", error);
    return createJsonResponse({ error: "Internal server error" }, 500, origin);
  }
}

async function handleConfirmPayment(req: Request, body: any, corsHeaders: Record<string, string>) {
  const origin = req.headers.get('Origin');
  
  try {
    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createJsonResponse({ error: "Missing authorization header" }, 401, origin);
    }
    
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return createJsonResponse({ error: "Invalid token" }, 401, origin);
    }

    const { subscription_id } = body;
    if (!subscription_id) {
      return createJsonResponse({ error: "Missing subscription_id" }, 400, origin);
    }

    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .single();

    if (subError || !subscription) {
      return createJsonResponse({ error: "Subscription not found" }, 404, origin);
    }

    // Find partner for this client and set it in user profile if not already set
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('partner_id')
      .eq('id', subscription.user_id)
      .single();

    let partnerId = userProfile?.partner_id;
    if (!partnerId) {
      const { data: partnerLink } = await supabase
        .from('partner_links')
        .select('partner_id')
        .eq('client_id', subscription.user_id)
        .eq('status', 'active')
        .single();
      
      if (partnerLink) {
        partnerId = partnerLink.partner_id;
        
        // Set partner_id in user profile for future purchases
        await supabase
          .from('user_profiles')
          .update({ partner_id: partnerId })
          .eq('id', subscription.user_id);
      }
    }

    // Calculate subscription period
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (subscription.duration_months || 1));

    // Update subscription to active (triggers commission calculation)
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        invoice_paid_at: new Date().toISOString(),
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription_id);

    if (updateError) {
      return createJsonResponse({ error: "Failed to activate subscription" }, 500, origin);
    }

    return createJsonResponse({
      success: true,
      message: "Payment confirmed and subscription activated"
    }, 200, origin);
  } catch (error) {
    console.error("Confirm payment error:", error);
    return createJsonResponse({ error: "Internal server error" }, 500, origin);
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);
  const url = new URL(req.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return createCorsResponse(origin);
  }

  try {
    const body = await req.json();
    const action = body.action;
    
    switch(action){
      case "get-plans":
        return await handleGetPlans(req, corsHeaders);
      case "request-invoice":
        return await handleRequestInvoice(req, body, corsHeaders);
      case "get-project-subscriptions":
        return await handleGetProjectSubscriptions(req, corsHeaders);
      case "generate-invoice":
        return await handleGenerateInvoice(req, body, corsHeaders);
      case "confirm-payment":
        return await handleConfirmPayment(req, body, corsHeaders);
      default:
        // Default action is get subscription for a specific project
        return await handleGetSubscription(req, body, corsHeaders);
    }
  } catch (error) {
    console.error("Handler error:", error);
    return createJsonResponse({ error: error.message }, 500, origin);
  }
});
