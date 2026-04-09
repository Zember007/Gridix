import { useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@gridix/utils/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@gridix/ui";
import PolygonPlanImageView from "@/features/visualization/buildingFacade/ui/PolygonPlanImageView";
import { parsePolygonOverlaySettings } from "@/features/visualization/buildingFacade/lib/parsePolygonOverlaySettings";
import type {
  MasterplanMobileSummary,
  MasterplanPolygonItem,
} from "@/features/visualization/buildingFacade/model/types";
import type { Project } from "@/entities/project/queries/useProjects";
import type { Apartment } from "@/entities/apartment/model/types";
import { Spinner } from "@/shared/ui/Spinner";
import type {
  MasterplanListItem,
  MasterplanArea,
  MasterplanInfrastructureZone,
  SubProjectListItem,
} from "@/features/projectSelector/api/projectSelectorApi";
import { useMasterplanData } from "../hooks/useMasterplanData";

interface MasterplanSectionProps {
  project: Project;
  projectId: string;
  themeColor: string;
  masterplansList: MasterplanListItem[];
  subProjects: SubProjectListItem[];
}

interface PolygonPoint {
  x: number;
  y: number;
}

function resolveInfrastructureZone(
  area: MasterplanArea,
  zones: MasterplanInfrastructureZone[],
): MasterplanInfrastructureZone | null {
  if (
    area.linked_entity_type !== "infrastructure_zone" ||
    !area.linked_entity_id
  ) {
    return null;
  }
  if (area.infrastructure_zone?.id) {
    return area.infrastructure_zone;
  }
  return zones.find((z) => z.id === area.linked_entity_id) ?? null;
}

function zoneDescriptionText(zone: MasterplanInfrastructureZone): string {
  const full = (zone.full_description ?? "").trim();
  if (full.length > 0) return full;
  const short = (zone.short_description ?? "").trim();
  if (short.length > 0 && short !== "-") return short;
  return "";
}

function compareMasterplanAreas(a: MasterplanArea, b: MasterplanArea): number {
  const dz = (a.z_index ?? 0) - (b.z_index ?? 0);
  if (dz !== 0) return dz;
  return (a.sort_order ?? 0) - (b.sort_order ?? 0);
}

function areasToMasterplanPolygons(
  areas: MasterplanArea[],
  naturalW: number | null,
  naturalH: number | null,
  buildingFill: string,
  infrastructureFill: string,
): MasterplanPolygonItem[] {
  const out: MasterplanPolygonItem[] = [];
  for (const a of areas) {
    const pts = a.geometry as PolygonPoint[] | undefined;
    if (!pts?.length || pts.length < 3) continue;
    const maxCoord = Math.max(
      ...pts.flatMap((p) => [Math.abs(p.x), Math.abs(p.y)]),
    );
    const inPixels =
      naturalW != null &&
      naturalH != null &&
      naturalW > 0 &&
      naturalH > 0 &&
      maxCoord > 100;
    const polygon = inPixels
      ? pts.map((p) => ({
          x: (p.x / naturalW!) * 100,
          y: (p.y / naturalH!) * 100,
        }))
      : pts;
    const fillColor =
      a.linked_entity_type === "infrastructure_zone"
        ? infrastructureFill
        : buildingFill;
    out.push({ id: a.id, polygon, fillColor });
  }
  return out;
}

const noopApartment = (_a: Apartment) => {
  void _a;
};

export function MasterplanSection({
  project,
  projectId,
  themeColor,
  masterplansList,
  subProjects,
}: MasterplanSectionProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeMasterplanIndex, setActiveMasterplanIndex] = useState(0);
  const activeMasterplanItem = masterplansList[activeMasterplanIndex] ?? null;

  const {
    masterplan,
    areas,
    infrastructureZones,
    loading,
    projectGenplanPolygonSettings,
  } = useMasterplanData({
    projectId,
    masterplansList,
    activeMasterplanId: activeMasterplanItem?.id,
    enabled: true,
  });

  const [selectedInfrastructureZone, setSelectedInfrastructureZone] =
    useState<MasterplanInfrastructureZone | null>(null);

  const subProjectsById = useMemo(() => {
    const map: Record<string, SubProjectListItem> = {};
    for (const sp of subProjects) {
      map[sp.id] = sp;
    }
    return map;
  }, [subProjects]);

  const buildingAreas = useMemo(
    () =>
      areas.filter(
        (a) =>
          a.linked_entity_type === "sub_project" &&
          a.linked_entity_id &&
          a.status === "active",
      ),
    [areas],
  );

  const infrastructureAreas = useMemo(
    () =>
      areas.filter(
        (a) =>
          a.linked_entity_type === "infrastructure_zone" &&
          a.linked_entity_id &&
          a.status === "active",
      ),
    [areas],
  );

  const displayAreas = useMemo(
    () =>
      [...buildingAreas, ...infrastructureAreas].sort(compareMasterplanAreas),
    [buildingAreas, infrastructureAreas],
  );

  const overlaySettings = useMemo(
    () =>
      parsePolygonOverlaySettings(
        projectGenplanPolygonSettings ?? masterplan?.polygon_display_settings,
      ),
    [projectGenplanPolygonSettings, masterplan?.polygon_display_settings],
  );

  const buildingFill = overlaySettings.colors.building;
  const infrastructureFill = overlaySettings.colors.available ?? "#16a34a";

  const masterplanPolygons = useMemo(
    () =>
      areasToMasterplanPolygons(
        displayAreas,
        masterplan?.background_asset_width ?? null,
        masterplan?.background_asset_height ?? null,
        buildingFill,
        infrastructureFill,
      ),
    [
      displayAreas,
      masterplan?.background_asset_width,
      masterplan?.background_asset_height,
      buildingFill,
      infrastructureFill,
    ],
  );

  const imageUrl =
    masterplan?.background_asset_url ??
    activeMasterplanItem?.background_asset_url ??
    null;

  const navigateToSubProject = useCallback(
    (subSlug: string) => {
      navigate(`p/${subSlug}`);
    },
    [navigate],
  );

  const onMasterplanAreaClick = useCallback(
    (areaId: string) => {
      const area = displayAreas.find((a) => a.id === areaId);
      if (!area) return;

      if (area.linked_entity_type === "infrastructure_zone") {
        const zone = resolveInfrastructureZone(area, infrastructureZones);
        if (zone) setSelectedInfrastructureZone(zone);
        return;
      }

      if (area.linked_entity_type !== "sub_project") return;

      const sid = area.linked_entity_id;
      if (!sid) return;
      const sp = subProjectsById[sid];
      if (sp) navigateToSubProject(sp.slug);
    },
    [displayAreas, infrastructureZones, subProjectsById, navigateToSubProject],
  );

  const masterplanRenderTooltip = useCallback(
    (areaId: string) => {
      const area = displayAreas.find((a) => a.id === areaId);
      if (!area) return null;

      if (area.linked_entity_type === "infrastructure_zone") {
        const zone = resolveInfrastructureZone(area, infrastructureZones);
        if (!zone) return null;
        const desc = zoneDescriptionText(zone);
        return (
          <div className="pointer-events-none w-64 overflow-hidden rounded-lg border bg-white shadow-lg">
            {zone.cover_image ? (
              <img
                src={zone.cover_image}
                alt=""
                className="h-28 w-full object-cover"
              />
            ) : null}
            <div className="p-3">
              <div className="text-sm font-semibold">
                {(zone.name ?? "").trim() || "—"}
              </div>
              {desc ? (
                <div className="mt-1 line-clamp-4 text-xs text-muted-foreground">
                  {desc}
                </div>
              ) : null}
            </div>
          </div>
        );
      }

      if (area.linked_entity_type !== "sub_project" || !area.linked_entity_id) {
        return null;
      }
      const sp = subProjectsById[area.linked_entity_id];
      if (!sp) return null;
      return (
        <div className="pointer-events-none w-56 rounded-lg border bg-white p-3 shadow-lg">
          <div className="mb-1 text-sm font-semibold">{sp.name}</div>
          {area.building_summary && (
            <div className="space-y-0.5 text-xs">
              <div>
                {t("project.available")}:{" "}
                <span className="font-medium">
                  {area.building_summary.available_count}
                </span>
              </div>
              {area.building_summary.price_from != null && (
                <div>
                  {t("project.priceFrom")}:{" "}
                  <span className="font-medium">
                    {new Intl.NumberFormat("en-US").format(
                      area.building_summary.price_from,
                    )}
                    {area.building_summary.currency
                      ? ` ${area.building_summary.currency}`
                      : ""}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    },
    [displayAreas, infrastructureZones, subProjectsById, t],
  );

  const facadeNavItems = useMemo(
    () => masterplansList.map((m) => ({ id: m.id, name: m.name })),
    [masterplansList],
  );

  const masterplanPolygonLabels = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of displayAreas) {
      if (a.linked_entity_type === "sub_project") {
        const sp = a.linked_entity_id
          ? subProjectsById[a.linked_entity_id]
          : null;
        const label = (a.short_label ?? a.label ?? sp?.name ?? "").trim();
        if (label) m[a.id] = label;
        continue;
      }
      if (a.linked_entity_type === "infrastructure_zone") {
        const zone = resolveInfrastructureZone(a, infrastructureZones);
        const label = (a.short_label ?? a.label ?? zone?.name ?? "").trim();
        if (label) m[a.id] = label;
      }
    }
    return m;
  }, [displayAreas, subProjectsById, infrastructureZones]);

  const masterplanMobileSummaries = useMemo(() => {
    const m: Record<string, MasterplanMobileSummary> = {};
    for (const a of displayAreas) {
      if (a.linked_entity_type === "sub_project" && a.linked_entity_id) {
        const sp = subProjectsById[a.linked_entity_id];
        const title =
          (a.short_label ?? a.label ?? sp?.name ?? "").trim() ||
          sp?.name ||
          "—";
        let subtitle: string | undefined;
        if (a.building_summary) {
          const parts: string[] = [
            `${a.building_summary.available_count} ${t("project.available")}`,
          ];
          if (a.building_summary.price_from != null) {
            parts.push(
              `${t("project.priceFrom")}: ${new Intl.NumberFormat(
                "en-US",
              ).format(
                a.building_summary.price_from,
              )}${a.building_summary.currency ? ` ${a.building_summary.currency}` : ""}`,
            );
          }
          subtitle = parts.join(" · ");
        }
        m[a.id] = { kind: "sub_project", title, subtitle };
        continue;
      }
      if (a.linked_entity_type === "infrastructure_zone") {
        const zone = resolveInfrastructureZone(a, infrastructureZones);
        const title =
          (a.short_label ?? a.label ?? zone?.name ?? "").trim() ||
          (zone?.name ?? "").trim() ||
          "—";
        const desc = zone ? zoneDescriptionText(zone) : "";
        const subtitle =
          desc.length > 160 ? `${desc.slice(0, 157)}…` : desc || undefined;
        m[a.id] = { kind: "infrastructure_zone", title, subtitle };
      }
    }
    return m;
  }, [displayAreas, subProjectsById, infrastructureZones, t]);

  const planProject = useMemo(
    () => ({
      id: project.id,
      name: masterplan?.name ?? activeMasterplanItem?.name ?? project.name,
      building_image_url: project.building_image_url,
      currency: project.currency,
    }),
    [project, masterplan?.name, activeMasterplanItem?.name],
  );

  const zoneDialogDescription = selectedInfrastructureZone
    ? zoneDescriptionText(selectedInfrastructureZone)
    : "";

  if (loading && !masterplan) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="md" color={themeColor} />
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">{t("project.noMasterplan")}</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <Dialog
        open={selectedInfrastructureZone != null}
        onOpenChange={(open) => {
          if (!open) setSelectedInfrastructureZone(null);
        }}
      >
        <DialogContent className="max-h-[min(90dvh,640px)] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto sm:max-w-lg">
          {selectedInfrastructureZone && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8 text-left">
                  {(selectedInfrastructureZone.name ?? "").trim() || "—"}
                </DialogTitle>
              </DialogHeader>
              {selectedInfrastructureZone.cover_image ? (
                <div className="-mx-1 mt-2 overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={selectedInfrastructureZone.cover_image}
                    alt=""
                    className="max-h-56 w-full object-cover"
                  />
                </div>
              ) : null}
              {zoneDialogDescription ? (
                <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {zoneDialogDescription}
                </p>
              ) : null}
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <PolygonPlanImageView
          projectId={projectId}
          themeColor={themeColor}
          project={planProject}
          entityKind="building"
          imageUrl={imageUrl}
          apartments={[]}
          onApartmentSelect={noopApartment}
          visibleFields={[]}
          buildingFloors={[]}
          facadeSettings={overlaySettings}
          loading={false}
          selectedCurrency={project.currency ?? undefined}
          facades={facadeNavItems.length > 1 ? facadeNavItems : undefined}
          activeFacadeIndex={
            facadeNavItems.length > 1 ? activeMasterplanIndex : undefined
          }
          onFacadeChange={
            facadeNavItems.length > 1 ? setActiveMasterplanIndex : undefined
          }
          planKind="masterplan"
          masterplanPolygons={masterplanPolygons}
          onMasterplanAreaClick={onMasterplanAreaClick}
          masterplanRenderTooltip={masterplanRenderTooltip}
          masterplanPolygonLabels={masterplanPolygonLabels}
          masterplanMobileSummaries={masterplanMobileSummaries}
        />
      </div>
    </div>
  );
}
