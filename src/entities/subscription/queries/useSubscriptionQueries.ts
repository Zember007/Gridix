import { useQuery } from "@tanstack/react-query";
import {
  fetchSubscription,
  fetchProjectSubscriptions,
  fetchPlans,
  fetchBillingDetails,
} from "@/entities/subscription/api/subscriptionApi";
import { useAuth } from "@/contexts/AuthContext";

export const useSubscriptionQuery = (projectId?: string) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["subscription", user?.id ?? null, projectId],
    enabled: !!user && !!projectId,
    queryFn: () => fetchSubscription(projectId!),
  });

  return {
    ...query,
    subscription: query.data ?? null,
  };
};

export const useProjectSubscriptionsQuery = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["project-subscriptions", user?.id ?? null],
    enabled: !!user,
    queryFn: () => fetchProjectSubscriptions(),
  });

  return {
    ...query,
    projectSubscriptions: query.data?.projects ?? [],
  };
};

export const usePlansQuery = () => {
  const query = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: () => fetchPlans(),
  });

  return {
    ...query,
    plans: query.data?.plans ?? [],
  };
};

export const useBillingDetailsQuery = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["billing-details", user?.id ?? null],
    enabled: !!user,
    queryFn: () => fetchBillingDetails(user!.id),
  });

  return query;
};
