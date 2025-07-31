
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Trash2, Eye, ExternalLink, Edit3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

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
  const { t, language } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;
    
    try {
      // Добавляем таймаут для запроса проектов
      const queryPromise = supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Projects query timeout after 5 seconds')), 5000)
      );
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        toast.error('Загрузка проектов заняла слишком много времени');
      } else {
        toast.error('Ошибка загрузки проектов');
      }
      // При ошибке устанавливаем пустой массив проектов
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string, projectName: string) => {
    if (!user) {
      toast.error('Необходима авторизация');
      return;
    }

    if (!confirm(`Вы уверены, что хотите удалить проект "${projectName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id); // Проверяем владельца

      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Проект удален');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Ошибка удаления проекта');
    }
  };

  const viewProject = (projectId: string) => {
    window.open(`/${language}/project/${projectId}`, '_blank');
  };

  const getWidgetUrl = (projectId: string) => {
    return `/${language}/embed/project/${projectId}`;
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
      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="border-dashed border-2 border-real-estate-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-real-estate-300 mb-4" />
            <h3 className="text-xl font-semibold text-real-estate-900 mb-2">
              {t('projectList.noProjects')}
            </h3>
            <p className="text-real-estate-600 text-center mb-6 max-w-md">
              {t('projectList.createFirstDescription')}
            </p>
            <Button
              onClick={onCreateNew}
              className="bg-real-estate-600 hover:bg-real-estate-700"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              {t('projectList.createFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Header with Create New Project Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-real-estate-900">{t('projectList.projects')}</h2>
              <p className="text-real-estate-600">{t('projectList.manageDescription')}</p>
            </div>
            <Button
              onClick={onCreateNew}
              className="bg-real-estate-600 hover:bg-real-estate-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              {t('projectList.createNew')}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-real-estate-200">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-real-estate-900 group-hover:text-real-estate-700 transition-colors line-clamp-1">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {project.description || 'Описание отсутствует'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Project Image */}
                  {project.building_image_url ? (
                    <div className="aspect-video bg-real-estate-50 rounded-lg overflow-hidden">
                      <img
                        src={project.building_image_url}
                        alt={project.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-real-estate-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-real-estate-400" />
                    </div>
                  )}

                  {/* Project Info */}
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline" className="border-real-estate-300 text-real-estate-700">
                      {project.floors} этажей
                    </Badge>
                    <span className="text-real-estate-500">
                      {new Date(project.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => viewProject(project.id)}
                      className="bg-real-estate-600 hover:bg-real-estate-700 text-white flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Открыть
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditProject(project.id, false)}
                      className="border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyWidgetCode(project.id)}
                      className="border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteProject(project.id, project.name)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
