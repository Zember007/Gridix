import React, { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import type { Shape } from "@/components/visualization/polygon-editor/GeometryShapes";
import type { ProjectFacade } from "../model/types";
import * as api from "../api/buildingImageEditorApi";

interface UseFacadeCrudParams {
  facades: ProjectFacade[];
  setFacades: React.Dispatch<React.SetStateAction<ProjectFacade[]>>;
  setSelectedFacadeId: React.Dispatch<React.SetStateAction<string | null>>;
  setBuildingImage: React.Dispatch<React.SetStateAction<string | null>>;
  setBuildingFloors: React.Dispatch<
    React.SetStateAction<import("../model/types").BuildingFloor[]>
  >;
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
  activeFacade: ProjectFacade | null;
  loadBuildingData: () => Promise<void>;
  projectId: string;
  subProjectId?: string;
  project: {
    id?: string;
    floors?: number;
    building_image_url?: string | null;
  } | null;
  user: { id: string } | null;
  t: (key: string, params?: Record<string, unknown>) => string;
  onImageUpdate?: (imageUrl: string) => void;
}

export function useFacadeCrud({
  facades,
  setFacades,
  setSelectedFacadeId,
  setBuildingImage,
  setBuildingFloors,
  setShapes,
  activeFacade,
  loadBuildingData,
  projectId,
  subProjectId,
  project,
  user,
  t,
  onImageUpdate,
}: UseFacadeCrudParams) {
  const [isAddingFacade, setIsAddingFacade] = useState(false);
  const [newFacadeName, setNewFacadeName] = useState("");
  const [newFacadeFile, setNewFacadeFile] = useState<File | null>(null);
  const [savingFacade, setSavingFacade] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const newFacadeFileInputRef = useRef<HTMLInputElement>(null);

  const syncPrimaryFacadeToProject = useCallback(
    async (nextFacades?: ProjectFacade[]) => {
      const list = nextFacades ?? facades;
      const sorted = list.slice().sort((a, b) => a.order_index - b.order_index);
      const primary = sorted[0];
      const fallbackWithImage =
        sorted.find((f) => !!f.image_url)?.image_url ?? null;
      const primaryUrl = primary?.image_url ?? fallbackWithImage ?? null;

      try {
        if (subProjectId) {
          await api.syncSubProjectBuildingImage(subProjectId, primaryUrl);
        }
        // projects.building_image_url is updated only from Project Editor → Basic tab
        if (primaryUrl) onImageUpdate?.(primaryUrl);
      } catch (e) {
        console.error("Error syncing primary facade to project:", e);
      }
    },
    [facades, onImageUpdate, subProjectId],
  );

  const normalizeFacadeOrder = useCallback(async (list: ProjectFacade[]) => {
    const sorted = list.slice().sort((a, b) => a.order_index - b.order_index);
    const normalized = sorted.map((f, idx) => ({ ...f, order_index: idx }));

    const changed = normalized.some(
      (f, idx) => f.order_index !== sorted[idx]?.order_index,
    );
    if (!changed) return normalized;

    await Promise.all(
      normalized.map((f) => api.updateFacadeOrder(f.id, f.order_index)),
    );

    return normalized;
  }, []);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file_get = event.target.files?.[0];
    if (!file_get || !projectId) return;

    if (!user) {
      toast.error(t("buildingImage.authRequired"));
      return;
    }

    setUploading(true);
    try {
      if (!activeFacade?.id) {
        toast.error(t("buildingImage.facades.selectFirst"));
        return;
      }

      const publicUrl = await api.uploadFacadeImageToStorage(
        project?.id || projectId,
        file_get,
      );

      await api.updateFacadeImage(activeFacade.id, publicUrl);

      setFacades((prev) =>
        prev.map((f) =>
          f.id === activeFacade.id ? { ...f, image_url: publicUrl } : f,
        ),
      );
      setBuildingImage(publicUrl);

      const shouldSyncProjectPreview =
        activeFacade.order_index === 0 || !project?.building_image_url;

      if (shouldSyncProjectPreview) {
        await syncPrimaryFacadeToProject(
          facades.map((f) =>
            f.id === activeFacade.id ? { ...f, image_url: publicUrl } : f,
          ),
        );
      }

      toast.success(t("buildingImage.facades.uploadSuccess"));
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(t("buildingImage.facades.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFacade = async () => {
    if (!user) {
      toast.error(t("buildingImage.authRequired"));
      return;
    }
    if (!newFacadeName.trim()) {
      toast.error(t("buildingImage.facades.nameRequired"));
      return;
    }
    if (!newFacadeFile) {
      toast.error(t("buildingImage.facades.imageRequired"));
      return;
    }

    setSavingFacade(true);
    try {
      const nextOrderIndex =
        (facades.length > 0
          ? Math.max(...facades.map((f) => f.order_index))
          : -1) + 1;

      const insertedFacade = await api.insertFacade(
        project?.id || projectId,
        newFacadeName.trim(),
        nextOrderIndex,
        subProjectId,
      );

      const publicUrl = await api.uploadFacadeImageToStorage(
        project?.id || projectId,
        newFacadeFile,
      );

      await api.updateFacadeImage(insertedFacade.id, publicUrl);

      const nextFacades = [
        ...facades,
        { ...insertedFacade, image_url: publicUrl },
      ];
      setFacades(nextFacades);
      setSelectedFacadeId(insertedFacade.id);
      setBuildingImage(publicUrl);
      setBuildingFloors([]);
      setShapes([]);

      // Ensure project-level preview is populated immediately (used by cards / gallery).
      await syncPrimaryFacadeToProject(nextFacades);

      setIsAddingFacade(false);
      setNewFacadeName("");
      setNewFacadeFile(null);
      if (newFacadeFileInputRef.current)
        newFacadeFileInputRef.current.value = "";

      toast.success(t("buildingImage.facades.created"));
    } catch (e) {
      console.error("Error creating facade:", e);
      toast.error(t("buildingImage.facades.createError"));
    } finally {
      setSavingFacade(false);
    }
  };

  const handleRenameFacade = async (facadeId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await api.renameFacade(facadeId, trimmed);
      setFacades((prev) =>
        prev.map((f) => (f.id === facadeId ? { ...f, name: trimmed } : f)),
      );
    } catch (e) {
      console.error("Error renaming facade:", e);
      toast.error(t("buildingImage.facades.renameError"));
    }
  };

  const handleDeleteFacade = async (facadeId: string) => {
    const facade = facades.find((f) => f.id === facadeId);
    if (!facade) return;
    if (facades.length <= 1) {
      toast.error(t("buildingImage.facades.cantDeleteLast"));
      return;
    }
    if (
      !confirm(t("buildingImage.facades.deleteConfirm", { name: facade.name }))
    )
      return;

    try {
      await api.deleteFacade(facadeId);

      let next = facades.filter((f) => f.id !== facadeId);
      next = await normalizeFacadeOrder(next);
      setFacades(next);

      const nextSelected = next[0]?.id ?? null;
      setSelectedFacadeId(nextSelected);
      setBuildingImage(next[0]?.image_url ?? null);

      await syncPrimaryFacadeToProject(next);
      toast.success(t("buildingImage.facades.deleted"));
      await loadBuildingData();
    } catch (e) {
      console.error("Error deleting facade:", e);
      toast.error(t("buildingImage.facades.deleteError"));
    }
  };

  const updateFacadeNameLocally = (facadeId: string, name: string) => {
    setFacades((prev) =>
      prev.map((f) => (f.id === facadeId ? { ...f, name } : f)),
    );
  };

  const cancelAddingFacade = () => {
    setIsAddingFacade(false);
    setNewFacadeName("");
    setNewFacadeFile(null);
    if (newFacadeFileInputRef.current) newFacadeFileInputRef.current.value = "";
  };

  return {
    isAddingFacade,
    setIsAddingFacade,
    newFacadeName,
    setNewFacadeName,
    newFacadeFile,
    setNewFacadeFile,
    savingFacade,
    uploading,
    fileInputRef,
    newFacadeFileInputRef,

    handleImageUpload,
    handleCreateFacade,
    handleRenameFacade,
    handleDeleteFacade,
    updateFacadeNameLocally,
    cancelAddingFacade,
  };
}
