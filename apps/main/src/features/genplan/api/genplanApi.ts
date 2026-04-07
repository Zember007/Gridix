import { supabase } from "@gridix/utils/api";
import type {
  SubProject,
  Masterplan,
  MasterplanArea,
  InfrastructureZone,
  MasterplanEditorData,
} from "../model/types";

const EDITOR_FN = "project-editor";

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(EDITOR_FN, { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}

// ── Sub-projects ──

export async function listSubProjects(
  projectId: string,
): Promise<SubProject[]> {
  const data = await invoke<{ subProjects: SubProject[] }>({
    action: "list-sub-projects",
    projectId,
  });
  return data.subProjects;
}

export async function createSubProject(
  projectId: string,
  payload: { name: string; type?: "building" | "object" },
): Promise<SubProject> {
  const data = await invoke<{ subProject: SubProject }>({
    action: "create-sub-project",
    projectId,
    ...payload,
  });
  return data.subProject;
}

export async function updateSubProject(
  projectId: string,
  subProjectId: string,
  payload: { name?: string; slug?: string; type?: "building" | "object" },
): Promise<SubProject> {
  const data = await invoke<{ subProject: SubProject }>({
    action: "update-sub-project",
    projectId,
    subProjectId,
    ...payload,
  });
  return data.subProject;
}

export async function deleteSubProject(
  projectId: string,
  subProjectId: string,
): Promise<void> {
  await invoke<{ success: boolean }>({
    action: "delete-sub-project",
    projectId,
    subProjectId,
  });
}

// ── Genplan toggle ──

export async function activateGenplan(projectId: string): Promise<void> {
  await invoke<{ success: boolean }>({ action: "activate-genplan", projectId });
}

export async function deactivateGenplan(
  projectId: string,
  options?: { keepSubProjectId?: string },
): Promise<void> {
  await invoke<{ success: boolean }>({
    action: "deactivate-genplan",
    projectId,
    ...(options?.keepSubProjectId
      ? { keepSubProjectId: options.keepSubProjectId }
      : {}),
  });
}

// ── Masterplan editor data ──

export async function loadMasterplanEditor(
  projectId: string,
): Promise<MasterplanEditorData> {
  const data = await invoke<MasterplanEditorData>({
    action: "load-masterplan-editor",
    projectId,
  });
  return data;
}

export async function upsertMasterplan(
  projectId: string,
  masterplan: {
    id?: string;
    name: string;
    slug?: string | null;
    background_asset_url?: string | null;
    background_asset_width?: number | null;
    background_asset_height?: number | null;
    is_default?: boolean;
  },
  areas?: Array<{
    id?: string;
    area_type: string;
    linked_entity_type: string;
    linked_entity_id?: string | null;
    geometry_type: string;
    geometry: unknown;
    label?: string | null;
    short_label?: string | null;
    sort_order?: number;
    z_index?: number;
    is_clickable?: boolean;
    status?: string;
  }>,
): Promise<{ masterplanId: string; areaIds: string[] }> {
  return invoke<{ masterplanId: string; areaIds: string[] }>({
    action: "upsert-masterplan",
    projectId,
    masterplan,
    areas,
  });
}

export async function deleteMasterplan(masterplanId: string): Promise<void> {
  await invoke<{ success: boolean }>({
    action: "delete-masterplan",
    masterplanId,
  });
}

export async function deleteMasterplanArea(areaId: string): Promise<void> {
  await invoke<{ success: boolean }>({
    action: "delete-masterplan-area",
    areaId,
  });
}

export async function reorderMasterplanAreas(
  areas: Array<{ id: string; sort_order: number }>,
): Promise<void> {
  await invoke<{ success: boolean }>({
    action: "reorder-masterplan-areas",
    areas,
  });
}

export async function publishMasterplan(masterplanId: string): Promise<void> {
  await invoke<{ success: boolean }>({
    action: "publish-masterplan",
    masterplanId,
  });
}

export async function upsertInfrastructureZone(
  projectId: string,
  zone: {
    id?: string;
    zone_type: string;
    name: string;
    is_published?: boolean;
    cover_image?: string | null;
    short_description?: string | null;
  },
): Promise<{ zoneId: string }> {
  return invoke<{ zoneId: string }>({
    action: "upsert-infrastructure-zone",
    projectId,
    zone,
  });
}

export async function deleteInfrastructureZone(zoneId: string): Promise<void> {
  await invoke<{ success: boolean }>({
    action: "delete-infrastructure-zone",
    zoneId,
  });
}

// ── Masterplan public load (via project-selector) ──

export async function loadMasterplanPreview(
  projectId: string,
  masterplanId?: string,
): Promise<{
  masterplan: Masterplan | null;
  areas: MasterplanArea[];
  infrastructureZones: InfrastructureZone[];
}> {
  const { data, error } = await supabase.functions.invoke("project-selector", {
    body: { action: "load-masterplan-preview", projectId, masterplanId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
