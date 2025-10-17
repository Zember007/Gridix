
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Building2 } from 'lucide-react';
import { Apartment } from '@/types/apartment';
import { useLanguage } from '@/contexts/LanguageContext';
import FloorPlanView from '@/components/visualization/FloorPlanView';

interface ApartmentFloorPlanProps {
  projectId: string;
  apartments: Apartment[];
  onApartmentSelect: (apartment: Apartment) => void;
  selectedFloorNumber?: number;
}

interface BuildingFloor {
  id: string;
  floor_number: number;
  polygon: { x: number; y: number }[];
  color: string;
}

const ApartmentFloorPlan = ({ projectId, apartments, onApartmentSelect, selectedFloorNumber }: ApartmentFloorPlanProps) => {
  const { t } = useLanguage();
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);

  useEffect(() => {
    // Загружаем только список этажей (id, floor_number)
    const loadFloorsLight = async () => {
      try {
        const { data, error } = await supabase
          .from('building_floors')
          .select('id, floor_number')
          .eq('project_id', projectId)
          .order('floor_number');

        if (error) throw error;

        const processedFloors = (data || []).map((floor: any) => ({
          id: floor.id,
          floor_number: floor.floor_number,
          polygon: [],
          color: '#000000'
        }));

        setBuildingFloors(processedFloors);
      } catch (error) {
        console.error('Error loading building floors:', error);
      }
    };

    loadFloorsLight();
  }, [projectId]);

  // Определяем выбранный этаж: используем переданный prop или первый доступный этаж
  const selectedFloor = typeof selectedFloorNumber  === 'number' ? selectedFloorNumber : (buildingFloors.length > 0 ? buildingFloors[0].floor_number : null);
  // Убрали тяжёлую загрузку полигонов этажей здесь — не требуется для FloorPlanView

  if (!buildingFloors.length || selectedFloor === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Building2 className="h-16 w-16 mb-4" />
        <p className="text-lg font-medium">{t('project.noBuildingPlan')}</p>
        <p className="text-sm">{t('project.contactAdmin')}</p>
      </div>
    );
  }

  const floorApartments = apartments.filter(apt => apt.floor_number === selectedFloor);

  return (
      <FloorPlanView
        projectId={projectId}
        floorNumber={selectedFloor}
        apartments={floorApartments}
        onApartmentSelect={onApartmentSelect}
      />
  );
};

export default ApartmentFloorPlan;
