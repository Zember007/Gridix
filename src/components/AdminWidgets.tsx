
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, ExternalLink, Eye, Code } from 'lucide-react';
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
  const { user } = useAuth();
  const { t } = useLanguage();
  const { projects, loading, error } = useUserProjects(user?.id);

  const generateEmbedCode = () => {
    const baseUrl = window.location.origin;
    let embedUrl = '';

    if (selectedProject === 'all') {
      embedUrl = `${baseUrl}/embed/projects/${user?.id}?lang=${defaultLanguage}`;
    } else {
      embedUrl = `${baseUrl}/embed/project/${selectedProject}?lang=${defaultLanguage}`;
    }

    return `<iframe 
  id="gridix-widget"
  src="${embedUrl}" 
  width="100%" 
  height="100%"
  style="height: 100vh; width: 100%;"
  frameborder="0"
  allowfullscreen>
</iframe>
<script>
  const iframe = document.getElementById("gridix-widget");

  window.addEventListener("message", (event) => {
    if (event.data.height) {
      iframe.style.height = event.data.height + "px";
    }
  });
</script>
`;
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              <Button onClick={openPreview} variant="outline" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                {t('adminWidgets.preview')}
              </Button>
              <Button onClick={copyEmbedCode} className="flex-1">
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
          <div className="space-y-2">
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
          </div>

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
