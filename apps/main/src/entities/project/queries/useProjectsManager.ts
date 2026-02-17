// useProjectsManager.ts - Исправленная версия
import { useState, useCallback } from "react";
import { supabase } from "@gridix/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tables } from "@gridix/types/database";
import { useLanguage } from "@gridix/utils/react";

// Используем тип из Supabase напрямую
export type Project = Tables<"projects">;

export interface ProjectFilters {
  userId?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
}

// Глобальный кеш для проектов
const projectsCache = new Map<
  string,
  { data: Project[]; timestamp: number; filters: ProjectFilters }
>();
const singleProjectCache = new Map<
  string,
  { data: Project; timestamp: number }
>();

// Глобальные состояния загрузки для предотвращения дублирования запросов
const loadingStates = new Map();

const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

// Утилитарные функции
const generateCacheKey = (filters: ProjectFilters): string => {
  return JSON.stringify(filters, Object.keys(filters).sort());
};

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

export const useProjectsManager = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  // Мемоизированная функция для загрузки проектов
  const loadProjects = useCallback(async (filters: ProjectFilters = {}) => {
    const cacheKey = generateCacheKey(filters);

    // Проверяем кеш
    const cached = projectsCache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      setProjects(cached.data);
      setError(null);
      setLoading(false);
      return cached.data;
    }

    // Проверяем, не загружается ли уже с такими же фильтрами
    if (loadingStates.has(`projects-${cacheKey}`)) {
      setLoading(true);
      setError(null);
      try {
        const result = await loadingStates.get(`projects-${cacheKey}`);
        setProjects(result);
        setLoading(false);
        return result;
      } catch (err) {
        setLoading(false);
        throw err;
      }
    }

    // Создаем промис загрузки
    const loadingPromise = (async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase.from("projects").select("*");

        if (filters.userId) {
          query = query.eq("user_id", filters.userId);
        } else if (filters.isPublic !== undefined) {
          query = query.eq("is_public", filters.isPublic);
        }

        if (filters.isFeatured !== undefined) {
          query = query.eq("is_featured", filters.isFeatured);
        }

        if (filters.limit) {
          query = query.limit(filters.limit);
        }

        if (filters.offset) {
          query = query.range(
            filters.offset,
            filters.offset + (filters.limit || 50) - 1,
          );
        }

        const { data, error: supabaseError } = await query.order("created_at", {
          ascending: false,
        });

        if (supabaseError) throw supabaseError;

        const projectsData = data || [];

        // Сохраняем в кеш
        projectsCache.set(cacheKey, {
          data: projectsData,
          timestamp: Date.now(),
          filters,
        });

        setProjects(projectsData);
        setError(null);
        return projectsData;
      } catch (err) {
        console.error("Error loading projects:", err);
        const errorMessage =
          (err as Error).message || "Ошибка загрузки проектов";
        setError(errorMessage);
        setProjects([]);
        throw err;
      } finally {
        setLoading(false);
        loadingStates.delete(`projects-${cacheKey}`);
      }
    })();

    // Сохраняем промис в состояние загрузки
    loadingStates.set(`projects-${cacheKey}`, loadingPromise);

    return loadingPromise;
  }, []); // Убираем зависимости, чтобы избежать пересоздания функции

  // Обновление счетчика просмотров
  const incrementViewCount = useCallback(
    async (projectId: string) => {
      try {
        // Записываем просмотр в таблицу аналитики
        await supabase.from("project_views").insert({
          project_id: projectId,
          user_id: user?.id || null,
          ip_address: null,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });

        // Увеличиваем счетчик в проекте
        const { error } = await supabase.rpc("increment_view_count", {
          project_id: projectId,
        });

        if (error) {
          console.error("Error incrementing view count:", error);
        }
      } catch (err) {
        console.error("Error tracking view:", err);
      }
    },
    [user],
  );

  // Мемоизированная функция для загрузки одного проекта
  const loadProject = useCallback(
    async (identifier: string): Promise<Project | null> => {
      if (!identifier) return null;

      // Проверяем кеш
      const cached = singleProjectCache.get(identifier);

      if (cached && isCacheValid(cached.timestamp)) {
        return cached.data;
      }

      // Проверяем, не загружается ли уже
      if (loadingStates.has(`project-${identifier}`)) {
        try {
          return await loadingStates.get(`project-${identifier}`);
        } catch (err) {
          return null;
        }
      }

      // Создаем промис загрузки
      const loadingPromise = (async (): Promise<Project | null> => {
        try {
          // Проверяем, является ли identifier UUID или slug
          const isUUID =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              identifier,
            );

          let query = supabase.from("projects").select("*");

          if (isUUID) {
            query = query.eq("id", identifier);
          } else {
            query = query.eq("slug", identifier);
          }

          const { data, error } = await query.maybeSingle();

          if (error) {
            if (error.code === "PGRST116") {
              return null;
            }
            throw error;
          }

          /*  // Проверяем права доступа
        if (!data.is_public && (!user || data.user_id !== user.id)) {
          return null;
        } */

          const project = data as Project;

          // Сохраняем в кеш
          singleProjectCache.set(identifier, {
            data: project,
            timestamp: Date.now(),
          });

          // Записываем просмотр проекта
          // Просмотр записывается для всех, кто имеет доступ к проекту (публичные проекты или владельцы)
          // Записываем просмотр асинхронно, не блокируя загрузку проекта
          if (project) {
            incrementViewCount(project.id).catch((err) => {
              console.error("Error tracking project view:", err);
            });
          }

          return project;
        } catch (err) {
          console.error("Error loading project:", err);
          return null;
        } finally {
          loadingStates.delete(`project-${identifier}`);
        }
      })();

      // Сохраняем промис в состояние загрузки
      loadingStates.set(`project-${identifier}`, loadingPromise);

      return loadingPromise;
    },
    [user, incrementViewCount],
  ); // user и incrementViewCount в зависимостях

  // Создание проекта
  const createProject = useCallback(
    async (
      projectData: Omit<
        Project,
        "id" | "created_at" | "updated_at" | "view_count" | "user_id"
      >,
    ) => {
      if (!user) {
        toast.error("Необходима авторизация");
        return null;
      }

      try {
        const { data, error } = await supabase
          .from("projects")
          .insert({
            ...projectData,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Инициализируем стандартные поля для нового проекта
        try {
          const { error: fieldsError } = await supabase.rpc(
            "initialize_default_fields",
            {
              p_project_id: data.id,
            },
          );

          if (fieldsError) {
            console.error("Error initializing default fields:", fieldsError);
            // Не прерываем создание проекта из-за ошибки полей
          }
        } catch (fieldsErr) {
          console.error("Error calling initialize_default_fields:", fieldsErr);
        }

        // Очищаем кеш проектов пользователя
        clearProjectsCache({ userId: user.id });

        toast.success(t("projectEditor.projectCreated"));
        return data as Project;
      } catch (err) {
        console.error("Error creating project:", err);
        toast.error((err as Error).message || "Ошибка создания проекта");
        return null;
      }
    },
    [user],
  );

  // Обновление проекта
  const updateProject = useCallback(
    async (projectId: string, updates: Partial<Project>) => {
      if (!user) {
        toast.error("Необходима авторизация");
        return false;
      }

      try {
        const { data, error } = await supabase
          .from("projects")
          .update(updates)
          .eq("id", projectId)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        // Обновляем кеш
        singleProjectCache.set(projectId, {
          data: data as Project,
          timestamp: Date.now(),
        });

        // Очищаем кеш списков проектов
        clearProjectsCache();

        toast.success("Проект обновлен");
        return true;
      } catch (err) {
        console.error("Error updating project:", err);
        toast.error((err as Error).message || "Ошибка обновления проекта");
        return false;
      }
    },
    [user],
  );

  // Удаление проекта
  const deleteProject = useCallback(
    async (projectId: string) => {
      if (!user) {
        toast.error("Необходима авторизация");
        return false;
      }

      try {
        const { error } = await supabase
          .from("projects")
          .delete()
          .eq("id", projectId)
          .eq("user_id", user.id);

        if (error) throw error;

        // Очищаем кеш
        singleProjectCache.delete(projectId);
        clearProjectsCache();

        toast.success("Проект удален");
        return true;
      } catch (err) {
        console.error("Error deleting project:", err);
        toast.error((err as Error).message || "Ошибка удаления проекта");
        return false;
      }
    },
    [user],
  );

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
  };
};
