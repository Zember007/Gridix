import { Navigate, useParams } from "react-router-dom";
import { DEFAULT_LANGUAGE } from "@gridix/utils/lib";
import { useProjectByDomain } from "@/entities/project/queries/useProjectByDomain";
import { Loader2 } from "lucide-react";
import { ProjectApartmentSelector } from "@/components";

export default function DomainSubProjectPage() {
  const { subSlug } = useParams<{ subSlug: string }>();
  const { project, loading, error, isDomainProject } = useProjectByDomain();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !isDomainProject || !project || !subSlug) {
    return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <ProjectApartmentSelector
        projectId={project.id}
        subProjectSlug={subSlug}
      />
    </div>
  );
}
