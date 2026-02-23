import { supabase } from "@gridix/utils/api";
import type { Tables } from "@gridix/types/database";

export type ProjectEditorProject = Tables<"projects">;
export type ProjectEditorApartment = Tables<"apartments">;
export type ProjectEditorFloorPlan = Tables<"floor_plans">;
export type ProjectEditorFieldSetting = Tables<"project_field_settings">;
export type ProjectEditorCustomField = Tables<"project_custom_fields">;
export type ProjectEditorDomain = Tables<"project_domains">;

export interface ProjectEditorLoadResult {
  project: ProjectEditorProject;
  apartments: ProjectEditorApartment[];
  floorPlans: ProjectEditorFloorPlan[];
  fieldSettings: ProjectEditorFieldSetting[];
  customFields: ProjectEditorCustomField[];
  domains: ProjectEditorDomain[];
}

const FUNCTION_NAME = "project-editor";

/**
 * Single request to load all data needed for the project editor.
 */
export async function loadProjectEditorData(
  projectId: string,
): Promise<ProjectEditorLoadResult> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: { action: "load", projectId },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.project) throw new Error("Project not found");

  return {
    project: data.project,
    apartments: data.apartments ?? [],
    floorPlans: data.floorPlans ?? [],
    fieldSettings: data.fieldSettings ?? [],
    customFields: data.customFields ?? [],
    domains: data.domains ?? [],
  };
}

/**
 * Upload PDF presentation via edge function (storage + project update in one request).
 */
export async function uploadProjectPdf(
  projectId: string,
  file: File,
): Promise<{ publicUrl: string }> {
  const form = new FormData();
  form.set("action", "uploadPdf");
  form.set("projectId", projectId);
  form.set("file", file);

  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: form,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.publicUrl) throw new Error("No URL returned");

  return { publicUrl: data.publicUrl };
}

/**
 * Remove PDF presentation via edge function (storage remove + project update).
 */
export async function removeProjectPdf(
  projectId: string,
  pdfUrl?: string | null,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: { action: "removePdf", projectId, pdfUrl },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}

/**
 * Upload floor plan image via edge function (storage + floor_plans upsert).
 */
export async function uploadFloorPlan(
  projectId: string,
  floorNumber: number,
  file: File,
): Promise<{ publicUrl: string }> {
  const form = new FormData();
  form.set("action", "uploadFloorPlan");
  form.set("projectId", projectId);
  form.set("floorNumber", String(floorNumber));
  form.set("file", file);

  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: form,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.publicUrl) throw new Error("No URL returned");

  return { publicUrl: data.publicUrl };
}

/**
 * Upload apartment photo via edge function (storage + apartment_photos insert).
 */
export async function uploadApartmentPhoto(
  apartmentId: string,
  orderIndex: number,
  file: File,
): Promise<{ publicUrl: string }> {
  const form = new FormData();
  form.set("action", "uploadApartmentPhoto");
  form.set("apartmentId", apartmentId);
  form.set("orderIndex", String(orderIndex));
  form.set("file", file);

  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: form,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.publicUrl) throw new Error("No URL returned");

  return { publicUrl: data.publicUrl };
}

/**
 * Delete apartment photo via edge function (apartment_photos delete + storage remove).
 */
export async function deleteApartmentPhoto(
  photoId: string,
  imageUrl: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: { action: "deleteApartmentPhoto", photoId, imageUrl },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}
