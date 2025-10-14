import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { getCorsHeaders, createCorsResponse, createJsonResponse } from '../_shared/cors.ts';
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
async function verifyWebhookSignature(payload, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), {
    name: "HMAC",
    hash: "SHA-256"
  }, false, [
    "sign"
  ]);
  const expectedSignature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expectedHex = Array.from(new Uint8Array(expectedSignature)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return signature === expectedHex;
}
async function fetchOrderData(orderId) {
  const apiKey = Deno.env.get("LEMONSQUEEZY_API_KEY");
  if (!apiKey) {
    console.error("LemonSqueezy API key not found");
    return null;
  }

  try {
    const response = await fetch(`https://api.lemonsqueezy.com/v1/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch order ${orderId}:`, response.status, await response.text());
      return null;
    }

    const orderData = await response.json();
    return orderData.data;
  } catch (error) {
    console.error("Error fetching order data:", error);
    return null;
  }
}

async function getPlanIdFromProductName(productName) {
  if (!productName) return null;
  
  if (productName === "Basic Plan" || productName.includes("Basic")) {
    const { data: basicPlan } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("slug", "basic")
      .single();
    return basicPlan?.id;
  } else if (productName === "Pro Plan" || productName.includes("Pro")) {
    const { data: proPlan } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("slug", "pro")
      .single();
    return proPlan?.id;
  }
  
  return null;
}

