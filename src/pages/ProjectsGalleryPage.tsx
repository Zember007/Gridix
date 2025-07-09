
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3X3, Map, Code, Eye } from 'lucide-react';
import ProjectsGallery from '@/components/ProjectsGallery';
import ProjectsMap from '@/components/ProjectsMap';

const ProjectsGalleryPage = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showEmbedCode, setShowEmbedCode] = useState(false);

  const generateEmbedCode = (type: 'gallery' | 'map' | 'project') => {
    const baseUrl = window.location.origin;
    let embedUrl = '';
    
    switch (type) {
      case 'gallery':
        embedUrl = `${baseUrl}/embed/projects`;
        break;
      case 'map':
        embedUrl = `${baseUrl}/embed/projects/map`;
        break;
      case 'project':
        if (selectedProjectId) {
          embedUrl = `${baseUrl}/embed/project/${selectedProjectId}`;
        }
        break;
    }

    return `<iframe 
  src="${embedUrl}" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
</iframe>`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Все проекты</h1>
              <p className="text-gray-600">Обзор всех жилых комплексов</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmbedCode(!showEmbedCode)}
              >
                <Code className="h-4 w-4 mr-2" />
                Получить код
              </Button>
              <Button size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Предпросмотр
              </Button>
            </div>
          </div>

          {/* Код для встраивания */}
          {showEmbedCode && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Код для встраивания</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">Галерея проектов:</label>
                    <textarea
                      readOnly
                      value={generateEmbedCode('gallery')}
                      className="w-full p-2 text-xs bg-gray-50 border rounded-md h-20 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">Карта проектов:</label>
                    <textarea
                      readOnly
                      value={generateEmbedCode('map')}
                      className="w-full p-2 text-xs bg-gray-50 border rounded-md h-20 font-mono"
                    />
                  </div>
                  {selectedProjectId && (
                    <div>
                      <label className="text-sm font-medium block mb-2">Выбранный проект:</label>
                      <textarea
                        readOnly
                        value={generateEmbedCode('project')}
                        className="w-full p-2 text-xs bg-gray-50 border rounded-md h-20 font-mono"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Галерея
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Карта
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="mt-6">
            <ProjectsGallery
              showHeader={false}
              onProjectSelect={(projectId) => {
                setSelectedProjectId(projectId);
                window.open(`/project/${projectId}`, '_blank');
              }}
            />
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <ProjectsMap
              selectedProjectId={selectedProjectId || undefined}
              onProjectSelect={(projectId) => {
                setSelectedProjectId(projectId);
                window.open(`/project/${projectId}`, '_blank');
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectsGalleryPage;
