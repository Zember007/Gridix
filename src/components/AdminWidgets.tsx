
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, ExternalLink, Eye, Code } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  name: string;
}

const AdminWidgets = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [widgetWidth, setWidgetWidth] = useState('100%');
  const [widgetHeight, setWidgetHeight] = useState('600px');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateEmbedCode = () => {
    const baseUrl = window.location.origin;
    let embedUrl = '';
    
    if (selectedProject === 'all') {
      embedUrl = `${baseUrl}/embed/projects`;
    } else {
      embedUrl = `${baseUrl}/embed/project/${selectedProject}`;
    }

    return `<iframe 
  src="${embedUrl}" 
  width="${widgetWidth}" 
  height="${widgetHeight}"
  frameborder="0"
  allowfullscreen>
</iframe>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    toast.success('Код скопирован в буфер обмена');
  };

  const openPreview = () => {
    const baseUrl = window.location.origin;
    let previewUrl = '';
    
    if (selectedProject === 'all') {
      previewUrl = `${baseUrl}/embed/projects`;
    } else {
      previewUrl = `${baseUrl}/embed/project/${selectedProject}`;
    }

    window.open(previewUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Виджеты</h1>
        <p className="text-gray-600">Создание и настройка встраиваемых виджетов для ваших проектов</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Настройки виджета</CardTitle>
            <CardDescription>
              Выберите проект и настройте параметры виджета
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="project-select">Выберите проект</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все проекты (галерея)</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="widget-width">Ширина</Label>
                <Input
                  id="widget-width"
                  value={widgetWidth}
                  onChange={(e) => setWidgetWidth(e.target.value)}
                  placeholder="100%"
                />
              </div>

              <div>
                <Label htmlFor="widget-height">Высота</Label>
                <Input
                  id="widget-height"
                  value={widgetHeight}
                  onChange={(e) => setWidgetHeight(e.target.value)}
                  placeholder="600px"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={openPreview} variant="outline" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Предварительный просмотр
              </Button>
              <Button onClick={copyEmbedCode} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Скопировать код
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Код для встраивания
            </CardTitle>
            <CardDescription>
              Скопируйте этот код и вставьте на ваш сайт
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
          <CardTitle>Прямые ссылки</CardTitle>
          <CardDescription>
            Используйте эти ссылки для прямого доступа к виджетам
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Галерея всех проектов:</Label>
            <div className="flex items-center gap-2">
              <Input
                value={`${window.location.origin}/embed/projects`}
                readOnly
                className="bg-gray-50"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`${window.location.origin}/embed/projects`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {selectedProject !== 'all' && (
            <div className="space-y-2">
              <Label>Выбранный проект:</Label>
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
