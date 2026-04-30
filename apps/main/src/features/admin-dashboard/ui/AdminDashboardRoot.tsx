import { ManagerBlockedScreen } from "@/features/auth";
import ProjectCreationModal from "@/components/projects/ProjectCreationModal";
import { AdminOnboardingChecklistPanel } from "@/features/onboarding/checklist";
import { useAdminDashboardController } from "../model/useAdminDashboardController";
import { AdminDashboardContent } from "./AdminDashboardContent";
import { DemoBanner } from "@/features/demo-cabinet";
import { useAdminAccess } from "@/entities/admin-access";
import {
  useAdminShellFullBleed,
  useRegisterAdminShellSidebar,
} from "@/app/layouts/admin-shell-context";
import { useAdminDashboardShellSidebar } from "../model/useAdminDashboardShellSidebar";

export const AdminDashboardRoot = () => {
  const {
    activeTab,
    setActiveTab,
    showCreateModal,
    isSigningOut,
    user,
    userProfile,
    loading,
    userRole,
    isManager,
    developerId,
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
  } = useAdminDashboardController();

  const managerBlocked =
    userRole.type === "manager" &&
    (!availableWorkspaces || availableWorkspaces.length === 0);

  useAdminShellFullBleed(managerBlocked);

  const adminAccess = useAdminAccess();
  const isDemoViewer = adminAccess?.isDemoViewer ?? false;
  const isDemoWorkspace = adminAccess?.isDemoWorkspace ?? false;

  const shellSidebarSlot = useAdminDashboardShellSidebar({
    blocked: managerBlocked,
    activeTab,
    setActiveTab,
    userEmail: userProfile?.email || user?.email || "Unknown user",
    crmUnreadCount,
    onSignOut: handleSignOut,
    isSigningOut,
  });

  useRegisterAdminShellSidebar(shellSidebarSlot);

  if (managerBlocked) {
    return <ManagerBlockedScreen />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      {isDemoWorkspace && isDemoViewer && <DemoBanner />}

      <AdminDashboardContent
        activeTab={activeTab}
        isManager={isManager}
        userRole={userRole}
        developerId={developerId}
        user={user}
        loading={loading}
        onCreateNew={isDemoViewer ? undefined : handleCreateNew}
        onEditProject={handleEditProject}
        isDemoViewer={isDemoViewer}
      />

      {!isDemoViewer && (
        <ProjectCreationModal
          open={showCreateModal}
          onClose={handleCloseCreateModal}
          onManualCreate={handleManualCreate}
        />
      )}
      <AdminOnboardingChecklistPanel
        effectiveOwnerId={effectiveOwnerId}
        onNavigateTab={setActiveTab}
        onOpenCreateProject={handleCreateNew}
        onReplayInteractiveOnboarding={retakeTraining}
        suppressChrome={suppressAdminChecklistChrome}
      />
    </div>
  );
};
