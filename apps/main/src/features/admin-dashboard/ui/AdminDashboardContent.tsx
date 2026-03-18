import { lazy, Suspense } from "react";
import ProjectList from "@/components/projects/ProjectList";
import { LoaderView } from "@/shared/ui/LoaderView";
import type { UserRole } from "@/hooks/useUserRole";

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
  onCreateNew: () => void;
  onEditProject: (projectId: string, isNew: boolean) => void;
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
}: AdminDashboardContentProps) => {
  return (
    <div
      className={`flex-1 overflow-y-auto ${activeTab === "subscription" ? "mx-auto" : ""} ${activeTab !== "leads" ? "px-6 py-4 lg:py-6" : ""}`}
    >
      {activeTab === "projects" && (
        <div className="projects_list_usertour h-full space-y-6">
          <ProjectList
            onCreateNew={onCreateNew}
            onEditProject={onEditProject}
          />
        </div>
      )}

      <Suspense fallback={<LoaderView />}>
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
            <AgencyPartnersPage />
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

        {activeTab === "integrations" && userRole.type !== "manager" && (
          <div className="space-y-6">
            <IntegrationsTab />
          </div>
        )}

        {activeTab === "settings" &&
          userRole.type !== "manager" &&
          developerId && (
            <div className="space-y-6">
              <AdminSettingsRoot
                userProfile={user as never}
                loading={loading}
                developerId={developerId}
                isManager={isManager}
                {...(userRole.managerData
                  ? { managerData: userRole.managerData }
                  : {})}
              />
            </div>
          )}

        {activeTab === "changelog" && (
          <div className="h-full space-y-6">
            <ChangelogPage />
          </div>
        )}
      </Suspense>
    </div>
  );
};
