import { useEffect, useRef } from "react";
import {
  isDevTourMode,
  startAdminChecklist,
  startAdminOnboardingTour,
  startPartnersTour,
  startProjectCreationTour,
  waitForSelectors,
} from "@gridix/utils/integrations";
import { buildTourUserPayload } from "../lib/buildTourUserPayload";

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
  const startedAdminTourRef = useRef(false);
  const startedAdminChecklistRef = useRef(false);
  const startedPartnersTourRef = useRef(false);
  const startedProjectCreationTourRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!user?.id) return;
    if (startedAdminTourRef.current) return;

    startedAdminTourRef.current = true;
    const run = async () => {
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
          startedAdminTourRef.current = false;
          return;
        }

        await startAdminOnboardingTour(
          buildTourUserPayload(user, userProfile ?? null),
        );
      } catch (error) {
        console.warn("Failed to start admin onboarding tour:", error);
        startedAdminTourRef.current = false;
      }
    };

    void run();
  }, [loading, user, userProfile]);

  useEffect(() => {
    if (loading) return;
    if (!user?.id) return;
    if (startedAdminChecklistRef.current) return;

    startedAdminChecklistRef.current = true;
    const run = async () => {
      try {
        await startAdminChecklist(
          buildTourUserPayload(user, userProfile ?? null),
        );
      } catch (error) {
        console.warn("Failed to start admin checklist:", error);
        startedAdminChecklistRef.current = false;
      }
    };

    void run();
  }, [loading, user, userProfile]);

  useEffect(() => {
    if (loading) return;
    const devTour = isDevTourMode();

    if (devTour && !showCreateModal) {
      startedProjectCreationTourRef.current = false;
      return;
    }

    if (!showCreateModal) return;
    if (!user?.id) return;
    if (startedProjectCreationTourRef.current) return;

    startedProjectCreationTourRef.current = true;
    const run = async () => {
      try {
        await startProjectCreationTour(
          buildTourUserPayload(user, userProfile ?? null),
        );
      } catch (error) {
        console.warn(
          "Failed to start project creation onboarding tour:",
          error,
        );
      }
    };

    void run();
  }, [loading, showCreateModal, user, userProfile]);

  useEffect(() => {
    const devTour = isDevTourMode();
    if (devTour && activeTab !== "partners") {
      startedPartnersTourRef.current = false;
      return;
    }
    if (loading) return;
    if (activeTab !== "partners") return;
    if (!user?.id) return;
    if (startedPartnersTourRef.current) return;

    startedPartnersTourRef.current = true;
    const run = async () => {
      try {
        await startPartnersTour(
          buildTourUserPayload(user, userProfile ?? null),
        );
      } catch (error) {
        console.warn("Failed to start partners onboarding tour:", error);
      }
    };

    void run();
  }, [activeTab, loading, user, userProfile]);
};
