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

interface UploadWithProgressOptions {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

const getSupabaseFunctionUrl = (functionName: string): string => {
  const supabaseUrl = (
    import.meta.env.VITE_SUPABASE_URL as string | undefined
  )?.replace(/\/$/, "");

  if (!supabaseUrl) {
    throw new Error("Supabase URL is not configured");
  }

  return `${supabaseUrl}/functions/v1/${functionName}`;
};

const getSupabaseAnonKey = (): string => {
  const anonKey =
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

  if (!anonKey) {
    throw new Error("Supabase anon key is not configured");
  }

  return anonKey;
};

const createAbortError = (): Error => {
  const error = new Error("Upload aborted");
  error.name = "AbortError";
  return error;
};

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
  options: UploadWithProgressOptions = {},
): Promise<{ publicUrl: string }> {
  const form = new FormData();
  form.set("action", "uploadPdf");
  form.set("projectId", projectId);
  form.set("file", file);

  const anonKey = getSupabaseAnonKey();
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  return await new Promise<{ publicUrl: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const functionUrl = getSupabaseFunctionUrl(FUNCTION_NAME);

    const abortUpload = () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) {
        xhr.abort();
      }
      reject(createAbortError());
    };

    if (options.signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const handleAbort = () => {
      abortUpload();
    };

    options.signal?.addEventListener("abort", handleAbort, { once: true });

    xhr.open("POST", functionUrl);
    xhr.responseType = "text";
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken ?? anonKey}`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = (event.loaded / event.total) * 100;
      options.onProgress?.(progress >= 100 ? 99 : progress);
    };

    xhr.onerror = () => {
      options.signal?.removeEventListener("abort", handleAbort);
      reject(new Error("Failed to upload PDF"));
    };

    xhr.onabort = () => {
      options.signal?.removeEventListener("abort", handleAbort);
      reject(createAbortError());
    };

    xhr.onload = () => {
      options.signal?.removeEventListener("abort", handleAbort);

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(xhr.responseText || "Failed to upload PDF"));
        return;
      }

      try {
        const parsed = JSON.parse(xhr.responseText) as {
          error?: string;
          publicUrl?: string;
        };

        if (parsed.error) {
          reject(new Error(parsed.error));
          return;
        }

        if (!parsed.publicUrl) {
          reject(new Error("No URL returned"));
          return;
        }

        options.onProgress?.(100);
        resolve({ publicUrl: parsed.publicUrl });
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Invalid response"));
      }
    };

    xhr.send(form);
  });
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
