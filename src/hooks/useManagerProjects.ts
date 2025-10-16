import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';

export interface Project {
  id: string;
  name: string;
  description: string;
  user_id: string;
  floors: number;
  building_image_url: string;
  created_at: string;
  developer_info?: {
    full_name: string;
    company_name: string;
  };
}

export const useManagerProjects = () => {
  const { user } = useAuth();
  const { userRole, isManager, developerIds } = useUserRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    console.log('loadProjects called with:', { 
      user: user?.id, 
      userRoleType: userRole.type, 
      isManager, 
      developerIds 
    });

    if (!user || userRole.type === 'loading') {
      console.log('Skipping load - user not ready or role loading');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isManager && developerIds.length > 0) {
        console.log('Loading projects for manager, developer IDs:', developerIds);
        
        // Получаем manager_account_id для текущего пользователя
        const { data: managerAccounts } = await supabase
          .from('manager_accounts')
          .select('id, developer_id')
          .eq('manager_id', user.id)
          .in('developer_id', developerIds);

        const managerAccountIds = (managerAccounts || []).map(ma => ma.id);
        
        // Проверяем наличие записей в manager_project_access для каждого manager_account
        const { data: accessRules } = await supabase
          .from('manager_project_access')
          .select('manager_account_id, project_id')
          .in('manager_account_id', managerAccountIds);

        // Группируем access rules по manager_account_id
        const accessByManagerAccount = new Map<string, string[]>();
        (accessRules || []).forEach(rule => {
          const existing = accessByManagerAccount.get(rule.manager_account_id) || [];
          existing.push(rule.project_id);
          accessByManagerAccount.set(rule.manager_account_id, existing);
        });
        
        // Загружаем проекты всех застройщиков
        const { data: allProjectsData, error: projectsError } = await supabase
          .from('projects')
          .select(`
            *,
            user_profiles!fk_projects_user_profile (
              full_name,
              company_name
            )
          `)
          .in('user_id', developerIds)
          .order('created_at', { ascending: false });

        console.log('Manager projects query result:', { data: allProjectsData, error: projectsError });

        if (projectsError) throw projectsError;

        // Фильтруем проекты на основе access rules
        const filteredProjects = (allProjectsData || []).filter((project: any) => {
          // Находим manager_account для этого застройщика
          const managerAccount = managerAccounts?.find(ma => ma.developer_id === project.user_id);
          if (!managerAccount) return false;

          // Если нет записей в access rules для этого manager_account - доступ ко всем проектам (backward compatibility)
          const projectIds = accessByManagerAccount.get(managerAccount.id);
          if (!projectIds || projectIds.length === 0) return true;

          // Если есть записи - проверяем, есть ли проект в списке доступных
          return projectIds.includes(project.id);
        });

        const projectsWithDeveloper = filteredProjects.map((project: any) => ({
          ...project,
          developer_info: project.user_profiles
        }));

        console.log('Processed projects for manager:', projectsWithDeveloper.length);
        setProjects(projectsWithDeveloper);
      } else if (!isManager && user.id) {
        console.log('Loading projects for developer:', user.id);
        
        // Для застройщиков загружаем только их проекты
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        console.log('Developer projects query result:', { data: projectsData, error: projectsError });

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);
      } else {
        console.log('No projects to load - not manager or no developer IDs');
        setProjects([]);
      }
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError(err.message || 'Ошибка загрузки проектов');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user, userRole.type, isManager, developerIds]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    loading,
    error,
    refresh: loadProjects
  };
};
