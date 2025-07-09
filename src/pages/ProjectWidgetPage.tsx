
import { useParams } from 'react-router-dom';
import ProjectApartmentSelector from '@/components/ProjectApartmentSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

const ProjectWidgetPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { t } = useLanguage();

  if (!projectId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="absolute top-4 right-4">
          <LanguageToggle />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">{t('project.notFound')}</h1>
          <p className="text-muted-foreground">{t('project.invalidId')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 z-50">
        <LanguageToggle />
      </div>
      <ProjectApartmentSelector projectId={projectId} />
    </div>
  );
};

export default ProjectWidgetPage;
