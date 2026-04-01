import { useCallback, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  isDriverDevMode,
  tryAutoOpenAdminChecklistPanel,
  waitForSelectors,
} from "@gridix/utils/integrations";
import {
  destroyPartnersDriverTour,
  destroyProjectCreationDriverTour,
  startAdminMainDriverTour,
  startPartnersDriverTour,
  startProjectCreationDriverTour,
} from "@/features/onboarding/driver";
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
  activeTab: string;
  showCreateModal: boolean;
  user: UserLike | undefined;
  userProfile: UserProfileLike;
};

export const useAdminDashboardTours = ({
  loading,
  activeTab,
  showCreateModal,
  user,
  userProfile,
}: UseAdminDashboardToursParams) => {
  const { t } = useLanguage();
  const adminMainAndChecklistSequenceRef = useRef(false);
  const startedPartnersTourRef = useRef(false);
  const wasPartnersTabRef = useRef(false);
  const startedProjectCreationTourRef = useRef(false);

  const runAdminMainTourAndChecklistSequence = useCallback(async () => {
    const userId = user?.id;
    if (!userId) return;

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

      try {
        await startAdminMainDriverTour({ userId, t });
      } catch (tourError) {
        console.warn("Failed to start admin main driver tour:", tourError);
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
  }, [t, user?.id]);

  /** Driver admin main tour, затем in-app checklist panel — без параллельного старта. */
  useEffect(() => {
    if (loading) return;
    const userId = user?.id;
    if (!userId) return;
    if (adminMainAndChecklistSequenceRef.current) return;

    adminMainAndChecklistSequenceRef.current = true;
    void runAdminMainTourAndChecklistSequence();
  }, [loading, runAdminMainTourAndChecklistSequence, user, userProfile]);

  useEffect(() => {
    if (loading) return;
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
  }, [loading, showCreateModal, t, user, userProfile]);

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
    if (loading) return;
    const userId = user?.id;
    if (!userId) return;
    if (startedPartnersTourRef.current) return;

    startedPartnersTourRef.current = true;
    const run = async () => {
      try {
        await startPartnersDriverTour({ userId, t });
      } catch (error) {
        console.warn("Failed to start partners onboarding tour:", error);
      }
    };

    void run();
  }, [activeTab, loading, t, user?.id]);

  const retakeTraining = useCallback(async () => {
    if (loading) return;
    const userId = user?.id;
    if (!userId) return;

    resetAdminInteractiveOnboardingStorage(userId);
    destroyPartnersDriverTour();
    destroyProjectCreationDriverTour();

    adminMainAndChecklistSequenceRef.current = false;
    startedPartnersTourRef.current = false;
    startedProjectCreationTourRef.current = false;

    adminMainAndChecklistSequenceRef.current = true;
    await runAdminMainTourAndChecklistSequence();

    if (activeTab === "partners") {
      startedPartnersTourRef.current = true;
      try {
        await startPartnersDriverTour({ userId, t });
      } catch (error) {
        console.warn("Failed to replay partners onboarding tour:", error);
      }
    }

    if (showCreateModal) {
      startedProjectCreationTourRef.current = true;
      try {
        await startProjectCreationDriverTour({ userId, t });
      } catch (error) {
        console.warn(
          "Failed to replay project creation onboarding tour:",
          error,
        );
      }
    }
  }, [
    activeTab,
    loading,
    runAdminMainTourAndChecklistSequence,
    showCreateModal,
    t,
    user?.id,
  ]);

  return { retakeTraining };
};
