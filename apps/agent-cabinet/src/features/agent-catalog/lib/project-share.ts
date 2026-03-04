export function getMainAppUrl(): string {
  const env = (import.meta as { env?: { VITE_MAIN_APP_URL?: string } }).env
    ?.VITE_MAIN_APP_URL;
  const raw = typeof env === "string" && env ? env : "https://app.gridix.live";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export function createShareUrl(args: {
  baseUrl: string;
  language: string;
  slug: string | null;
  activeWorkspaceId: string | null;
}): string | null {
  const { baseUrl, language, slug, activeWorkspaceId } = args;
  if (!slug || !activeWorkspaceId) return null;
  return `${baseUrl}/${encodeURIComponent(language)}/project/${slug}?agent_id=${encodeURIComponent(activeWorkspaceId)}`;
}

export function createUnitUrl(args: {
  baseUrl: string;
  language: string;
  slug: string | null;
  apartmentNumber: string | null;
  activeWorkspaceId: string | null;
}): string | null {
  const { baseUrl, language, slug, apartmentNumber, activeWorkspaceId } = args;
  if (!slug || !apartmentNumber || !activeWorkspaceId) return null;
  return `${baseUrl}/${encodeURIComponent(language)}/project/${slug}/apartment/${encodeURIComponent(apartmentNumber)}?agent_id=${encodeURIComponent(activeWorkspaceId)}`;
}
