
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Save, Building2, Image, Layers3, Settings, ChevronDown, ChevronRight, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import ProjectApartmentsManager from './ProjectApartmentsManager';
import FloorPlanEditor from './FloorPlanEditor';
import BuildingImageEditor from './BuildingImageEditor';
import CustomFieldsManager from './CustomFieldsManager';
import ApartmentPhotosManager from './ApartmentPhotosManager';

interface ProjectEditorProps {
  projectId: string;
  isNew: boolean;
  onBack: () => void;
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

const ProjectEditor = ({ projectId, isNew, onBack }: ProjectEditorProps) => {
  const [project, setProject] = useState<Project>({
    id: '',
    name: '',
    description: '',
    address: '',
    floors: 1,
    building_image_url: null,
    latitude: null,
    longitude: null
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [floorStates, setFloorStates] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNew && projectId) {
      loadProject();
    }
  }, [projectId, isNew]);

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      
      setProject({
        id: data.id,
        name: data.name || '',
        description: data.description || '',
        address: data.address || '',
        floors: data.floors || 1,
        building_image_url: data.building_image_url,
        latitude: data.latitude,
        longitude: data.longitude
      });
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Ошибка загрузки проекта');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project.name.trim()) {
      toast.error('Название проекта обязательно');
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        name: project.name.trim(),
        description: project.description || null,
        address: project.address || null,
        floors: project.floors,
        building_image_url: project.building_image_url,
        latitude: project.latitude,
        longitude: project.longitude,
        updated_at: new Date().toISOString()
      };

      if (isNew) {
        const { data, error } = await supabase
          .from('projects')
          .insert([saveData])
          .select()
          .single();

        if (error) throw error;
        
        setProject(prev => ({ ...prev, id: data.id }));
        toast.success('Проект создан');
        navigate(`/admin/project/${data.id}`);
      } else {
        const { error } = await supabase
          .from('projects')
          .update(saveData)
          .eq('id', project.id);

        if (error) throw error;
        toast.success('Проект сохранен');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Ошибка сохранения проекта');
    } finally {
      setSaving(false);
    }
  };

  const toggleFloorCollapse = (floor: number) => {
    setFloorStates(prev => ({
      ...prev,
      [floor]: !prev[floor]
    }));
  };

  const renderFloorPlanTabs = () => {
    if (isNew || !project.id) return null;

    const floors = Array.from({ length: project.floors }, (_, i) => i + 1);

    return (
      <div className="space-y-2">
        {floors.map((floor) => {
          const isOpen = floorStates[floor] || false;
          
          return (
            <Collapsible key={floor} open={isOpen} onOpenChange={() => toggleFloorCollapse(floor)}>
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {isOpen ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          <Layers3 className="h-3 w-3" />
                        </div>
                        <div>
                          <CardTitle className="text-xs">Этаж {floor}</CardTitle>
                          <CardDescription className="text-xs">
                            Планировка {floor} этажа
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs px-1">
                        План
                      </Badge>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <FloorPlanEditor 
                      projectId={project.id}
                      floorNumber={floor}
                    />
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {isNew ? 'Новый проект' : project.name}
                </h1>
                <p className="text-muted-foreground">
                  {isNew ? 'Создание нового проекта' : 'Редактирование проекта'}
                </p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="basic" className="text-xs">
              <Building2 className="h-3 w-3 mr-1" />
              Основное
            </TabsTrigger>
            <TabsTrigger value="building" className="text-xs" disabled={isNew}>
              <Image className="h-3 w-3 mr-1" />
              Здание
            </TabsTrigger>
            <TabsTrigger value="floors" className="text-xs" disabled={isNew}>
              <Layers3 className="h-3 w-3 mr-1" />
              Этажи
            </TabsTrigger>
            <TabsTrigger value="apartments" className="text-xs" disabled={isNew}>
              <Settings className="h-3 w-3 mr-1" />
              Квартиры
            </TabsTrigger>
            <TabsTrigger value="photos" className="text-xs" disabled={isNew}>
              <Camera className="h-3 w-3 mr-1" />
              Фото
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
                <CardDescription>Основные параметры проекта</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Название проекта *</Label>
                  <Input
                    id="name"
                    value={project.name}
                    onChange={(e) => setProject(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Название жилого комплекса"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={project.description}
                    onChange={(e) => setProject(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Описание проекта..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Адрес</Label>
                  <Input
                    id="address"
                    value={project.address}
                    onChange={(e) => setProject(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Адрес проекта"
                  />
                </div>
                <div>
                  <Label htmlFor="floors">Количество этажей *</Label>
                  <Input
                    id="floors"
                    type="number"
                    min="1"
                    value={project.floors}
                    onChange={(e) => setProject(prev => ({ ...prev, floors: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="latitude">Широта (latitude)</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={project.latitude ?? ''}
                    onChange={(e) => setProject(prev => ({ ...prev, latitude: e.target.value ? parseFloat(e.target.value) : null }))}
                    placeholder="Например: 55.7558"
                  />
                  <p className="text-xs text-gray-500 mt-1">Пример: 55.7558 (Москва)</p>
                </div>
                <div>
                  <Label htmlFor="longitude">Долгота (longitude)</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={project.longitude ?? ''}
                    onChange={(e) => setProject(prev => ({ ...prev, longitude: e.target.value ? parseFloat(e.target.value) : null }))}
                    placeholder="Например: 37.6176"
                  />
                  <p className="text-xs text-gray-500 mt-1">Пример: 37.6176 (Москва)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="building">
            <BuildingImageEditor 
              projectId={project.id}
              currentImageUrl={project.building_image_url}
              onImageUpdate={(imageUrl) => setProject(prev => ({ ...prev, building_image_url: imageUrl }))}
            />
          </TabsContent>

          <TabsContent value="floors">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Планы этажей</CardTitle>
                  <CardDescription>
                    Управление планировками этажей. Нажмите на этаж для редактирования.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderFloorPlanTabs()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="apartments">
            <div className="space-y-4">
              <ProjectApartmentsManager projectId={project.id} />
              <CustomFieldsManager projectId={project.id} />
            </div>
          </TabsContent>

          <TabsContent value="photos">
            <ApartmentPhotosManager projectId={project.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectEditor;
