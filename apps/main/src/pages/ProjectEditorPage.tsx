import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useLanguageNavigation } from "@gridix/utils/react";
import ProjectEditor from "@/components/projects/ProjectEditor";
import { ProjectEditorDataProvider } from "@/features/projectEditor/context/ProjectEditorDataContext";
import { useAdminAccess } from "@/entities/admin-access";
import { LoadingProgress } from "@/shared/ui/LoadingProgress";

interface ProjectEditorPageProps {
  useId?: boolean;
}

/**
 * Безопасная навигация "назад":
 * 1) Только текущий домен — не переходим на чужие (referrer проверяется по origin).
 * 2) Только другой URL (другой path), не тот же path с другими query.
 */
function getSafeBackTarget(currentPathname: string): string | null {
  const referrer = document.referrer;
  if (!referrer) return null;
  try {
    const refUrl = new URL(referrer);
    if (refUrl.origin !== window.location.origin) return null;
    if (refUrl.pathname === currentPathname) return null;
    return refUrl.pathname + refUrl.search;
  } catch {
    return null;
  }
}

function isProjectEditorPath(path: string): boolean {
  return path.includes("/admin/project/");
}

const ProjectEditorPage = ({ useId = false }: ProjectEditorPageProps) => {
  const { projectId, projectSlug } = useParams<{
    projectId?: string;
    projectSlug?: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { navigate: navigateWithLanguage } = useLanguageNavigation();
  const adminAccess = useAdminAccess();

  const projectIdentifier = useId ? projectId : projectSlug || projectId;
  const isNew = !projectIdentifier || projectIdentifier === "new";
  const bootstrapProject = isNew
    ? null
    : (adminAccess?.projects.find(
        (project) =>
          project.id === projectIdentifier ||
          project.slug === projectIdentifier,
      ) ?? null);
  const actualProjectId = isNew
    ? ""
    : (bootstrapProject?.id ?? projectIdentifier ?? "");
  const isRestrictedProject =
    !isNew &&
    bootstrapProject != null &&
    bootstrapProject.access_status !== "active";

  if (!isNew && adminAccess?.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingProgress />
      </div>
    );
  }

  const goBack = () => {
    const fromState = (location.state as { from?: string } | null)?.from;
    if (
      fromState &&
      fromState !== location.pathname &&
      !isProjectEditorPath(fromState)
    ) {
      navigate(fromState);
      return;
    }
    const safeTarget = getSafeBackTarget(location.pathname);
    if (safeTarget && !isProjectEditorPath(safeTarget)) {
      navigate(safeTarget);
      return;
    }
    navigateWithLanguage("/admin");
  };

  return (
    <ProjectEditorDataProvider
      projectId={isNew ? null : actualProjectId}
      enabled={!isNew && !isRestrictedProject}
    >
      <ProjectEditor
        projectId={actualProjectId}
        isNew={isNew}
        onBack={goBack}
        bootstrapProject={bootstrapProject}
        isRestrictedProject={isRestrictedProject}
      />
    </ProjectEditorDataProvider>
  );
};

export default ProjectEditorPage;
