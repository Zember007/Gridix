import { createContext, useContext, type ReactNode, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminAccessQuery } from "../queries/useAdminAccessQuery";
import type {
  AdminBootstrapProject,
  AdminBootstrapResponse,
} from "../model/types";

interface AdminAccessContextValue {
  data: AdminBootstrapResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<unknown>;
  access: AdminBootstrapResponse["access"] | null;
  capabilities: AdminBootstrapResponse["capabilities"] | null;
  projects: AdminBootstrapProject[];
  activeProjects: AdminBootstrapProject[];
  proProjects: AdminBootstrapProject[];
  hasAnyProject: boolean;
  hasAnyActiveProject: boolean;
  hasAnyProProject: boolean;
  canViewAnalytics: boolean;
  canViewLeads: boolean;
  canUseWidgets: boolean;
  canUseIntegrations: boolean;
  isProjectActive: (projectId?: string | null) => boolean;
  isProjectPro: (projectId?: string | null) => boolean;
  canEditProject: (projectId?: string | null) => boolean;
  canGenerateWidget: (projectId?: string | null) => boolean;
  canUseCrmIntegration: (projectId?: string | null) => boolean;
  canUseCustomDomain: (projectId?: string | null) => boolean;
  canUsePartnerModule: (projectId?: string | null) => boolean;
  canUseMassActions: (projectId?: string | null) => boolean;
  canUseAdvancedAnalytics: (projectId?: string | null) => boolean;
}

const AdminAccessContext = createContext<AdminAccessContextValue | null>(null);

interface AdminAccessProviderProps {
  children: ReactNode;
}

export function AdminAccessProvider({ children }: AdminAccessProviderProps) {
  const { user } = useAuth();
  const { activeWorkspaceId, isManagerMode } = useWorkspace();
  const { userRole } = useUserRole();

  const query = useAdminAccessQuery({
    userId: user?.id,
    isManagerMode,
    activeWorkspaceId,
    enabled: Boolean(user && userRole.type !== "loading"),
  });

  const value = useMemo<AdminAccessContextValue>(() => {
    const data = query.data ?? null;
    const projects = data?.projects ?? [];
    const capabilities = data?.capabilities;
    const access = data?.access;
    const activeProjects = projects.filter(
      (project) => project.access_status === "active",
    );
    const proProjects = projects.filter(
      (project) =>
        project.access_status === "active" && project.plan_tier === "pro",
    );

    const hasInList = (list: string[] | undefined, projectId?: string | null) =>
      Boolean(projectId && list?.includes(projectId));

    return {
      data,
      loading: query.isLoading,
      error: query.error
        ? query.error instanceof Error
          ? query.error.message
          : String(query.error)
        : null,
      refresh: query.refetch,
      access: data?.access ?? null,
      capabilities: data?.capabilities ?? null,
      projects,
      activeProjects,
      proProjects,
      hasAnyProject: access?.has_any_project ?? false,
      hasAnyActiveProject: access?.has_any_active_project ?? false,
      hasAnyProProject: proProjects.length > 0,
      canViewAnalytics: capabilities?.can_view_analytics ?? false,
      canViewLeads: capabilities?.can_view_leads ?? false,
      canUseWidgets: capabilities?.can_use_widgets ?? false,
      canUseIntegrations: capabilities?.can_use_integrations ?? false,
      isProjectActive: (projectId) =>
        hasInList(access?.active_project_ids, projectId),
      isProjectPro: (projectId) =>
        projects.some(
          (project) =>
            project.id === projectId &&
            project.access_status === "active" &&
            project.plan_tier === "pro",
        ),
      canEditProject: (projectId) =>
        hasInList(capabilities?.editable_project_ids, projectId),
      canGenerateWidget: (projectId) =>
        hasInList(capabilities?.widget_project_ids, projectId),
      canUseCrmIntegration: (projectId) =>
        hasInList(capabilities?.crm_integration_project_ids, projectId),
      canUseCustomDomain: (projectId) =>
        hasInList(capabilities?.custom_domain_project_ids, projectId),
      canUsePartnerModule: (projectId) =>
        hasInList(capabilities?.partner_module_project_ids, projectId),
      canUseMassActions: (projectId) =>
        projectId
          ? hasInList(capabilities?.mass_action_project_ids, projectId)
          : (capabilities?.mass_action_project_ids.length ?? 0) > 0,
      canUseAdvancedAnalytics: (projectId) =>
        projectId
          ? hasInList(capabilities?.advanced_analytics_project_ids, projectId)
          : (capabilities?.advanced_analytics_project_ids.length ?? 0) > 0,
    };
  }, [query.data, query.error, query.isLoading, query.refetch]);

  return (
    <AdminAccessContext.Provider value={value}>
      {children}
    </AdminAccessContext.Provider>
  );
}

export function useAdminAccess() {
  return useContext(AdminAccessContext);
}
