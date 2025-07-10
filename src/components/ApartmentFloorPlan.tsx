
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
}

interface BuildingFloor {
  id: string;
  floor_number: number;
  polygon: { x: number; y: number }[];
  color: string;
}

const ApartmentFloorPlan = ({ projectId, project, apartments, onApartmentSelect }: ApartmentFloorPlanProps) => {
  const { t } = useLanguage();
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  useEffect(() => {
    loadBuildingFloors();
  }, [projectId]);

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

  const getFloorApartments = (floorNumber: number) => {
    return apartments.filter(apt => apt.floor_number === floorNumber);
  };

  const handleFloorClick = (floorNumber: number) => {
    setSelectedFloor(floorNumber);
  };

  const handleBackToBuilding = () => {
    setSelectedFloor(null);
  };

  // Если выбран этаж, показываем план этажа
  if (selectedFloor) {
    const floorApartments = getFloorApartments(selectedFloor);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToBuilding}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← {t('project.backToBuilding')}
          </button>
          <h2 className="text-xl font-semibold">{selectedFloor} {t('project.floor')}</h2>
        </div>
        <FloorPlanView
          projectId={projectId}
          floorNumber={selectedFloor}
          apartments={floorApartments}
          onApartmentSelect={onApartmentSelect}
        />
      </div>
    );
  }

  if (!project.building_image_url && buildingFloors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <Building2 className="h-16 w-16 mb-4" />
        <p className="text-lg font-medium">{t('project.noBuildingPlan')}</p>
        <p className="text-sm">{t('project.contactAdmin')}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <h2 className="text-xl font-semibold mb-6">{t('project.interactivePlan')}</h2>
      
      {project.building_image_url ? (
        <div className="relative bg-gray-50 rounded-lg overflow-hidden">
          <div className="w-full max-h-[600px]">
            <img 
              src={project.building_image_url} 
              alt={`План ${project.name}`}
              className="w-full h-auto object-contain max-h-[600px]"
            />
          </div>
          
          {/* SVG overlay for interactive floors */}
          {buildingFloors.length > 0 && (
            <svg 
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100" 
              preserveAspectRatio="none"
            >
              {buildingFloors.map((floor) => {
                if (!floor.polygon || floor.polygon.length < 3) return null;
                
                const points = floor.polygon
                  .map(point => `${point.x},${point.y}`)
                  .join(' ');

                const floorApartments = getFloorApartments(floor.floor_number);
                const availableCount = floorApartments.filter(apt => apt.status === 'available').length;
                const totalCount = floorApartments.length;
                
                let fillColor = '#6b7280'; // default gray
                if (totalCount > 0) {
                  if (availableCount === totalCount) fillColor = '#3b82f6'; // all available - blue
                  else if (availableCount === 0) fillColor = '#ef4444'; // all sold - red  
                  else fillColor = '#f59e0b'; // partially available - yellow
                }

                return (
                  <g key={floor.id}>
                    <polygon
                      points={points}
                      fill={fillColor}
                      fillOpacity={0.3}
                      stroke={fillColor}
                      strokeWidth={0.5}
                      className="cursor-pointer hover:fill-opacity-50 transition-all"
                      onClick={() => handleFloorClick(floor.floor_number)}
                    />
                    {/* Floor number label */}
                    {floor.polygon.length > 0 && (
                      <text
                        x={floor.polygon.reduce((sum, p) => sum + p.x, 0) / floor.polygon.length}
                        y={floor.polygon.reduce((sum, p) => sum + p.y, 0) / floor.polygon.length}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white font-bold pointer-events-none"
                        fontSize="2"
                        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
                      >
                        {floor.floor_number}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg text-muted-foreground">
          <Building2 className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">Изображение плана не загружено</p>
        </div>
      )}
    </div>
  );
};

export default ApartmentFloorPlan;
