import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Home, Filter, Grid3X3, Map } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ApartmentFilters from './ApartmentFilters';
import ApartmentList from './ApartmentList';
import FloorPlanView from './FloorPlanView';
import BuildingFacadeView from './BuildingFacadeView';
import { Apartment, normalizeApartmentData } from '@/types/apartment';

interface ProjectWidgetProps {
  projectId: string;
  showHeader?: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string;
  address: string;
  floors: number;
  building_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface FilterState {
  rooms: number[];
  status: string[];
  priceRange: [number, number];
  areaRange: [number, number];
  floor: number[];
}

const ProjectWidget = ({ projectId, showHeader = true }: ProjectWidgetProps) => {
  const [project, setProject] = useState<Project | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [filteredApartments, setFilteredApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    rooms: [],
    status: [],
    priceRange: [0, 0],
    areaRange: [0, 0],
    floor: []
  });

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  useEffect(() => {
    applyFilters();
  }, [apartments, filters]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      
      // Загружаем проект
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Загружаем квартиры
      const { data: apartmentsData, error: apartmentsError } = await supabase
        .from('apartments')
        .select('*')
        .eq('project_id', projectId)
        .order('floor_number')
        .order('apartment_number');

      if (apartmentsError) throw apartmentsError;
      
      // Нормализуем данные квартир
      const processedApartments = apartmentsData.map(normalizeApartmentData);
      setApartments(processedApartments);

      // Инициализируем диапазоны фильтров
      if (processedApartments.length > 0) {
        const prices = processedApartments.map(apt => apt.price || 0).filter(p => p > 0);
        const areas = processedApartments.map(apt => apt.area);
        
        setFilters(prev => ({
          ...prev,
          priceRange: prices.length > 0 ? [Math.min(...prices), Math.max(...prices)] : [0, 0],
          areaRange: [Math.min(...areas), Math.max(...areas)]
        }));
      }
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...apartments];

    if (filters.rooms.length > 0) {
      filtered = filtered.filter(apt => filters.rooms.includes(apt.rooms));
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter(apt => filters.status.includes(apt.status));
    }

    if (filters.floor.length > 0) {
      filtered = filtered.filter(apt => filters.floor.includes(apt.floor_number));
    }

    if (filters.priceRange[0] > 0 || filters.priceRange[1] > 0) {
      filtered = filtered.filter(apt => {
        const price = apt.price || 0;
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
    }

    if (filters.areaRange[0] > 0 || filters.areaRange[1] > 0) {
      filtered = filtered.filter(apt => 
        apt.area >= filters.areaRange[0] && apt.area <= filters.areaRange[1]
      );
    }

    setFilteredApartments(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'reserved': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sold': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Доступно';
      case 'reserved': return 'Забронировано';
      case 'sold': return 'Продано';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Проект не найден</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-sm">
      {showHeader && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
              {project.address && (
                <div className="flex items-center text-blue-100 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{project.address}</span>
                </div>
              )}
              {project.description && (
                <p className="text-blue-100 text-sm leading-relaxed">{project.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  <span>{filteredApartments.length} квартир</span>
                </div>
                <div className="flex items-center gap-1">
                  <Grid3X3 className="h-4 w-4" />
                  <span>{project.floors} этажей</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Фильтры */}
          <div className="lg:w-80 flex-shrink-0">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4" />
                  <h3 className="font-semibold">Фильтры</h3>
                </div>
                <ApartmentFilters
                  apartments={apartments}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </CardContent>
            </Card>

            {/* Статистика */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Статистика</h3>
                <div className="space-y-2">
                  {['available', 'reserved', 'sold'].map(status => {
                    const count = apartments.filter(apt => apt.status === status).length;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <Badge variant="outline" className={getStatusColor(status)}>
                          {getStatusText(status)}
                        </Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Основной контент */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Список квартир
                </TabsTrigger>
                <TabsTrigger value="floor" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  План этажа
                </TabsTrigger>
                <TabsTrigger value="building" className="flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Фасад
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="mt-4">
                <ApartmentList 
                  apartments={filteredApartments}
                  onApartmentSelect={(apartment) => {
                    console.log('Selected apartment:', apartment);
                  }}
                />
              </TabsContent>

              <TabsContent value="floor" className="mt-4">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Этаж:</span>
                    <div className="flex gap-1">
                      {Array.from({ length: project.floors }, (_, i) => i + 1).map(floor => (
                        <Button
                          key={floor}
                          size="sm"
                          variant={selectedFloor === floor ? "default" : "outline"}
                          onClick={() => setSelectedFloor(floor)}
                          className="w-10 h-8"
                        >
                          {floor}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <FloorPlanView
                  projectId={projectId}
                  floorNumber={selectedFloor}
                  apartments={filteredApartments.filter(apt => apt.floor_number === selectedFloor)}
                  onApartmentSelect={(apartment) => {
                    console.log('Selected apartment from floor plan:', apartment);
                  }}
                />
              </TabsContent>

              <TabsContent value="building" className="mt-4">
                <BuildingFacadeView
                  projectId={projectId}
                  project={project}
                  apartments={filteredApartments}
                  onApartmentSelect={(apartment) => {
                    console.log('Selected apartment from facade:', apartment);
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectWidget;
