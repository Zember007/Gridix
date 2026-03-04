import type { Project, UnitStatusGroup } from "../model/types";
import type { SharedProject } from "@gridix/ui";

export function getUnitStatusGroup(status: string | null): UnitStatusGroup {
  const st = String(status ?? "").toLowerCase();
  if (st === "available") return "available";
  if (st === "reserved" || st === "booked") return "booked";
  return "sold";
}

export function toSharedProject(project: Project): SharedProject {
  return {
    id: project.id,
    name: project.name,
    location: project.address ?? undefined,
    developerName: project.developer_name ?? undefined,
    imageUrl: project.building_image_url ?? undefined,
    description: project.description ?? undefined,
    floors: project.floors ?? undefined,
    minPrice: project.min_price ?? undefined,
    totalUnits: project.total_units ?? undefined,
    availableUnits: project.available_units ?? undefined,
    yield: project.yield_percent ?? undefined,
    commissionPercent: project.commission_percent ?? undefined,
    commissionCondition: project.commission_condition ?? undefined,
    partnershipStatus: "active",
    partnershipSettings: {
      isEnabled: true,
      allowPartnerConnect:
        project.allow_partner_connect === false ? false : true,
      commissionType: "percent",
      commissionValue: project.commission_percent ?? 5,
      ...(project.commission_condition
        ? { payoutCondition: project.commission_condition }
        : {}),
    },
  };
}
