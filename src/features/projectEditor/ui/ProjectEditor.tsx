
import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ArrowLeft, Save, Building2, Image, FileText, Upload, X } from 'lucide-react';
import { ADMIN_THEME, getAdminThemeVariables } from '@/shared/lib/admin-theme-config';
import { toast } from 'sonner';
import { supabase } from '@/shared/api/supabase';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { CURRENCIES, CurrencyType, DEFAULT_CURRENCY } from '@/shared/lib/currency-utils';
import { useProject } from '@/entities/project/queries/useProjects';
import ProjectApartmentsManager from '@/components/projects/ProjectApartmentsManager';
import BuildingImageEditor from '@/components/visualization/BuildingImageEditor';
import AllFieldsManager from '@/components/admin/AllFieldsManager';
import ApartmentPhotosManager from '@/components/apartment/ApartmentPhotosManager';
import AmoCRMSettings from '@/components/admin/AmoCRMSettings';
import ProjectDomainSettings from '@/components/admin/ProjectDomainSettings';
import { ProjectEditorSidebar, ProjectEditorSidebarMenuButton } from '@/shared/ui/sidebar-component';
import { useSearchParams } from 'react-router-dom';
import ProjectFloorsManager from '@/components/projects/ProjectFloorsManager';
import { ProjectPriceManager } from '@/components/projects/ProjectPriceManager';
import {
  DEFAULT_PROJECT_EDITOR_PROJECT,
  type ProjectEditorProject,
} from "@/features/projectEditor/model/types";

interface ProjectEditorProps {
  projectId: string;
  isNew: boolean;
  onBack: () => void;
}

