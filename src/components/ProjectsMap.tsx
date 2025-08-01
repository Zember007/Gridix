
import { useState, useEffect } from 'react';
import { usePublicProjects } from '@/hooks/useProjects';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Building2, Eye, SlidersHorizontal, DollarSign, Calendar } from 'lucide-react';

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

interface ProjectsMapProps {
  onProjectSelect?: (project: Project) => void;
  selectedProjectId?: string;
}

const ProjectsMap = ({ onProjectSelect, selectedProjectId }: ProjectsMapProps) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { projects, loading, error } = usePublicProjects();

  const handleViewProject = (projectId: string) => {
    window.open(`/widget/${projectId}`, '_blank');
  };

  const handleProjectClick = (project: Project) => {
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

      {/* Map content */}
      <div className="relative h-[80vh] bg-gradient-to-br from-blue-200 via-blue-100 to-green-100">
        {/* Map background image/placeholder */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDgwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iODAwIiBmaWxsPSIjRjBGOEZGIi8+CjxwYXRoIGQ9Ik0xMDAgNjAwSDExMDBWNjUwSDEwMFY2MDBaIiBmaWxsPSIjRTBFN0ZGIi8+CjxwYXRoIGQ9Ik0yMDAgNDAwSDYwMFY0NTBIMjAwVjQwMFoiIGZpbGw9IiNEMURGRkYiLz4KPC9zdmc+')"
          }}
        />

        {/* Project markers */}
        {projects.map((project, index) => {
          const isSelected = selectedProjectId === project.id || selectedProject?.id === project.id;
          
          // Mock positioning based on index (in real app would use actual coordinates)
          const positions = [
            { left: '25%', top: '30%' },
            { left: '45%', top: '50%' },
            { left: '65%', top: '25%' },
            { left: '30%', top: '65%' },
            { left: '70%', top: '70%' },
            { left: '15%', top: '45%' },
          ];
          
          const position = positions[index % positions.length];
          
          return (
            <div
              key={project.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: position.left, top: position.top }}
              onClick={() => handleProjectClick(project)}
            >
              {/* Project marker */}
              <div className={`relative ${isSelected ? 'z-20' : 'z-10'}`}>
                <div className={`w-24 h-24 rounded-full overflow-hidden border-4 shadow-lg transition-all duration-300 ${
                  isSelected ? 'border-[#1E1E1E] scale-110' : 'border-white hover:border-gray-300 hover:scale-105'
                }`}>
                  {project.building_image_url ? (
                    <img
                      src={project.building_image_url}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Project name label */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-medium text-gray-900 shadow-md">
                    {project.name}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Selected project info panel */}
        {selectedProject && (
          <div className="absolute bottom-6 left-6 right-6 md:left-6 md:right-auto md:w-96">
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

export default ProjectsMap;
