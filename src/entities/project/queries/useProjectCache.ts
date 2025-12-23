import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/shared/api/supabase";

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
  installment_enabled: boolean;
  min_down_payment_percent: number;
  max_installment_months: number;
  created_at: string;
  updated_at: string;
}

// Глобальный кеш для проектов
const projectCache = new Map<string, { data: Project; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут в миллисекундах

// Глобальные состояния загрузки для предотвращения дублирования запросов
const loadingProjects = new Set<string>();
const projectSubscribers = new Map<string, Set<(project: Project | null) => void>>();

/**
 * Оптимизированный хук для работы с данными проекта с кешированием
 * и предотвращением дублирования запросов
 */
export const useProjectCache = (projectId?: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriberRef = useRef<(project: Project | null) => void>();

  // Функция для очистки кеша (может использоваться при обновлении проекта)
  const clearCache = (id: string) => {
    projectCache.delete(id);
  };

  // Функция для проверки актуальности кеша
  const isCacheValid = (timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_DURATION;
  };

  // Основная функция загрузки проекта
  const loadProject = async (id: string) => {
    if (!id) {
      setProject(null);
      setError(null);
      return;
    }

    // Проверяем кеш
    const cached = projectCache.get(id);
    if (cached && isCacheValid(cached.timestamp)) {
      setProject(cached.data);
      setError(null);
      setLoading(false);
      return;
    }

    // Проверяем, не загружается ли уже этот проект
    if (loadingProjects.has(id)) {
      // Подписываемся на результат загрузки
      setLoading(true);
      setError(null);
      
      if (!projectSubscribers.has(id)) {
        projectSubscribers.set(id, new Set());
      }
      
      const subscribers = projectSubscribers.get(id)!;
      const subscriber = (loadedProject: Project | null) => {
        setProject(loadedProject);
        setLoading(false);
      };
      
      subscribers.add(subscriber);
      subscriberRef.current = subscriber;
      return;
    }

    // Начинаем загрузку
    loadingProjects.add(id);
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          setError('Проект не найден');
        } else {
          throw supabaseError;
        }
        return;
      }

      // Сохраняем в кеш
      projectCache.set(id, {
        data: data as Project,
        timestamp: Date.now()
      });

      // Обновляем состояние
      setProject(data as Project);
      setError(null);

      // Уведомляем всех подписчиков
      const subscribers = projectSubscribers.get(id);
      if (subscribers) {
        subscribers.forEach(callback => callback(data as Project));
        projectSubscribers.delete(id);
      }

    } catch (err: any) {
      console.error('Error loading project:', err);
      setError(err.message || 'Ошибка загрузки проекта');
      setProject(null);

      // Уведомляем подписчиков об ошибке
      const subscribers = projectSubscribers.get(id);
      if (subscribers) {
        subscribers.forEach(callback => callback(null));
        projectSubscribers.delete(id);
      }
    } finally {
      setLoading(false);
      loadingProjects.delete(id);
    }
  };

  // Эффект для загрузки проекта при изменении ID
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    } else {
      setProject(null);
      setError(null);
      setLoading(false);
    }

    // Очистка подписки при размонтировании
    return () => {
      if (subscriberRef.current && projectId) {
        const subscribers = projectSubscribers.get(projectId);
        if (subscribers) {
          subscribers.delete(subscriberRef.current);
          if (subscribers.size === 0) {
            projectSubscribers.delete(projectId);
          }
        }
      }
    };
  }, [projectId]);

  return {
    project,
    loading,
    error,
    refresh: () => projectId && loadProject(projectId),
    clearCache: () => projectId && clearCache(projectId),
    // Утилитарные функции для работы с валютой
    getCurrency: () => project?.currency || null,
    getProjectInfo: () => project ? {
      id: project.id,
      currency: project.currency,
      name: project.name
    } : null
  };
};

/**
 * Хук для получения только информации о валюте проекта
 * Более легковесная версия для компонентов, которым нужна только валюта
 */
export const useProjectCurrency = (projectId?: string) => {
  const { project, loading, error } = useProjectCache(projectId);
  
  return {
    currency: project?.currency || null,
    loading,
    error
  };
};

/**
 * Функция для предварительной загрузки проекта в кеш
 * Полезна для предзагрузки данных
 */
export const preloadProject = async (projectId: string): Promise<void> => {
  if (!projectId) return;
  
  // Проверяем, есть ли актуальные данные в кеше
  const cached = projectCache.get(projectId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return; // Данные актуальны
  }

  // Проверяем, не загружается ли уже
  if (loadingProjects.has(projectId)) {
    return; // Уже загружается
  }

  try {
    loadingProjects.add(projectId);
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!error && data) {
      projectCache.set(projectId, {
        data: data as Project,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('Error preloading project:', error);
  } finally {
    loadingProjects.delete(projectId);
  }
};

// Экспортируем тип Project для использования в других компонентах
export type { Project };