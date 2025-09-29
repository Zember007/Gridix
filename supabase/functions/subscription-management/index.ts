import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { lemonSqueezySetup } from "https://esm.sh/@lemonsqueezy/lemonsqueezy.js@3";
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
// Setup LemonSqueezy
lemonSqueezySetup({
  apiKey: Deno.env.get("LEMONSQUEEZY_API_KEY") ?? "",
  onError: (error)=>console.error("LemonSqueezy error:", error)
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

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
async function handleGetPurchaseLinks(req) {
  try {
    // Get user from JWT to include user data in purchase links
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Missing authorization header", {
        status: 401,
        headers: corsHeaders
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

    // Create purchase links with user data
    const userEmail = encodeURIComponent(user.email || '');
    const userName = encodeURIComponent(user.user_metadata?.full_name || user.email || '');
    const userId = encodeURIComponent(user.id);
    
    const basicPlanLink = `https://gridixlive.lemonsqueezy.com/buy/32720a42-0349-4e77-96d9-7c32f9e7ac3f?embed=1&checkout[email]=${userEmail}&checkout[name]=${userName}&checkout[custom][user_id]=${userId}`;
    const proPlanLink = `https://gridixlive.lemonsqueezy.com/buy/90042763-2bfc-42e2-a4f5-3c8dd8906b17?embed=1&checkout[email]=${userEmail}&checkout[name]=${userName}&checkout[custom][user_id]=${userId}`;
    
    return new Response(JSON.stringify({
      basic: {
        name: "Basic Plan",
        price: "$79/month",
        link: basicPlanLink,
        features: ["Floor plan builder", "Basic templates", "Export to PDF", "Email support"]
      },
      pro: {
        name: "Pro Plan", 
        price: "$129/month",
        link: proPlanLink,
        features: ["All Basic features", "CRM integration", "Custom domain", "Advanced templates", "Priority support", "Analytics"]
      }
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Get purchase links error:", error);
    return new Response("Internal server error", {
      status: 500,
      headers: corsHeaders
    });
  }
}

async function handleGetSubscription(req) {
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
      `).eq("user_id", user.id).single();
    if (subError) {
      return new Response("Subscription not found", {
        status: 404,
        headers: corsHeaders
      });
    }
    // Check if trial has expired
    const now = new Date();
    const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
    const isTrialExpired = trialEndsAt && now > trialEndsAt;
    // Update status if trial expired
    if (subscription.status === 'trialing' && isTrialExpired) {
      await supabase.from("user_subscriptions").update({
        status: 'trial_expired'
      }).eq("id", subscription.id);
      subscription.status = 'trial_expired';
    }
    return new Response(JSON.stringify({
      subscription,
      isTrialActive: subscription.status === 'trialing' && !isTrialExpired,
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
async function handleGetManagementUrl(req) {
  try {
    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Missing authorization header", {
        status: 401,
        headers: corsHeaders
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
    
    // Get user subscription
    const { data: subscription, error: subError } = await supabase.from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();
      
    if (subError || !subscription) {
      return new Response("Subscription not found", {
        status: 404,
        headers: corsHeaders
      });
    }
    
    // Get management URL from LemonSqueezy
    const { getSubscription } = await import("https://esm.sh/@lemonsqueezy/lemonsqueezy.js@3");
    const subscriptionResult = await getSubscription(subscription.lemon_squeezy_subscription_id);
    
    if (subscriptionResult.error) {
      console.error("Failed to get subscription from LemonSqueezy:", subscriptionResult.error);
      return new Response("Failed to get management URL", {
        status: 500,
        headers: corsHeaders
      });
    }
    
    const managementUrl = subscriptionResult.data?.data.attributes.urls?.customer_portal;
    
    return new Response(JSON.stringify({
      managementUrl: managementUrl || `https://gridixlive.lemonsqueezy.com/billing`
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Get management URL error:", error);
    return new Response("Internal server error", {
      status: 500,
      headers: corsHeaders
    });
  }
}
async function handleGetPlans(req) {
  try {
    // Get all active plans with discounts
    const { data: plans, error: plansError } = await supabase.from("subscription_plans").select("*").eq("is_active", true).order("base_price");
    const { data: discounts, error: discountsError } = await supabase.from("subscription_discounts").select("*").eq("is_active", true).order("duration_months");
    if (plansError || discountsError) {
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
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders } });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;
    
    switch(action){
      case "get-purchase-links":
        return await handleGetPurchaseLinks(req);
      case "get-plans":
        return await handleGetPlans(req);
      case "get-management-url":
        return await handleGetManagementUrl(req);
      default:
        // Default action is get subscription
        return await handleGetSubscription(req);
    }
  } catch (error) {
    console.error("Handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
