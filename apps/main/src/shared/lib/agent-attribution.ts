const AGENT_ID_QUERY_PARAM = "agent_id";
const AGENT_ID_COOKIE_NAME = "agent_id";
const AGENT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Reads a cookie value by name from `document.cookie`.
 * Returns `null` when the cookie is missing or empty.
 */
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!cookie) return null;

  const rawValue = cookie.slice(name.length + 1).trim();
  if (!rawValue) return null;

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

/**
 * Returns `agent_id` from URL query params.
 * If `search` is omitted, uses `window.location.search`.
 */
export function getAgentIdFromQuery(search?: string): string | null {
  if (typeof window === "undefined" && !search) return null;

  const params = new URLSearchParams(
    search ?? (typeof window !== "undefined" ? window.location.search : ""),
  );
  const value = params.get(AGENT_ID_QUERY_PARAM)?.trim();
  return value || null;
}

/**
 * Returns `agent_id` stored in cookie.
 */
export function getAgentIdFromCookie(): string | null {
  const value = readCookie(AGENT_ID_COOKIE_NAME)?.trim();
  return value || null;
}

/**
 * Persists `agent_id` in cookie for 30 days.
 * Uses `SameSite=Lax`, `Path=/`, and adds `Secure` on HTTPS.
 */
export function setAgentIdCookie(agentId: string): void {
  if (typeof document === "undefined") return;

  const value = agentId.trim();
  if (!value) return;

  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  document.cookie =
    `${AGENT_ID_COOKIE_NAME}=${encodeURIComponent(value)}; ` +
    `Max-Age=${AGENT_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

/**
 * Persists agent attribution in cookie and project-scoped localStorage context.
 * LocalStorage write is skipped when `projectId` is not provided.
 */
export function persistAgentAttribution(
  agentId: string,
  projectId?: string,
): void {
  const value = agentId.trim();
  if (!value) return;

  setAgentIdCookie(value);

  if (typeof localStorage === "undefined" || !projectId) return;

  localStorage.setItem(
    `agent_context:${projectId}`,
    JSON.stringify({
      agent_id: value,
      set_at: new Date().toISOString(),
      source: "link",
    }),
  );
}

/**
 * Resolves current attributed `agent_id` with priority:
 * 1) query param, 2) cookie, 3) project-scoped localStorage fallback.
 */
export function getAttributedAgentId(projectId?: string): string | null {
  const queryValue = getAgentIdFromQuery();
  if (queryValue) return queryValue;

  const cookieValue = getAgentIdFromCookie();
  if (cookieValue) return cookieValue;

  if (typeof localStorage === "undefined" || !projectId) return null;

  try {
    const contextRaw = localStorage.getItem(`agent_context:${projectId}`);
    const context = contextRaw
      ? (JSON.parse(contextRaw) as { agent_id?: string | null })
      : null;
    const localValue = context?.agent_id?.trim();
    return localValue || null;
  } catch {
    return null;
  }
}
