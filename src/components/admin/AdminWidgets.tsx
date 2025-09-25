
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, ExternalLink, Eye, Code } from 'lucide-react';
import { ADMIN_THEME, getAdminThemeVariables } from '@/lib/admin-theme-config';
import { toast } from 'sonner';
import { useUserProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGE_CONFIG, Language } from '@/lib/language-utils';

interface Project {
  id: string;
  name: string;
}

const AdminWidgets = () => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [defaultLanguage, setDefaultLanguage] = useState<Language>('ru');

  // Применяем CSS переменные темы
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);
  const { user } = useAuth();
  const { t } = useLanguage();
  const { projects, loading, error } = useUserProjects(user?.id);

  const generateEmbedCode = () => {
    const baseUrl = window.location.origin;
    
    let embedParams = '';
    if (selectedProject === 'all') {
      embedParams = `data-user-id="${user?.id}"`;
    } else {
      const project = projects.find(p => p.id === selectedProject);
      if (project?.slug) {
        embedParams = `data-project-slug="${project.slug}"`;
      } else {
        embedParams = `data-project-id="${selectedProject}"`;
      }
    }

    return `<!-- Gridix Widget - JavaScript Embed (Direct DOM Integration) -->
<div id="gridix-widget" 
     data-gridix-embed 
     ${embedParams}
     data-lang="${defaultLanguage}"
     data-theme="default"
     data-show-header="true"
     style="width: 100%; min-height: 400px;">
</div>

<script src="${baseUrl}/gridix-embed.js"></script>

<!-- Alternative manual initialization -->
<!-- 
<script>
  // Manual initialization if needed
  new GridixEmbed({
    container: '#gridix-widget',
    ${selectedProject === 'all' ? `userId: '${user?.id}'` : 
      projects.find(p => p.id === selectedProject)?.slug ? 
        `projectSlug: '${projects.find(p => p.id === selectedProject)?.slug}'` : 
        `projectId: '${selectedProject}'`
    },
    lang: '${defaultLanguage}',
    theme: 'default',
    showHeader: true
  });
</script>
-->`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    toast.success(t('adminWidgets.codeCopied'));
  };

  const openPreview = () => {
    // Create a preview page with our widget
    const embedCode = generateEmbedCode();
    const previewHTML = `
<!DOCTYPE html>
<html lang="${defaultLanguage}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gridix Widget Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .preview-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .preview-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        .preview-title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 8px 0;
        }
        .preview-subtitle {
            color: #6b7280;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="preview-header">
            <h1 class="preview-title">Gridix Widget Preview</h1>
            <p class="preview-subtitle">This is how your widget will look when embedded on a website</p>
        </div>
        ${embedCode}
    </div>
</body>
</html>`;

    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Clean up the URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('adminWidgets.allProjects')}</SelectItem>
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
              JavaScript код для встраивания
            </CardTitle>
            <CardDescription>
              Скопируйте этот код и вставьте на ваш сайт. Виджет встроится напрямую в DOM без iframe
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
          <div className="space-y-2">
            <Label>JavaScript файл виджета</Label>
            <div className="flex items-center gap-2">
              <Input
                value={`${window.location.origin}/gridix-embed.js`}
                readOnly
                className="bg-gray-50"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`${window.location.origin}/gridix-embed.js`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">JavaScript файл для прямого встраивания виджета в DOM</p>
          </div>

          <div className="space-y-2">
            <Label>API URL для данных виджета</Label>
            <div className="flex items-center gap-2">
              <Input
                value={(() => {
                  const params = new URLSearchParams({ lang: defaultLanguage });
                  if (selectedProject === 'all') {
                    params.append('userId', user?.id || '');
                  } else {
                    const project = projects.find(p => p.id === selectedProject);
                    if (project?.slug) {
                      params.append('projectSlug', project.slug);
                    } else {
                      params.append('projectId', selectedProject);
                    }
                  }
                  return `${window.location.origin}/functions/v1/widget-embed-api?${params.toString()}`;
                })()}
                readOnly
                className="bg-gray-50"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams({ lang: defaultLanguage });
                  if (selectedProject === 'all') {
                    params.append('userId', user?.id || '');
                  } else {
                    const project = projects.find(p => p.id === selectedProject);
                    if (project?.slug) {
                      params.append('projectSlug', project.slug);
                    } else {
                      params.append('projectId', selectedProject);
                    }
                  }
                  window.open(`${window.location.origin}/functions/v1/widget-embed-api?${params.toString()}`, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">API endpoint для получения данных проекта виджетом</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWidgets;
