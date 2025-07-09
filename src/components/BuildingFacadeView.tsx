
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Apartment } from '@/types/apartment';

interface BuildingFacadeViewProps {
  projectId: string;
  project: {
    id: string;
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
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

const BuildingFacadeView = ({ projectId, project, apartments, onApartmentSelect }: BuildingFacadeViewProps) => {
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBuildingFloors();
  }, [projectId]);

  const loadBuildingFloors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('building_floors')
        .select('*')
        .eq('project_id', projectId)
        .order('floor_number');

      if (error) throw error;

      const processedFloors = data.map(floor => ({
        ...floor,
        polygon: Array.isArray(floor.polygon) ? floor.polygon as { x: number; y: number }[] : []
      }));

      setBuildingFloors(processedFloors);
    } catch (error) {
      console.error('Error loading building floors:', error);
      setBuildingFloors([]);
    } finally {
      setLoading(false);
    }
  };

  const getFloorApartments = (floorNumber: number) => {
    return apartments.filter(apt => apt.floor_number === floorNumber);
  };

  const getFloorStatusColor = (floorNumber: number) => {
    const floorApartments = getFloorApartments(floorNumber);
    if (floorApartments.length === 0) return '#6b7280';
    
    const availableCount = floorApartments.filter(apt => apt.status === 'available').length;
    const totalCount = floorApartments.length;
    
    if (availableCount === totalCount) return '#3b82f6'; // Все доступны
    if (availableCount === 0) return '#ef4444'; // Все проданы
    return '#f59e0b'; // Частично доступны
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Фасад здания */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Фасад здания</h3>
            {project.address && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{project.address}</span>
              </div>
            )}
          </div>

          {project.building_image_url ? (
            <div className="relative bg-gray-50 rounded-lg overflow-hidden">
              <img 
                src={project.building_image_url} 
                alt={`Фасад ${project.name}`}
                className="w-full h-auto max-h-[500px] object-contain"
              />
              
              {/* Overlay с этажами */}
              {buildingFloors.length > 0 && (
                <div className="absolute inset-0">
                  <svg className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
                    {buildingFloors.map((floor) => {
                      if (!floor.polygon || floor.polygon.length < 3) return null;
                      
                      const points = floor.polygon
                        .map(point => `${point.x},${point.y}`)
                        .join(' ');

                      const floorApartments = getFloorApartments(floor.floor_number);
                      const statusColor = getFloorStatusColor(floor.floor_number);

                      return (
                        <g key={floor.id}>
                          <polygon
                            points={points}
                            fill={statusColor}
                            fillOpacity={0.3}
                            stroke={statusColor}
                            strokeWidth={2}
                            className="cursor-pointer hover:fillOpacity-50 transition-all"
                            onClick={() => {
                              if (floorApartments.length > 0) {
                                onApartmentSelect(floorApartments[0]);
                              }
                            }}
                          />
                          {/* Номер этажа */}
                          {floor.polygon.length > 0 && (
                            <text
                              x={floor.polygon.reduce((sum, p) => sum + p.x, 0) / floor.polygon.length}
                              y={floor.polygon.reduce((sum, p) => sum + p.y, 0) / floor.polygon.length}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-white font-bold text-sm pointer-events-none"
                              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
                            >
                              {floor.floor_number}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500 bg-gray-50 rounded-lg">
              <Navigation className="h-12 w-12 mb-4" />
              <p>Изображение фасада не загружено</p>
              <p className="text-sm mt-1">Обратитесь к администратору для загрузки изображения</p>
            </div>
          )}

          {/* Легенда */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded opacity-60"></div>
              <span>Все квартиры доступны</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-600 rounded opacity-60"></div>
              <span>Частично доступны</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded opacity-60"></div>
              <span>Все проданы</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Карта расположения */}
      {project.latitude && project.longitude && (
        <Card>
          <CardContent className="p-4">
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Расположение на карте</h3>
            </div>
            
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p>Интеграция с картой</p>
                <p className="text-sm">
                  Координаты: {project.latitude.toFixed(6)}, {project.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BuildingFacadeView;
