
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Trash2, Eye, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description: string;
  floors: number;
  building_image_url: string;
  created_at: string;
}

interface ProjectListProps {
  onCreateNew: () => void;
  onEditProject: (projectId: string, isNew: boolean) => void;
}

const ProjectList = ({ onCreateNew, onEditProject }: ProjectListProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Ошибка загрузки проектов');
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить проект "${projectName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Проект удален');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Ошибка удаления проекта');
    }
  };

  const viewProject = (projectId: string) => {
    window.open(`/project/${projectId}`, '_blank');
  };

  const getWidgetUrl = (projectId: string) => {
    return `${window.location.origin}/widget/${projectId}`;
  };

  const copyWidgetCode = (projectId: string) => {
    const widgetCode = `<iframe 
  src="${getWidgetUrl(projectId)}"
  width="100%"
  height="600px"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
  allowfullscreen>
</iframe>`;
    
    navigator.clipboard.writeText(widgetCode);
    toast.success('Код виджета скопирован в буфер обмена');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Building2 className="h-8 w-8 text-real-estate-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-real-estate-900">Проекты</h2>
          <p className="text-real-estate-600">Управление жилыми комплексами</p>
        </div>
        <Button 
          onClick={onCreateNew}
          className="bg-real-estate-600 hover:bg-real-estate-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Создать проект
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-real-estate-300 mb-4" />
            <h3 className="text-lg font-semibold text-real-estate-900 mb-2">
              Нет проектов
            </h3>
            <p className="text-real-estate-600 text-center mb-6 max-w-md">
              Создайте свой первый проект недвижимости с интерактивными планами этажей и квартир
            </p>
            <Button 
              onClick={onCreateNew}
              className="bg-real-estate-600 hover:bg-real-estate-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Создать первый проект
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-real-estate-900 group-hover:text-real-estate-700 transition-colors">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {project.description || 'Описание отсутствует'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Project Image */}
                  {project.building_image_url && (
                    <div className="aspect-video bg-real-estate-50 rounded-lg overflow-hidden">
                      <img
                        src={project.building_image_url}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Project Info */}
                  <div className="flex items-center gap-4 text-sm text-real-estate-600">
                    <Badge variant="outline" className="border-real-estate-300">
                      {project.floors} этажей
                    </Badge>
                    <span>
                      Создан {new Date(project.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewProject(project.id)}
                      className="border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Открыть
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditProject(project.id, false)}
                      className="border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
                    >
                      Редактировать
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyWidgetCode(project.id)}
                      className="border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Виджет
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteProject(project.id, project.name)}
                      className="text-red-600 hover:bg-red-50 ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
