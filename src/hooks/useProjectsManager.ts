import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  floors: number;
  building_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  slug: string | null;
  currency: string | null;
  is_public: boolean;
  is_featured: boolean;
  view_count: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectFilters {
  userId?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
}

// Глобальный кеш для проектов
const projectsCache = new Map<string, { data: Project[]; timestamp: number; filters: ProjectFilters }>();
const singleProjectCache = new Map<string, { data: Project; timestamp: number }>();

// Глобальные состояния загрузки для предотвращения дублирования запросов
const loadingStates = new Map<string, Set<string>>();
const subscribers = new Map<string, Set<(data: any) => void>>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

// Утилитарные функции
const generateCacheKey = (filters: ProjectFilters): string => {
  return JSON.stringify(filters);
};

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

const notifySubscribers = (key: string, data: any) => {
  const subscriberSet = subscribers.get(key);
  if (subscriberSet) {
    subscriberSet.forEach(callback => callback(data));
  }
};

export const useProjectsManager = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriberRef = useRef<string | null>(null);

  // Загрузка списка проектов
  const loadProjects = useCallback(async (filters: ProjectFilters = {}) => {
    const cacheKey = generateCacheKey(filters);
    
    // Проверяем кеш
    const cached = projectsCache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      setProjects(cached.data);
      setError(null);
      setLoading(false);
      return;
    }

    // Проверяем, не загружается ли уже с такими же фильтрами
    if (loadingStates.has('projects') && loadingStates.get('projects')?.has(cacheKey)) {
      setLoading(true);
      setError(null);
      
      if (!subscribers.has(cacheKey)) {
        subscribers.set(cacheKey, new Set());
      }
      
      const subscriberSet = subscribers.get(cacheKey)!;
      const subscriber = (data: Project[]) => {
        setProjects(data);
        setLoading(false);
      };
      
      subscriberSet.add(subscriber);
      subscriberRef.current = cacheKey;
      return;
    }

    // Начинаем загрузку
    if (!loadingStates.has('projects')) {
      loadingStates.set('projects', new Set());
    }
    loadingStates.get('projects')!.add(cacheKey);
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('projects').select('*');

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      } else if (filters.isPublic !== undefined) {
        query = query.eq('is_public', filters.isPublic);
      }

      if (filters.isFeatured !== undefined) {
        query = query.eq('is_featured', filters.isFeatured);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error: supabaseError } = await query.order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      const projectsData = data || [];
      
      // Сохраняем в кеш
      projectsCache.set(cacheKey, {
        data: projectsData,
        timestamp: Date.now(),
        filters
      });

      setProjects(projectsData);
      setError(null);

      // Уведомляем подписчиков
      notifySubscribers(cacheKey, projectsData);

    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError(err.message || 'Ошибка загрузки проектов');
      setProjects([]);
      
      // Уведомляем подписчиков об ошибке
      notifySubscribers(cacheKey, []);
    } finally {
      setLoading(false);
      loadingStates.get('projects')?.delete(cacheKey);
    }
  }, []);

  // Загрузка одного проекта
  const loadProject = useCallback(async (identifier: string) => {
    if (!identifier) return null;

    // Проверяем кеш
    const cached = singleProjectCache.get(identifier);
    if (cached && isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    // Проверяем, не загружается ли уже
    if (loadingStates.has('single') && loadingStates.get('single')?.has(identifier)) {
      return new Promise<Project | null>((resolve) => {
        if (!subscribers.has(identifier)) {
          subscribers.set(identifier, new Set());
        }
        
        const subscriberSet = subscribers.get(identifier)!;
        const subscriber = (data: Project | null) => resolve(data);
        subscriberSet.add(subscriber);
      });
    }

    // Начинаем загрузку
    if (!loadingStates.has('single')) {
      loadingStates.set('single', new Set());
    }
    loadingStates.get('single')!.add(identifier);

    try {
      // Проверяем, является ли identifier UUID или slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
      
      let query = supabase.from('projects').select('*');
      
      if (isUUID) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('slug', identifier);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          notifySubscribers(identifier, null);
          return null;
        }
        throw error;
      }

      // Проверяем права доступа
      if (!data.is_public && (!user || data.user_id !== user.id)) {
        notifySubscribers(identifier, null);
        return null;
      }

      // Сохраняем в кеш
      singleProjectCache.set(identifier, {
        data: data as Project,
        timestamp: Date.now()
      });

      // Уведомляем подписчиков
      notifySubscribers(identifier, data);

      return data as Project;

    } catch (err: any) {
      console.error('Error loading project:', err);
      notifySubscribers(identifier, null);
      return null;
    } finally {
      loadingStates.get('single')?.delete(identifier);
    }
  }, [user]);

  // Создание проекта
  const createProject = useCallback(async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'user_id'>) => {
    if (!user) {
      toast.error('Необходима авторизация');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Очищаем кеш проектов пользователя
      clearProjectsCache({ userId: user.id });
      
      toast.success('Проект создан');
      return data as Project;
    } catch (err: any) {
      console.error('Error creating project:', err);
      toast.error(err.message || 'Ошибка создания проекта');
      return null;
    }
  }, [user]);

  // Обновление проекта
  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    if (!user) {
      toast.error('Необходима авторизация');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Обновляем кеш
      singleProjectCache.set(projectId, {
        data: data as Project,
        timestamp: Date.now()
      });

      // Очищаем кеш списков проектов
      clearProjectsCache();

      toast.success('Проект обновлен');
      return true;
    } catch (err: any) {
      console.error('Error updating project:', err);
      toast.error(err.message || 'Ошибка обновления проекта');
      return false;
    }
  }, [user]);

  // Удаление проекта
  const deleteProject = useCallback(async (projectId: string) => {
    if (!user) {
      toast.error('Необходима авторизация');
      return false;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Очищаем кеш
      singleProjectCache.delete(projectId);
      clearProjectsCache();

      toast.success('Проект удален');
      return true;
    } catch (err: any) {
      console.error('Error deleting project:', err);
      toast.error(err.message || 'Ошибка удаления проекта');
      return false;
    }
  }, [user]);

  // Очистка кеша
  const clearProjectsCache = useCallback((filters?: ProjectFilters) => {
    if (filters) {
      const cacheKey = generateCacheKey(filters);
      projectsCache.delete(cacheKey);
    } else {
      projectsCache.clear();
    }
  }, []);

  const clearSingleProjectCache = useCallback((projectId: string) => {
    singleProjectCache.delete(projectId);
  }, []);

  // Обновление счетчика просмотров
  const incrementViewCount = useCallback(async (projectId: string) => {
    try {
      // Записываем просмотр в таблицу аналитики
      await supabase.from('project_views').insert({
        project_id: projectId,
        user_id: user?.id || null,
        ip_address: null,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null
      });

      // Увеличиваем счетчик в проекте
      const { error } = await supabase.rpc('increment_view_count', {
        project_id: projectId
      });

      if (error) {
        console.error('Error incrementing view count:', error);
      }
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  }, [user]);

  // Очистка подписок при размонтировании
  useEffect(() => {
    return () => {
      if (subscriberRef.current) {
        const subscriberSet = subscribers.get(subscriberRef.current);
        if (subscriberSet) {
          subscriberSet.clear();
          subscribers.delete(subscriberRef.current);
        }
      }
    };
  }, []);

  return {
    // Состояние
    projects,
    loading,
    error,
    
    // Методы загрузки
    loadProjects,
    loadProject,
    
    // CRUD операции
    createProject,
    updateProject,
    deleteProject,
    
    // Кеш
    clearProjectsCache,
    clearSingleProjectCache,
    
    // Утилиты
    incrementViewCount,
    
    // Утилитарные методы
    getProjectById: (id: string) => singleProjectCache.get(id)?.data || null,
    getProjectsByUser: (userId: string) => loadProjects({ userId }),
    getPublicProjects: () => loadProjects({ isPublic: true }),
    getFeaturedProjects: () => loadProjects({ isFeatured: true })
  };
};

// Экспортируем тип для использования в других компонентах
export type { Project, ProjectFilters }; 