import { AdminSidebar } from "@/shared/ui/sidebar-component";
import { ManagerBlockedScreen } from "@/features/auth";
import ProjectCreationModal from "@/components/projects/ProjectCreationModal";
import { AdminOnboardingChecklistPanel } from "@/features/onboarding/checklist";
import { useAdminDashboardController } from "../model/useAdminDashboardController";
import { AdminDashboardContent } from "./AdminDashboardContent";
import { DemoBanner } from "@/features/demo-cabinet";
import { useAdminAccess } from "@/entities/admin-access";

export const AdminDashboardRoot = () => {
  const {
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
    developerId,
    effectiveOwnerId,
    availableWorkspaces,
    crmUnreadCount,
    handleCreateNew,
    handleCloseCreateModal,
    handleManualCreate,
    handleEditProject,
    handleSignOut,
    replayInteractiveOnboarding,
  } = useAdminDashboardController();

  const adminAccess = useAdminAccess();
  const isDemoViewer = adminAccess?.isDemoViewer ?? false;
  const isDemoWorkspace = adminAccess?.isDemoWorkspace ?? false;

  if (
    userRole.type === "manager" &&
    (!availableWorkspaces || availableWorkspaces.length === 0)
  ) {
    return <ManagerBlockedScreen />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        userEmail={userProfile?.email || user?.email || "Unknown user"}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        crmUnreadCount={crmUnreadCount}
      />

      <div
        className={`flex flex-1 flex-col bg-background transition-all duration-300 ${isCollapsed ? "md:ml-28 md:max-w-[calc(100vw-7rem)]" : "md:ml-64 md:max-w-[calc(100vw-16rem)]"}`}
      >
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
          onReplayInteractiveOnboarding={replayInteractiveOnboarding}
        />
      </div>
    </div>
  );
};
