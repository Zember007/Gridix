import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';
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
  installment_enabled: boolean;
  min_down_payment_percent: number;
  max_installment_months: number;
  pdf_presentation_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useProject = (identifier?: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { isManager, developerIds } = useUserRole();

  const loadProject = async (id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Пытаемся найти проект по slug, затем по ID
      let query = supabase.from('projects').select('*');
      
      // Проверяем, является ли identifier UUID или slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      
      if (isUUID) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', id);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Проект не найден');
        } else {
          throw error;
        }
        return;
      }

      // Проверяем права доступа
      const hasAccess = data.is_public || 
        (user && (
          // Владелец проекта имеет доступ
          data.user_id === user.id ||
          // Менеджер имеет доступ, если проект принадлежит застройщику, к которому он имеет доступ
          (isManager && developerIds.includes(data.user_id))
        ));
        
      if (!hasAccess) {
        setError('У вас нет доступа к этому проекту');
        return;
      }

      setProject(data);

      // Увеличиваем счетчик просмотров
      await incrementViewCount(data.id);

    } catch (err: any) {
      console.error('Error loading project:', err);
      setError(err.message || 'Ошибка загрузки проекта');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async (projectId: string) => {
    try {
      // Записываем просмотр в таблицу аналитики
      await supabase.from('project_views').insert({
        project_id: projectId,
        user_id: user?.id || null,
        ip_address: null, // В реальном приложении нужно получать IP
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
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    if (!user) {
      toast.error('Необходима авторизация');
      return false;
    }

    try {
      // Проверяем права на редактирование
      const canEdit = user && (
        // Владелец проекта может редактировать
        project?.user_id === user.id ||
        // Менеджер может редактировать, если проект принадлежит застройщику, к которому он имеет доступ
        (isManager && project?.user_id && developerIds.includes(project.user_id))
      );
      
      if (!canEdit) {
        throw new Error('У вас нет прав на редактирование этого проекта');
      }

      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      setProject(data);
      toast.success('Проект обновлен');
      return true;
    } catch (err: any) {
      console.error('Error updating project:', err);
      toast.error(err.message || 'Ошибка обновления проекта');
      return false;
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!user) {
      toast.error('Необходима авторизация');
      return false;
    }

    try {
      // Проверяем права на удаление (только владелец может удалять)
      if (!user || project?.user_id !== user.id) {
        throw new Error('Только владелец проекта может его удалить');
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      setProject(null);
      toast.success('Проект удален');
      return true;
    } catch (err: any) {
      console.error('Error deleting project:', err);
      toast.error(err.message || 'Ошибка удаления проекта');
      return false;
    }
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'user_id'>) => {
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

      // Инициализируем стандартные поля для нового проекта
      try {
        const { error: fieldsError } = await supabase.rpc('initialize_default_fields', {
          p_project_id: data.id
        });

        if (fieldsError) {
          console.error('Error initializing default fields:', fieldsError);
          // Не прерываем создание проекта из-за ошибки полей
        }
      } catch (fieldsErr) {
        console.error('Error calling initialize_default_fields:', fieldsErr);
      }

      toast.success('Проект создан');
      return data;
    } catch (err: any) {
      console.error('Error creating project:', err);
      toast.error(err.message || 'Ошибка создания проекта');
      return null;
    }
  };

  useEffect(() => {
    if (identifier) {
      loadProject(identifier);
    }
  }, [identifier, user]);

  return {
    project,
    loading,
    error,
    loadProject,
    updateProject,
    deleteProject,
    createProject,
    refresh: () => identifier && loadProject(identifier)
  };
};

export const useProjects = (userId?: string) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadProjects = async () => {
    setLoading(true);

    try {
      let query = supabase.from('projects').select('*');

      if (userId) {
        // Загружаем проекты конкретного пользователя
        query = query.eq('user_id', userId);
      } else {
        // Загружаем только публичные проекты
        query = query.eq('is_public', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(data || []);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      toast.error(err.message || 'Ошибка загрузки проектов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [userId, user]);

  return {
    projects,
    loading,
    refresh: loadProjects
  };
}; 