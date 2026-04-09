import type { Tables } from "@gridix/types/database";
import type { Apartment } from "@/entities/apartment/model/types";
import type { SubProjectListItem } from "@/features/projectSelector/api/projectSelectorApi";

/** Slug для `/p/:slug/apartment/...` — текущий подпроект или дефолтный / единственный из списка. */
export function resolveSubProjectSlugForApartmentUrl(
  subProject: Tables<"sub_projects"> | null | undefined,
  subProjects: SubProjectListItem[],
): string | null {
  if (subProject?.slug) return subProject.slug;

  const defaultSp = subProjects.find((s) => s.is_default);
  if (defaultSp) return defaultSp.slug;

  if (subProjects.length === 1) return subProjects[0]!.slug;

  if (subProjects.length > 0) {
    return [...subProjects].sort((a, b) => a.sort_order - b.sort_order)[0]!
      .slug;
  }

  return null;
}

/** Для PDF и ссылок: сначала субпроект квартиры, иначе контекст виджета (как при открытии карточки). */
export function resolveSubProjectSlugForPdf(
  apartment: Apartment,
  subProject: Tables<"sub_projects"> | null | undefined,
  subProjects: SubProjectListItem[],
): string | undefined {
  if (apartment.sub_project_id) {
    const sp = subProjects.find((s) => s.id === apartment.sub_project_id);
    if (sp) return sp.slug;
  }
  const fallback = resolveSubProjectSlugForApartmentUrl(
    subProject,
    subProjects,
  );
  return fallback ?? undefined;
}
