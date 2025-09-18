import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Trash2, Eye, ExternalLink, Edit3, Building } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useManagerProjects, Project } from '@/hooks/useManagerProjects';
import { toast } from 'sonner';
import { LeadsStats } from '@/components/admin/LeadsNotification';

interface ManagerProjectListProps {
  onCreateNew: () => void;
  onEditProject: (projectId: string, isNew: boolean) => void;
}

const ManagerProjectList = ({ onCreateNew, onEditProject }: ManagerProjectListProps) => {
  const { t, language } = useLanguage();
  const { projects, loading, error, refresh } = useManagerProjects();

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
    toast.success(t('projectList.widgetCodeCopied'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Building2 className="h-8 w-8 text-real-estate-600 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-red-600 mb-4">Ошибка загрузки проектов</div>
          <Button onClick={refresh} variant="outline">
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-real-estate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-real-estate-900 mb-2">
              Нет доступных проектов
            </h3>
            <p className="text-real-estate-600 mb-4">
              У вас пока нет доступа к проектам или проекты еще не созданы
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Header with Create New Project Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-real-estate-900">Доступные проекты</h2>
              <p className="text-real-estate-600">
                Проекты застройщиков, к которым у вас есть доступ ({projects.length})
              </p>
            </div>
            <Button
              onClick={onCreateNew}
              className="bg-real-estate-600 hover:bg-real-estate-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Создать проект
            </Button>
          </div>
          
          {/* Projects Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-real-estate-900 group-hover:text-real-estate-700 transition-colors line-clamp-1">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {project.description || 'Описание отсутствует'}
                      </CardDescription>
                      
                      {/* Developer Info */}
                      {project.developer_info && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                          <Building className="h-3 w-3" />
                          <span>{project.developer_info.company_name || project.developer_info.full_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Project Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm text-real-estate-600">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          <span>
                            {project.floors} {project.floors === 1 ? 'этаж' : project.floors < 5 ? 'этажа' : 'этажей'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-real-estate-500">
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Leads Stats */}
                      <LeadsStats projectId={project.id} />
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

export default ManagerProjectList;
