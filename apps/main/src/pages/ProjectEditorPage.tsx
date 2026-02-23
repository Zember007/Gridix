import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useLanguageNavigation } from "@gridix/utils/react";
import ProjectEditor from "@/components/projects/ProjectEditor";
import { ProjectEditorDataProvider } from "@/features/projectEditor/context/ProjectEditorDataContext";

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

const ProjectEditorPage = ({ useId = false }: ProjectEditorPageProps) => {
  const { projectId, projectSlug } = useParams<{
    projectId?: string;
    projectSlug?: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { navigate: navigateWithLanguage } = useLanguageNavigation();

  const projectIdentifier = useId ? projectId : projectSlug || projectId;
  const isNew = !projectIdentifier || projectIdentifier === "new";
  const actualProjectId = isNew ? "" : projectIdentifier;

  const goBack = () => {
    const fromState = (location.state as { from?: string } | null)?.from;
    if (fromState && fromState !== location.pathname) {
      navigate(fromState);
      return;
    }
    const safeTarget = getSafeBackTarget(location.pathname);
    if (safeTarget) {
      navigate(safeTarget);
      return;
    }
    navigateWithLanguage("/admin");
  };

  return (
    <ProjectEditorDataProvider
      projectId={isNew ? null : actualProjectId}
      enabled={!isNew}
    >
      <ProjectEditor
        projectId={actualProjectId}
        isNew={isNew}
        onBack={goBack}
      />
    </ProjectEditorDataProvider>
  );
};

export default ProjectEditorPage;
