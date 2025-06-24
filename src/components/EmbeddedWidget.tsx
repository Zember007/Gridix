
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, X } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

interface Project {
  id: string;
  name: string;
  description: string;
  floors: number;
  building_image_url: string;
}

interface BuildingFloor {
  id: string;
  floor_number: number;
  polygon: { x: number; y: number }[];
  color: string;
}

interface FloorPlan {
  id: string;
  floor_number: number;
  image_url: string;
}

interface Apartment {
  id: string;
  apartment_number: string;
  rooms: number;
  area: number;
  price: number;
  status: 'available' | 'sold' | 'reserved';
  polygon: { x: number; y: number }[];
}

const EmbeddedWidget = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);

  // Widget configuration from URL params
  const showLegend = searchParams.get('legend') !== 'false';
  const showSearch = searchParams.get('search') === 'true';
  const theme = searchParams.get('theme') || 'light';

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedFloor && projectId) {
      loadFloorPlan();
      loadApartments();
    }
  }, [selectedFloor, projectId]);

  const parsePolygon = (polygon: Json): { x: number; y: number }[] => {
    if (Array.isArray(polygon)) {
      return polygon.filter(p => 
        typeof p === 'object' && 
        p !== null && 
        'x' in p && 
        'y' in p &&
        typeof p.x === 'number' &&
        typeof p.y === 'number'
      ) as { x: number; y: number }[];
    }
    return [];
  };

  const loadProject = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      const { data: floorsData, error: floorsError } = await supabase
        .from('building_floors')
        .select('*')
        .eq('project_id', projectId)
        .order('floor_number');

      if (floorsError) throw floorsError;
      
      const transformedFloors: BuildingFloor[] = floorsData.map(floor => ({
        id: floor.id,
        floor_number: floor.floor_number,
        polygon: parsePolygon(floor.polygon),
        color: floor.color
      }));

      setBuildingFloors(transformedFloors);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFloorPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('floor_plans')
        .select('*')
        .eq('project_id', projectId)
        .eq('floor_number', selectedFloor)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setFloorPlan(data);
    } catch (error) {
      console.error('Error loading floor plan:', error);
    }
  };

  const loadApartments = async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('project_id', projectId)
        .eq('floor_number', selectedFloor);

      if (error) throw error;
      
      const transformedApartments: Apartment[] = (data || []).map(apt => ({
        id: apt.id,
        apartment_number: apt.apartment_number,
        rooms: apt.rooms,
        area: Number(apt.area),
        price: Number(apt.price) || 0,
        status: (apt.status === 'available' || apt.status === 'sold' || apt.status === 'reserved') 
          ? apt.status 
          : 'available',
        polygon: parsePolygon(apt.polygon)
      }));

      setApartments(transformedApartments);
    } catch (error) {
      console.error('Error loading apartments:', error);
    }
  };

  const polygonToPath = (polygon: { x: number; y: number }[]) => {
    if (polygon.length === 0) return '';
    return `M ${polygon.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#22c55e';
      case 'sold': return '#ef4444';
      case 'reserved': return '#f59e0b';
      default: return '#22c55e';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Доступна';
      case 'sold': return 'Продана';
      case 'reserved': return 'Забронирована';
      default: return 'Доступна';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Building2 className="h-8 w-8 text-real-estate-600 animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-real-estate-600">Проект не найден</p>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-full ${isDark ? 'bg-gray-900 text-white' : 'bg-white'}`}>
      <div className="p-4">
        {/* Header */}
        <div className={`mb-4 pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <Building2 className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-real-estate-600'}`} />
            <div>
              <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-real-estate-900'}`}>
                {project.name}
              </h1>
              {project.description && (
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-real-estate-600'}`}>
                  {project.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
              <CardContent className="p-4">
                <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-real-estate-900'}`}>
                  {selectedFloor ? `${selectedFloor}-й этаж` : 'Выберите этаж'}
                </h2>
                
                {!selectedFloor && project.building_image_url && (
                  <div className="relative inline-block max-w-full">
                    <img
                      src={project.building_image_url}
                      alt="Building"
                      className="max-w-full max-h-96 object-contain rounded"
                    />
                    <svg
                      className="absolute top-0 left-0 w-full h-full cursor-pointer"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      {buildingFloors.map(floor => (
                        <g key={floor.id}>
                          <path
                            d={polygonToPath(floor.polygon)}
                            fill={floor.color}
                            fillOpacity="0.3"
                            stroke={floor.color}
                            strokeWidth="0.5"
                            className="hover:fill-opacity-60 transition-all cursor-pointer"
                            onClick={() => setSelectedFloor(floor.floor_number)}
                          />
                          <text
                            x={floor.polygon.reduce((sum, p) => sum + p.x, 0) / floor.polygon.length}
                            y={floor.polygon.reduce((sum, p) => sum + p.y, 0) / floor.polygon.length}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="white"
                            fontSize="2"
                            fontWeight="bold"
                            className="pointer-events-none"
                          >
                            {floor.floor_number}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                )}

                {selectedFloor && floorPlan?.image_url && (
                  <div className="relative inline-block max-w-full">
                    <img
                      src={floorPlan.image_url}
                      alt={`Floor ${selectedFloor} plan`}
                      className="max-w-full max-h-96 object-contain rounded"
                    />
                    <svg
                      className="absolute top-0 left-0 w-full h-full cursor-pointer"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      {apartments.map(apartment => (
                        <g key={apartment.id}>
                          <path
                            d={polygonToPath(apartment.polygon)}
                            fill={getStatusColor(apartment.status)}
                            fillOpacity={selectedApartment?.id === apartment.id ? 0.8 : 0.4}
                            stroke={getStatusColor(apartment.status)}
                            strokeWidth="0.3"
                            className="hover:fill-opacity-70 transition-all cursor-pointer"
                            onClick={() => setSelectedApartment(apartment)}
                          />
                          <text
                            x={apartment.polygon.reduce((sum, p) => sum + p.x, 0) / apartment.polygon.length}
                            y={apartment.polygon.reduce((sum, p) => sum + p.y, 0) / apartment.polygon.length}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="white"
                            fontSize="1.2"
                            fontWeight="bold"
                            className="pointer-events-none"
                          >
                            {apartment.apartment_number}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Floor Selection */}
            <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
              <CardContent className="p-4">
                <h3 className={`text-md font-semibold mb-3 ${isDark ? 'text-white' : 'text-real-estate-900'}`}>
                  Этажи
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: project.floors }, (_, i) => i + 1).map(floorNum => {
                    const hasFloor = buildingFloors.some(f => f.floor_number === floorNum);
                    return (
                      <Button
                        key={floorNum}
                        size="sm"
                        variant={selectedFloor === floorNum ? "default" : "outline"}
                        onClick={() => setSelectedFloor(selectedFloor === floorNum ? null : floorNum)}
                        disabled={!hasFloor}
                        className={`text-xs ${
                          hasFloor 
                            ? selectedFloor === floorNum
                              ? isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-real-estate-600 hover:bg-real-estate-700'
                              : isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {floorNum}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Apartment Details */}
            {selectedApartment && (
              <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-md font-semibold ${isDark ? 'text-white' : 'text-real-estate-900'}`}>
                      Кв. {selectedApartment.apartment_number}
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedApartment(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-real-estate-600'}>Статус:</span>
                      <Badge className={`text-xs ${
                        selectedApartment.status === 'available' ? 'bg-green-100 text-green-800' :
                        selectedApartment.status === 'sold' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusText(selectedApartment.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-real-estate-600'}>Комнат:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : ''}`}>
                        {selectedApartment.rooms}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-real-estate-600'}>Площадь:</span>
                      <span className={`font-medium ${isDark ? 'text-white' : ''}`}>
                        {selectedApartment.area} м²
                      </span>
                    </div>
                    
                    {selectedApartment.price > 0 && (
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-real-estate-600'}>Цена:</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-real-estate-900'}`}>
                          {formatPrice(selectedApartment.price)} ₽
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            {showLegend && (
              <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
                <CardContent className="p-4">
                  <h3 className={`text-md font-semibold mb-3 ${isDark ? 'text-white' : 'text-real-estate-900'}`}>
                    Легенда
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }}></div>
                      <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-real-estate-600'}`}>
                        Доступна
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                      <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-real-estate-600'}`}>
                        Забронирована
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                      <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-real-estate-600'}`}>
                        Продана
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedWidget;
