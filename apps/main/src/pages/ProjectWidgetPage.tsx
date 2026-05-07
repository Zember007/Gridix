import { lazy, Suspense, useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ProjectApartmentSelector } from "@/components/project-selector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCrmProjectsLite } from "@/pages/bitrix/hooks/useCrmProjectsLite";

const CrmTopBar = lazy(() =>
  import("@/pages/bitrix/components/BitrixCrmTopBar").then((m) => ({
    default: m.CrmTopBar,
  })),
);

interface ProjectWidgetPageProps {
  useId?: boolean;
}

const ProjectWidgetPageInner = ({ useId = false }: ProjectWidgetPageProps) => {
  const { projectId, projectSlug } = useParams<{
    projectId?: string;
    projectSlug?: string;
  }>();
  const { t } = useLanguage();
  const location = useLocation();

  const projectIdentifier = useId ? projectId : projectSlug || projectId;

  const crm = useMemo(
    () => new URLSearchParams(location.search).get("crm"),
    [location.search],
  );
  const isCrmEmbed = crm === "bitrix" || crm === "amocrm";
  const { projects, loading: projectsLoading } = useCrmProjectsLite(isCrmEmbed);

  const activeProjectId = useMemo(() => {
    if (!isCrmEmbed) return null;
    const bySlug = projectSlug
      ? projects.find((p) => p.slug === projectSlug)
      : null;
    if (bySlug?.id) return bySlug.id;
    const byId = projectId ? projects.find((p) => p.id === projectId) : null;
    return byId?.id ?? null;
  }, [isCrmEmbed, projectId, projectSlug, projects]);

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
      {isCrmEmbed && (
        <div className="p-3">
          <Suspense fallback={null}>
            <CrmTopBar
              crm={crm === "amocrm" ? "amocrm" : "bitrix"}
              projects={projects}
              loading={projectsLoading}
              dealId={null}
              activeProjectId={activeProjectId}
            />
          </Suspense>
        </div>
      )}
      <ProjectApartmentSelector projectId={projectIdentifier} />
    </div>
  );
};

const ProjectWidgetPage = (props: ProjectWidgetPageProps) => {
  return <ProjectWidgetPageInner {...props} />;
};

export default ProjectWidgetPage;
