
import { useParams } from "react-router-dom";
import ProjectApartmentSelector from "@/components/ProjectApartmentSelector";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";



const ProjectWidgetPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { t } = useLanguage();
  

  if (!projectId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">{t('project.notFound')}</h1>
          <p className="text-muted-foreground">{t('project.invalidId')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex justify-end p-4">
        <LanguageToggle />
      </div>
      <ProjectApartmentSelector projectId={projectId}  />
    </div>
  );
};

export default ProjectWidgetPage;
