import { supabase } from "@/shared/api/supabase";
import type { AmoCRMData } from "../model/types";

export const fetchProjectSettingsBulk = async (
  connectionId: string,
  projectIds: string[],
) => {
  const { data, error } = await supabase
    .from("project_crm_settings")
    .select("*")
    .eq("crm_connection_id", connectionId)
    .in("project_id", projectIds);

  if (error) throw error;
  return data ?? [];
};

export const fetchProjectSettingsSingle = async (
  connectionId: string,
  projectId: string,
) => {
  const { data, error } = await supabase
    .from("project_crm_settings")
    .select("*")
    .eq("project_id", projectId)
    .eq("crm_connection_id", connectionId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
};

export const fetchAmoData = async (): Promise<AmoCRMData | null> => {
  const response = await supabase.functions.invoke("amocrm-api", {
    body: { action: "fetch_data" },
  });

  if (response.error) throw response.error;
  return (response.data as any)?.data ?? null;
};

export const disableProjectAmoSettings = async (
  connectionId: string,
  projectId: string,
) => {
  const { error } = await supabase
    .from("project_crm_settings")
    .delete()
    .eq("project_id", projectId)
    .eq("crm_connection_id", connectionId);

  if (error) throw error;
};

export const saveProjectAmoSettings = async (params: {
  projectId: string;
  pipelineId: string;
  statusId: string | null;
  responsibleUserId: string | null;
}) => {
  const { data, error } = await supabase.functions.invoke("amocrm-api", {
    body: {
      project_id: params.projectId,
      action: "save_settings",
      pipeline_id: parseInt(params.pipelineId, 10),
      status_id: params.statusId ? parseInt(params.statusId, 10) : null,
      responsible_user_id: params.responsibleUserId
        ? parseInt(params.responsibleUserId, 10)
        : null,
    },
  });

  if (error) throw error;
  return data;
};