async function handleSubscriptionCreated(data) {
  const { attributes } = data;
  
  // Try to find user by custom user_id first, then fallback to email
  let user = null;
  let userError = null;
  let customUserId = null;

  // Fetch order data to get custom fields
  const orderData = await fetchOrderData(attributes.order_id);
  if (orderData && orderData.attributes && orderData.attributes.custom) {
    customUserId = orderData.attributes.custom.user_id;
  }

  // Check if custom user_id is provided in the order data
  if (customUserId) {
    const { data: userData, error: userIdError } = await supabase.auth.admin.getUserById(customUserId);
    if (!userIdError && userData && userData.user) {
      user = userData.user;
    }
  }
  
  // Fallback to email lookup if user not found by ID
  if (!user) {
    // Use listUsers to find user by email since getUserByEmail doesn't exist
    const { data: usersData, error: emailError } = await supabase.auth.admin.listUsers();
    if (!emailError && usersData && usersData.users) {
      const foundUser = usersData.users.find(u => u.email === attributes.user_email);
      if (foundUser) {
        user = foundUser;
      }
    }
    userError = emailError;
  }
  
  if (userError || !user) {
    console.error("User not found:", { 
      email: attributes.user_email, 
      customUserId,
      orderId: attributes.order_id,
      error: userError 
    });
    return;
  }
  
  // Determine plan_id from product_name
  const planId = await getPlanIdFromProductName(attributes.product_name);
  
  if (!planId) {
    console.error("Unable to determine plan_id for product:", attributes.product_name);
    return;
  }
  
  // Minimal data only: do not derive or store subscription duration or discounts
  
  // Check if subscription already exists for this user
  const { data: existingSubscription } = await supabase
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  
  let subscriptionError = null;
  
  if (existingSubscription) {
    // Update existing subscription
    const { error: updateError } = await supabase.from("user_subscriptions").update({
      plan_id: planId,
      lemon_squeezy_subscription_id: data.id,
      lemon_squeezy_customer_id: attributes.customer_id.toString(),
      status: attributes.status,
      trial_ends_at: attributes.trial_ends_at ? new Date(attributes.trial_ends_at) : null,
      current_period_start: new Date(attributes.created_at),
      current_period_end: attributes.renews_at ? new Date(attributes.renews_at) : null,
      updated_at: new Date()
    }).eq("user_id", user.id);
    subscriptionError = updateError;
  } else {
    // Create new subscription
    const { error: insertError } = await supabase.from("user_subscriptions").insert({
      user_id: user.id,
      plan_id: planId,
      lemon_squeezy_subscription_id: data.id,
      lemon_squeezy_customer_id: attributes.customer_id.toString(),
      status: attributes.status,
      trial_ends_at: attributes.trial_ends_at ? new Date(attributes.trial_ends_at) : null,
      current_period_start: new Date(attributes.created_at),
      current_period_end: attributes.renews_at ? new Date(attributes.renews_at) : null,
      cancel_at_period_end: false,
      created_at: new Date(),
      updated_at: new Date()
    });
    subscriptionError = insertError;
  }
  
  if (subscriptionError) {
    console.error("Failed to create/update subscription:", subscriptionError);
    return;
  }
  
  // Get subscription ID for history logging
  const { data: currentSubscription } = await supabase
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .single();
  
  // Log subscription history
  if (currentSubscription) {
    await supabase.from("subscription_history").insert({
      user_id: user.id,
      subscription_id: currentSubscription.id,
      action: "subscription_created",
      new_status: attributes.status,
      metadata: {
        lemon_squeezy_id: data.id,
        custom_user_id: customUserId,
        order_id: attributes.order_id
      }
    });
  }
}
async function handleSubscriptionUpdated(data) {
  const { attributes } = data;
  // Find subscription by LemonSqueezy ID
  const { data: subscription, error: subError } = await supabase.from("user_subscriptions").select("*").eq("lemon_squeezy_subscription_id", data.id).single();
  if (subError || !subscription) {
    console.error("Subscription not found:", data.id);
    return;
  }
  const oldStatus = subscription.status;
  
  // Check if plan changed (upgrade/downgrade)
  const newPlanId = await getPlanIdFromProductName(attributes.product_name);
  const planChanged = newPlanId && newPlanId !== subscription.plan_id;
  
  // Prepare update object
  const updateData = {
    status: attributes.status,
    trial_ends_at: attributes.trial_ends_at ? new Date(attributes.trial_ends_at) : null,
    cancel_at_period_end: attributes.cancelled,
    cancelled_at: attributes.cancelled ? new Date() : null,
    current_period_end: attributes.renews_at ? new Date(attributes.renews_at) : (attributes.ends_at ? new Date(attributes.ends_at) : subscription.current_period_end),
    updated_at: new Date(),
    ...(planChanged && { plan_id: newPlanId })
  };
  
  // Update subscription
  const { error: updateError } = await supabase.from("user_subscriptions").update(updateData).eq("id", subscription.id);
  if (updateError) {
    console.error("Failed to update subscription:", updateError);
    return;
  }
  // Log subscription history
  await supabase.from("subscription_history").insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    action: planChanged ? "plan_changed" : "subscription_updated",
    old_status: oldStatus,
    new_status: attributes.status,
    metadata: {
      lemon_squeezy_id: data.id,
      cancelled: attributes.cancelled,
      plan_changed: planChanged,
      new_plan_id: planChanged ? newPlanId : undefined,
      product_name: attributes.product_name
    }
  });

  console.log('subscription_updated', attributes.status, planChanged ? `(plan changed to ${attributes.product_name})` : '');
  
}
async function handleSubscriptionResumed(data) {
  const { attributes } = data;
  // Find subscription by LemonSqueezy ID
  const { data: subscription, error: subError } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("lemon_squeezy_subscription_id", data.id)
    .single();
  if (subError || !subscription) {
    console.error("Subscription not found:", data.id);
    return;
  }
  const oldStatus = subscription.status;

  // When subscription is resumed, reset cancellation flags
  const { error: updateError } = await supabase
    .from("user_subscriptions")
    .update({
      status: attributes.status || "active",
      cancel_at_period_end: false,
      cancelled_at: null,
      trial_ends_at: attributes.trial_ends_at ? new Date(attributes.trial_ends_at) : subscription.trial_ends_at,
      current_period_end: attributes.renews_at ? new Date(attributes.renews_at) : subscription.current_period_end,
      updated_at: new Date(),
    })
    .eq("id", subscription.id);

  if (updateError) {
    console.error("Failed to resume subscription:", updateError);
    return;
  }

  await supabase.from("subscription_history").insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    action: "subscription_resumed",
    old_status: oldStatus,
    new_status: attributes.status || "active",
    metadata: {
      lemon_squeezy_id: data.id,
    },
  });

  console.log('subscription_resumed', attributes.status || "active");

}
async function handleSubscriptionCancelled(data) {
  const { attributes } = data;
  // Find subscription by LemonSqueezy ID
  const { data: subscription, error: subError } = await supabase.from("user_subscriptions").select("*").eq("lemon_squeezy_subscription_id", data.id).single();
  if (subError || !subscription) {
    console.error("Subscription not found:", data.id);
    return;
  }
  // Update subscription
  const { error: updateError } = await supabase.from("user_subscriptions").update({
    status: "cancelled",
    cancelled_at: new Date(),
    updated_at: new Date()
  }).eq("id", subscription.id);
  if (updateError) {
    console.error("Failed to cancel subscription:", updateError);
    return;
  }
  // Log subscription history
  await supabase.from("subscription_history").insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    action: "subscription_cancelled",
    old_status: subscription.status,
    new_status: "cancelled",
    metadata: {
      lemon_squeezy_id: data.id
    }
  });
  
  console.log('subscription_cancelled', data.id);
}

