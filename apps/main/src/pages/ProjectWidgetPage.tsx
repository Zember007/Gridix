import { useLocation, useParams } from "react-router-dom";
import { ProjectApartmentSelector } from "@/components";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useMemo } from "react";
import { BitrixCrmTopBar } from "@/pages/bitrix/components/BitrixCrmTopBar";
import { useCrmProjectsLite } from "@/pages/bitrix/hooks/useCrmProjectsLite";

interface ProjectWidgetPageProps {
  useId?: boolean;
}

const ProjectWidgetPage = ({ useId = false }: ProjectWidgetPageProps) => {
  const { projectId, projectSlug } = useParams<{
    projectId?: string;
    projectSlug?: string;
  }>();
  const { t } = useLanguage();
  const location = useLocation();

  // Определяем идентификатор проекта в зависимости от типа маршрута
  const projectIdentifier = useId ? projectId : projectSlug || projectId;

  const crm = useMemo(
    () => new URLSearchParams(location.search).get("crm"),
    [location.search],
  );
  const isBitrixCrm = crm === "bitrix";
  const { projects, loading: projectsLoading } =
    useCrmProjectsLite(isBitrixCrm);

  const activeProjectId = useMemo(() => {
    if (!isBitrixCrm) return null;
    const bySlug = projectSlug
      ? projects.find((p) => p.slug === projectSlug)
      : null;
    if (bySlug?.id) return bySlug.id;
    const byId = projectId ? projects.find((p) => p.id === projectId) : null;
    return byId?.id ?? null;
  }, [isBitrixCrm, projectId, projectSlug, projects]);

  if (!projectIdentifier) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-bold text-foreground">
            {t("project.notFound")}
          </h1>
          <p className="text-muted-foreground">{t("project.invalidId")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isBitrixCrm && (
        <div className="p-3">
          <BitrixCrmTopBar
            projects={projects}
            loading={projectsLoading}
            dealId={null}
            activeProjectId={activeProjectId}
          />
        </div>
      )}
      <ProjectApartmentSelector projectId={projectIdentifier} />
    </div>
  );
};

export default ProjectWidgetPage;
