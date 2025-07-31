import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Глобальный кеш для проверки существования пользователя
 */
const userExistsCache = new Map<string, { exists: boolean; timestamp: number }>();
const USER_CACHE_DURATION = 10 * 60 * 1000; // 10 минут

interface ProjectWithMinPrice {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  building_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  currency: string | null;
  min_price: number | null;
}

/**
 * Оптимизированный хук для получения проектов пользователя с минимальными ценами
 * Использует один оптимизированный запрос вместо множественных
 */
export const useProjectsWithPrices = (userId?: string) => {
  const [projects, setProjects] = useState<ProjectWithMinPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userExists, setUserExists] = useState<boolean | null>(null);

  const loadProjectsWithPrices = useCallback(async () => {
    if (!userId) {
      setProjects([]);
      setUserExists(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Сначала проверяем существование пользователя (используем кеш)
      const cached = userExistsCache.get(userId);
      let userCheckResult: boolean;

      if (cached && Date.now() - cached.timestamp < USER_CACHE_DURATION) {
        userCheckResult = cached.exists;
      } else {
        // Проверяем существование пользователя
        const { data: userProfile, error: userError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', userId)
          .single();

        userCheckResult = !userError && !!userProfile;
        
        // Кешируем результат
        userExistsCache.set(userId, {
          exists: userCheckResult,
          timestamp: Date.now()
        });
      }

      setUserExists(userCheckResult);

      if (!userCheckResult) {
        setProjects([]);
        setError('Пользователь не найден');
        return;
      }

      // Оптимизированный запрос: получаем проекты с минимальными ценами одним запросом
      // Используем LEFT JOIN с подзапросом для получения минимальной цены
      const { data, error: supabaseError } = await supabase.rpc('get_projects_with_min_prices', {
        user_id_param: userId
      });

      if (supabaseError) {
        // Если RPC функция не существует, используем запасной вариант
        if (supabaseError.code === '42883') {
          console.warn('RPC function not found, using fallback method');
          await loadProjectsWithPricesFallback();
          return;
        }
        throw supabaseError;
      }

      setProjects(data || []);
    } catch (err: any) {
      console.error('Error loading projects with prices:', err);
      setError(err.message || 'Ошибка загрузки проектов');
      
      // Используем запасной метод в случае ошибки
      try {
        await loadProjectsWithPricesFallback();
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Запасной метод для случаев, когда RPC функция недоступна
  const loadProjectsWithPricesFallback = async () => {
    if (!userId) return;

    // Загружаем проекты
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, description, address, building_image_url, latitude, longitude, currency')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (projectsError) throw projectsError;

    if (!projectsData || projectsData.length === 0) {
      setProjects([]);
      return;
    }

    // Для каждого проекта получаем минимальную цену одним запросом
    const projectIds = projectsData.map(p => p.id);
    
    const { data: pricesData, error: pricesError } = await supabase
      .from('apartments')
      .select('project_id, price')
      .in('project_id', projectIds)
      .not('price', 'is', null)
      .order('price', { ascending: true });

    if (pricesError) throw pricesError;

    // Группируем цены по проектам и находим минимальные
    const minPricesByProject = new Map<string, number>();
    
    if (pricesData) {
      pricesData.forEach(apartment => {
        const currentMin = minPricesByProject.get(apartment.project_id);
        const price = Number(apartment.price);
        
        if (currentMin === undefined || price < currentMin) {
          minPricesByProject.set(apartment.project_id, price);
        }
      });
    }

    // Объединяем данные проектов с минимальными ценами
    const projectsWithPrices = projectsData.map(project => ({
      ...project,
      min_price: minPricesByProject.get(project.id) || null
    }));

    setProjects(projectsWithPrices);
  };

  useEffect(() => {
    loadProjectsWithPrices();
  }, [loadProjectsWithPrices]);

  return {
    projects,
    loading,
    error,
    userExists,
    refresh: loadProjectsWithPrices
  };
};

/**
 * @deprecated Используйте useProjectsWithPrices вместо этого - он включает проверку пользователя
 * Оставлен для обратной совместимости
 */
export const useUserExists = (userId?: string) => {
  console.warn('useUserExists is deprecated, use useProjectsWithPrices instead');
  const { userExists: exists, loading } = useProjectsWithPrices(userId);
  return { exists, loading };
};