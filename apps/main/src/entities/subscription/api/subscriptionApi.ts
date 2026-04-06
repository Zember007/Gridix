import { supabase } from "@gridix/utils/api";
import { fetchCurrentSession } from "@gridix/utils";
import type { BillingDetails } from "@/entities/subscription/queries/useSubscription";

export const fetchSubscription = async (projectId: string) => {
  const sessionData = await fetchCurrentSession();

  const { data, error } = await supabase.functions.invoke(
    "subscription-management",
    {
      body: { project_id: projectId },
      headers: {
        Authorization: `Bearer ${sessionData.session?.access_token}`,
      },
    },
  );

  if (error) throw error;

  return data;
};

export const fetchProjectSubscriptions = async () => {
  const sessionData = await fetchCurrentSession();

  const { data, error } = await supabase.functions.invoke(
    "subscription-management",
    {
      body: { action: "get-project-subscriptions" },
      headers: {
        Authorization: `Bearer ${sessionData.session?.access_token}`,
      },
    },
  );

  if (error) throw error;

  return data;
};

export const fetchPlans = async () => {
  const sessionData = await fetchCurrentSession();
  const headers: Record<string, string> = {};

  if (sessionData.session?.access_token) {
    headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
  }

  const { data, error } = await supabase.functions.invoke(
    "subscription-management",
    {
      body: { action: "get-plans" },
      headers,
    },
  );

  if (error) throw error;

  return data;
};

export const requestInvoice = async (
  projectId: string,
  planId: string,
  durationMonths: number,
) => {
  const sessionData = await fetchCurrentSession();

  const { data, error } = await supabase.functions.invoke(
    "subscription-management",
    {
      body: {
        action: "request-invoice",
        project_id: projectId,
        plan_id: planId,
        duration_months: durationMonths,
      },
      headers: {
        Authorization: `Bearer ${sessionData.session?.access_token}`,
      },
    },
  );

  if (error) throw error;

  return data;
};

export const requestInvoiceForMultiple = async (
  projectIds: string[],
  planId: string,
  durationMonths: number,
) => {
  const results = await Promise.all(
    projectIds.map((projectId) =>
      requestInvoice(projectId, planId, durationMonths),
    ),
  );

  return results;
};

export const createStripeCheckoutSession = async (
  projectIds: string[],
  planId: string,
  durationMonths: number,
) => {
  const sessionData = await fetchCurrentSession();

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://gridix.live";

  const { data, error } = await supabase.functions.invoke("stripe-billing", {
    body: {
      action: "create-checkout-session",
      project_ids: projectIds,
      plan_id: planId,
      duration_months: durationMonths,
      success_url: `${origin}/admin?page=subscription`,
      cancel_url: `${origin}/admin?page=subscription`,
    },
    headers: {
      Authorization: `Bearer ${sessionData.session?.access_token}`,
    },
  });

  if (error) throw error;

  return data as {
    success: boolean;
    url?: string;
    session_id?: string;
    added?: boolean;
    error?: string;
  };
};

export const changeStripeSubscriptionPlan = async (
  projectId: string,
  planId: string,
  durationMonths: number,
) => {
  const sessionData = await fetchCurrentSession();

  const { data, error } = await supabase.functions.invoke("stripe-billing", {
    body: {
      action: "change-plan",
      project_id: projectId,
      plan_id: planId,
      duration_months: durationMonths,
    },
    headers: {
      Authorization: `Bearer ${sessionData.session?.access_token}`,
    },
  });

  if (error) throw error;

  return data as {
    success: boolean;
    error?: string;
    message?: string;
  };
};

export const createStripePortalSession = async (): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> => {
  const sessionData = await fetchCurrentSession();
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://gridix.live";

  const { data, error } = await supabase.functions.invoke("stripe-billing", {
    body: {
      action: "create-portal-session",
      return_url: `${origin}/admin?page=subscription`,
    },
    headers: {
      Authorization: `Bearer ${sessionData.session?.access_token}`,
    },
  });

  if (error) throw error;

  return data as { success: boolean; url?: string; error?: string };
};

export const fetchCustomerSubscriptions = async () => {
  const sessionData = await fetchCurrentSession();

  const { data, error } = await supabase.functions.invoke("stripe-billing", {
    body: { action: "get-customer-subscriptions" },
    headers: {
      Authorization: `Bearer ${sessionData.session?.access_token}`,
    },
  });

  if (error) throw error;

  return data as {
    success: boolean;
    subscriptions: CustomerSubscriptionResponse[];
  };
};

