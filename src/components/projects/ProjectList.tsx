
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { Building2, Plus, Trash2, Eye, ExternalLink, Edit3, Building } from 'lucide-react';
import { ADMIN_THEME, getAdminThemeVariables } from '@/lib/admin-theme-config';
import { useWorkspaceProjects } from '@/hooks/useWorkspaceProjects';
import { useProjectCRUD } from '@/hooks/useProjects';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LeadsStats } from '@/components/admin/LeadsNotification';
import { Project } from '@/hooks/useWorkspaceProjects';


interface ProjectListProps {
  onCreateNew: () => void;
  onEditProject: (projectId: string, isNew: boolean) => void;
}

const ProjectList = ({ onCreateNew, onEditProject }: ProjectListProps) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { projects, loading, error, refresh, isManagerMode } = useWorkspaceProjects();
  const { deleteProject: deleteProjectCRUD } = useProjectCRUD();

  // Применяем CSS переменные темы
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  // Удаляем старую функцию loadProjects, так как теперь используется хук

  const deleteProject = async (projectId: string, projectName: string) => {
    if (!user) {
      toast.error(t('projectList.authRequired'));
      return;
    }

    // Менеджеры не могут удалять проекты
    if (isManagerMode) {
      toast.error('Менеджеры не могут удалять проекты');
      return;
    }

    if (!confirm(t('projectList.deleteConfirm', { name: projectName }))) {
      return;
    }

    const success = await deleteProjectCRUD(projectId);
    if (success) {
      refresh(); // Обновляем список проектов
    }
  };

  const viewProject = (project: Project) => {
    const url = project.slug 
      ? `/${language}/project/${project.slug}` 
      : `/${language}/project/id/${project.id}`;
    window.open(url, '_blank');
  };

  const getWidgetUrl = (project: Project) => {
    return project.slug 
      ? `/${language}/embed/project/${project.slug}`
      : `/${language}/embed/project/id/${project.id}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="md" color={ADMIN_THEME.primary} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="border-dashed border-2 ">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16  mb-4" />
            <h3 className="text-xl font-semibold  mb-2">
              {t('projectList.noProjects')}
            </h3>
            <p className=" text-center mb-6 max-w-md">
              {t('projectList.createFirstDescription')}
            </p>
            <Button
              onClick={onCreateNew}
              size="lg"
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
              <h2
              style={{ color: ADMIN_THEME.textPrimary }}
              className="text-xl font-semibold">{t('projectList.projects')}</h2>
              <p 
              style={{ color: ADMIN_THEME.textSecondary }}
              >{t('projectList.manageDescription')}</p>
            </div>
            <Button
              onClick={onCreateNew}
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
              <Plus className="h-5 w-5 mr-2" />
              {t('projectList.createNew')}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle
                    style={{ color: ADMIN_THEME.textPrimary }}
                    className="text-lg  transition-colors line-clamp-1">
                      {project.name}
                    </CardTitle>
                    <CardDescription
                    style={{ color: ADMIN_THEME.textSecondary }}
                    className="mt-1 line-clamp-2">
                      {project.description || '-'}
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
                    <div 
                    className="aspect-video bg-real-estate-100 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: ADMIN_THEME.backgroundSecondary }}
                    >
                      <Building2 className="h-12 w-12 text-real-estate-400" style={{ color: ADMIN_THEME.textSecondary }} />
                    </div>
                  )}

                  {/* Project Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <Badge
                      style={{ color: ADMIN_THEME.textSecondary }}
                      variant="outline">
                        {project.floors} {t('projectList.floors')}
                      </Badge>
                      <span
                      style={{ color: ADMIN_THEME.textSecondary }}
                      >
                        {new Date(project.created_at).toLocaleDateString('en-US')}
                      </span>
                    </div>
                    
                    {/* Developer Info для менеджеров */}
                    {isManagerMode && project.developer_info && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Building className="h-3 w-3" />
                        <span>{project.developer_info.company_name || project.developer_info.full_name}</span>
                      </div>
                    )}
                    
                    {/* Leads Stats */}
                    <LeadsStats projectId={project.id} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => viewProject(project)}
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
                      <Eye className="h-4 w-4 mr-2" />
                      {t('managerAccounts.openLink')}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditProject(project.id, false)}
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
                      <Edit3 className="h-4 w-4" />
                    </Button>
                 
                    
                    {/* Кнопка удаления скрыта для менеджеров */}
                    {!isManagerMode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteProject(project.id, project.name)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
