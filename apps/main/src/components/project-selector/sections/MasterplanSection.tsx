import { useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@gridix/utils/react";
import PolygonPlanImageView from "@/features/visualization/buildingFacade/ui/PolygonPlanImageView";
import { parsePolygonOverlaySettings } from "@/features/visualization/buildingFacade/lib/parsePolygonOverlaySettings";
import type { MasterplanPolygonItem } from "@/features/visualization/buildingFacade/model/types";
import type { Project } from "@/entities/project/queries/useProjects";
import type { Apartment } from "@/entities/apartment/model/types";
import { Spinner } from "@/shared/ui/Spinner";
import type {
  MasterplanListItem,
  MasterplanArea,
  SubProjectListItem,
} from "@/features/projectSelector/api/projectSelectorApi";
import { useMasterplanData } from "../hooks/useMasterplanData";
import { normalizeSubProjectKind } from "../lib/subProjectDisplay";

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

function geometryToPercentPolygons(
  areas: MasterplanArea[],
  naturalW: number | null,
  naturalH: number | null,
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
    out.push({ id: a.id, polygon });
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

  const { masterplan, areas, loading } = useMasterplanData({
    projectId,
    masterplansList,
    activeMasterplanId: activeMasterplanItem?.id,
    enabled: true,
  });

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

  const overlaySettings = useMemo(
    () => parsePolygonOverlaySettings(masterplan?.polygon_display_settings),
    [masterplan?.polygon_display_settings],
  );

  const masterplanPolygons = useMemo(
    () =>
      geometryToPercentPolygons(
        buildingAreas,
        masterplan?.background_asset_width ?? null,
        masterplan?.background_asset_height ?? null,
      ),
    [
      buildingAreas,
      masterplan?.background_asset_width,
      masterplan?.background_asset_height,
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
      const area = buildingAreas.find((a) => a.id === areaId);
      const sid = area?.linked_entity_id;
      if (!sid) return;
      const sp = subProjectsById[sid];
      if (sp) navigateToSubProject(sp.slug);
    },
    [buildingAreas, subProjectsById, navigateToSubProject],
  );

  const masterplanRenderTooltip = useCallback(
    (areaId: string) => {
      const area = buildingAreas.find((a) => a.id === areaId);
      if (!area?.linked_entity_id) return null;
      const sp = subProjectsById[area.linked_entity_id];
      if (!sp) return null;
      const kind = normalizeSubProjectKind(sp.type);
      return (
        <div className="pointer-events-none w-56 rounded-lg border bg-white p-3 shadow-lg">
          <div className="mb-1 text-sm font-semibold">{sp.name}</div>
          <div className="mb-2 text-xs text-gray-500">
            {kind === "object" ? t("project.object") : t("project.building")}
          </div>
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
          <div
            className="mt-2 text-xs font-medium"
            style={{ color: themeColor }}
          >
            {t("project.viewDetails")} →
          </div>
        </div>
      );
    },
    [buildingAreas, subProjectsById, t, themeColor],
  );

  const facadeNavItems = useMemo(
    () => masterplansList.map((m) => ({ id: m.id, name: m.name })),
    [masterplansList],
  );

  const masterplanPolygonLabels = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of buildingAreas) {
      const sp = a.linked_entity_id
        ? subProjectsById[a.linked_entity_id]
        : null;
      const label = (a.short_label ?? a.label ?? sp?.name ?? "").trim();
      if (label) m[a.id] = label;
    }
    return m;
  }, [buildingAreas, subProjectsById]);

  const planProject = useMemo(
    () => ({
      id: project.id,
      name: masterplan?.name ?? activeMasterplanItem?.name ?? project.name,
      building_image_url: project.building_image_url,
      project_type: "building" as const,
      currency: project.currency,
      facade_open: project.facade_open ?? false,
    }),
    [project, masterplan?.name, activeMasterplanItem?.name],
  );

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
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <PolygonPlanImageView
          projectId={projectId}
          themeColor={themeColor}
          project={planProject}
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
        />
      </div>
    </div>
  );
}