async function handleSubscriptionExpired(data) {
  const { attributes } = data;
  // Find subscription by LemonSqueezy ID
  const { data: subscription, error: subError } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("lemon_squeezy_subscription_id", data.id)
    .single();
  
  if (subError || !subscription) {
    console.error("Subscription not found:", data.id);
    return;
  }
  
  const oldStatus = subscription.status;
  
  // Update subscription to expired status
  const { error: updateError } = await supabase
    .from("user_subscriptions")
    .update({
      status: "expired",
      current_period_end: attributes.ends_at ? new Date(attributes.ends_at) : subscription.current_period_end,
      updated_at: new Date()
    })
    .eq("id", subscription.id);
    
  if (updateError) {
    console.error("Failed to expire subscription:", updateError);
    return;
  }
  
  // Log subscription history
  await supabase.from("subscription_history").insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    action: "subscription_expired",
    old_status: oldStatus,
    new_status: "expired",
    metadata: {
      lemon_squeezy_id: data.id,
      ended_at: attributes.ends_at
    }
  });
  
  console.log('subscription_expired', data.id);
}
Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  
  if (req.method === 'OPTIONS') {
    return createCorsResponse(origin);
  }
  
  if (req.method !== "POST") {
    return createJsonResponse({ error: "Method not allowed" }, 405, origin);
  }
  try {
    const signature = req.headers.get("x-signature");
    const webhookSecret = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");
    if (!signature || !webhookSecret) {
      return createJsonResponse({ error: "Missing signature or webhook secret" }, 400, origin);
    }
    const payload = await req.text();
    // Verify webhook signature
    const isValid = await verifyWebhookSignature(payload, signature, webhookSecret);
    if (!isValid) {
      return createJsonResponse({ error: "Invalid signature" }, 401, origin);
    }
    const webhookPayload = JSON.parse(payload);
    const { meta, data } = webhookPayload;
    console.log(`Received webhook: ${meta.event_name}`);
    console.log('data', data)
    switch (meta.event_name) {
      case "subscription_created":
        await handleSubscriptionCreated(data);
        break;
      case "subscription_updated":
        await handleSubscriptionUpdated(data);
        break;
      case "subscription_cancelled":
        await handleSubscriptionCancelled(data);
        break;
      case "subscription_resumed":
        await handleSubscriptionResumed(data);
        break;
      case "subscription_expired":
        await handleSubscriptionExpired(data);
        break;
      case "subscription_paused":
        await handleSubscriptionUpdated(data);
        break;
      case "subscription_unpaused":
        await handleSubscriptionResumed(data);
        break;
      default:
        console.log(`Unhandled webhook event: ${meta.event_name}`);
    }
    return createJsonResponse({ status: "OK" }, 200, origin);
  } catch (error) {
    console.error("Webhook error:", error);
    return createJsonResponse({ error: "Internal server error" }, 500, origin);
  }
});
