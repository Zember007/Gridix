import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { loadSelectorFloorPlan } from "@/features/projectSelector/api/projectSelectorApi";
import { Apartment } from "@/entities/apartment/model/types";
import { useLanguage } from "@/contexts/LanguageContext";
import ApartmentPopup from "./ApartmentPopup";
import { FieldSetting } from "@/hooks/useFields";
import PolygonAnnotator from "./polygon-editor/PolygonAnnotatorLazy";
import type { Shape } from "./polygon-editor/GeometryShapes";
import InteractionHint from "./InteractionHint";
import { Spinner } from "@/shared/ui/Spinner";

interface FloorPlanViewProps {
  projectId: string;
  /** When the selector is scoped to a building, floor plan image + `polygon_settings_floor` are loaded for this sub-project. */
  subProjectId?: string | null;
  floorNumber: number;
  apartments?: Apartment[];
  onApartmentSelect?: (apartment: Apartment) => void;
  currency?: string | null;
  visibleFields?: FieldSetting[];
  selectedCurrency?: string;
  themeColor?: string;
}

interface FloorPlan {
  id: string;
  image_url: string | null;
}

type FloorSettings = {
  colors?: { available: string; reserved: string; sold: string };
  opacity?: { normal: number; hover: number };
  display?: {
    showNumbers?: boolean;
    showTooltip?: boolean;
    showArea?: boolean;
    showPrice?: boolean;
  };
  hoverEffects?: {
    glow?: boolean;
    colorChange?: boolean;
    opacityChange?: boolean;
    scale?: boolean;
  };
};

/** Align with `FloorPlanEditor` / `polygon_settings_floor` editor defaults. */
const DEFAULT_FLOOR_COLORS = {
  available: "#22c55e",
  reserved: "#f59e0b",
  sold: "#ef4444",
} as const;

const DEFAULT_FLOOR_OPACITY = { normal: 0.3, hover: 0.5 } as const;

const DEFAULT_FLOOR_SETTINGS: FloorSettings = {
  colors: { ...DEFAULT_FLOOR_COLORS },
  opacity: { ...DEFAULT_FLOOR_OPACITY },
  display: {
    showNumbers: true,
    showTooltip: false,
    showArea: false,
    showPrice: false,
  },
  hoverEffects: { glow: true, colorChange: true, opacityChange: true },
};

function mergeFloorSettings(fromApi: unknown): FloorSettings {
  const src =
    fromApi && typeof fromApi === "object" ? (fromApi as FloorSettings) : null;
  if (!src) {
    return { ...DEFAULT_FLOOR_SETTINGS };
  }
  const colors = {
    available: src.colors?.available ?? DEFAULT_FLOOR_COLORS.available,
    reserved: src.colors?.reserved ?? DEFAULT_FLOOR_COLORS.reserved,
    sold: src.colors?.sold ?? DEFAULT_FLOOR_COLORS.sold,
  };
  const opacity = {
    normal: src.opacity?.normal ?? DEFAULT_FLOOR_OPACITY.normal,
    hover: src.opacity?.hover ?? DEFAULT_FLOOR_OPACITY.hover,
  };
  return {
    colors,
    opacity,
    display: { ...DEFAULT_FLOOR_SETTINGS.display, ...(src.display ?? {}) },
    hoverEffects: {
      ...DEFAULT_FLOOR_SETTINGS.hoverEffects,
      ...(src.hoverEffects ?? {}),
    },
  };
}

