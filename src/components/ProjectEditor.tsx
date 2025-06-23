
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Building2, Image, Layout } from 'lucide-react';
import BuildingImageEditor from '@/components/BuildingImageEditor';
import FloorPlanEditor from '@/components/FloorPlanEditor';

interface ProjectEditorProps {
  projectId: string;
  isNew: boolean;
  onBack: () => void;
}

const ProjectEditor = ({ projectId, isNew, onBack }: ProjectEditorProps) => {
  const [projectData, setProjectData] = useState({
    name: isNew ? '' : 'ЖК "Северная звезда"',
    description: isNew ? '' : 'Премиальный жилой комплекс в центре города',
    floors: isNew ? 1 : 12,
    buildingImage: null as string | null,
    floorPlans: [] as any[]
  });

  const [activeTab, setActiveTab] = useState('general');

  const handleSave = () => {
    console.log('Сохраняем проект:', projectData);
    // Here we would save to the backend
  };

  const handleBuildingImageUpload = (imageUrl: string) => {
    setProjectData(prev => ({ ...prev, buildingImage: imageUrl }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-real-estate-50 via-white to-real-estate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-real-estate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onBack}
                className="text-real-estate-600 hover:text-real-estate-700 hover:bg-real-estate-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                К проектам
              </Button>
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-real-estate-600" />
                <div>
                  <h1 className="text-2xl font-bold text-real-estate-900">
                    {isNew ? 'Новый проект' : projectData.name}
                  </h1>
                  {!isNew && (
                    <p className="text-sm text-real-estate-600">Редактирование проекта</p>
                  )}
                </div>
              </div>
            </div>
            <Button 
              onClick={handleSave}
              className="bg-real-estate-600 hover:bg-real-estate-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Общие
            </TabsTrigger>
            <TabsTrigger value="building" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Здание
            </TabsTrigger>
            <TabsTrigger value="floors" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Планы этажей
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
                <CardDescription>
                  Настройте основные параметры вашего проекта
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Название проекта</Label>
                      <Input
                        id="name"
                        value={projectData.name}
                        onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="ЖК 'Название комплекса'"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="floors">Количество этажей</Label>
                      <Input
                        id="floors"
                        type="number"
                        value={projectData.floors}
                        onChange={(e) => setProjectData(prev => ({ ...prev, floors: parseInt(e.target.value) || 1 }))}
                        min="1"
                        max="50"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={projectData.description}
                      onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Краткое описание жилого комплекса..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="building" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Изображение здания</CardTitle>
                <CardDescription>
                  Загрузите изображение здания и настройте интерактивные зоны этажей
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BuildingImageEditor 
                  projectId={projectId}
                  floors={projectData.floors}
                  onImageUpload={handleBuildingImageUpload}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="floors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Планы этажей</CardTitle>
                <CardDescription>
                  Загрузите планы этажей и настройте интерактивные зоны квартир
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FloorPlanEditor 
                  projectId={projectId}
                  floors={projectData.floors}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectEditor;
