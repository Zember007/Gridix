/** Normalize API `sub_projects.type` for UI (case-insensitive). */
export function normalizeSubProjectKind(
  type: string | null | undefined,
): "building" | "object" {
  const t = (type ?? "").toLowerCase().trim();
  return t === "object" ? "object" : "building";
}
