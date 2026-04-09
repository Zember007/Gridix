import { useState, useEffect } from "react";
import { supabase } from "@gridix/utils/api";
import { fetchCurrentSession } from "@gridix/utils";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: string;
  currency: string;
  features: string[];
  is_active: boolean;
  pricing: {
    durationMonths: number;
    discountPercentage: number;
    monthlyPrice: number;
    totalPrice: number;
    savings: number;
  }[];
}

export interface UserSubscription {
  id: string;
  user_id: string;
  project_id: string;
  plan_id: string;
  lemon_squeezy_subscription_id: string | null;
  lemon_squeezy_customer_id: string | null;
  status: string;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  duration_months: number;
  discount_percentage: number;
  final_price: number | null;
  invoice_number: string | null;
  invoice_url: string | null;
  invoice_requested_at: string | null;
  invoice_generated_at?: string | null;
  created_at?: string | null;
  payment_method?: string | null;
  subscription_plans: {
    name: string;
    slug: string;
    description: string;
    base_price: string;
    features: string[];
  };
}

export interface ProjectSubscription {
  id: string;
  name: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  user_id: string;
  user_profiles?: {
    id: string;
    email: string;
    full_name?: string;
    company_name?: string;
    phone?: string | null;
    tax_id?: string | null;
    legal_address?: string | null;
  };
  user_subscriptions: UserSubscription[];
}

export interface SubscriptionData {
  subscription: UserSubscription;
  isTrialActive: boolean;
  trialDaysRemaining: number;
}

export type BillingPayerType = "individual" | "company";

export interface BillingDetails {
  type: BillingPayerType;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  taxId: string;
  address: string;
}

export interface CustomerSubscription {
  id: string;
  stripe_subscription_id: string | null;
  billing_interval: string;
  billing_interval_count: number;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  subscription_line_items: SubscriptionLineItem[];
}

