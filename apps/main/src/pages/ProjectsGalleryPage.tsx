import ProjectsGallery from "@/components/projects/ProjectsGallery";
import { LanguageToggle } from "@gridix/ui";
import { useLanguageNavigation } from "@gridix/utils/react";

interface ProjectsGalleryPageProps {
  embedMode?: boolean;
}

const ProjectsGalleryPage = ({
  embedMode = false,
}: ProjectsGalleryPageProps) => {
  const { getPathWithLanguage } = useLanguageNavigation();

  return (
    <div className="min-h-screen bg-background">
      {!embedMode && (
        <div className="flex justify-end p-4">
          <LanguageToggle />
        </div>
      )}
      <div className="container mx-auto py-8">
        <ProjectsGallery
          embedMode={embedMode}
          showHeader={true}
          onProjectSelect={(projectId) => {
            if (embedMode) {
              window.open(`/embed/project/${projectId}`, "_blank");
            } else {
              window.location.href = getPathWithLanguage(
                `/project/${projectId}`,
              );
            }
          }}
        />
      </div>
    </div>
  );
};

export default ProjectsGalleryPage;
