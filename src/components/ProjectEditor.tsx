
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Building2, Image, Layout, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BuildingImageEditor from '@/components/BuildingImageEditor';
import FloorPlanEditor from '@/components/FloorPlanEditor';
import CustomFieldsManager from '@/components/CustomFieldsManager';
import ProjectApartmentsManager from '@/components/ProjectApartmentsManager';
import ApartmentPhotosManager from '@/components/ApartmentPhotosManager';

interface ProjectEditorProps {
  projectId: string;
  isNew: boolean;
  onBack: () => void;
}

interface ProjectData {
  name: string;
  description: string;
  floors: number;
  building_image_url: string | null;
}

const ProjectEditor = ({ projectId, isNew, onBack }: ProjectEditorProps) => {
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    floors: 1,
    building_image_url: null
  });
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNew && projectId) {
      loadProject();
    }
  }, [projectId, isNew]);

  useEffect(() => {
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    }, { passive: false });

    return () => {
      window.removeEventListener('wheel', function (e) {
        if (e.ctrlKey) {
          e.preventDefault();
        }
      });
    }
  }, [])

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;

      setProjectData({
        name: data.name,
        description: data.description || '',
        floors: data.floors,
        building_image_url: data.building_image_url
      });
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Error loading project');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!projectData.name.trim()) {
      toast.error('Please enter project name');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const { data, error } = await supabase
          .from('projects')
          .insert([{
            name: projectData.name.trim(),
            description: projectData.description.trim() || null,
            floors: projectData.floors,
            building_image_url: projectData.building_image_url
          }])
          .select()
          .single();

        if (error) throw error;

        toast.success('Project created');
        // Navigate to edit the created project
        navigate(`/admin/project/${data.id}`);
      } else {
        const { error } = await supabase
          .from('projects')
          .update({
            name: projectData.name.trim(),
            description: projectData.description.trim() || null,
            floors: projectData.floors,
            building_image_url: projectData.building_image_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId);

        if (error) throw error;
        toast.success('Project saved');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Error saving project');
    } finally {
      setSaving(false);
    }
  };

  const handleBuildingImageUpload = (imageUrl: string) => {
    setProjectData(prev => ({ ...prev, building_image_url: imageUrl }));
  };

  const [floorNumber, setFloorNumber] = useState(1);

  const handleFloorChange = (floorNumber: number) => {
    setFloorNumber(floorNumber);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-real-estate-50 via-white to-real-estate-100 flex items-center justify-center">
        <Building2 className="h-8 w-8 text-real-estate-600 animate-pulse" />
      </div>
    );
  }

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
                Назад к проектам
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
              disabled={saving}
              className="bg-real-estate-600 hover:bg-real-estate-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-[900px]">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Основное
            </TabsTrigger>
            <TabsTrigger value="building" className="flex items-center gap-2" disabled={isNew}>
              <Image className="h-4 w-4" />
              Здание
            </TabsTrigger>
            <TabsTrigger value="floors" className="flex items-center gap-2" disabled={isNew}>
              <Layout className="h-4 w-4" />
              Планы этажей
            </TabsTrigger>
            <TabsTrigger value="apartments" className="flex items-center gap-2" disabled={isNew}>
              <Building2 className="h-4 w-4" />
              Квартиры
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2" disabled={isNew}>
              <Image className="h-4 w-4" />
              Фотографии
            </TabsTrigger>
            <TabsTrigger value="fields" className="flex items-center gap-2" disabled={isNew}>
              <Settings className="h-4 w-4" />
              Поля
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
                      <Label htmlFor="name">Название проекта*</Label>
                      <Input
                        id="name"
                        value={projectData.name}
                        onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Название комплекса"
                        className="mt-1"
                        required
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

                {isNew && (
                  <div className="bg-real-estate-50 p-4 rounded-lg">
                    <p className="text-sm text-real-estate-700">
                      После создания проекта вы сможете загрузить изображения здания, настроить планы этажей и установить пользовательские поля.
                    </p>
                  </div>
                )}
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
                  floorNumber={floorNumber}
                  onFloorChange={handleFloorChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apartments" className="space-y-6">
            <ProjectApartmentsManager projectId={projectId} />
          </TabsContent>

          <TabsContent value="photos" className="space-y-6">
            <ApartmentPhotosManager projectId={projectId} />
          </TabsContent>

          <TabsContent value="fields" className="space-y-6">
            <CustomFieldsManager projectId={projectId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectEditor;