const FloorPlanView = ({
  projectId,
  subProjectId,
  floorNumber,
  apartments,
  onApartmentSelect,
  currency,
  visibleFields = [],
  selectedCurrency,
  themeColor = "#000000",
}: FloorPlanViewProps) => {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const [floorSettings, setFloorSettings] = useState<FloorSettings | null>(
    null,
  );
  const [hoveredApartment, setHoveredApartment] = useState<Apartment | null>(
    null,
  );
  const [popupPosition, setPopupPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const viewerWrapRef = useRef<HTMLDivElement>(null);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        const result = await loadSelectorFloorPlan(
          projectId,
          floorNumber,
          subProjectId ?? undefined,
        );
        if (cancelled) return;

        setFloorPlan(result.floorPlan);
        setFloorSettings(mergeFloorSettings(result.floorSettings));
      } catch (error) {
        if (cancelled) return;
        console.error("Error loading floor plan:", error);
        setFloorSettings(mergeFloorSettings(null));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [projectId, floorNumber, subProjectId]);

  const getApartmentColor = useCallback(
    (apartment: Apartment) => {
      const colors = floorSettings?.colors;
      if (colors) {
        switch (apartment.status) {
          case "available":
            return colors.available;
          case "reserved":
            return colors.reserved;
          case "sold":
            return colors.sold;
          default:
            return colors.available;
        }
      }
      switch (apartment.status) {
        case "available":
          return DEFAULT_FLOOR_COLORS.available;
        case "reserved":
          return DEFAULT_FLOOR_COLORS.reserved;
        case "sold":
          return DEFAULT_FLOOR_COLORS.sold;
        default:
          return DEFAULT_FLOOR_COLORS.available;
      }
    },
    [floorSettings],
  );

  const apartmentById = useMemo(() => {
    const map = new Map<string, Apartment>();
    (apartments ?? []).forEach((a) => map.set(a.id, a));
    return map;
  }, [apartments]);

  const shapes: Shape[] = useMemo(() => {
    return (apartments ?? [])
      .filter((a) => Array.isArray(a.polygon) && a.polygon.length >= 3)
      .map((a) => ({
        id: a.id,
        type: "polygon",
        points: a.polygon,
        color: getApartmentColor(a),
        isSelected: false,
      }));
  }, [apartments, getApartmentColor]);

  const labelsById = useMemo(() => {
    const out: Record<string, string> = {};
    (apartments ?? []).forEach((a) => {
      out[a.id] = String(a.apartment_number ?? "");
    });
    return out;
  }, [apartments]);

  const getStyleById = useCallback(
    (id: string) => {
      const apt = apartmentById.get(id);
      const baseColor = apt
        ? getApartmentColor(apt)
        : DEFAULT_FLOOR_COLORS.available;
      return {
        fill: baseColor,
        fillOpacity: floorSettings?.opacity?.normal ?? 0.3,
        stroke: baseColor,
        strokeOpacity: 1,
        strokeWidth: 2,
      };
    },
    [apartmentById, floorSettings, getApartmentColor],
  );

  const hidePopup = useCallback(() => {
    setHoveredApartment(null);
    setShowPopup(false);
  }, []);

  const updateMousePos = useCallback((e: React.MouseEvent) => {
    const rect = viewerWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    lastMousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  if (loading) {
    return (
      <div
        className={`flex h-full grow items-center justify-center p-0 md:p-6 ${apartments ? "min-h-[400px]" : "min-h-[100px]"}`}
      >
        <Spinner size="md" style={{ borderColor: themeColor }} />
      </div>
    );
  }

  if (!floorPlan || !floorPlan.image_url) {
    return (
      <div
        className={`flex h-full grow flex-col items-center justify-center p-0 text-gray-500 md:p-6 ${apartments ? "min-h-[400px]" : "min-h-[100px]"}`}
      >
        <p>{t("floorPlan.viewer.notLoaded", { floor: floorNumber })}</p>
        <p className="mt-1 text-sm">{t("floorPlan.viewer.contactAdmin")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full grow flex-col rounded-none p-0 md:p-6">
      <div
        ref={viewerWrapRef}
        className="relative flex flex-1 items-center justify-center rounded-lg bg-gray-50"
        onMouseMove={updateMousePos}
        onMouseLeave={hidePopup}
      >
        <PolygonAnnotator
          imageUrl={floorPlan.image_url}
          mode="view"
          shapes={shapes}
          showLabels={floorSettings?.display?.showNumbers !== false}
          labelsById={labelsById}
          getStyleById={getStyleById}
          viewHoverEffects={floorSettings?.hoverEffects}
          zoomToSelection={true}
          onHoverAnnotationId={(id) => {
            if (!(floorSettings?.display?.showTooltip ?? false)) return;
            if (!id) {
              hidePopup();
              return;
            }

            const apt = apartmentById.get(id);
            if (!apt) {
              hidePopup();
              return;
            }

            setHoveredApartment(apt);
            setShowPopup(true);
            setPopupPosition(lastMousePosRef.current);
          }}
          onSelectAnnotationId={(id) => {
            hidePopup();

            if (!id) {
              return;
            }

            const apt = apartmentById.get(id);
            if (apt && onApartmentSelect) onApartmentSelect(apt);
          }}
          className={`w-full ${apartments ? "h-full" : "h-[250px] min-h-[100px] md:h-[300px]"}`}
        />

        {showPopup && hoveredApartment && popupPosition && (
          <ApartmentPopup
            apartment={hoveredApartment}
            position={popupPosition}
            settings={{
              showNumbers: floorSettings?.display?.showNumbers ?? true,
              showTooltip: floorSettings?.display?.showTooltip ?? false,
              showArea:
                visibleFields.find((field) => field.field_name === "area")
                  ?.is_visible ?? false,
              showPrice:
                visibleFields.find((field) => field.field_name === "price")
                  ?.is_visible ?? false,
              showRooms:
                visibleFields.find((field) => field.field_name === "rooms")
                  ?.is_visible ?? false,
            }}
            showFloor={
              visibleFields.find((field) => field.field_name === "floor")
                ?.is_visible ?? false
            }
            showStatus={
              visibleFields.find((field) => field.field_name === "status")
                ?.is_visible ?? false
            }
            currency={currency || null}
            selectedCurrency={selectedCurrency}
          />
        )}
        <InteractionHint storageKey="floor-plan" />
      </div>

      {apartments?.length && onApartmentSelect && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-6 text-[10px] md:text-sm">
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded opacity-60"
                style={{
                  backgroundColor:
                    floorSettings?.colors?.available ??
                    DEFAULT_FLOOR_COLORS.available,
                }}
              ></div>
              <span>{t("project.available")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded opacity-60"
                style={{
                  backgroundColor: floorSettings?.colors?.reserved ?? "#f59e0b",
                }}
              ></div>
              <span>{t("project.reserved")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded opacity-60"
                style={{
                  backgroundColor: floorSettings?.colors?.sold ?? "#ef4444",
                }}
              ></div>
              <span>{t("project.sold")}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FloorPlanView;
