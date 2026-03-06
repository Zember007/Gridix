import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";

interface UseConstructionUpdatesOptions {
  projectId: string;
  userId?: string;
  t: (key: string, params?: Record<string, unknown>) => string;
  reloadProject: (projectId: string) => Promise<void>;
}

interface AddUpdateParams {
  files: File[];
  links?: string[];
  clearFiles: () => void;
  clearLinks?: () => void;
}

export const useConstructionUpdates = ({
  projectId,
  userId,
  t,
  reloadProject,
}: UseConstructionUpdatesOptions) => {
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [isPublishing, setIsPublishing] = useState(false);

  const addUpdate = async ({
    files,
    links = [],
    clearFiles,
    clearLinks,
  }: AddUpdateParams) => {
    if (!newTitle.trim() || !newDesc.trim()) return;
    if (!userId) {
      toast.error(t("projectList.authRequired"));
      return;
    }

    const normalizedLinks = links
      .map((link) => link.trim())
      .filter(Boolean)
      .map((link) => {
        try {
          const parsed = new URL(link);
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return null;
          }
          return parsed.toString();
        } catch {
          return null;
        }
      });

    if (normalizedLinks.some((link) => link === null)) {
      toast.error(t("projectList.media.invalidLink"));
      return;
    }

    const safeLinks = Array.from(
      new Set(normalizedLinks.filter((link): link is string => Boolean(link))),
    );

    setIsPublishing(true);
    try {
      const uploadedFiles: string[] = [];
      const batchTs = Date.now();
      for (const [idx, file] of files.entries()) {
        const safeName = file.name.replace(/\//g, "_");
        const filePath = `${userId}/${projectId}/construction_updates/${batchTs}_${idx}_${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "application/octet-stream",
          });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("project-files")
          .getPublicUrl(filePath);
        uploadedFiles.push(urlData.publicUrl);
      }

      const { error } = await supabase.functions.invoke("project-drawer", {
        body: {
          action: "add_construction_update",
          project_id: projectId,
          date: newDate,
          title: newTitle,
          description: newDesc,
          images: [...uploadedFiles, ...safeLinks],
        },
      });
      if (error) throw error;

      toast.success(t("projectList.construction.addSuccess"));
      setNewTitle("");
      setNewDesc("");
      clearFiles();
      clearLinks?.();
      await reloadProject(projectId);
    } catch (e) {
      console.error("Failed to add construction update", e);
      toast.error(t("projectList.construction.addError"));
    } finally {
      setIsPublishing(false);
    }
  };

  const deleteUpdate = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("project-drawer", {
        body: {
          action: "delete_construction_update",
          project_id: projectId,
          id,
        },
      });
      if (error) throw error;
      toast.success(t("projectList.construction.deleteSuccess"));
      await reloadProject(projectId);
    } catch (e) {
      console.error("Failed to delete construction update", e);
      toast.error(t("projectList.construction.deleteError"));
    }
  };

  return {
    newTitle,
    setNewTitle,
    newDesc,
    setNewDesc,
    newDate,
    setNewDate,
    isPublishing,
    addUpdate,
    deleteUpdate,
  };
};
