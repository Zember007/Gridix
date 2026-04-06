import type { SubProjectListItem } from "@/features/projectSelector/api/projectSelectorApi";

/** Normalize API `sub_projects.type` for UI (case-insensitive). */
export function normalizeSubProjectKind(
  type: string | null | undefined,
): "building" | "object" {
  const t = (type ?? "").toLowerCase().trim();
  return t === "object" ? "object" : "building";
}

/**
 * Effective building vs object layout for the selector: explicit sub-project row,
 * else default (or first) sub-project from the initial list — not `projects.project_type`.
 */
export function resolveSelectorEntityKind(
  subProject: { type: string | null | undefined } | null | undefined,
  subProjects: SubProjectListItem[],
): "building" | "object" {
  if (subProject) return normalizeSubProjectKind(subProject.type);
  const def = subProjects.find((s) => s.is_default) ?? subProjects[0];
  return def ? normalizeSubProjectKind(def.type) : "building";
}
