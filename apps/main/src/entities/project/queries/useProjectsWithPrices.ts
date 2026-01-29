import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@gridix/utils/api";
import { Tables } from '@gridix/types/database';

export type ProjectWithMinPrice = Pick<
  Tables<'projects'>,
  | 'id'
  | 'name'
  | 'description'
  | 'address'
  | 'building_image_url'
  | 'latitude'
  | 'longitude'
  | 'currency'
  | 'slug'
> & { min_price: number | null };

/**
 * Оптимизированный хук для получения проектов пользователя с минимальными ценами
 * Использует один оптимизированный запрос вместо множественных
 */
export const useProjectsWithPrices = (userId?: string) => {
  const [projects, setProjects] = useState<ProjectWithMinPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userExists, setUserExists] = useState<boolean | null>(null);

  // Запасной метод для случаев, когда RPC функция недоступна
  const loadProjectsWithPricesFallback = useCallback(async () => {
    if (!userId) return;

    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, description, address, building_image_url, latitude, longitude, currency, slug')
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (projectsError) throw projectsError;

    if (!projectsData || projectsData.length === 0) {
      setProjects([]);
      return;
    }

    const projectIds = projectsData.map(p => p.id);
    const { data: pricesData, error: pricesError } = await supabase
      .from('apartments')
      .select('project_id, price')
      .in('project_id', projectIds)
      .not('price', 'is', null)
      .order('price', { ascending: true });

    if (pricesError) throw pricesError;

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

    const projectsWithPrices: ProjectWithMinPrice[] = projectsData.map(project => ({
      ...project,
      min_price: minPricesByProject.get(project.id) || null
    }));

    setProjects(projectsWithPrices);
  }, [userId]);

  const loadProjectsWithPrices = useCallback(async () => {
    if (!userId) {
      setProjects([]);
      // Для публичного доступа не сигнализируем об отсутствии пользователя
      setUserExists(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // В публичном режиме не блокируем загрузку из-за отсутствия профиля
      setUserExists(null);

      // Оптимизированный запрос: получаем проекты с минимальными ценами одним запросом
      // Используем LEFT JOIN с подзапросом для получения минимальной цены
      const rpcClient = supabase as unknown as {
        rpc: (
          fn: string,
          args: unknown
        ) => Promise<{ data: unknown; error: { code?: string } | null }>;
      };
      const { data, error: supabaseError } = await rpcClient.rpc('get_projects_with_min_prices', {
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

      const typedData = (data as ProjectWithMinPrice[]) || [];
      setProjects(typedData);
    } catch (err: unknown) {
      console.error('Error loading projects with prices:', err);
      const message = err instanceof Error ? err.message : 'Ошибка загрузки проектов';
      setError(message);
      
      // Используем запасной метод в случае ошибки
      try {
        await loadProjectsWithPricesFallback();
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, loadProjectsWithPricesFallback]);

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