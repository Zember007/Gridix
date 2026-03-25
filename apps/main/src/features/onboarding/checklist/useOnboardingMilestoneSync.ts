import { useEffect, useState } from "react";
import { subscribeOnboardingMilestones } from "@gridix/utils/integrations";

export type UseOnboardingMilestoneSyncOptions = {
  /**
   * Счётчик из derived-fetch (БД): при каждом успешном refetch увеличивается —
   * вместе с подпиской на LS даёт пересчёт чеклиста без дублирования deps в панелях.
   */
  derivedRevision?: number;
};

/**
 * Меняется при `trackOnboardingMilestone` (localStorage) и при росте `derivedRevision`
 * после успешного fetch серверных критериев чеклиста.
 */
export function useOnboardingMilestoneSync(
  options?: UseOnboardingMilestoneSyncOptions,
): number {
  const derivedRevision = options?.derivedRevision ?? 0;
  const [subscriptionVersion, setSubscriptionVersion] = useState(0);

  useEffect(
    () =>
      subscribeOnboardingMilestones(() => {
        setSubscriptionVersion((v) => v + 1);
      }),
    [],
  );

  return subscriptionVersion + derivedRevision;
}
