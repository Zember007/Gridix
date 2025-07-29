
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Building2 } from 'lucide-react';
import { Apartment } from '@/types/apartment';
import { useLanguage } from '@/contexts/LanguageContext';
import FloorPlanView from '@/components/FloorPlanView';

interface ApartmentFloorPlanProps {
  projectId: string;
  project: {
    id: string;
    name: string;
    building_image_url: string | null;
  };
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

const ApartmentFloorPlan = ({ projectId, project, apartments, onApartmentSelect, selectedFloorNumber }: ApartmentFloorPlanProps) => {
  const { t } = useLanguage();
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);

  useEffect(() => {
    loadBuildingFloors();
  }, [projectId]);

  // Определяем выбранный этаж: используем переданный prop или первый доступный этаж
  const selectedFloor = selectedFloorNumber || (buildingFloors.length > 0 ? buildingFloors[0].floor_number : null);

  const loadBuildingFloors = async () => {
    try {
      const { data, error } = await supabase
        .from('building_floors')
        .select('*')
        .eq('project_id', projectId)
        .order('floor_number');

      if (error) throw error;

      const processedFloors = (data || []).map(floor => ({
        ...floor,
        polygon: Array.isArray(floor.polygon) ? floor.polygon as { x: number; y: number }[] : []
      }));

      setBuildingFloors(processedFloors);
    } catch (error) {
      console.error('Error loading building floors:', error);
    }
  };

  if (!buildingFloors.length || selectedFloor === null) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
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
