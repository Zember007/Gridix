import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useUserRole } from '@/hooks/useUserRole';

export interface Project {
  id: string;
  name: string;
  description: string;
  floors: number;
  building_image_url: string;
  created_at: string;
  user_id: string;
  developer_info?: {
    full_name: string;
    company_name: string;
  };
}

/**
 * Хук для загрузки проектов с учетом активного workspace
 * Если activeWorkspaceId === null - загружает проекты текущего пользователя
 * Если activeWorkspaceId !== null - загружает проекты застройщика с учетом прав менеджера
 */
export const useWorkspaceProjects = () => {
  const { user } = useAuth();
  const { activeWorkspaceId, isManagerMode } = useWorkspace();
  const { userRole } = useUserRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);
  const lastLoadParamsRef = useRef<string>('');

  const loadProjects = useCallback(async () => {
    if (!user || userRole.type === 'loading') {
      return;
    }

    // Создаем ключ для проверки изменений параметров
    const loadParamsKey = `${user.id}-${activeWorkspaceId}-${isManagerMode}`;
    
    // Предотвращаем множественные одновременные запросы с одинаковыми параметрами
    if (isLoadingRef.current && lastLoadParamsRef.current === loadParamsKey) {
      return;
    }

    isLoadingRef.current = true;
    lastLoadParamsRef.current = loadParamsKey;
    setLoading(true);
    setError(null);

    try {
      if (isManagerMode && activeWorkspaceId) {
        // Менеджер работает в чужом workspace
        
        // Получаем manager_account_id для данного workspace
        const { data: managerAccount } = await supabase
          .from('manager_accounts')
          .select('id')
          .eq('manager_id', user.id)
          .eq('developer_id', activeWorkspaceId)
          .eq('status', 'active')
          .single();

        if (!managerAccount) {
          setProjects([]);
          return;
        }

        // Проверяем, есть ли записи в manager_project_access
        const { data: accessRules } = await supabase
          .from('manager_project_access')
          .select('project_id')
          .eq('manager_account_id', managerAccount.id);

        // Загружаем проекты застройщика
        let query = supabase
          .from('projects')
          .select(`
            *,
            user_profiles!fk_projects_user_profile (
              full_name,
              company_name
            )
          `)
          .eq('user_id', activeWorkspaceId);

        // Если есть access rules - фильтруем по ним
        if (accessRules && accessRules.length > 0) {
          const projectIds = accessRules.map(r => r.project_id);
          query = query.in('id', projectIds);
        }
        // Иначе показываем все проекты (backward compatibility)

        const { data: projectsData, error: projectsError } = await query
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;

        const projectsWithDeveloper = (projectsData || []).map((project: any) => ({
          ...project,
          developer_info: project.user_profiles
        }));

        setProjects(projectsWithDeveloper);
      } else {
        // Собственный workspace - загружаем проекты текущего пользователя
        
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;

        setProjects(projectsData || []);
      }
    } catch (err: any) {
      console.error('Error loading workspace projects:', err);
      const errorMessage = err.message || 'Ошибка загрузки проектов';
      setError(errorMessage);
      setProjects([]);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [user, activeWorkspaceId, isManagerMode, userRole.type]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    loading,
    error,
    refresh: loadProjects,
    isManagerMode
  };
};

