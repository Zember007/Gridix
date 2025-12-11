import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useUserRole } from '@/hooks/useUserRole';

export const getManagerProjectIds = async (
  managerId: string,
  developerId: string,
): Promise<string[]> => {
  try {
    const { data: managerAccount, error: managerError } = await supabase
      .from('manager_accounts')
      .select('id')
      .eq('manager_id', managerId)
      .eq('developer_id', developerId)
      .eq('status', 'active')
      .maybeSingle();

    if (managerError) {
      console.error('Error loading manager account for manager:', managerError);
      return [];
    }

    if (!managerAccount) {
      // Нет активного manager_account для этого застройщика
      return [];
    }

    const { data: accessRules, error: accessError } = await supabase
      .from('manager_project_access')
      .select('project_id')
      .eq('manager_account_id', managerAccount.id);

    if (accessError) {
      console.error('Error loading manager project access:', accessError);
      return [];
    }

    if (accessRules && accessRules.length > 0) {
      return accessRules.map((r) => r.project_id);
    }

    // Если нет access rules - доступ ко всем проектам застройщика
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', developerId);

    if (projectsError) {
      console.error('Error loading projects for manager:', projectsError);
      return [];
    }

    return projects?.map((p) => p.id) || [];
  } catch (error) {
    console.error('Error resolving manager project ids:', error);
    return [];
  }
};

interface UseManagerProjectIdsResult {
  projectIds: string[];
  loading: boolean;
  error: string | null;
  isEnabled: boolean;
}

export const useManagerProjectIds = (): UseManagerProjectIdsResult => {
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const { userRole } = useUserRole();

  const enabled = Boolean(user && activeWorkspaceId && userRole.type === 'manager');

  const {
    data: projectIds = [],
    isLoading,
    error,
  } = useQuery<string[]>({
    queryKey: ['managerProjectIds', user?.id, activeWorkspaceId],
    enabled,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!user || !activeWorkspaceId) return [];
      return getManagerProjectIds(user.id, activeWorkspaceId);
    },
  });

  return {
    projectIds,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    isEnabled: enabled,
  };
};

