import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import {
  fetchProjectChecklistDerived,
  type ProjectChecklistDerivedProgress,
} from "./onboardingDerivedQueries";

const idleProject: ProjectChecklistDerivedProgress = {
  projectBasicInfoReady: false,
  projectFacadeConfigured: false,
  projectFirstApartmentCreated: false,
  projectFloorplanUploaded: false,
};

export type UseProjectOnboardingDerivedProgressOptions = {
  projectId: string | null | undefined;
  /** Для согласованности с панелью и повторного fetch при смене типа в том же редакторе. */
  projectType?: "building" | "object" | null;
  panelExpanded: boolean;
  openSignal?: number;
};

export function useProjectOnboardingDerivedProgress(
  options: UseProjectOnboardingDerivedProgressOptions,
): {
  derived: ProjectChecklistDerivedProgress;
  revision: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const { projectId, panelExpanded, openSignal = 0 } = options;

  const [derived, setDerived] =
    useState<ProjectChecklistDerivedProgress>(idleProject);
  const [revision, setRevision] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const genRef = useRef(0);

  const refetch = useCallback(async () => {
    const gen = ++genRef.current;
    setIsLoading(true);
    try {
      const next = await fetchProjectChecklistDerived(supabase, projectId);
      if (gen !== genRef.current) return;
      setDerived(next);
      setRevision((r) => r + 1);
    } finally {
      if (gen === genRef.current) setIsLoading(false);
    }
  }, [projectId]);

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
