import { supabase } from "@gridix/utils/api";

export function resolveSignatureUrl(path: string): string {
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  const normalizedPath = path
    .replace(/^\/+/, "")
    .replace(/^project-images\//, "");
  return supabase.storage.from("project-images").getPublicUrl(normalizedPath)
    .data.publicUrl;
}
