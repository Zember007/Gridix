import type { SharedProject } from "@gridix/ui";
import type { ProjectDrawerResponse } from "@/entities/project";

/**
 * Maps project drawer payload from API response to SharedProject used by UI drawer.
 * Keeps optional fields undefined when API does not provide a value and normalizes
 * mixed floors/commission representations to the expected types.
 */
export function mapDrawerProject(
  api: NonNullable<ProjectDrawerResponse["project"]>,
): SharedProject {
  return {
    id: String(api.id),
    name: String(api.name ?? ""),
    location: api.location ?? undefined,
    imageUrl: api.imageUrl ?? undefined,
    description: api.description ?? undefined,
    floors:
      typeof api.floors === "number"
        ? api.floors
        : api.floors
          ? Number(api.floors)
          : undefined,
    minPrice: api.minPrice ?? undefined,
    yield: api.yield ?? undefined,
    stats: api.stats ?? undefined,
    media: api.media ?? undefined,
    constructionProgress: api.constructionProgress ?? undefined,
    partnershipStatus: "active",
    partnershipSettings: api.partnershipSettings ?? undefined,
    commissionPercent:
      api.partnershipSettings?.commissionType === "percent"
        ? Number(api.partnershipSettings?.commissionValue ?? 5)
        : undefined,
    commissionCondition: api.partnershipSettings?.payoutCondition ?? undefined,
  };
}
