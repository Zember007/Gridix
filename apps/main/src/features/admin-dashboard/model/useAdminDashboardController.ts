import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguageNavigation } from "@gridix/utils/react";
import { ADMIN_THEME, getAdminThemeVariables } from "@gridix/utils/lib";
import {
  isDevTourMode,
  startAdminChecklist,
  startAdminOnboardingTour,
  startPartnersTour,
  startProjectCreationTour,
  waitForSelectors,
} from "@gridix/utils/integrations";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAmoWidget } from "@/hooks/useAmoWidget";
import { useLeadsRealtime } from "@/hooks/useLeadsRealtime";
import { useLeads } from "@/entities/lead/queries/useLeads";
import { buildTourUserPayload } from "../lib/buildTourUserPayload";

export const useAdminDashboardController = () => {
  const [activeTab, setActiveTab] = useState("projects");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const { user, userProfile, signOut, loading } = useAuth();
  const location = useLocation();
  const routerNavigate = useNavigate();
  const { navigate, getPathWithLanguage } = useLanguageNavigation();
  const { userRole, isManager, developerId } = useUserRole();
  const { availableWorkspaces } = useWorkspace();
  const { amoWidget } = useAmoWidget();
  const { leads: allLeadsForUnread } = useLeads();

  const startedAdminTourRef = useRef(false);
  const startedAdminChecklistRef = useRef(false);
  const startedPartnersTourRef = useRef(false);
  const startedProjectCreationTourRef = useRef(false);

  useLeadsRealtime();

  const crmUnreadCount = useMemo(
    () => allLeadsForUnread.filter((lead) => !lead.read_at).length,
    [allLeadsForUnread],
  );

  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    const queryParams = new URLSearchParams(window.location.search);
    const tab = queryParams.get("page");
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

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

        await startAdminOnboardingTour(buildTourUserPayload(user, userProfile));
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
        await startAdminChecklist(buildTourUserPayload(user, userProfile));
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
        await startProjectCreationTour(buildTourUserPayload(user, userProfile));
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
        await startPartnersTour(buildTourUserPayload(user, userProfile));
      } catch (error) {
        console.warn("Failed to start partners onboarding tour:", error);
      }
    };

    void run();
  }, [activeTab, loading, user, userProfile]);

  const handleCreateNew = () => {
    if (amoWidget) {
      window.open("https://app.gridix.live/ru/admin", "_blank");
      return;
    }
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleManualCreate = () => {
    setShowCreateModal(false);
    routerNavigate(getPathWithLanguage("/admin/project/new"), {
      state: { from: location.pathname },
    });
  };

  const handleEditProject = (projectId: string, isNew: boolean) => {
    const path = isNew
      ? getPathWithLanguage("/admin/project/new")
      : getPathWithLanguage(`/admin/project/${projectId}`);
    routerNavigate(path, { state: { from: location.pathname } });
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    showCreateModal,
    isSigningOut,
    isMobileOpen,
    setIsMobileOpen,
    isCollapsed,
    setIsCollapsed,
    user,
    userProfile,
    loading,
    userRole,
    isManager,
    developerId: developerId ?? null,
    availableWorkspaces,
    crmUnreadCount,
    handleCreateNew,
    handleCloseCreateModal,
    handleManualCreate,
    handleEditProject,
    handleSignOut,
  };
};
