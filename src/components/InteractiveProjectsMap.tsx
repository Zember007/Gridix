import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Eye, SlidersHorizontal, DollarSign, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjectsWithPrices } from '@/hooks/useProjectsWithPrices';
import { formatPriceWithCurrency } from '@/lib/currency-utils';

interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  building_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  currency: string | null;
  min_price: number | null;
}

interface InteractiveProjectsMapProps {
  onProjectSelect?: (project: Project) => void;
  selectedProjectId?: string;
  userId?: string;
}

// Кастомная иконка для маркеров проектов
const createCustomIcon = (project: Project, isSelected: boolean = false) => {
  const iconSize = isSelected ? 60 : 50;
  
  return new Icon({
    iconUrl: project.building_image_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjAiIGZpbGw9IiMxRTFFMUUiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMgMjFoMTh2LTJIM3Yyem0wLTE2aDMuNUw3IDlsMy41LTRIMTd2MTJIM3Y5eiIgZmlsbD0iI2ZmZiIvPgo8L3N2Zz4KPC9zdmc+',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -iconSize / 2],
    className: isSelected ? 'selected-project-marker' : 'project-marker'
  });
};

// Компонент для автоматической подгонки карты под маркеры
const FitBounds = ({ projects }: { projects: Project[] }) => {
  const map = useMap();

  useEffect(() => {
    if (projects.length > 0) {
      const validProjects = projects.filter(p => p.latitude && p.longitude);
      if (validProjects.length > 0) {
        const bounds = new LatLngBounds(
          validProjects.map(p => [p.latitude!, p.longitude!])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [projects, map]);

  return null;
};

const InteractiveProjectsMap = ({ onProjectSelect, selectedProjectId, userId }: InteractiveProjectsMapProps) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { t } = useLanguage();
  
  // Используем оптимизированный хук для получения проектов
  const { projects: allProjects, loading, error } = useProjectsWithPrices(userId);
  
  // Фильтруем проекты только с координатами для отображения на карте
  const projects = allProjects.filter(project => 
    project.latitude !== null && project.longitude !== null
  );

  const handleViewProject = (projectId: string) => {
    window.open(`/embed/project/${projectId}`, '_blank');
  };

  const handleMarkerClick = (project: Project) => {
    setSelectedProject(project);
  };

  if (loading) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E1E1E]"></div>
        <span className="ml-2">{t('map.loading')}</span>
      </div>
    );
  }

  // Центр карты - средняя точка всех проектов или дефолтные координаты
  const mapCenter = projects.length > 0 
    ? [
        projects.reduce((sum, p) => sum + (p.latitude || 0), 0) / projects.length,
        projects.reduce((sum, p) => sum + (p.longitude || 0), 0) / projects.length
      ] as [number, number]
    : [41.7151, 44.8271] as [number, number]; // Тбилиси как дефолт

  return (
    <div className="relative h-[80vh]">
        <MapContainer
          center={mapCenter}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Автоматическая подгонка под маркеры */}
          <FitBounds projects={projects} />
          
          {/* Маркеры проектов */}
          {projects.map((project) => {
            if (!project.latitude || !project.longitude) return null;
            
            const isSelected = selectedProjectId === project.id || selectedProject?.id === project.id;
            
            return (
              <Marker
                key={project.id}
                position={[project.latitude, project.longitude]}
                icon={createCustomIcon(project, isSelected)}
                eventHandlers={{
                  click: () => handleMarkerClick(project),
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-lg mb-2">{project.name}</h3>
                    
                    {project.building_image_url && (
                      <img
                        src={project.building_image_url}
                        alt={project.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    
                    {project.address && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4" />
                        <span>{project.address}</span>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-600 mb-3">
                      {project.min_price ? (
                        <>ОТ {formatPriceWithCurrency(project.min_price, project.currency)}</>
                      ) : (
                        <span className="text-gray-400">Цена по запросу</span>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handleViewProject(project.id)}
                      className="w-full bg-[#1E1E1E] hover:bg-[#1E1E1E]/90 text-white"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Смотреть квартиры
                    </Button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Selected project info panel */}
        {selectedProject && (
          <div className="absolute bottom-6 left-6 right-6 md:left-6 md:right-auto md:w-96 z-10">
            <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    {selectedProject.building_image_url ? (
                      <img
                        src={selectedProject.building_image_url}
                        alt={selectedProject.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {selectedProject.name}
                    </h3>
                    
                    {selectedProject.address && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{selectedProject.address}</span>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-600 mb-4">
                      {selectedProject.min_price ? (
                        <>ОТ {formatPriceWithCurrency(selectedProject.min_price, selectedProject.currency)}</>
                      ) : (
                        <span className="text-gray-400">Цена по запросу</span>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handleViewProject(selectedProject.id)}
                      className="w-full bg-[#1E1E1E] hover:bg-[#1E1E1E]/90 text-white"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Смотреть квартиры
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
  );
};

export default InteractiveProjectsMap; 