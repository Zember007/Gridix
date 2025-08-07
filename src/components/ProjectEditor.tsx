
import { useState, useEffect, useCallback } from 'react';
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
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES, CurrencyType, DEFAULT_CURRENCY } from '@/lib/currency-utils';
import { useProject, useProjectCRUD } from '@/hooks/useProjects';
import ProjectApartmentsManager from './ProjectApartmentsManager';
import FloorPlanEditor from './FloorPlanEditor';
import BuildingImageEditor from './BuildingImageEditor';
import AllFieldsManager from './AllFieldsManager';
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
  currency: CurrencyType;
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
    longitude: null,
    currency: DEFAULT_CURRENCY
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [floorStates, setFloorStates] = useState<Record<number, boolean>>({});
  const [accessError, setAccessError] = useState<string | null>(null);

  const { navigate } = useLanguageNavigation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { project: cachedProject } = useProject(projectId);
  const { updateProject } = useProjectCRUD();

  const loadProject = useCallback(async () => {
    try {
      if (cachedProject) {
        // Проверяем права на редактирование
        if (!user || cachedProject.user_id !== user.id) {
          setAccessError(t('projectEditor.noEditRights'));
          setLoading(false);
          return;
        }
        
        setProject({
          id: cachedProject.id,
          name: cachedProject.name || '',
          description: cachedProject.description || '',
          address: cachedProject.address || '',
          floors: cachedProject.floors || 1,
          building_image_url: cachedProject.building_image_url,
          latitude: cachedProject.latitude,
          longitude: cachedProject.longitude,
          currency: (cachedProject.currency as CurrencyType) || DEFAULT_CURRENCY
        });
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error(t('projectEditor.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [projectId, user, cachedProject]);

  useEffect(() => {
    if (!isNew && projectId) {
      loadProject();
    }
  }, [projectId, isNew, loadProject]);

  const handleSave = async () => {
    if (!project.name.trim()) {
      toast.error(t('projectEditor.projectNameRequired'));
      return;
    }

    if (!user) {
      toast.error(t('projectEditor.authRequired'));
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
        currency: project.currency,
        updated_at: new Date().toISOString(),
        ...(isNew && { user_id: user.id }) // Добавляем user_id только при создании
      };

      if (isNew) {

        const { data, error } = await supabase
          .from('projects')
          .insert([saveData])
          .select()
          .single();

        if (error) throw error;
        
        setProject(prev => ({ ...prev, id: data.id }));
        toast.success(t('projectEditor.projectCreated'));
        navigate(`/admin/project/${data.id}`);
      } else {
        const { error } = await supabase
          .from('projects')
          .update(saveData)
          .eq('id', project.id)
          .eq('user_id', user.id); // Проверяем владельца

        if (error) throw error;
        toast.success(t('projectEditor.projectSaved'));
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(t('projectEditor.errorSaving'));
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
                          <CardTitle className="text-xs">{t('projectEditor.floor')} {floor}</CardTitle>
                          <CardDescription className="text-xs">
                            {t('projectEditor.floorPlanDesc', { floor })}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs px-1">
                        {t('projectEditor.plan')}
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

        if (accessError) {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center text-red-600">{t('projectEditor.accessDenied')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground">{accessError}</p>
                <Button onClick={onBack} className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('projectEditor.back')}
                </Button>
              </CardContent>
            </Card>
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
                  {t('projectEditor.back')}
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isNew ? t('projectEditor.newProject') : project.name}
                  </h1>
                  <p className="text-muted-foreground">
                    {isNew ? t('projectEditor.createNewProject') : t('projectEditor.editProject')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LanguageToggle />
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? t('projectEditor.saving') : t('projectEditor.save')}
                </Button>
              </div>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="basic" className="text-xs">
              <Building2 className="h-3 w-3 mr-1" />
              {t('projectEditor.basicInfo')}
            </TabsTrigger>
            <TabsTrigger value="building" className="text-xs" disabled={isNew}>
              <Image className="h-3 w-3 mr-1" />
              {t('projectEditor.buildingImage')}
            </TabsTrigger>
            <TabsTrigger value="floors" className="text-xs" disabled={isNew}>
              <Layers3 className="h-3 w-3 mr-1" />
              {t('projectEditor.floors')}
            </TabsTrigger>
            <TabsTrigger value="apartments" className="text-xs" disabled={isNew}>
              <Settings className="h-3 w-3 mr-1" />
              {t('projectList.apartments')}
            </TabsTrigger>
            <TabsTrigger value="fields" className="text-xs" disabled={isNew}>
              <Settings className="h-3 w-3 mr-1" />
              {t('projectEditor.fields')}
            </TabsTrigger>
            <TabsTrigger value="photos" className="text-xs" disabled={isNew}>
              <Camera className="h-3 w-3 mr-1" />
              {t('projectEditor.photos')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('projectEditor.basicInfo')}</CardTitle>
                <CardDescription>{t('projectEditor.basicInfo')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('projectEditor.projectName')} *</Label>
                  <Input
                    id="name"
                    value={project.name}
                    onChange={(e) => setProject(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('projectEditor.projectName')}
                  />
                </div>
                <div>
                  <Label htmlFor="description">{t('projectEditor.description')}</Label>
                  <Textarea
                    id="description"
                    value={project.description}
                    onChange={(e) => setProject(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('projectEditor.description')}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="address">{t('projectEditor.address')}</Label>
                  <Input
                    id="address"
                    value={project.address}
                    onChange={(e) => setProject(prev => ({ ...prev, address: e.target.value }))}
                    placeholder={t('projectEditor.address')}
                  />
                </div>
                <div>
                  <Label htmlFor="floors">{t('projectEditor.floors')} *</Label>
                  <Input
                    id="floors"
                    type="number"
                    min="1"
                    value={project.floors}
                    onChange={(e) => setProject(prev => ({ ...prev, floors: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="latitude">{t('projectEditor.latitude')}</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={project.latitude ?? ''}
                    onChange={(e) => setProject(prev => ({ ...prev, latitude: e.target.value ? parseFloat(e.target.value) : null }))}
                    placeholder={t('projectEditor.latitudePlaceholder')}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('projectEditor.latitudeExample')}</p>
                </div>
                <div>
                  <Label htmlFor="longitude">{t('projectEditor.longitude')}</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={project.longitude ?? ''}
                    onChange={(e) => setProject(prev => ({ ...prev, longitude: e.target.value ? parseFloat(e.target.value) : null }))}
                    placeholder={t('projectEditor.longitudePlaceholder')}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('projectEditor.longitudeExample')}</p>
                </div>
                <div>
                  <Label htmlFor="currency">{t('projectEditor.currency')}</Label>
                  <Select value={project.currency} onValueChange={(value: CurrencyType) => setProject(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('projectEditor.currency')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CURRENCIES).map(([code, info]) => (
                        <SelectItem key={code} value={code}>
                          {t(info.translationKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">{t('projectEditor.currencyDesc')}</p>
                </div>

                {isNew && (
              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? t('projectEditor.saving') : t('projectEditor.save&continue')}
              </Button>
            )}
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
                  <CardTitle>{t('projectEditor.floorPlans')}</CardTitle>
                  <CardDescription>
                    {t('projectEditor.floorPlansDesc')}
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
            </div>
          </TabsContent>

          <TabsContent value="fields">
            <AllFieldsManager projectId={project.id} />
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
