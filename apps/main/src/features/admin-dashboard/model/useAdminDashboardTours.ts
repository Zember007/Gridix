import type { QueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  isDriverDevMode,
  tryAutoOpenAdminChecklistPanel,
  waitForSelectors,
} from "@gridix/utils/integrations";
import type { AdminBootstrapResponse } from "@/entities/admin-access/model/types";
import { ADMIN_BOOTSTRAP_QUERY_KEY_PREFIX } from "@/entities/admin-access/queries/useAdminAccessQuery";
import {
  ADMIN_MAIN_DRIVER_TOUR_ID,
  destroyPartnersDriverTour,
  destroyProjectCreationDriverTour,
  startAdminMainDriverTour,
  startPartnersDriverTour,
  startProjectCreationDriverTour,
} from "@/features/onboarding/driver";
import type { CompletedInteractiveTours } from "@/features/onboarding/interactiveTourState";
import {
  isInteractiveTourMarkedComplete,
  mirrorCompletedInteractiveToursToLocalStorage,
  normalizeCompletedInteractiveTours,
} from "@/features/onboarding/interactiveTourState";
import { resetAdminInteractiveOnboardingStorage } from "@/features/onboarding/resetInteractiveOnboardingStorage";

type UserMetadata = Record<string, unknown> | null | undefined;

type UserLike = {
  id?: string;
  email?: string | null;
  created_at?: string | null;
  user_metadata?: UserMetadata;
} | null;

type UserProfileLike =
  | {
      email?: string | null;
      full_name?: string | null;
      created_at?: string | null;
      company_name?: string | null;
      phone?: string | null;
    }
  | null
  | undefined;

type UseAdminDashboardToursParams = {
  loading: boolean;
  adminBootstrapLoading: boolean;
  completedInteractiveTours: Record<string, string> | null | undefined;
  queryClient: QueryClient;
  activeTab: string;
  showCreateModal: boolean;
  user: UserLike | undefined;
  userProfile: UserProfileLike;
};

