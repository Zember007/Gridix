
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Navigation, Maximize } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  building_image_url: string | null;
  apartment_count: number;
  available_count: number;
  price_from: number | null;
}

interface ProjectsMapProps {
  onProjectSelect?: (projectId: string) => void;
  selectedProjectId?: string;
}

const ProjectsMap = ({ onProjectSelect, selectedProjectId }: ProjectsMapProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          apartments (
            id,
            status,
            price
          )
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;

      const processedProjects = data.map(project => {
        const apartments = project.apartments || [];
        const availableApartments = apartments.filter((apt: any) => apt.status === 'available');
        const prices = apartments.map((apt: any) => apt.price).filter((p: any) => p > 0);
        
        return {
          id: project.id,
          name: project.name,
          description: project.description || '',
          address: project.address || '',
          latitude: project.latitude,
          longitude: project.longitude,
          building_image_url: project.building_image_url,
          apartment_count: apartments.length,
          available_count: availableApartments.length,
          price_from: prices.length > 0 ? Math.min(...prices) : null
        };
      });

      setProjects(processedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'По запросу';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const getProjectMarkerColor = (project: Project) => {
    if (project.available_count === 0) return '#ef4444'; // Красный - все продано
    if (project.available_count === project.apartment_count) return '#3b82f6'; // Синий - все доступно
    return '#f59e0b'; // Желтый - частично доступно
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
    <Card>
      <CardContent className="p-4">
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Проекты на карте</h3>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span>Все доступно</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
              <span>Частично доступно</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span>Все продано</span>
            </div>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500 bg-gray-50 rounded-lg">
            <Navigation className="h-12 w-12 mb-4" />
            <p>Нет проектов с координатами</p>
            <p className="text-sm mt-1">Добавьте координаты в настройках проектов</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Заглушка карты - здесь будет интеграция с реальной картой */}
            <div className="h-96 bg-gray-100 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
                {/* Имитация карты */}
                <div className="w-full h-full relative">
                  {projects.map((project, index) => {
                    const x = 20 + (index % 3) * 30 + Math.random() * 20;
                    const y = 20 + Math.floor(index / 3) * 25 + Math.random() * 20;
                    const isSelected = selectedProjectId === project.id;
                    const isHovered = hoveredProject === project.id;
                    
                    return (
                      <div
                        key={project.id}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
                          isSelected || isHovered ? 'scale-125 z-10' : 'hover:scale-110'
                        }`}
                        style={{
                          left: `${x}%`,
                          top: `${y}%`
                        }}
                        onClick={() => onProjectSelect?.(project.id)}
                        onMouseEnter={() => setHoveredProject(project.id)}
                        onMouseLeave={() => setHoveredProject(null)}
                      >
                        {/* Маркер проекта */}
                        <div 
                          className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                            isSelected ? 'ring-2 ring-blue-400' : ''
                          }`}
                          style={{ backgroundColor: getProjectMarkerColor(project) }}
                        >
                          <Home className="h-4 w-4 text-white" />
                        </div>
                        
                        {/* Tooltip */}
                        {(isHovered || isSelected) && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64">
                            <div className="bg-white rounded-lg shadow-lg border p-3">
                              <div className="flex items-start gap-3">
                                {project.building_image_url && (
                                  <img 
                                    src={project.building_image_url} 
                                    alt={project.name}
                                    className="w-16 h-12 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm truncate">{project.name}</h4>
                                  <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    <span className="truncate">{project.address}</span>
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="text-sm font-bold text-blue-600">
                                      от {formatPrice(project.price_from)}
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs bg-green-50 text-green-700"
                                    >
                                      {project.available_count} доступно
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Overlay с кнопкой полноэкранного режима */}
                <div className="absolute top-4 right-4">
                  <button className="bg-white shadow-md rounded-lg p-2 hover:bg-gray-50">
                    <Maximize className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Список проектов */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <Card 
                  key={project.id}
                  className={`cursor-pointer transition-all ${
                    selectedProjectId === project.id 
                      ? 'ring-2 ring-blue-400 shadow-md' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => onProjectSelect?.(project.id)}
                  onMouseEnter={() => setHoveredProject(project.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: getProjectMarkerColor(project) }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1">{project.name}</h4>
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{project.address}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold text-blue-600">
                            от {formatPrice(project.price_from)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {project.available_count}/{project.apartment_count}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectsMap;
