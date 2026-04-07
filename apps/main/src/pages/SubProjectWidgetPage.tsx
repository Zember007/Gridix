import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ProjectApartmentSelector } from "@/components/project-selector";
import { supabase } from "@gridix/utils/api";
import { LoadingProgress } from "@/shared/ui/LoadingProgress";

/**
 * Public page for a sub-project within a project.
 * Routes: /widget/:projectSlug/p/:subSlug
 *         /project/:projectSlug/p/:subSlug
 *
 * Loads the project and sub-project to verify they exist, then
 * delegates rendering to ProjectApartmentSelector with sub-project context.
 * Full filtering by sub_project_id is handled in the project-selector edge fn
 * via the `load-sub-project` action (used by this route).
 */
export default function SubProjectWidgetPage() {
  const { projectSlug, subSlug } = useParams<{
    projectSlug: string;
    subSlug: string;
  }>();

  const [projectId, setProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!projectSlug || !subSlug) return;
    supabase
      .from("projects")
      .select("id")
      .eq("slug", projectSlug)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setNotFound(true);
        } else {
          setProjectId(data.id);
        }
        setLoading(false);
      });
  }, [projectSlug, subSlug]);

  if (loading) return <LoadingProgress />;

  if (notFound || !projectId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Проект не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProjectApartmentSelector
        projectId={projectId}
        subProjectSlug={subSlug}
      />
    </div>
  );
}
