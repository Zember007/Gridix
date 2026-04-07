import { useState, useCallback, useRef, useEffect } from "react";
import { useLanguage } from "@gridix/utils/react";
import { supabase } from "@gridix/utils/api";
import { compressToWebP } from "@gridix/utils/lib";
import { toast } from "sonner";
import type { InfrastructureZone } from "@/features/genplan/model/types";
import {
  upsertMasterplan,
  upsertInfrastructureZone,
  deleteInfrastructureZone,
} from "@/features/genplan/api/genplanApi";
import type { GenplanEditorConfig } from "../model/types";

export interface GenplanEditorDataInput {
  projectId: string;
  currentImageUrl?: string | null;
  genplan: GenplanEditorConfig;
}

export interface InfraZoneFormData {
  id?: string;
  name: string;
  zone_type: string;
  short_description: string;
  cover_image?: string | null;
}

export function useGenplanEditorData({
  projectId,
  currentImageUrl,
  genplan,
}: GenplanEditorDataInput) {
  const { t } = useLanguage();

  const [uploading, setUploading] = useState(false);
  const uploadedUrlRef = useRef<string | null>(currentImageUrl ?? null);

  useEffect(() => {
    if (currentImageUrl) {
      uploadedUrlRef.current = currentImageUrl;
    }
  }, [currentImageUrl]);

  const [infraZones, setInfraZones] = useState<InfrastructureZone[]>(
    genplan.infrastructureZones,
  );
  const [savingZone, setSavingZone] = useState(false);
  const [uploadingZoneImage, setUploadingZoneImage] = useState(false);

  useEffect(() => {
    setInfraZones(genplan.infrastructureZones);
  }, [genplan.infrastructureZones]);

  const masterplanImageUrl = currentImageUrl ?? uploadedUrlRef.current ?? null;

  const handleUploadImage = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setUploading(true);
      try {
        const compressed = await compressToWebP(file);
        const fileName = genplan.masterplanId ?? "masterplan";
        const path = `projects/${projectId}/genplan/${fileName}.webp`;
        const { error } = await supabase.storage
          .from("project-images")
          .upload(path, compressed, { upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage
          .from("project-images")
          .getPublicUrl(path);
        uploadedUrlRef.current = urlData.publicUrl;
        await upsertMasterplan(projectId, {
          id: genplan.masterplanId,
          name: genplan.masterplanName ?? "",
          background_asset_url: uploadedUrlRef.current,
          background_asset_width: null,
          background_asset_height: null,
          is_default: genplan.masterplanIsDefault ?? false,
        });
        toast.success(t("genplan.editor.imageSaved"));
        genplan.onMasterplanUpdated();
      } catch {
        toast.error(t("genplan.editor.imageError"));
      } finally {
        setUploading(false);
      }
    },
    [projectId, genplan, t],
  );

  const handleUploadZoneImage = useCallback(
    async (file: File): Promise<string> => {
      setUploadingZoneImage(true);
      try {
        const compressed = await compressToWebP(file);
        const fileName = `projects/${projectId}/infra-zones/${Date.now()}.webp`;
        const { error } = await supabase.storage
          .from("project-images")
          .upload(fileName, compressed, { upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage
          .from("project-images")
          .getPublicUrl(fileName);
        return urlData.publicUrl;
      } finally {
        setUploadingZoneImage(false);
      }
    },
    [projectId],
  );

  const handleSaveInfraZone = useCallback(
    async (formData: InfraZoneFormData, imageFile?: File | null) => {
      setSavingZone(true);
      try {
        let coverImage = formData.cover_image ?? null;
        if (imageFile) {
          coverImage = await handleUploadZoneImage(imageFile);
        }
        const { zoneId } = await upsertInfrastructureZone(projectId, {
          id: formData.id,
          zone_type: formData.zone_type,
          name: formData.name,
          short_description: formData.short_description || null,
          cover_image: coverImage,
          is_published: true,
        });
        setInfraZones((prev) => {
          if (formData.id) {
            return prev.map((z) =>
              z.id === formData.id
                ? {
                    ...z,
                    name: formData.name,
                    zone_type: formData.zone_type,
                    short_description: formData.short_description || null,
                    cover_image: coverImage,
                  }
                : z,
            );
          }
          return [
            ...prev,
            {
              id: zoneId,
              project_id: projectId,
              name: formData.name,
              zone_type: formData.zone_type,
              short_description: formData.short_description || null,
              full_description: null,
              cover_image: coverImage,
              icon: null,
              gallery: null,
              display_mode: "popup",
              status: "active",
              is_published: true,
              priority: 0,
              cta_type: null,
              cta_payload: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } satisfies InfrastructureZone,
          ];
        });
        toast.success(t("genplan.infraZones.saveSuccess"));
      } catch {
        toast.error(t("genplan.infraZones.saveError"));
      } finally {
        setSavingZone(false);
      }
    },
    [projectId, handleUploadZoneImage, t],
  );

  const handleDeleteInfraZone = useCallback(
    async (zoneId: string) => {
      try {
        await deleteInfrastructureZone(zoneId);
        setInfraZones((prev) => prev.filter((z) => z.id !== zoneId));
        toast.success(t("genplan.infraZones.deleteSuccess"));
      } catch {
        toast.error(t("genplan.infraZones.deleteError"));
      }
    },
    [t],
  );

  return {
    t,
    masterplanImageUrl,
    uploading,
    handleUploadImage,
    uploadedUrlRef,
    infraZones,
    savingZone,
    uploadingZoneImage,
    handleSaveInfraZone,
    handleDeleteInfraZone,
    handleUploadZoneImage,
  };
}
