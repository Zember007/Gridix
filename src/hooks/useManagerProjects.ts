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
        
        // Загружаем проекты всех застройщиков, к которым менеджер имеет доступ
        const { data: projectsData, error: projectsError } = await supabase
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

        console.log('Manager projects query result:', { data: projectsData, error: projectsError });

        if (projectsError) throw projectsError;

        const projectsWithDeveloper = (projectsData || []).map((project: any) => ({
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
