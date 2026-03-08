import ProjectList from "@/components/projects/ProjectList";
import { AdminSettingsRoot } from "@/features/admin-settings";
import { AdminWidgets } from "@/features/admin-widgets";
import { LeadsManager } from "@/features/admin-leads-manager";
import { SubscriptionTab } from "@/features/admin-subscription";
import PartnersPage from "@/pages/PartnersPage";
import { AgencyPartnersPage } from "@/features/agency-partners-management";
import { AdminAnalytics } from "@/features/admin-analytics";
import { IntegrationsTab } from "@/features/admin-integrations";
import { AdminContactsPanel as AdminContactsPage } from "@/features/admin-contacts";
import type { UserRole } from "@/hooks/useUserRole";

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

      {activeTab === "leads" && <LeadsManager showProjectColumn={!isManager} />}

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
    </div>
  );
};
