import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

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
  user_subscriptions: UserSubscription[];
}

export interface SubscriptionData {
  subscription: UserSubscription;
  isTrialActive: boolean;
  trialDaysRemaining: number;
}

export function useSubscription(projectId?: string) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [projectSubscriptions, setProjectSubscriptions] = useState<ProjectSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const { data, error } = await supabase.functions.invoke('subscription-management', {
        body: { project_id: targetProjectId },
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      setSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
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
      const { data, error } = await supabase.functions.invoke('subscription-management', {
        body: { action: 'get-project-subscriptions' },
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      setProjectSubscriptions(data.projects || []);
    } catch (err) {
      console.error('Error fetching project subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch project subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      
      // Add authorization header only if user is logged in
      if (session.data.session?.access_token) {
        headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke('subscription-management', {
        body: { action: 'get-plans' },
        headers,
      });

      if (error) {
        throw error;
      }

      setPlans(data.plans || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch plans');
    } finally {
      setPlansLoading(false);
    }
  };

  const requestInvoice = async (targetProjectId: string, planId: string, durationMonths: number) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase.functions.invoke('subscription-management', {
        body: { 
          action: 'request-invoice',
          project_id: targetProjectId,
          plan_id: planId,
          duration_months: durationMonths
        },
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error requesting invoice:', err);
      throw err;
    }
  };

  const requestInvoiceForMultiple = async (projectIds: string[], planId: string, durationMonths: number) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const results = await Promise.all(
        projectIds.map(projectId => requestInvoice(projectId, planId, durationMonths))
      );
      return results;
    } catch (err) {
      console.error('Error requesting invoices for multiple projects:', err);
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
    if (['active', 'trialing'].includes(status)) {
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
    
    return subscription.subscription.subscription_plans.slug === 'pro';
  };

  const isBasic = (): boolean => {
    if (!subscription) return false;
    
    return subscription.subscription.subscription_plans.slug === 'basic';
  };

  useEffect(() => {
    if (user) {
      if (projectId) {
        fetchSubscription();
      } else {
        fetchProjectSubscriptions();
      }
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
    requestInvoice,
    requestInvoiceForMultiple,
    refreshSubscription: fetchSubscription,
    refreshProjectSubscriptions: fetchProjectSubscriptions,
    hasFeature,
    isActive,
    isPro,
    isBasic,
  };
}
