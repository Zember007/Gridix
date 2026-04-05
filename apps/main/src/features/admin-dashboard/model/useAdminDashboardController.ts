import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguageNavigation } from "@gridix/utils/react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAmoWidget } from "@/hooks/useAmoWidget";
import { useLeadsRealtime } from "@/hooks/useLeadsRealtime";
import { useLeads } from "@/entities/lead/queries/useLeads";
import { useAdminDashboardInit } from "./useAdminDashboardInit";
import { useAdminDashboardTours } from "./useAdminDashboardTours";

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
  const shouldEnableLeads = activeTab === "leads";
  const { leads: allLeadsForUnread } = useLeads(undefined, {
    enabled: shouldEnableLeads,
  });

  useLeadsRealtime(shouldEnableLeads);
  useAdminDashboardInit(setActiveTab);
  const { retakeTraining, suppressAdminChecklistChrome } =
    useAdminDashboardTours({
      loading,
      activeTab,
      showCreateModal,
      user,
      userProfile,
    });

  const crmUnreadCount = useMemo(
    () => allLeadsForUnread.filter((lead) => !lead.read_at).length,
    [allLeadsForUnread],
  );

  const effectiveOwnerId = useMemo(() => {
    if (isManager && developerId) return developerId;
    return user?.id ?? null;
  }, [isManager, developerId, user?.id]);

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
    effectiveOwnerId,
    availableWorkspaces,
    crmUnreadCount,
    handleCreateNew,
    handleCloseCreateModal,
    handleManualCreate,
    handleEditProject,
    handleSignOut,
    retakeTraining,
    suppressAdminChecklistChrome,
  };
};
