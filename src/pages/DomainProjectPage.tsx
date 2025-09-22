import { Navigate } from "react-router-dom";
import { DEFAULT_LANGUAGE } from "@/lib/language-utils";
import { useProjectByDomain } from "@/hooks/useProjectByDomain";
import { Loader2 } from "lucide-react";
import ProjectApartmentSelector from "@/components/ProjectApartmentSelector";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function DomainProjectPage() {
  const { project, loading, error, isDomainProject } = useProjectByDomain();

  // Show loading spinner while determining the domain
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If there's an error, redirect to main page
  if (error) {
    console.error("Domain resolution error:", error);
    return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;
  }

  // If this is not a custom domain or no project found, redirect to main page
  if (!isDomainProject || !project) {
    return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;
  }

  // If project found via custom domain, render the project directly
  return (
    <div className="min-h-full bg-background">
      <div className="flex justify-end p-4">
        <LanguageToggle />
      </div>
      <ProjectApartmentSelector projectId={project.id} />
    </div>
  );
}
