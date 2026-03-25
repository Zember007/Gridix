import { useEffect, useState } from "react";
import { subscribeOnboardingMilestones } from "@gridix/utils/integrations";

/**
 * Bumps when any `trackOnboardingMilestone` completes so checklist UI can re-read localStorage.
 */
export function useOnboardingMilestoneSync(): number {
  const [version, setVersion] = useState(0);

  useEffect(
    () =>
      subscribeOnboardingMilestones(() => {
        setVersion((v) => v + 1);
      }),
    [],
  );

  return version;
}
