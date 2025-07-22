import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Eye, SlidersHorizontal, DollarSign, Calendar } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  floors: number;
  building_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface InteractiveProjectsMapProps {
  onProjectSelect?: (project: Project) => void;
  selectedProjectId?: string;
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

const InteractiveProjectsMap = ({ onProjectSelect, selectedProjectId }: InteractiveProjectsMapProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, address, floors, building_image_url, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = (projectId: string) => {
    window.open(`/widget/${projectId}`, '_blank');
  };

  const handleMarkerClick = (project: Project) => {
    setSelectedProject(project);
    onProjectSelect?.(project);
  };

  if (loading) {
    return (
      <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E1E1E]"></div>
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
    <div className="min-h-screen bg-white">
      {/* Header with filters */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">НАШИ ПРОЕКТЫ</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-gray-300">
                Плитка
              </Button>
              <Button variant="default" size="sm" className="bg-[#1E1E1E] text-white">
                На карте
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Parameters filter */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
              <SlidersHorizontal className="h-4 w-4 text-gray-600" />
              <Select defaultValue="all">
                <SelectTrigger className="border-0 shadow-none h-auto p-0 bg-transparent">
                  <SelectValue placeholder="Параметры" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все параметры</SelectItem>
                  <SelectItem value="studio">Студия</SelectItem>
                  <SelectItem value="1">1 комната</SelectItem>
                  <SelectItem value="2">2 комнаты</SelectItem>
                  <SelectItem value="3">3 комнаты</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price filter */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <Select defaultValue="all">
                <SelectTrigger className="border-0 shadow-none h-auto p-0 bg-transparent">
                  <SelectValue placeholder="Стоимость" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Любая стоимость</SelectItem>
                  <SelectItem value="low">До 100 000$</SelectItem>
                  <SelectItem value="medium">100 000$ - 200 000$</SelectItem>
                  <SelectItem value="high">От 200 000$</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Delivery date filter */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
              <Calendar className="h-4 w-4 text-gray-600" />
              <Select defaultValue="all">
                <SelectTrigger className="border-0 shadow-none h-auto p-0 bg-transparent">
                  <SelectValue placeholder="Срок сдачи" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Любой срок</SelectItem>
                  <SelectItem value="2024">2024 год</SelectItem>
                  <SelectItem value="2025">2025 год</SelectItem>
                  <SelectItem value="2026">2026 год</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset filters */}
            <Button variant="ghost" size="sm" className="text-gray-600">
              Сбросить фильтр
            </Button>

            {/* Main CTA */}
            <Button className="bg-[#1E1E1E] hover:bg-[#1E1E1E]/90 text-white ml-auto">
              Смотреть {projects.length} вариантов
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
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
                      ОТ {Math.floor(Math.random() * 2000) + 1000}$ М²
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
                      ОТ {Math.floor(Math.random() * 2000) + 1000}$ М²
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
    </div>
  );
};

export default InteractiveProjectsMap; 