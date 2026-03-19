import { supabase } from "@gridix/utils/api";

const FUNCTION_NAME = "project-drawer";

export type ProjectDrawerMediaKind = "render" | "video" | "presentation";

interface UploadWithProgressOptions {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

interface UploadProjectDrawerMediaItemParams {
  projectId: string;
  kind: ProjectDrawerMediaKind;
  file: File;
  title?: string;
  thumbnail?: File;
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

const uploadWithProgress = async (
  form: FormData,
  options: UploadWithProgressOptions = {},
): Promise<void> => {
  const { anonKey, authorization } = await getAuthHeaders();

  return await new Promise<void>((resolve, reject) => {
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
        const parsed = xhr.responseText ? JSON.parse(xhr.responseText) : {};
        if (parsed?.error) {
          reject(
            new Error(
              typeof parsed.error === "string"
                ? parsed.error
                : "Failed to upload file",
            ),
          );
          return;
        }
      } catch {
        reject(new Error("Failed to parse upload response"));
        return;
      }

      resolve();
    };

    xhr.send(form);
  });
};

export async function uploadProjectDrawerMediaItem(
  params: UploadProjectDrawerMediaItemParams,
  options: UploadWithProgressOptions = {},
): Promise<void> {
  const form = new FormData();
  form.set("action", "upload_media_item");
  form.set("project_id", params.projectId);
  form.set("kind", params.kind);
  form.set("file", params.file);

  if (params.title) {
    form.set("title", params.title);
  }

  if (params.thumbnail) {
    form.set("thumbnail", params.thumbnail);
  }

  await uploadWithProgress(form, options);
}