export const useAdminDashboardTours = ({
  loading,
  adminBootstrapLoading,
  completedInteractiveTours,
  queryClient,
  activeTab,
  showCreateModal,
  user,
  userProfile,
}: UseAdminDashboardToursParams) => {
  const { t } = useLanguage();
  const [suppressAdminChecklistChrome, setSuppressAdminChecklistChrome] =
    useState(false);
  const adminMainAndChecklistSequenceRef = useRef(false);
  const startedPartnersTourRef = useRef(false);
  const wasPartnersTabRef = useRef(false);
  const startedProjectCreationTourRef = useRef(false);

  const normalizedRemoteTours = useMemo<CompletedInteractiveTours>(() => {
    return normalizeCompletedInteractiveTours(completedInteractiveTours);
  }, [completedInteractiveTours]);

  /** Актуальная карта из кэша bootstrap (учитывает refetch после сброса прогресса). */
  const getBootstrapInteractiveTours =
    useCallback((): CompletedInteractiveTours => {
      const cachedPairs = queryClient.getQueriesData<AdminBootstrapResponse>({
        queryKey: [...ADMIN_BOOTSTRAP_QUERY_KEY_PREFIX],
      });
      const firstPayload = cachedPairs.find(([, d]) => d != null)?.[1];
      return normalizeCompletedInteractiveTours(
        firstPayload?.completed_interactive_tours,
      );
    }, [queryClient]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    mirrorCompletedInteractiveToursToLocalStorage(
      userId,
      normalizedRemoteTours,
    );
  }, [user?.id, normalizedRemoteTours]);

  const runAdminMainTourAndChecklistSequence = useCallback(async () => {
    const userId = user?.id;
    if (!userId) return;

    const interactiveTours = getBootstrapInteractiveTours();

    try {
      const anchorsReady = await waitForSelectors(
        [
          ".sidebar_usertour",
          ".projects_list_usertour",
          ".create_project_usertour",
          ".support_usertour",
        ],
        { timeoutMs: 8000, intervalMs: 100, debugLabel: "admin_onboarding" },
      );

      if (!anchorsReady) {
        adminMainAndChecklistSequenceRef.current = false;
        return;
      }

      const willRunAdminMainTour = !isInteractiveTourMarkedComplete(
        userId,
        ADMIN_MAIN_DRIVER_TOUR_ID,
        interactiveTours,
      );
      if (willRunAdminMainTour) {
        setSuppressAdminChecklistChrome(true);
      }

      try {
        await startAdminMainDriverTour({
          userId,
          t,
          completedInteractiveTours: interactiveTours,
          queryClient,
        });
      } catch (tourError) {
        console.warn("Failed to start admin main driver tour:", tourError);
      } finally {
        if (willRunAdminMainTour) {
          setSuppressAdminChecklistChrome(false);
        }
      }

      if (typeof window !== "undefined") {
        await new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => resolve());
          });
        });
      }

      try {
        tryAutoOpenAdminChecklistPanel(userId);
      } catch (checklistError) {
        console.warn("Failed to open admin checklist panel:", checklistError);
      }
    } catch (error) {
      console.warn("Failed admin dashboard onboarding sequence:", error);
      adminMainAndChecklistSequenceRef.current = false;
    }
  }, [getBootstrapInteractiveTours, queryClient, t, user?.id]);

  /** Driver admin main tour, затем in-app checklist panel — без параллельного старта. */
  useEffect(() => {
    if (loading || adminBootstrapLoading) return;
    const userId = user?.id;
    if (!userId) return;
    if (adminMainAndChecklistSequenceRef.current) return;

    adminMainAndChecklistSequenceRef.current = true;
    void runAdminMainTourAndChecklistSequence();
  }, [
    adminBootstrapLoading,
    loading,
    runAdminMainTourAndChecklistSequence,
    user,
    userProfile,
  ]);

  useEffect(() => {
    if (loading || adminBootstrapLoading) return;
    const devTour = isDriverDevMode();

    if (devTour && !showCreateModal) {
      startedProjectCreationTourRef.current = false;
      return;
    }

    if (!showCreateModal) return;
    const userId = user?.id;
    if (!userId) return;
    if (startedProjectCreationTourRef.current) return;

    startedProjectCreationTourRef.current = true;
    const run = async () => {
      try {
        await startProjectCreationDriverTour({
          userId,
          t,
          completedInteractiveTours: getBootstrapInteractiveTours(),
          queryClient,
        });
      } catch (error) {
        console.warn(
          "Failed to start project creation onboarding tour:",
          error,
        );
      }
    };

    void run();

    return () => {
      destroyProjectCreationDriverTour();
    };
  }, [
    adminBootstrapLoading,
    getBootstrapInteractiveTours,
    loading,
    showCreateModal,
    t,
    user,
    userProfile,
    queryClient,
  ]);

  useEffect(() => {
    const onPartners = activeTab === "partners";
    if (wasPartnersTabRef.current && !onPartners) {
      destroyPartnersDriverTour();
      startedPartnersTourRef.current = false;
    }
    wasPartnersTabRef.current = onPartners;
  }, [activeTab]);

  useEffect(() => {
    const devTour = isDriverDevMode();
    if (devTour && activeTab !== "partners") {
      startedPartnersTourRef.current = false;
    }
    if (activeTab !== "partners") return;
    if (loading || adminBootstrapLoading) return;
    const userId = user?.id;
    if (!userId) return;
    if (startedPartnersTourRef.current) return;

    startedPartnersTourRef.current = true;
    const run = async () => {
      try {
        await startPartnersDriverTour({
          userId,
          t,
          completedInteractiveTours: getBootstrapInteractiveTours(),
          queryClient,
        });
      } catch (error) {
        console.warn("Failed to start partners onboarding tour:", error);
      }
    };

    void run();
  }, [
    activeTab,
    adminBootstrapLoading,
    getBootstrapInteractiveTours,
    loading,
    queryClient,
    t,
    user?.id,
  ]);

  const retakeTraining = useCallback(async () => {
    if (loading) return;
    const userId = user?.id;
    if (!userId) return;

    await resetAdminInteractiveOnboardingStorage(userId);

    destroyPartnersDriverTour();
    destroyProjectCreationDriverTour();

    startedPartnersTourRef.current = false;
    startedProjectCreationTourRef.current = false;

    try {
      await queryClient.refetchQueries({
        queryKey: [...ADMIN_BOOTSTRAP_QUERY_KEY_PREFIX],
      });
    } catch (error) {
      console.warn(
        "retakeTraining: bootstrap refetch after reset failed:",
        error,
      );
    }

    await runAdminMainTourAndChecklistSequence();

    const replayTours = getBootstrapInteractiveTours();

    if (activeTab === "partners") {
      startedPartnersTourRef.current = true;
      try {
        await startPartnersDriverTour({
          userId,
          t,
          completedInteractiveTours: replayTours,
          queryClient,
        });
      } catch (error) {
        console.warn("Failed to replay partners onboarding tour:", error);
      }
    }

    if (showCreateModal) {
      startedProjectCreationTourRef.current = true;
      try {
        await startProjectCreationDriverTour({
          userId,
          t,
          completedInteractiveTours: replayTours,
          queryClient,
        });
      } catch (error) {
        console.warn(
          "Failed to replay project creation onboarding tour:",
          error,
        );
      }
    }
  }, [
    activeTab,
    getBootstrapInteractiveTours,
    loading,
    queryClient,
    runAdminMainTourAndChecklistSequence,
    showCreateModal,
    t,
    user?.id,
  ]);

  return { retakeTraining, suppressAdminChecklistChrome };
};
