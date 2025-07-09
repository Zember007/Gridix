
import { useParams } from "react-router-dom";
import ProjectApartmentSelector from "@/components/ProjectApartmentSelector";
import LanguageToggle from "@/components/LanguageToggle";

interface ProjectWidgetPageProps {
  embedMode?: boolean;
}

const ProjectWidgetPage = ({ embedMode = false }: ProjectWidgetPageProps) => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">Проект не найден</h1>
          <p className="text-muted-foreground">Неверный идентификатор проекта</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!embedMode && (
        <div className="flex justify-end p-4">
          <LanguageToggle />
        </div>
      )}
      <ProjectApartmentSelector projectId={projectId} embedMode={embedMode} />
    </div>
  );
};

export default ProjectWidgetPage;
