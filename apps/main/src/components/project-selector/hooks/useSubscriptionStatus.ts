import { useMemo } from "react";

interface UseSubscriptionStatusParams {
  project?: {
    subscription_expires_at?: string | null;
    subscription_status?: string | null;
    user_id?: string | null;
  } | null;
  user?: {
    id: string;
  } | null;
}

export const useSubscriptionStatus = ({
  project,
  user,
}: UseSubscriptionStatusParams) => {
  const isSubscriptionExpired = useMemo(() => {
    if (!project?.subscription_expires_at) return false;
    return new Date(project.subscription_expires_at) < new Date();
  }, [project?.subscription_expires_at]);

  const isSubscriptionInactive = useMemo(() => {
    return (
      !["active", "trialing", "trial"].includes(
        project?.subscription_status || "",
      ) || isSubscriptionExpired
    );
  }, [project?.subscription_status, isSubscriptionExpired]);

  const isOwner = useMemo(() => {
    return !!user && project?.user_id === user.id;
  }, [project?.user_id, user]);

  return {
    isSubscriptionExpired,
    isSubscriptionInactive,
    isOwner,
  };
};
