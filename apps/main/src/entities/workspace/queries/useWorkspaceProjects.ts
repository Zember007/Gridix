import { useQuery } from '@tanstack/react-query';
import { supabase } from "@gridix/utils/api";
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useUserRole } from '@/hooks/useUserRole';
import { getManagerProjectIds } from '@/hooks/useManagerProjectIds';

export interface Project {
  id: string;
  name: string;
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
  const { user } = useAuth();
  const { activeWorkspaceId, isManagerMode } = useWorkspace();
  const { userRole } = useUserRole();

  const {
    data: projects = [],
    isLoading: loading,
    error: queryError,
    refetch: refresh,
  } = useQuery<Project[]>({
    queryKey: ['workspaceProjects', user?.id, activeWorkspaceId, isManagerMode],
    enabled: !!user && userRole.type !== 'loading',
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Project[]> => {
      if (!user) return [];

      try {
        if (isManagerMode && activeWorkspaceId) {
          // Менеджер работает в чужом workspace

          // Получаем список доступных проектов для этого застройщика
          const managerProjectIds = await getManagerProjectIds(user.id, activeWorkspaceId);

          // Если у менеджера нет доступа ни к одному проекту
          if (!managerProjectIds || managerProjectIds.length === 0) {
            return [];
          }

          // Загружаем проекты застройщика, ограниченные списком доступных проектов
          let query = supabase
            .from('projects')
            .select(`
              *,
              user_profiles!fk_projects_user_profile (
                full_name,
                company_name
              )
            `)
            .eq('user_id', activeWorkspaceId)
            .in('id', managerProjectIds);

          const { data: projectsData, error: projectsError } = await query.order('created_at', {
            ascending: false,
          });

          if (projectsError) throw projectsError;

          const projectsWithDeveloper = (projectsData || []).map((project: any) => ({
            ...project,
            developer_info: project.user_profiles,
          }));

          return projectsWithDeveloper;
        } else {
          // Собственный workspace - загружаем проекты текущего пользователя

          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (projectsError) throw projectsError;

          return projectsData || [];
        }
      } catch (err: any) {
        console.error('Error loading workspace projects:', err);
        throw err;
      }
    },
  });

  return {
    projects,
    loading,
    error: queryError ? (queryError instanceof Error ? queryError.message : String(queryError)) : null,
    refresh,
    isManagerMode,
  };
};
