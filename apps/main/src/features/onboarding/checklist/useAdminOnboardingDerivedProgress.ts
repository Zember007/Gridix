import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import {
  fetchAdminChecklistDerived,
  type AdminChecklistDerivedProgress,
  type EffectiveOwnerId,
} from "./onboardingDerivedQueries";

const idleAdmin: AdminChecklistDerivedProgress = {
  projectCreated: false,
  crmConnected: false,
  crmQuerySucceeded: false,
  billingTouched: false,
  billingQuerySucceeded: false,
};

export type UseAdminOnboardingDerivedProgressOptions = {
  effectiveOwnerId: EffectiveOwnerId | null | undefined;
  /** Когда пользователь разворачивает чеклист — перезапрос при переходе в открытое состояние. */
  panelExpanded: boolean;
  /** Из `useChecklistOpenSignal`: увеличивается при запросе открыть панель (FAB и т.п.). */
  openSignal?: number;
};

export function useAdminOnboardingDerivedProgress(
  options: UseAdminOnboardingDerivedProgressOptions,
): {
  derived: AdminChecklistDerivedProgress;
  /** Увеличивается после каждого успешного применения результата fetch (для синка с UI). */
  revision: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const { effectiveOwnerId, panelExpanded, openSignal = 0 } = options;

  const [derived, setDerived] =
    useState<AdminChecklistDerivedProgress>(idleAdmin);
  const [revision, setRevision] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const genRef = useRef(0);

  const refetch = useCallback(async () => {
    const gen = ++genRef.current;
    setIsLoading(true);
    try {
      const next = await fetchAdminChecklistDerived(supabase, effectiveOwnerId);
      if (gen !== genRef.current) return;
      setDerived(next);
      setRevision((r) => r + 1);
    } finally {
      if (gen === genRef.current) setIsLoading(false);
    }
  }, [effectiveOwnerId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refetch();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refetch]);

  const prevExpandedRef = useRef(panelExpanded);
  useEffect(() => {
    if (panelExpanded && !prevExpandedRef.current) {
      void refetch();
    }
    prevExpandedRef.current = panelExpanded;
  }, [panelExpanded, refetch]);

  const prevOpenSignalRef = useRef(openSignal);
  useEffect(() => {
    if (openSignal > prevOpenSignalRef.current && openSignal > 0) {
      void refetch();
    }
    prevOpenSignalRef.current = openSignal;
  }, [openSignal, refetch]);

  return { derived, revision, isLoading, refetch };
}
