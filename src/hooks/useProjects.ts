import { useState, useEffect, useRef, useCallback } from 'react';
import { useProjectsManager, Project, ProjectFilters } from './useProjectsManager';

// Хук для загрузки списка проектов
export const useProjects = (filters: ProjectFilters = {}) => {
  const { loadProjects, projects, loading, error } = useProjectsManager();
  const filtersRef = useRef<string>('');
  const mountedRef = useRef(true);

  // Создаем стабильный ключ для фильтров
  const filtersKey = JSON.stringify(filters, Object.keys(filters || {}).sort());

  useEffect(() => {
    mountedRef.current = true;
    
    // Если фильтры не изменились, не делаем запрос
    if (filtersRef.current === filtersKey) {
      return;
    }

    filtersRef.current = filtersKey;
    
    // Делаем запрос только если компонент еще смонтирован
    if (mountedRef.current) {

      loadProjects(filters);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [filtersKey, loadProjects]);

  // Мемоизированная функция обновления
  const refresh = useCallback(() => {
    if (mountedRef.current) {
      loadProjects(filters);
    }
  }, [loadProjects, filters]);

  return {
    projects,
    loading,
    error,
    refresh
  };
};

// Хук для загрузки одного проекта
export const useProject = (identifier?: string) => {
  const { loadProject } = useProjectsManager();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Рефы для отслеживания состояния
  const identifierRef = useRef<string | undefined>(undefined);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    // Отменяем предыдущий запрос если он есть
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Если identifier не изменился, не делаем запрос
    if (identifierRef.current === identifier) {
      return;
    }

    identifierRef.current = identifier;

    if (!identifier) {
      setProject(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchProject = async () => {
      // Создаем новый AbortController для этого запроса
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (!mountedRef.current) return;

      setLoading(true);
      setError(null);
      
      try {
        console.log('loadProject', identifier);
        
        const data = await loadProject(identifier);
        
        if ( identifierRef.current === identifier) {
          setProject(data);
          if (!data) {
            setError('Проект не найден');
          }
        }
      } catch (err: any) {
        // Проверяем, что это не отмененный запрос
        if (!controller.signal.aborted && mountedRef.current && identifierRef.current === identifier) {
          setError(err.message || 'Ошибка загрузки проекта');
          setProject(null);
        }
      } finally {
        if (!controller.signal.aborted && mountedRef.current && identifierRef.current === identifier) {
          setLoading(false);
        }
      }
    };

    fetchProject();

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [identifier, loadProject]);

  // Мемоизированная функция обновления
  const refresh = useCallback(async () => {
    if (!identifier || !mountedRef.current) return;

    // Отменяем текущий запрос если он есть
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await loadProject(identifier);
      
      if (!controller.signal.aborted && mountedRef.current) {
        setProject(data);
        if (!data) {
          setError('Проект не найден');
        }
      }
    } catch (err: any) {
      if (!controller.signal.aborted && mountedRef.current) {
        setError(err.message || 'Ошибка загрузки проекта');
        setProject(null);
      }
    } finally {
      if (!controller.signal.aborted && mountedRef.current) {
        setLoading(false);
      }
    }
  }, [identifier, loadProject]);

  return {
    project,
    loading,
    error,
    refresh
  };
};

// Хук для проектов пользователя с мемоизацией
export const useUserProjects = (userId?: string) => {
  const filtersRef = useRef<ProjectFilters | null>(null);
  
  // Создаем стабильный объект фильтров
  if (!filtersRef.current || filtersRef.current.userId !== userId) {
    filtersRef.current = userId ? { userId } : {};
  }
  
  return useProjects(filtersRef.current);
};

// Хук для публичных проектов с мемоизацией
export const usePublicProjects = (limit?: number) => {
  const filtersRef = useRef<ProjectFilters | null>(null);
  
  // Создаем стабильный объект фильтров
  if (!filtersRef.current || filtersRef.current.limit !== limit) {
    filtersRef.current = { isPublic: true, ...(limit && { limit }) };
  }
  
  return useProjects(filtersRef.current);
};

// Хук для избранных проектов с мемоизацией
export const useFeaturedProjects = (limit?: number) => {
  const filtersRef = useRef<ProjectFilters | null>(null);
  
  // Создаем стабильный объект фильтров
  if (!filtersRef.current || filtersRef.current.limit !== limit) {
    filtersRef.current = { isFeatured: true, ...(limit && { limit }) };
  }
  
  return useProjects(filtersRef.current);
};

// Хук для CRUD операций с проектами
export const useProjectCRUD = () => {
  const { createProject, updateProject, deleteProject, incrementViewCount } = useProjectsManager();
  
  // Мемоизируем объект чтобы избежать лишних перерендеров
  return useRef({
    createProject,
    updateProject,
    deleteProject,
    incrementViewCount
  }).current;
};

// Хук для управления кешем проектов
export const useProjectCache = () => {
  const { clearProjectsCache, clearSingleProjectCache, getProjectById } = useProjectsManager();
  
  // Мемоизируем объект чтобы избежать лишних перерендеров
  return useRef({
    clearProjectsCache,
    clearSingleProjectCache,
    getProjectById
  }).current;
};

// Экспортируем типы
export type { Project, ProjectFilters };