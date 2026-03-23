import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAdminAccess } from "@/entities/admin-access";

export interface Project {
  id: string;
  name: string;
  address?: string | null;
  description: string | null;
  floors: number;
  slug: string | null;
  building_image_url: string | null;
  created_at: string;
  user_id: string | null;
  developer_info?: {
    full_name: string;
    company_name: string;
  };
}

/**
 * Хук для загрузки проектов с учетом активного workspace через React Query
 * Если activeWorkspaceId === null - загружает проекты текущего пользователя
 * Если activeWorkspaceId !== null - загружает проекты застройщика с учетом прав менеджера
 */
export const useWorkspaceProjects = () => {
  const { isManagerMode } = useWorkspace();
  const adminAccess = useAdminAccess();
  const projects = (adminAccess?.projects ?? []) as Project[];
  const loading = adminAccess?.loading ?? false;
  const queryError = adminAccess?.error ?? null;
  const refresh = adminAccess?.refresh ?? (async () => null);

  return {
    projects,
    loading,
    error: queryError,
    refresh,
    isManagerMode,
  };
};
