
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Copy, ExternalLink, Eye, Code } from 'lucide-react';
import { ADMIN_THEME, getAdminThemeVariables } from '@/lib/admin-theme-config';
import { toast } from 'sonner';
import { useUserProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGE_CONFIG, Language } from '@/lib/language-utils';

// Local Project interface kept for potential future extensions
// interface Project {
//   id: string;
//   name: string;
// }

const AdminWidgets = () => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [defaultLanguage, setDefaultLanguage] = useState<Language>('en');
  const [showFullProject, setShowFullProject] = useState<boolean>(true);
  const [showFloatingButton, setShowFloatingButton] = useState<boolean>(true);
  const [floatingButtonSide, setFloatingButtonSide] = useState<'left' | 'right'>('right');
  const [floatingButtonBottomOffset, setFloatingButtonBottomOffset] = useState<number>(40);
  const [floatingButtonSideOffset, setFloatingButtonSideOffset] = useState<number>(32);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Применяем CSS переменные темы
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { projects, loading } = useUserProjects(user?.id);

  useEffect(() => {
    if (projects.length > 0) {
      setSelectedProject(projects?.[0]?.id || '');
    }
  }, [projects]);

  const ensureAtLeastOneOption = (nextShowFull: boolean, nextShowButton: boolean): boolean => {
    if (!nextShowFull && !nextShowButton) {
      toast.error(t('adminWidgets.atLeastOneOptionRequired'));
      return false;
    }
    return true;
  };

  const handleToggleShowFullProject = (checked: boolean) => {
    if (!ensureAtLeastOneOption(checked as boolean, showFloatingButton)) return;
    setShowFullProject(checked as boolean);
  };

  const handleToggleShowFloatingButton = (checked: boolean) => {
    if (!ensureAtLeastOneOption(showFullProject, checked as boolean)) return;
    setShowFloatingButton(checked as boolean);
  };

  const generateEmbedCode = () => {
    const origin = import.meta.env.VITE_WIDGET_DOMAIN;
    const scriptUrl = `https://${origin}/widget.js`;

    const params: Record<string, string | number | boolean> = {
      lang: defaultLanguage,
      showFullProject,
      showFloatingButton,
      floatingButtonSide,
      floatingButtonBottomOffset,
      floatingButtonSideOffset,
    };
    if (selectedProject !== 'all') params.projectId = selectedProject;
/*     if (selectedProject === 'all' && user?.id) params.userId = user.id; */

    const attrs = Object.entries(params)
      .map(([k, v]) => {
        if (typeof v === 'string') {
          return `${k}: "${v}"`;
        }
        return `${k}: ${v}`;
      })
      .join(', ');

    return `<div id="gridix-widget-root" style="height: 100vh; width: 100%; position: relative; z-index: 1000;"></div>
<script src="${scriptUrl}"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    window.GridixWidget && window.GridixWidget.init({ ${attrs} });
  });
</script>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    toast.success(t('adminWidgets.codeCopied'));
  };

  const openPreview = () => {
    const baseUrl = window.location.origin;
    let previewUrl = '';
    if (selectedProject === 'all') {
      previewUrl = `${baseUrl}/embed/projects/${user?.id}?lang=${defaultLanguage}`;
    } else {
      previewUrl = `${baseUrl}/embed/project/${selectedProject}?lang=${defaultLanguage}`;
    }
    window.open(previewUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: ADMIN_THEME.primary }}
        ></div>
        <span className="ml-2">{t('adminWidgets.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('adminWidgets.title')}</h1>
        <p className="text-gray-600">{t('adminWidgets.description')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('adminWidgets.settings')}</CardTitle>
            <CardDescription>
              {t('adminWidgets.settingsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="project-select">{t('adminWidgets.selectProject')}</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder={'-'} />
                </SelectTrigger>
                
                <SelectContent>
                  {/* <SelectItem value="all">{t('adminWidgets.allProjects')}</SelectItem> */}
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="default-language">{t('adminWidgets.defaultLanguage')}</Label>
              <Select value={defaultLanguage} onValueChange={(value: Language) => setDefaultLanguage(value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('adminWidgets.defaultLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_CONFIG).map(([code, config]) => (
                    <SelectItem key={code} value={code}>
                      {config.flag} {t(`language.${code}` as keyof typeof LANGUAGE_CONFIG)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">{t('adminWidgets.defaultLanguageDesc')}</p>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <Label>{t('adminWidgets.widgetDisplay')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="h-8 px-3 text-xs"
                  style={{
                    borderColor: ADMIN_THEME.primary,
                    color: ADMIN_THEME.primary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = ADMIN_THEME.backgroundHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {showAdvanced ? t('adminWidgets.hideAdvanced') : t('adminWidgets.showAdvanced')}
                </Button>
              </div>

              {showAdvanced && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t('adminWidgets.showFullProject')}</p>
                      <p className="text-xs text-gray-500">{t('adminWidgets.showFullProjectDesc')}</p>
                    </div>
                    <Switch
                      checked={showFullProject}
                      onCheckedChange={handleToggleShowFullProject}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t('adminWidgets.showFloatingButton')}</p>
                      <p className="text-xs text-gray-500">{t('adminWidgets.showFloatingButtonDesc')}</p>
                    </div>
                    <Switch
                      checked={showFloatingButton}
                      onCheckedChange={handleToggleShowFloatingButton}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('adminWidgets.floatingButtonPosition')}</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div className="md:col-span-1">
                        <Label className="text-xs text-gray-500">{t('adminWidgets.floatingButtonSide')}</Label>
                        <Select
                          value={floatingButtonSide}
                          onValueChange={(value: 'left' | 'right') => setFloatingButtonSide(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">{t('adminWidgets.floatingButtonSideLeft')}</SelectItem>
                            <SelectItem value="right">{t('adminWidgets.floatingButtonSideRight')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">{t('adminWidgets.floatingButtonBottomOffset')}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={floatingButtonBottomOffset}
                          onChange={(e) => setFloatingButtonBottomOffset(Number(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">{t('adminWidgets.floatingButtonSideOffset')}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={floatingButtonSideOffset}
                          onChange={(e) => setFloatingButtonSideOffset(Number(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {t('adminWidgets.floatingButtonPositionDesc')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={openPreview} 
                variant="outline" 
                className="flex-1"
                style={{
                  borderColor: ADMIN_THEME.primary,
                  color: ADMIN_THEME.primary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = ADMIN_THEME.backgroundHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                {t('adminWidgets.preview')}
              </Button>
              <Button 
                onClick={copyEmbedCode} 
                className="flex-1"
                style={{
                  backgroundColor: ADMIN_THEME.primary,
                  color: ADMIN_THEME.textOnPrimary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = ADMIN_THEME.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ADMIN_THEME.primary;
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                {t('adminWidgets.copyCode')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              {t('adminWidgets.embedCode')}
            </CardTitle>
            <CardDescription>
              {t('adminWidgets.embedCodeDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                {generateEmbedCode()}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminWidgets.links')}</CardTitle>
          <CardDescription>
            {t('adminWidgets.linksDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
         {/*    <div className="space-y-2">
              <Label>{t('adminWidgets.allProjects')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={`${window.location.origin}/embed/projects/${user?.id}`}
                  readOnly
                  className="bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`${window.location.origin}/embed/projects/${user?.id}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div> */}

          {selectedProject !== 'all' && (
            <div className="space-y-2">
              <Label>{t('adminWidgets.selectedProject')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={`${window.location.origin}/embed/project/${selectedProject}`}
                  readOnly
                  className="bg-gray-50"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`${window.location.origin}/embed/project/${selectedProject}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWidgets;
