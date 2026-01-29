import { useState, useEffect } from 'react';
import { supabase } from "@gridix/utils/api";
import { Apartment, normalizeApartmentData } from '@/entities/apartment/model/types';
import { toast } from 'sonner';

export interface UseApartmentOptions {
  useId?: boolean; // Если true, то identifier интерпретируется как ID, иначе как apartment_number
}

export const useApartment = (projectIdentifier?: string, apartmentIdentifier?: string, options: UseApartmentOptions = {}) => {
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApartment = async (projId: string, aptId: string) => {
    if (!projId || !aptId) return;

    setLoading(true);
    setError(null);

    try {
      // Сначала получаем ID проекта, если передан slug
      let projectId = projId;
      
      // Проверяем, является ли projectIdentifier UUID или slug
      const isProjectUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projId);
      
      if (!isProjectUUID) {
        // Ищем проект по slug
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id')
          .eq('slug', projId)
          .single();

        if (projectError || !projectData) {
          setError('Проект не найден');
          return;
        }
        projectId = projectData.id;
      }

      // Теперь ищем квартиру
      let query = supabase.from('apartments').select('*').eq('project_id', projectId);
      
      if (options.useId) {
        // Ищем по ID квартиры
        query = query.eq('id', aptId);
      } else {
        // Ищем по номеру квартиры
        query = query.eq('apartment_number', aptId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Квартира не найдена');
        } else {
          throw error;
        }
        return;
      }

      setApartment(normalizeApartmentData(data));

    } catch (err: any) {
      console.error('Error loading apartment:', err);
      setError(err.message || 'Ошибка загрузки квартиры');
    } finally {
      setLoading(false);
    }
  };

  const updateApartment = async (apartmentId: string, updates: Partial<Apartment>) => {
    try {
      const safeUpdates: Partial<Apartment> = {
        ...updates,
        ...(typeof updates.rooms === 'number' ? { rooms: String(updates.rooms) } : {}),
      };

      const { data, error } = await supabase
        .from('apartments')
        .update(safeUpdates as any)
        .eq('id', apartmentId)
        .select()
        .single();

      if (error) throw error;

      setApartment(normalizeApartmentData(data));
      toast.success('Квартира обновлена');
      return true;
    } catch (err: any) {
      console.error('Error updating apartment:', err);
      toast.error(err.message || 'Ошибка обновления квартиры');
      return false;
    }
  };

  useEffect(() => {
    if (projectIdentifier && apartmentIdentifier) {
      loadApartment(projectIdentifier, apartmentIdentifier);
    }
  }, [projectIdentifier, apartmentIdentifier, options.useId]);

  const getRooms = (apartment: Apartment) => {
    if (apartment.type === 'apartment') {
      return apartment.rooms;
    }
    return apartment.type;
  };

  return {
    apartment,
    loading,
    error,
    loadApartment,
    updateApartment,
    refresh: () => projectIdentifier && apartmentIdentifier && loadApartment(projectIdentifier, apartmentIdentifier)
  };
};