export interface CustomerSubscriptionResponse {
  id: string;
  stripe_subscription_id: string | null;
  billing_interval: string;
  billing_interval_count: number;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  subscription_line_items: SubscriptionLineItemResponse[];
}

export interface SubscriptionLineItemResponse {
  id: string;
  stripe_subscription_item_id: string | null;
  item_type: "project" | "module";
  project_id: string | null;
  module_slug: string | null;
  plan_id: string | null;
  plan_slug: string;
  effective_price: number | null;
  discount_percentage: number;
  status: string;
  created_at: string;
}

export interface StripeInvoiceItem {
  id: string;
  number: string | null;
  status: string;
  total: number;
  currency: string;
  created: number;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  period_start: number;
  period_end: number;
  subscription: string | { id: string } | null;
}

export const fetchStripeInvoices = async (): Promise<{
  success: boolean;
  invoices: StripeInvoiceItem[];
}> => {
  const sessionData = await fetchCurrentSession();

  const { data, error } = await supabase.functions.invoke("stripe-billing", {
    body: { action: "get-stripe-invoices" },
    headers: {
      Authorization: `Bearer ${sessionData.session?.access_token}`,
    },
  });

  if (error) throw error;
  return data as { success: boolean; invoices: StripeInvoiceItem[] };
};

export const createSetupIntent = async (): Promise<{
  success: boolean;
  client_secret: string;
}> => {
  const sessionData = await fetchCurrentSession();

  const { data, error } = await supabase.functions.invoke("stripe-billing", {
    body: { action: "create-setup-intent" },
    headers: {
      Authorization: `Bearer ${sessionData.session?.access_token}`,
    },
  });

  if (error) throw error;
  return data as { success: boolean; client_secret: string };
};

export const setDefaultPaymentMethod = async (
  paymentMethodId: string,
): Promise<{ success: boolean }> => {
  const sessionData = await fetchCurrentSession();

  const { data, error } = await supabase.functions.invoke("stripe-billing", {
    body: {
      action: "set-default-payment-method",
      payment_method_id: paymentMethodId,
    },
    headers: {
      Authorization: `Bearer ${sessionData.session?.access_token}`,
    },
  });

  if (error) throw error;
  return data as { success: boolean };
};

export const cancelStripeSubscriptionForProject = async (
  projectId: string,
): Promise<{ success: boolean }> => {
  const sessionData = await fetchCurrentSession();

  const { data, error } = await supabase.functions.invoke("stripe-billing", {
    body: { action: "remove-projects", project_ids: [projectId] },
    headers: {
      Authorization: `Bearer ${sessionData.session?.access_token}`,
    },
  });

  if (error) throw error;
  return data as { success: boolean };
};

export const resumeStripeSubscriptionForProject = async (
  projectId: string,
): Promise<{ success: boolean }> => {
  const sessionData = await fetchCurrentSession();

  const { data, error } = await supabase.functions.invoke("stripe-billing", {
    body: { action: "resume-subscription", project_id: projectId },
    headers: {
      Authorization: `Bearer ${sessionData.session?.access_token}`,
    },
  });

  if (error) throw error;
  return data as { success: boolean };
};

export const fetchBillingDetails = async (userId: string) => {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, email, phone, tax_id, legal_address")
    .eq("id", userId)
    .single();

  const { data: company } = await supabase
    .from("company_settings")
    .select("company_name, tax_id, address, phone, email")
    .eq("user_id", userId)
    .maybeSingle();

  return { profile, company };
};

export const saveBillingDetails = async (
  userId: string,
  details: BillingDetails,
) => {
  const profileUpdate: Record<string, string> = {};

  if (details.type === "individual") {
    if (details.name) profileUpdate.full_name = details.name;
    if (details.taxId) profileUpdate.tax_id = details.taxId;
    if (details.address) profileUpdate.legal_address = details.address;
  }

  if (details.email) profileUpdate.email = details.email;
  if (details.phone) profileUpdate.phone = details.phone;

  if (Object.keys(profileUpdate).length > 0) {
    await supabase.from("user_profiles").update(profileUpdate).eq("id", userId);
  }

  if (details.type === "company") {
    const companyPayload = {
      user_id: userId,
      company_name: details.companyName || details.name,
      tax_id: details.taxId || null,
      address: details.address || null,
      phone: details.phone,
      email: details.email,
    };

    await supabase
      .from("company_settings")
      .upsert(companyPayload, { onConflict: "user_id" });
  }
};
