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

const getSupabaseStorageUrl = (): string => {
  const supabaseUrl = (
    import.meta.env.VITE_SUPABASE_URL as string | undefined
  )?.replace(/\/$/, "");

  if (!supabaseUrl) {
    throw new Error("Supabase URL is not configured");
  }

  return `${supabaseUrl}/storage/v1`;
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

const getAuthHeaders = async (): Promise<{
  anonKey: string;
  authorization: string;
}> => {
  const anonKey = getSupabaseAnonKey();
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  return {
    anonKey,
    authorization: `Bearer ${accessToken ?? anonKey}`,
  };
};

const invokeFunctionUploadWithProgress = async <TResponse>(
  form: FormData,
  options: UploadWithProgressOptions = {},
): Promise<TResponse> => {
  const { anonKey, authorization } = await getAuthHeaders();

  return await new Promise<TResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const functionUrl = getSupabaseFunctionUrl(FUNCTION_NAME);

    const cleanup = () => {
      options.signal?.removeEventListener("abort", handleAbort);
    };

    const abortUpload = () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) {
        xhr.abort();
      }
      cleanup();
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
    xhr.setRequestHeader("Authorization", authorization);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = (event.loaded / event.total) * 100;
      options.onProgress?.(progress >= 100 ? 99 : progress);
    };

    xhr.onerror = () => {
      cleanup();
      reject(new Error("Failed to upload file"));
    };

    xhr.onabort = () => {
      cleanup();
      reject(createAbortError());
    };

    xhr.onload = () => {
      cleanup();

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(xhr.responseText || "Failed to upload file"));
        return;
      }

      try {
        const parsed = JSON.parse(xhr.responseText) as TResponse & {
          error?: string;
        };

        if (parsed.error) {
          reject(new Error(parsed.error));
          return;
        }

        options.onProgress?.(100);
        resolve(parsed);
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Invalid response"));
      }
    };

    xhr.send(form);
  });
};

const uploadStorageObjectWithProgress = async (
  bucket: string,
  objectPath: string,
  file: File,
  options: UploadWithProgressOptions = {},
): Promise<void> => {
  const { anonKey, authorization } = await getAuthHeaders();
  const encodedPath = objectPath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const uploadUrl = `${getSupabaseStorageUrl()}/object/${encodeURIComponent(bucket)}/${encodedPath}`;
    const form = new FormData();

    form.append("cacheControl", "3600");
    form.append("", file);

    const cleanup = () => {
      options.signal?.removeEventListener("abort", handleAbort);
    };

    const abortUpload = () => {
      if (xhr.readyState !== XMLHttpRequest.DONE) {
        xhr.abort();
      }
      cleanup();
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

    xhr.open("POST", uploadUrl);
    xhr.responseType = "text";
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("Authorization", authorization);
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = (event.loaded / event.total) * 100;
      options.onProgress?.(progress >= 100 ? 99 : progress);
    };

    xhr.onerror = () => {
      cleanup();
      reject(new Error("Failed to upload file"));
    };

    xhr.onabort = () => {
      cleanup();
      reject(createAbortError());
    };

    xhr.onload = () => {
      cleanup();

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(xhr.responseText || "Failed to upload file"));
        return;
      }

      options.onProgress?.(100);
      resolve();
    };

    xhr.send(form);
  });
};

const createUniqueFileName = (
  prefix: string,
  extension: string,
  scope?: string,
): string => {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return [prefix, scope, randomPart].filter(Boolean).join("-") + extension;
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

  const response = await invokeFunctionUploadWithProgress<{
    publicUrl?: string;
  }>(form, options);

  if (!response.publicUrl) throw new Error("No URL returned");

  return { publicUrl: response.publicUrl };
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
  options: UploadWithProgressOptions = {},
): Promise<{ publicUrl: string }> {
  const form = new FormData();
  form.set("action", "uploadFloorPlan");
  form.set("projectId", projectId);
  form.set("floorNumber", String(floorNumber));
  form.set("file", file);

  const response = await invokeFunctionUploadWithProgress<{
    publicUrl?: string;
  }>(form, options);

  if (!response.publicUrl) throw new Error("No URL returned");

  return { publicUrl: response.publicUrl };
}

const getStorageObjectPathFromPublicUrl = (
  publicUrl: string,
  bucket: string,
): string | null => {
  try {
    const url = new URL(publicUrl);
    const publicMarker = `/object/public/${bucket}/`;
    const markerIndex = url.pathname.indexOf(publicMarker);

    if (markerIndex === -1) {
      return null;
    }

    const objectPath = url.pathname.slice(markerIndex + publicMarker.length);
    return decodeURIComponent(objectPath);
  } catch {
    return null;
  }
};

export async function removeFloorPlan(
  projectId: string,
  floorNumber: number,
  imageUrl?: string | null,
): Promise<void> {
  const { error: dbError } = await supabase
    .from("floor_plans")
    .delete()
    .eq("project_id", projectId)
    .eq("floor_number", floorNumber);

  if (dbError) throw dbError;

  if (!imageUrl) return;

  const objectPath = getStorageObjectPathFromPublicUrl(
    imageUrl,
    "project-images",
  );

  if (!objectPath) return;

  const { error: storageError } = await supabase.storage
    .from("project-images")
    .remove([objectPath]);

  if (storageError) throw storageError;
}

/**
 * Upload apartment photo via edge function (storage + apartment_photos insert).
 */
export async function uploadApartmentPhoto(
  apartmentId: string,
  orderIndex: number,
  file: File,
  options: UploadWithProgressOptions = {},
): Promise<{ publicUrl: string }> {
  const form = new FormData();
  form.set("action", "uploadApartmentPhoto");
  form.set("apartmentId", apartmentId);
  form.set("orderIndex", String(orderIndex));
  form.set("file", file);

  const response = await invokeFunctionUploadWithProgress<{
    publicUrl?: string;
  }>(form, options);

  if (!response.publicUrl) throw new Error("No URL returned");

  return { publicUrl: response.publicUrl };
}

export async function uploadLayoutPhoto(
  projectId: string,
  layoutType: string,
  orderIndex: number,
  file: File,
  options: UploadWithProgressOptions = {},
): Promise<{ publicUrl: string }> {
  const fileName = createUniqueFileName(projectId, ".webp", layoutType);
  const objectPath = `layouts/${fileName}`;

  await uploadStorageObjectWithProgress(
    "project-images",
    objectPath,
    file,
    options,
  );

  const {
    data: { publicUrl },
  } = supabase.storage.from("project-images").getPublicUrl(objectPath);

  const { error } = await supabase.from("layout_photos").insert({
    project_id: projectId,
    layout_type: layoutType,
    image_url: publicUrl,
    order_index: orderIndex,
  });

  if (error) {
    await supabase.storage.from("project-images").remove([objectPath]);
    throw error;
  }

  return { publicUrl };
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
