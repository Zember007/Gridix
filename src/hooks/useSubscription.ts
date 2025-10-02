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
  subscription_plans: {
    name: string;
    slug: string;
    description: string;
    base_price: string;
    features: string[];
  };
}

export interface SubscriptionData {
  subscription: UserSubscription;
  isTrialActive: boolean;
  trialDaysRemaining: number;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('subscription-management', {
        body: {},
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

  const getPurchaseLinks = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase.functions.invoke('subscription-management', {
        body: { action: 'get-purchase-links' },
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Error getting purchase links:', err);
      throw err;
    }
  };

  const getManagementUrl = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase.functions.invoke('subscription-management', {
        body: { action: 'get-management-url' },
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      return data.managementUrl;
    } catch (err) {
      console.error('Error getting management URL:', err);
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
      fetchSubscription();
    } else {
      setLoading(false);
    }
    // Always fetch plans, even for non-authenticated users
    fetchPlans();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    subscription,
    plans,
    loading,
    plansLoading,
    error,
    getPurchaseLinks,
    getManagementUrl,
    refreshSubscription: fetchSubscription,
    hasFeature,
    isActive,
    isPro,
    isBasic,
  };
}