export interface SubscriptionLineItem {
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

export interface SubscriptionOrder {
  id: string;
  date: string | null;
  projectId: string;
  projectName: string;
  status: string;
  planName?: string;
  durationMonths?: number | null;
  amount?: number | null;
  paymentMethod?: string | null;
  invoiceUrl?: string | null;
  projectIds: string[];
}

export function useSubscription(projectId?: string) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [projectSubscriptions, setProjectSubscriptions] = useState<
    ProjectSubscription[]
  >([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(
    null,
  );
  const [billingLoading, setBillingLoading] = useState(false);

  const fetchSubscription = async (specificProjectId?: string) => {
    if (!user) {
      setLoading(false);
      return;
    }

    const targetProjectId = specificProjectId || projectId;
    if (!targetProjectId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "subscription-management",
        {
          body: { project_id: targetProjectId },
          headers: {
            Authorization: `Bearer ${(await fetchCurrentSession()).session?.access_token}`,
          },
        },
      );

      if (error) {
        throw error;
      }

      setSubscription(data);
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch subscription",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectSubscriptions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
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

      if (error) {
        throw error;
      }

      setProjectSubscriptions(data.projects || []);
    } catch (err) {
      console.error("Error fetching project subscriptions:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch project subscriptions",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const sessionData = await fetchCurrentSession();
      const headers: Record<string, string> = {};

      // Add authorization header only if user is logged in
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

      if (error) {
        throw error;
      }
      const rawPlans = (data.plans || []) as SubscriptionPlan[];
      setPlans(
        rawPlans.map((plan) => ({
          ...plan,
          pricing: plan.pricing?.filter((p) => p.durationMonths !== 3) ?? [],
        })),
      );
    } catch (err) {
      console.error("Error fetching plans:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch plans");
    } finally {
      setPlansLoading(false);
    }
  };

  const requestInvoice = async (
    targetProjectId: string,
    planId: string,
    durationMonths: number,
  ) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "subscription-management",
        {
          body: {
            action: "request-invoice",
            project_id: targetProjectId,
            plan_id: planId,
            duration_months: durationMonths,
          },
          headers: {
            Authorization: `Bearer ${(await fetchCurrentSession()).session?.access_token}`,
          },
        },
      );

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error("Error requesting invoice:", err);
      throw err;
    }
  };

  const requestInvoiceForMultiple = async (
    projectIds: string[],
    planId: string,
    durationMonths: number,
  ) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      const results = await Promise.all(
        projectIds.map((projectId) =>
          requestInvoice(projectId, planId, durationMonths),
        ),
      );
      return results;
    } catch (err) {
      console.error("Error requesting invoices for multiple projects:", err);
      throw err;
    }
  };

  const hasFeature = (feature: string): boolean => {
    if (!subscription) return false;

    const plan = subscription.subscription.subscription_plans;
    return plan.features.includes(feature);
  };

  const isActive = (): boolean => {
    if (!subscription) return false;

    const { status, current_period_end } = subscription.subscription;

    // Check if subscription is in active status
    if (["active", "trialing"].includes(status)) {
      return true;
    }

    // Check if subscription is cancelled but still in paid period
    if (subscription.subscription.cancel_at_period_end && current_period_end) {
      return new Date(current_period_end) > new Date();
    }

    return false;
  };

  const isPro = (): boolean => {
    if (!subscription) return false;

    return subscription.subscription.subscription_plans.slug === "pro";
  };

  const isBasic = (): boolean => {
    if (!subscription) return false;

    return subscription.subscription.subscription_plans.slug === "basic";
  };

  const fetchBillingDetails = async () => {
    if (!user) {
      setBillingDetails(null);
      return;
    }

    setBillingLoading(true);
    try {
      // Load user profile (individual details)
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name, email, phone, tax_id, legal_address")
        .eq("id", user.id)
        .single();

      // Load company settings (company payer details)
      const { data: company } = await supabase
        .from("company_settings")
        .select("company_name, tax_id, address, phone, email")
        .eq("user_id", user.id)
        .maybeSingle();

      if (company) {
        setBillingDetails({
          type: "company",
          name: profile?.full_name || company.company_name || "",
          email: company.email || profile?.email || "",
          phone: company.phone || profile?.phone || "",
          companyName: company.company_name || "",
          taxId: company.tax_id || profile?.tax_id || "",
          address: company.address || profile?.legal_address || "",
        });
      } else if (profile) {
        setBillingDetails({
          type: "individual",
          name:
            profile.full_name ||
            (profile.email ? profile.email.split("@")[0] : "") ||
            "",
          email: profile.email || "",
          phone: profile.phone || "",
          companyName: "",
          taxId: profile.tax_id || "",
          address: profile.legal_address || "",
        });
      } else {
        setBillingDetails(null);
      }
    } catch (err) {
      console.error("Error fetching billing details:", err);
      // Do not surface as global error, keep separate
    } finally {
      setBillingLoading(false);
    }
  };

  const saveBillingDetails = async (details: BillingDetails) => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      // Always keep basic contact info in user_profiles
      const profileUpdate: Record<string, string> = {};
      if (details.type === "individual") {
        if (details.name) profileUpdate.full_name = details.name;
        if (details.taxId) profileUpdate.tax_id = details.taxId;
        if (details.address) profileUpdate.legal_address = details.address;
      }
      if (details.email) profileUpdate.email = details.email;
      if (details.phone) profileUpdate.phone = details.phone;

      if (Object.keys(profileUpdate).length > 0) {
        await supabase
          .from("user_profiles")
          .update(profileUpdate)
          .eq("id", user.id);
      }

      // For companies, also upsert company_settings
      if (details.type === "company") {
        const companyPayload = {
          user_id: user.id,
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

      await fetchBillingDetails();
    } catch (err) {
      console.error("Error saving billing details:", err);
      throw err;
    }
  };

  const orders: SubscriptionOrder[] = projectSubscriptions
    .flatMap((project) =>
      (project.user_subscriptions || []).map((sub) => ({
        id: sub.id,
        date:
          sub.invoice_requested_at ||
          sub.current_period_start ||
          sub.created_at ||
          null,
        projectId: project.id,
        projectName: project.name,
        status: sub.status,
        planName: sub.subscription_plans?.name,
        durationMonths: sub.duration_months,
        amount: sub.final_price,
        paymentMethod: sub.payment_method || "invoice",
        invoiceUrl: sub.invoice_url || null,
        projectIds: [project.id],
      })),
    )
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const getPurchaseLinks = async () => {
    const sessionData = await fetchCurrentSession();
    const headers: Record<string, string> = {};

    if (sessionData.session?.access_token) {
      headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
    }

    const { data, error } = await supabase.functions.invoke(
      "subscription-management",
      {
        body: { action: "get-purchase-links" },
        headers,
      },
    );

    if (error) throw error;
    return (data as any) ?? null;
  };

  useEffect(() => {
    if (user) {
      if (projectId) {
        fetchSubscription();
      } else {
        fetchProjectSubscriptions();
      }
      fetchBillingDetails();
    } else {
      setLoading(false);
    }
    // Always fetch plans, even for non-authenticated users
    fetchPlans();
  }, [user, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    subscription,
    projectSubscriptions,
    plans,
    loading,
    plansLoading,
    error,
    billingDetails,
    billingLoading,
    getPurchaseLinks,
    requestInvoice,
    requestInvoiceForMultiple,
    refreshSubscription: fetchSubscription,
    refreshProjectSubscriptions: fetchProjectSubscriptions,
    fetchBillingDetails,
    saveBillingDetails,
    orders,
    hasFeature,
    isActive,
    isPro,
    isBasic,
  };
}
