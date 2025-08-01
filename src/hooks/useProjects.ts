import { useState, useEffect } from 'react';
import { useProjectsManager, Project, ProjectFilters } from './useProjectsManager';

// Хук для загрузки списка проектов
export const useProjects = (filters: ProjectFilters = {}) => {
  const { loadProjects, projects, loading, error } = useProjectsManager();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      loadProjects(filters);
      setInitialized(true);
    }
  }, [loadProjects, filters, initialized]);

  return {
    projects,
    loading,
    error,
    refresh: () => loadProjects(filters)
  };
};

// Хук для загрузки одного проекта
export const useProject = (identifier?: string) => {
  const { loadProject } = useProjectsManager();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier) {
      setProject(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await loadProject(identifier);
        setProject(data);
        if (!data) {
          setError('Проект не найден');
        }
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки проекта');
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [identifier, loadProject]);

  return {
    project,
    loading,
    error,
    refresh: () => identifier && loadProject(identifier)
  };
};

// Хук для проектов пользователя
export const useUserProjects = (userId?: string) => {
  return useProjects({ userId });
};

// Хук для публичных проектов
export const usePublicProjects = (limit?: number) => {
  return useProjects({ isPublic: true, limit });
};

// Хук для избранных проектов
export const useFeaturedProjects = (limit?: number) => {
  return useProjects({ isFeatured: true, limit });
};

// Хук для CRUD операций с проектами
export const useProjectCRUD = () => {
  const { createProject, updateProject, deleteProject, incrementViewCount } = useProjectsManager();
  
  return {
    createProject,
    updateProject,
    deleteProject,
    incrementViewCount
  };
};

// Хук для управления кешем проектов
export const useProjectCache = () => {
  const { clearProjectsCache, clearSingleProjectCache, getProjectById } = useProjectsManager();
  
  return {
    clearProjectsCache,
    clearSingleProjectCache,
    getProjectById
  };
};

// Экспортируем типы
export type { Project, ProjectFilters }; 