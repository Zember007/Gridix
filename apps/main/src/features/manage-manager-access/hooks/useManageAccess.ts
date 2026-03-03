import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ManagerAccount } from "@/entities/manager-account";
import {
  fetchDeveloperProjectsForAccess,
  type ProjectSummary,
} from "@/entities/project/api/projectApi";
import { fetchManagerAccess, saveManagerAccess } from "../api/managerAccessApi";

interface UseManageAccessParams {
  developerId: string;
}

export const useManageAccess = ({ developerId }: UseManageAccessParams) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<ManagerAccount | null>(
    null,
  );
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const openForManager = async (manager: ManagerAccount) => {
    setSelectedManager(manager);
    setLoading(true);
    setIsOpen(true);

    try {
      const loadedProjects = await fetchDeveloperProjectsForAccess(developerId);
      setProjects(loadedProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Ошибка загрузки проектов");
    }

    try {
      const projectIds = await fetchManagerAccess(manager.id);
      setSelectedProjectIds(projectIds);
    } catch (error) {
      console.error("Error loading manager access:", error);
      toast.error("Ошибка загрузки доступа");
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!selectedManager) return;

    try {
      await saveManagerAccess(selectedManager.id, selectedProjectIds);
      toast.success(t("workspace.accessUpdated"));
      close();
    } catch (error) {
      console.error("Error saving access:", error);
      toast.error(t("workspace.errorUpdatingAccess"));
    }
  };

  const close = () => {
    setIsOpen(false);
    setSelectedManager(null);
    setSelectedProjectIds([]);
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  };

  const selectAll = () => {
    setSelectedProjectIds(projects.map((p) => p.id));
  };

  const clearAll = () => {
    setSelectedProjectIds([]);
  };

  return {
    isOpen,
    setIsOpen,
    selectedManager,
    projects,
    selectedProjectIds,
    loading,
    openForManager,
    handleSave,
    close,
    toggleProject,
    selectAll,
    clearAll,
  };
};
