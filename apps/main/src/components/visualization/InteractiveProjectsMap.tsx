import { useState } from "react";
import { useLanguage } from "@gridix/utils/react";
import {
  useProjectsWithPrices,
  ProjectWithMinPrice,
} from "@/entities/project/queries/useProjectsWithPrices";
import { Tables } from "@gridix/types/database";
import { Spinner } from "@/shared/ui/Spinner";
import { InteractiveProjectsMap as SharedInteractiveProjectsMap } from "@gridix/ui";

type Project = ProjectWithMinPrice;

type ProjectProp = Tables<"projects">;

interface InteractiveProjectsMapProps {
  onProjectSelect?: (projectId: string) => void;
  selectedProjectId?: string;
  userId?: string;
  project?: ProjectProp;
}

const InteractiveProjectsMap = ({
  onProjectSelect,
  selectedProjectId,
  userId,
  project,
}: InteractiveProjectsMapProps) => {
  const [selectedProject, setSelectedProject] = useState<
    ProjectProp | Project | null
  >(null);
  const { t } = useLanguage();

  // Используем оптимизированный хук для получения проектов
  const {
    projects: allProjects,
    loading,
    error,
  } = useProjectsWithPrices(userId);

  // Фильтруем проекты только с координатами для отображения на карте
  const projects = project
    ? [project]
    : allProjects.filter(
        (project) => project.latitude !== null && project.longitude !== null,
      );

  const handleViewProject = (project: Project | ProjectProp) => {
    if (onProjectSelect) {
      onProjectSelect(project.id);
    } else {
      const url = project.slug
        ? `/embed/project/${project.slug}`
        : `/embed/project/id/${project.id}`;
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg bg-gray-100">
        <Spinner size="md" className="border-[#1E1E1E]" />
        <span className="ml-2">{t("map.loading")}</span>
      </div>
    );
  }

  return (
    <SharedInteractiveProjectsMap
      projects={projects as any[]}
      selectedProjectId={selectedProjectId}
      onProjectSelect={onProjectSelect}
      onOpenProject={handleViewProject as any}
    />
  );
};

export default InteractiveProjectsMap;
