import { supabase } from "@gridix/utils/api";

// Force a fresh fetch when the underlying file may be overwritten at the same path.
function appendCacheBust(url: string, cacheBust: string | number | null) {
  if (cacheBust === null) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(String(cacheBust))}`;
}

export function resolveSignatureUrl(
  path: string,
  cacheBust: string | number | null = null,
): string {
  if (/^https?:\/\//i.test(path)) return appendCacheBust(path, cacheBust);
  if (path.startsWith("data:")) return path;
  const normalizedPath = path
    .replace(/^\/+/, "")
    .replace(/^project-images\//, "");
  // Supabase public URL is stable for the same object key, so we may need a version param.
  const publicUrl = supabase.storage
    .from("project-images")
    .getPublicUrl(normalizedPath).data.publicUrl;
  return appendCacheBust(publicUrl, cacheBust);
}
