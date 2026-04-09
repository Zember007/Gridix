import { useParams } from "react-router-dom";
import { ProjectApartmentSelector } from "@/components/project-selector";

/**
 * Public page for a sub-project within a project.
 * Routes: /widget/:projectSlug/p/:subSlug
 *         /project/:projectSlug/p/:subSlug
 *
 * Data loading and errors are handled inside ProjectApartmentSelector
 * (load-sub-project via `useProjectSelectorSubProject`).
 */
export default function SubProjectWidgetPage() {
  const { projectSlug, subSlug } = useParams<{
    projectSlug: string;
    subSlug: string;
  }>();

  if (!projectSlug || !subSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Проект не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProjectApartmentSelector
        projectId={projectSlug}
        subProjectSlug={subSlug}
      />
    </div>
  );
}
