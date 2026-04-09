import type { SubProject } from "@/features/genplan/model/types";

/** Slug для URL виджета: публичный slug или id, если slug пустой. */
export function subProjectEmbedSlug(sp: SubProject): string {
  const s = sp.slug?.trim();
  return s && s.length > 0 ? s : sp.id;
}
