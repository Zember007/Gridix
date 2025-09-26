
import { useParams } from "react-router-dom";
import ProjectApartmentSelector from "@/components/ProjectApartmentSelector";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language, LANGUAGE_CONFIG } from "@/lib/language-utils";
import { useEffect } from "react";

interface ProjectWidgetPageProps {
  useId?: boolean;
}

const ProjectWidgetPage = ({ useId = false }: ProjectWidgetPageProps) => {
  const { projectId, projectSlug } = useParams<{ projectId?: string; projectSlug?: string }>();
  const { t } = useLanguage();

  // Определяем идентификатор проекта в зависимости от типа маршрута
  const projectIdentifier = useId ? projectId : (projectSlug || projectId);


  useEffect(() => {
    function sendHeight() {
      const height = document.body.scrollHeight

      console.log('Height:', height,
        document.documentElement.scrollHeight);

      window.parent.postMessage(
        { type: "IFRAME_HEIGHT", height },
        "*" // лучше вместо "*" указать точный origin родителя
      );
    }

    window.onload = sendHeight;
    window.onresize = sendHeight;

    // На случай динамического контента
    new ResizeObserver(sendHeight).observe(document.body);
  }, []);


  if (!projectIdentifier) {
    return (
      <div className="min-h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">{t('project.notFound')}</h1>
          <p className="text-muted-foreground">{t('project.invalidId')}</p>
        </div>
      </div>
    );
  }

  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');



  return (
    <div className="min-h-full bg-background">
      {(langParam && (langParam as Language) in LANGUAGE_CONFIG) ?
        null
        : <LanguageToggle  
          classNameButton="fixed top-4 right-4 z-50"
        />}
      <ProjectApartmentSelector projectId={projectIdentifier} />
    </div>
  );
};

export default ProjectWidgetPage;
