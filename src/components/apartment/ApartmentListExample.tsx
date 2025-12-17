import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Apartment } from '@/types/apartment';
import ApartmentList from './ApartmentList';
import { preloadProject } from '@/hooks/useProjectCache';

interface ApartmentListExampleProps {
  projectId: string;
}

const ApartmentListExample = ({ projectId }: ApartmentListExampleProps) => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Предзагружаем данные проекта для кеширования
    if (projectId) {
      preloadProject(projectId);
    }
    loadApartments();
  }, [projectId]);

  const loadApartments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('project_id', projectId)
        .order('floor_number', { ascending: true })
        .order('apartment_number', { ascending: true });

      if (error) throw error;
      
      // Нормализуем данные квартир
      const normalizedApartments = (data || []).map(apartment => ({
        ...apartment,
        status: apartment.status as 'available' | 'sold' | 'reserved',
        polygon: Array.isArray(apartment.polygon) ? apartment.polygon as { x: number; y: number }[] : [],
        price: apartment.price ? Number(apartment.price) : null,
        area: Number(apartment.area),
        rooms: Number(apartment.rooms),
        floor_number: Number(apartment.floor_number)
      }));

      setApartments(normalizedApartments);
    } catch (error) {
      console.error('Error loading apartments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApartmentSelect = (apartment: Apartment) => {
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E1E1E]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto  py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Список квартир</h2>
      
      <ApartmentList
        apartments={apartments}
        onApartmentSelect={handleApartmentSelect}
        projectId={projectId} // Передаем ID проекта для получения информации о валюте
      />
    </div>
  );
};

export default ApartmentListExample; 