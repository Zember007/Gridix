import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/shared/api/supabase";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type ProjectDomain = Tables<'project_domains'>;
type ProjectDomainInsert = Tables<'project_domains'>['Insert'];
type ProjectDomainUpdate = Tables<'project_domains'>['Update'];

export interface UseProjectDomainsResult {
  domains: ProjectDomain[];
  loading: boolean;
  error: string | null;
  addDomain: (domain: Omit<ProjectDomainInsert, 'id' | 'created_at' | 'updated_at'>) => Promise<ProjectDomain | null>;
  updateDomain: (id: string, updates: ProjectDomainUpdate) => Promise<boolean>;
  deleteDomain: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useProjectDomains(projectId?: string): UseProjectDomainsResult {
  const [domains, setDomains] = useState<ProjectDomain[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDomains = useCallback(async () => {
    if (!projectId) {
      setDomains([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('project_domains')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      setDomains(data || []);
    } catch (e: any) {
      console.error('Error loading project domains:', e);
      const errorMessage = e.message || 'Ошибка загрузки доменов';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const addDomain = useCallback(async (domainData: Omit<ProjectDomainInsert, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectDomain | null> => {
    try {
      // Clean and validate domain
      const cleanDomain = domainData.domain.toLowerCase().trim();
      
      // Remove protocol if present
      const domain = cleanDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      
      // Basic domain validation
      if (!domain || !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
        throw new Error('Неверный формат домена. Используйте формат: example.com');
      }

      const { data, error } = await supabase
        .from('project_domains')
        .insert({
          ...domainData,
          domain
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // unique constraint violation
          throw new Error('Этот домен уже используется другим проектом');
        }
        throw error;
      }

      toast.success('Домен успешно добавлен');
      await loadDomains(); // Refresh the list
      return data;
    } catch (e: any) {
      console.error('Error adding domain:', e);
      const errorMessage = e.message || 'Ошибка добавления домена';
      toast.error(errorMessage);
      return null;
    }
  }, [loadDomains]);

  const updateDomain = useCallback(async (id: string, updates: ProjectDomainUpdate): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('project_domains')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Домен успешно обновлен');
      await loadDomains(); // Refresh the list
      return true;
    } catch (e: any) {
      console.error('Error updating domain:', e);
      const errorMessage = e.message || 'Ошибка обновления домена';
      toast.error(errorMessage);
      return false;
    }
  }, [loadDomains]);

  const deleteDomain = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('project_domains')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Домен успешно удален');
      await loadDomains(); // Refresh the list
      return true;
    } catch (e: any) {
      console.error('Error deleting domain:', e);
      const errorMessage = e.message || 'Ошибка удаления домена';
      toast.error(errorMessage);
      return false;
    }
  }, [loadDomains]);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  return {
    domains,
    loading,
    error,
    addDomain,
    updateDomain,
    deleteDomain,
    refresh: loadDomains
  };
}
