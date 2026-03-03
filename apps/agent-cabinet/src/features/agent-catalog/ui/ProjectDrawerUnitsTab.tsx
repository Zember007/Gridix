import type { SharedProject } from "@gridix/ui";
import { UnitsChessboard } from "@gridix/ui";
import { getUnitStatusGroup } from "@/entities/project";
import { createUnitUrl } from "../lib/project-share";
import { useProjectUnitsQuery } from "../model/useProjectUnitsQuery";

interface Props {
  project: SharedProject;
  activeWorkspaceId: string | null;
  baseUrl: string;
  language: string;
  t: (key: string) => string;
}

export function ProjectDrawerUnitsTab({
  project,
  activeWorkspaceId,
  baseUrl,
  language,
  t,
}: Props) {
  const unitsQuery = useProjectUnitsQuery(activeWorkspaceId, project.id);
  const payload = unitsQuery.data;
  const slug = payload?.project?.slug ?? null;
  const units = payload?.units ?? [];

  const openUnit = (apartmentNumber: string | null) => {
    const url = createUnitUrl({
      baseUrl,
      language,
      slug,
      apartmentNumber,
      activeWorkspaceId,
    });
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <UnitsChessboard
      units={units}
      loading={unitsQuery.isLoading}
      loadingText={t("common.common.loading")}
      emptyText={t("common.drawer.units.empty")}
      labels={{
        available: t("common.drawer.units.legend.available"),
        booked: t("common.drawer.units.legend.booked"),
        sold: t("common.drawer.units.legend.sold"),
      }}
      onUnitClick={(unit) => openUnit(unit.apartment_number)}
      getUnitStatusGroup={getUnitStatusGroup}
    />
  );
}
