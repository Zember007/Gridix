import { lazy, Suspense } from "react";
import { cn } from "@gridix/utils/lib";
import ProjectList from "@/components/projects/ProjectList";
import { LoadingProgress } from "@/shared/ui/LoadingProgress";
import type { UserRole } from "@/hooks/useUserRole";
import { useAdminAccess } from "@/entities/admin-access";
import { AdminAccessNotice } from "@/shared/ui/AdminAccessNotice";

const AdminSettingsRoot = lazy(() =>
  import("@/features/admin-settings").then((m) => ({
    default: m.AdminSettingsRoot,
  })),
);
const AdminWidgets = lazy(() =>
  import("@/features/admin-widgets").then((m) => ({ default: m.AdminWidgets })),
);
const LeadsManager = lazy(() =>
  import("@/features/admin-leads-manager").then((m) => ({
    default: m.LeadsManager,
  })),
);
const SubscriptionTab = lazy(() =>
  import("@/features/admin-subscription").then((m) => ({
    default: m.SubscriptionTab,
  })),
);
const PartnersPage = lazy(() => import("@/pages/PartnersPage"));
const AgencyPartnersPage = lazy(() =>
  import("@/features/agency-partners-management").then((m) => ({
    default: m.AgencyPartnersPage,
  })),
);
const AdminAnalytics = lazy(() =>
  import("@/features/admin-analytics").then((m) => ({
    default: m.AdminAnalytics,
  })),
);
const IntegrationsTab = lazy(() =>
  import("@/features/admin-integrations").then((m) => ({
    default: m.IntegrationsTab,
  })),
);
const AdminContactsPage = lazy(() =>
  import("@/features/admin-contacts").then((m) => ({
    default: m.AdminContactsPanel,
  })),
);
const ChangelogPage = lazy(() => import("@gridix/ui/changelog-page"));

type AdminDashboardContentProps = {
  activeTab: string;
  isManager: boolean;
  userRole: UserRole;
  developerId: string | null;
  user: unknown;
  loading: boolean;
  onCreateNew?: () => void;
  onEditProject: (projectId: string, isNew: boolean) => void;
  isDemoViewer?: boolean;
};

export const AdminDashboardContent = ({
  activeTab,
  isManager,
  userRole,
  developerId,
  user,
  loading,
  onCreateNew,
  onEditProject,
  isDemoViewer = false,
}: AdminDashboardContentProps) => {
  const adminAccess = useAdminAccess();

  const showAdminSettings =
    activeTab === "settings" &&
    userRole.type !== "manager" &&
    !isDemoViewer &&
    Boolean(developerId);

  const tabFallback = (
    <div className="flex min-h-[320px] items-center justify-center">
      <LoadingProgress />
    </div>
  );

  return (
    <div
      className={cn(
        "min-h-0 flex-1",
        showAdminSettings
          ? "flex flex-col overflow-hidden px-3 py-3 sm:px-6 sm:py-4 lg:py-6"
          : "overflow-y-auto",
        !showAdminSettings && activeTab === "subscription" && "mx-auto",
        !showAdminSettings &&
          activeTab !== "leads" &&
          "px-3 py-3 sm:px-6 sm:py-4 lg:py-6",
      )}
    >
      {activeTab === "projects" && (
        <div className="projects_list_usertour h-full space-y-6">
          <ProjectList
            onCreateNew={onCreateNew}
            onEditProject={onEditProject}
          />
        </div>
      )}

      <div
        className={
          showAdminSettings
            ? "flex min-h-0 flex-1 flex-col [&>*]:min-h-0 [&>*]:flex-1"
            : "contents"
        }
      >
        <Suspense fallback={tabFallback}>
          {activeTab === "leads" && (
            <LeadsManager showProjectColumn={!isManager} />
          )}

          {activeTab === "subscription" && userRole.type !== "manager" && (
            <div className="h-full space-y-6">
              <SubscriptionTab />
            </div>
          )}

          {activeTab === "partners" && (
            <div className="h-full space-y-6">
              <PartnersPage />
            </div>
          )}

          {activeTab === "agent_network" && (
            <div className="space-y-6">
              {adminAccess?.loading ? (
                tabFallback
              ) : adminAccess?.hasAnyProProject ? (
                <AgencyPartnersPage />
              ) : (
                <AdminAccessNotice variant="pro" />
              )}
            </div>
          )}

          {activeTab === "contacts" && <AdminContactsPage />}

          {activeTab === "widgets" && (
            <div className="h-full space-y-6">
              <AdminWidgets />
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="h-full space-y-6">
              <AdminAnalytics />
            </div>
          )}

          {activeTab === "integrations" &&
            userRole.type !== "manager" &&
            !isDemoViewer && (
              <div className="space-y-6">
                <IntegrationsTab />
              </div>
            )}

          {showAdminSettings && developerId && (
            <AdminSettingsRoot
              userProfile={user as never}
              loading={loading}
              developerId={developerId}
              isManager={isManager}
              {...(userRole.managerData
                ? { managerData: userRole.managerData }
                : {})}
            />
          )}

          {activeTab === "changelog" && (
            <div className="h-full space-y-6">
              <ChangelogPage />
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
};
