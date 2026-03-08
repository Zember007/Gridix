import { supabase } from "@/shared/api/supabase";
import type {
  BitrixCategory,
  BitrixStage,
  ProjectBitrixSettings,
} from "../model/types";

export const fetchBitrixProjectState = async (projectId: string) => {
  const { data, error } = await supabase.functions.invoke("bitrix-app", {
    body: { action: "bitrix_get_state", project_id: projectId },
  });

  if (error) throw error;

  return {
    projectSettings: ((data as any)?.project_settings ??
      null) as ProjectBitrixSettings | null,
    categories: (((data as any)?.categories ?? []) as BitrixCategory[]) || [],
    stages: (((data as any)?.stages ?? []) as BitrixStage[]) || [],
  };
};

export const attachBitrixProject = async (projectId: string) => {
  const { data, error } = await supabase.functions.invoke("bitrix-app", {
    body: { action: "bitrix_attach_project", project_id: projectId },
  });

  if (error) throw error;
  if (!(data as any)?.success) throw new Error("Attach failed");
};

export const detachBitrixProject = async (projectId: string) => {
  const { data, error } = await supabase.functions.invoke("bitrix-app", {
    body: { action: "bitrix_detach_project", project_id: projectId },
  });

  if (error) throw error;
  if (!(data as any)?.success) throw new Error("Detach failed");
};

export const syncBitrixFunnel = async (params: {
  projectId: string;
  categoryId: number;
}) => {
  const { data, error } = await supabase.functions.invoke("bitrix-app", {
    body: {
      action: "bitrix_sync_funnel",
      project_id: params.projectId,
      category_id: params.categoryId,
    },
  });

  if (error) throw error;
  if (!(data as any)?.success) throw new Error("Bitrix sync failed");

  return (((data as any)?.stages ?? []) as BitrixStage[]) || [];
};