const ProjectEditor = ({ projectId, isNew, onBack }: ProjectEditorProps) => {
  const [project, setProject] = useState<ProjectEditorProject>(
    DEFAULT_PROJECT_EDITOR_PROJECT
  );
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [accessError, setAccessError] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [showSettings, setShowSettings] = useState(false);


  const { navigate } = useLanguageNavigation();
  const { user, userProfile } = useAuth();
  const { t } = useLanguage();
  const { isManager, developerIds } = useUserRole();
  const { activeWorkspaceId, isManagerMode } = useWorkspace();
  const { project: cachedProject } = useProject(projectId);
  const [searchParams] = useSearchParams();

  // Mobile menu state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Применяем CSS переменные темы
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  // Читаем query параметры и устанавливаем активную вкладку
  useEffect(() => {
    const page = searchParams.get('page');
    if (page) {
      // Валидируем, что page является допустимой вкладкой
      const validTabs = ['basic', 'building', 'apartments', 'floors', 'photos', 'fields', 'integrations', 'domains'];
      if (validTabs.includes(page)) {
        setActiveTab(page);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (isNew || !projectId || !cachedProject) {
      setLoading(false);
      return;
    }


    try {
      // Проверяем права на редактирование
      const canEdit = user && (
        // Владелец проекта может редактировать
        cachedProject.user_id === user.id ||
        // Менеджер может редактировать, если проект принадлежит застройщику активного workspace
        (isManagerMode && activeWorkspaceId && cachedProject.user_id === activeWorkspaceId) ||
        // Или если менеджер имеет доступ к этому застройщику
        (isManager && developerIds.includes(cachedProject.user_id ?? ''))
      );

      if (!canEdit) {
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
        has_parking: cachedProject.has_parking || false,
        has_commercial: cachedProject.has_commercial || false,
        building_image_url: cachedProject.building_image_url,
        latitude: cachedProject.latitude,
        longitude: cachedProject.longitude,
        currency: (cachedProject.currency as CurrencyType) || DEFAULT_CURRENCY,
        installment_enabled: cachedProject.installment_enabled || false,
        min_down_payment_percent: cachedProject.min_down_payment_percent || 20,
        max_installment_months: cachedProject.max_installment_months || 24,
        pdf_presentation_url: cachedProject.pdf_presentation_url,
        theme_color: (cachedProject as unknown as Record<string, unknown>).theme_color as string || '#000000',
        project_type: (cachedProject as unknown as Record<string, unknown>).project_type as 'building' | 'object' | null || 'building',
        facade_open: (cachedProject as unknown as Record<string, unknown>).facade_open as boolean || false
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error(t('projectEditor.errorLoading'));
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, cachedProject?.id]);

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
        has_parking: project.has_parking,
        has_commercial: project.has_commercial,
        building_image_url: project.building_image_url,
        latitude: project.latitude,
        longitude: project.longitude,
        currency: project.currency,
        installment_enabled: project.installment_enabled,
        min_down_payment_percent: project.min_down_payment_percent,
        max_installment_months: project.max_installment_months,
        pdf_presentation_url: project.pdf_presentation_url,
        theme_color: project.theme_color,
        project_type: project.project_type || 'building',
        facade_open: project.facade_open,
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
        const canEdit = user && (
          cachedProject?.user_id === user.id ||
          (isManagerMode && activeWorkspaceId && cachedProject?.user_id === activeWorkspaceId) ||
          (isManager && cachedProject?.user_id && developerIds.includes(cachedProject.user_id))
        );

        if (!canEdit) {
          throw new Error('У вас нет прав на редактирование этого проекта');
        }

        const { error } = await supabase
          .from('projects')
          .update(saveData)
          .eq('id', project.id);

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


  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("Text")
    const parts = text.split(",").map((part) => part.trim())

    if (parts.length === 2) {
      const [parsedLat, parsedLon] = parts
      setProject(prev => ({ ...prev, latitude: parseFloat(parsedLat ?? '0'), longitude: parseFloat(parsedLon ?? '0') }))
      e.preventDefault() // предотвращаем вставку в одно поле
    }
  }

  const handlePdfUpload = async (file: File) => {
    if (!user || isNew) {
      toast.error(t('projectEditor.saveProjectFirst'));
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error(t('projectEditor.onlyPdfAllowed'));
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error(t('projectEditor.fileTooLarge'));
      return;
    }

    setUploadingPdf(true);
    try {
      const { PDFDocument } = await import('pdf-lib');

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pageCount = pdfDoc.getPageCount();

      if (pageCount === 0) {
        toast.error(t('projectEditor.invalidPdf'));
        setUploadingPdf(false);
        return;
      }


      const compressedFile = new Blob([arrayBuffer], { type: 'application/pdf' });

      const fileName = `${user.id}/${project.id}/presentation_${Date.now()}.pdf`;

      const { error } = await supabase.storage
        .from('project-files')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(fileName);

      // Update project with new PDF URL
      const { error: updateError } = await supabase
        .from('projects')
        .update({ pdf_presentation_url: publicUrl })
        .eq('id', project.id);

      if (updateError) throw updateError;

      setProject(prev => ({ ...prev, pdf_presentation_url: publicUrl }));
      toast.success(t('projectEditor.pdfUploadSuccess'));

    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error(t('projectEditor.pdfUploadError'));
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleRemovePdf = async () => {
    if (!user || !project.pdf_presentation_url) return;

    try {
      // Extract file path from URL
      const url = new URL(project.pdf_presentation_url);
      const filePath = url.pathname.split('/').pop();

      if (filePath) {
        await supabase.storage
          .from('project-files')
          .remove([`${project.id}/${filePath}`]);
      }

      // Update project to remove PDF URL
      const { error } = await supabase
        .from('projects')
        .update({ pdf_presentation_url: null })
        .eq('id', project.id);

      if (error) throw error;

      setProject(prev => ({ ...prev, pdf_presentation_url: null }));
      toast.success(t('projectEditor.pdfRemoveSuccess'));

    } catch (error) {
      console.error('Error removing PDF:', error);
      toast.error(t('projectEditor.pdfRemoveError'));
    }
  };

  const [isCollapsed, setIsCollapsed] = useState(false);

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

  // Map activeTab to sidebar sections
  const getSidebarSection = (tab: string) => {
    switch (tab) {
      case 'basic': return 'general';
      case 'building': return 'general';
      case 'apartments': return 'apartments';
      case 'floors': return 'floorplan';
      case 'photos': return 'photos';
      case 'fields': return 'fields';
      case 'integrations': return 'integrations';
      case 'domains': return 'domains';
      default: return 'general';
    }
  };

  const handleSidebarSectionChange = (section: string) => {
    switch (section) {
      case 'general': setActiveTab('basic'); break;
      case 'apartments': setActiveTab('apartments'); break;
      case 'floorplan': setActiveTab('floors'); break;
      case 'photos': setActiveTab('photos'); break;
      case 'fields': setActiveTab('fields'); break;
      case 'integrations': setActiveTab('integrations'); break;
      case 'domains': setActiveTab('domains'); break;
      default: setActiveTab('basic');
    }
  };


  return (
    <div className="min-h-screen bg-background flex">
      <ProjectEditorSidebar
        onSectionChange={handleSidebarSectionChange}
        activeTab={getSidebarSection(activeTab ?? 'basic')}
        userEmail={userProfile?.email || user?.email || 'Unknown user'}
        projectType={project.project_type ?? 'building'}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Mobile menu button */}
      <ProjectEditorSidebarMenuButton
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className={`flex-1 bg-background flex flex-col  transition-all duration-300 ${isCollapsed ? 'md:ml-16 md:max-w-[calc(100vw-4rem)] ' : 'md:ml-64 md:max-w-[calc(100vw-16rem)]'}`}>
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{t('projectEditor.back')}</span>
                </Button>



                <div className="hidden lg:block">
                  <h1 className="text-2xl font-bold">
                    {isNew ? t('projectEditor.newProject') : project.name}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {isNew ? t('projectEditor.createNewProject') : t('projectEditor.editProject')}
                  </p>
                </div>
                <div className="lg:hidden">
                  <h1 className="text-lg font-bold">
                    {isNew ? t('projectEditor.newProject') : project.name}
                  </h1>
                  <p className="text-muted-foreground text-xs">
                    {isNew ? t('projectEditor.createNewProject') : t('projectEditor.editProject')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                  style={{
                    backgroundColor: ADMIN_THEME.primary,
                    color: ADMIN_THEME.textOnPrimary,
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor = ADMIN_THEME.primaryHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor = ADMIN_THEME.primary;
                    }
                  }}
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">
                    {saving ? t('projectEditor.saving') : t('projectEditor.save')}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 py-4 lg:py-6 overflow-y-auto">
          {/* Show content based on activeTab without Tabs wrapper */}


          {(activeTab === 'basic' || activeTab === 'building') && (
            <div className="space-y-6">
              {/* Sub-navigation for basic/building sections - only on desktop */}
              <div className="hidden lg:flex gap-2 mb-6">
                <Button
                  variant={activeTab === 'basic' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('basic')}
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  {t('projectEditor.basicInfo')}
                </Button>
                <Button
                  variant={activeTab === 'building' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('building')}
                  disabled={isNew}
                  className="flex items-center gap-2"
                >
                  <Image className="h-4 w-4" />
                  {project.project_type === 'object' ? 'Object Image' : t('projectEditor.buildingImage')}
                </Button>
              </div>

              {activeTab === 'basic' && (
                <>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="project-type-desktop">{t('projectEditor.projectType')}</Label>
                          <Select value={project.project_type || 'building'} onValueChange={(v: 'building' | 'object') => setProject(prev => ({ ...prev, project_type: v }))}>
                            <SelectTrigger id="project-type-desktop">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="building">{t('projectEditor.typeBuilding')}</SelectItem>
                              <SelectItem value="object">{t('projectEditor.typeObject')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {project.project_type !== 'object' && (
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
                        )}
                      </div>

                      {/* Дополнительные типы помещений */}
                      <div className="space-y-4 ">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="has-parking"
                            checked={project.has_parking}
                            onCheckedChange={(checked) => setProject(prev => ({ ...prev, has_parking: checked }))}
                          />
                          <Label htmlFor="has-parking">{t('projectEditor.hasParking')}</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="has-commercial"
                            checked={project.has_commercial}
                            onCheckedChange={(checked) => setProject(prev => ({ ...prev, has_commercial: checked }))}
                          />
                          <Label htmlFor="has-commercial">{t('projectEditor.hasCommercial')}</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="facade-open-desktop"
                            checked={project.facade_open}
                            onCheckedChange={(checked) => setProject(prev => ({ ...prev, facade_open: checked }))}
                          />
                          <Label htmlFor="facade-open-desktop">{t('projectEditor.facadeOpen')}</Label>
                        </div>
                        <p className="text-xs text-gray-500">{t('projectEditor.facadeOpenDesc')}</p>
                      </div>
                      <div>
                        <Label htmlFor="latitude">{t('projectEditor.latitude')}</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="0.000001"
                          value={project.latitude ?? ''}
                          onPaste={handlePaste}
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
                          onPaste={handlePaste}
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
                      <div>
                        <Label htmlFor="theme-color">{t('projectEditor.themeColor')}</Label>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <Input
                              id="theme-color"
                              type="color"
                              value={project.theme_color}
                              onChange={(e) => setProject(prev => ({ ...prev, theme_color: e.target.value }))}
                              className="w-20 h-10 p-1 border rounded cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={project.theme_color}
                              onChange={(e) => setProject(prev => ({ ...prev, theme_color: e.target.value }))}
                              placeholder="#000000"
                              className="flex-1"
                            />
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {['#000000', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'].map((color) => (
                              <button
                                key={color}
                                type="button"
                                className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
                                style={{ backgroundColor: color }}
                                onClick={() => setProject(prev => ({ ...prev, theme_color: color }))}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{t('projectEditor.themeColorDesc')}</p>
                      </div>

                      {/* PDF Presentation Upload */}
                      <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {t('projectEditor.pdfPresentation')}
                        </h4>

                        {project.pdf_presentation_url ? (
                          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-red-600" />
                              <span className="text-sm">{t('projectEditor.pdfUploaded')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(project.pdf_presentation_url!, '_blank')}
                              >
                                {t('projectEditor.view')}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleRemovePdf}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground mb-4">
                              {t('projectEditor.pdfPresentationDesc')}
                            </p>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePdfUpload(file);
                              }}
                              className="hidden"
                              id="pdf-upload-desktop"
                              disabled={isNew || uploadingPdf}
                            />
                            <label htmlFor="pdf-upload-desktop">
                              <Button
                                variant="outline"
                                disabled={isNew || uploadingPdf}
                                asChild
                              >
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  {uploadingPdf ? t('projectEditor.uploading') : t('projectEditor.uploadPdf')}
                                </span>
                              </Button>
                            </label>
                            {isNew && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {t('projectEditor.saveProjectFirstNote')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Настройки рассрочки */}
                      <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium text-sm">{t('projectEditor.installmentSettings')}</h4>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="installment-enabled"
                            checked={project.installment_enabled}
                            onCheckedChange={(checked) => setProject(prev => ({ ...prev, installment_enabled: checked }))}
                          />
                          <Label htmlFor="installment-enabled">{t('projectEditor.enableInstallment')}</Label>
                        </div>

                        {project.installment_enabled && (
                          <>
                            <div>
                              <Label htmlFor="min-down-payment">{t('projectEditor.minDownPaymentPercent')}</Label>
                              <Input
                                id="min-down-payment"
                                type="number"
                                min="0"
                                max="100"
                                value={project.min_down_payment_percent}
                                onChange={(e) => setProject(prev => ({
                                  ...prev,
                                  min_down_payment_percent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                                }))}
                                placeholder="20"
                              />
                              <p className="text-xs text-gray-500 mt-1">{t('projectEditor.minDownPaymentDesc')}</p>
                            </div>

                            <div>
                              <Label htmlFor="max-installment-months">{t('projectEditor.maxInstallmentMonths')}</Label>
                              <Input
                                id="max-installment-months"
                                type="number"
                                min="1"
                                max="120"
                                value={project.max_installment_months}
                                onChange={(e) => setProject(prev => ({
                                  ...prev,
                                  max_installment_months: Math.min(120, Math.max(1, parseInt(e.target.value) || 1))
                                }))}
                                placeholder="24"
                              />
                              <p className="text-xs text-gray-500 mt-1">{t('projectEditor.maxInstallmentMonthsDesc')}</p>
                            </div>
                          </>
                        )}
                      </div>

                      {isNew && (
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          className="w-full"
                          style={{
                            backgroundColor: ADMIN_THEME.primary,
                            color: ADMIN_THEME.textOnPrimary,
                          }}
                          onMouseEnter={(e) => {
                            if (!saving) {
                              e.currentTarget.style.backgroundColor = ADMIN_THEME.primaryHover;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!saving) {
                              e.currentTarget.style.backgroundColor = ADMIN_THEME.primary;
                            }
                          }}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? t('projectEditor.saving') : t('projectEditor.save&continue')}
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {!isNew && <ProjectPriceManager projectId={project.id} />}
                </>
              )}

              {activeTab === 'building' && (
                <BuildingImageEditor
                  projectId={project.id}
                  currentImageUrl={project.building_image_url}
                  onImageUpdate={(imageUrl) => setProject(prev => ({ ...prev, building_image_url: imageUrl }))}
                />
              )}
            </div>
          )}

          {activeTab === 'floors' && project.project_type !== 'object' && (
            <ProjectFloorsManager projectId={project.id} />
          )}

          {activeTab === 'apartments' && (
            <div className="space-y-4">
              <ProjectApartmentsManager projectId={project.id} projectType={project.project_type ?? 'building'} />
            </div>
          )}

          {activeTab === 'fields' && (
            <AllFieldsManager projectId={project.id} />
          )}

          {activeTab === 'photos' && (
            <ApartmentPhotosManager projectId={project.id} />
          )}

          {activeTab === 'domains' && (
            <ProjectDomainSettings projectId={project.id} projectName={project.name} />
          )}

          {activeTab === 'integrations' && (
            <AmoCRMSettings projectId={project.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectEditor;
