import { useMemo, useState } from "react";
import type { Apartment } from "@/entities/apartment/model/types";
import type { Project } from "@/entities/project/queries/useProjects";
import { cn } from "@gridix/utils/lib";
import { Button } from "@gridix/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import ApartmentPopup, {
  hasAnyPopupContent,
} from "@/components/visualization/ApartmentPopup";
import type { FieldVisibility } from "../types";

type ApartmentWithSection = Apartment & {
  section_number?: number | null;
};

type Props = {
  project: Project;
  apartments: Apartment[];
  onApartmentSelect: (apartment: Apartment) => void;
  onOpenFloorPlan: (floorNumber: number) => void;
  themeColor: string;
  selectedCurrency: string;
  fieldVisibility: FieldVisibility;
  // Extra props can be passed from parent; keep them optional for TS safety
  language?: string;
  t?: (key: string, options?: Record<string, unknown>) => string;
};

// Helper to determine text/hover classes based on status
const getStatusColorClass = (status: Apartment["status"]) => {
  switch (status) {
    case "available":
      return "text-white";
    case "reserved":
      return "text-gray-800";
    case "sold":
      return "text-gray-800 opacity-70";
    default:
      return "text-gray-800 opacity-50";
  }
};

export const ChessView = ({
  project,
  apartments,
  onApartmentSelect,
  onOpenFloorPlan,
  selectedCurrency,
  fieldVisibility,
}: Props) => {
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);

  const { t } = useLanguage();

  // Group apartments by floor
  // Sort floors descending (top to bottom)
  const floorsData = useMemo(() => {
    const grouped: Record<number, ApartmentWithSection[]> = {};
    apartments.forEach((aptRaw) => {
      const apt = aptRaw as ApartmentWithSection;
      const f = apt.floor_number;
      if (!grouped[f]) grouped[f] = [];
      grouped[f].push(apt);
    });

    const floorNumbers = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => b - a);

    return floorNumbers.map((f) => {
      // Sort by section then number
      const apts = ((grouped[f] ?? []) as ApartmentWithSection[]).sort(
        (a, b) => {
          const sectionA = a.section_number ?? 0;
          const sectionB = b.section_number ?? 0;
          if (sectionA !== sectionB) {
            return sectionA - sectionB;
          }
          const numA = parseInt(a.apartment_number.replace(/\D/g, "")) || 0;
          const numB = parseInt(b.apartment_number.replace(/\D/g, "")) || 0;
          return numA - numB;
        },
      );
      return { floor: f, apartments: apts };
    });
  }, [apartments]);

  const floorSettings = project.polygon_settings_floor as
    | {
        colors?: { available?: string; reserved?: string; sold?: string };
      }
    | undefined;

  const colors = {
    available: floorSettings?.colors?.available || "#3b82f6",
    reserved: floorSettings?.colors?.reserved || "#f59e0b",
    sold: floorSettings?.colors?.sold || "#ef4444",
  };

  return (
    <div className="mx-auto flex grow select-none flex-col overflow-hidden bg-white px-2 py-8 md:container lg:px-6">
      <div className="flex shrink-0 gap-4 border-b border-gray-50 pb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div
            className="h-4 w-4 rounded"
            style={{ backgroundColor: colors.available }}
          ></div>
          <span>{t("project.available")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div
            className="h-4 w-4 rounded"
            style={{ backgroundColor: colors.reserved }}
          ></div>
          <span>{t("project.reserved")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div
            className="h-4 w-4 rounded"
            style={{ backgroundColor: colors.sold }}
          ></div>
          <span>{t("project.sold")}</span>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto pb-20">
        <TooltipProvider delayDuration={100}>
          <div className="flex min-w-max flex-col gap-1 py-4">
            {floorsData.map(({ floor, apartments }) => (
              <div
                key={floor}
                className="group flex min-h-[40px] items-center gap-4 rounded-lg py-0.5 transition-colors hover:bg-slate-50"
                onMouseEnter={() => setHoveredFloor(floor)}
                onMouseLeave={() => setHoveredFloor(null)}
              >
                {/* Left Floor Number */}
                <div className="w-8 shrink-0 text-right text-sm font-medium text-gray-400">
                  {floor}
                </div>

                {/* Apartments Grid Row */}
                <div className="no-scrollbarmd:max-w-[calc(100vw-32px-100px-48px)] flex max-w-[calc(100vw-32px-100px)] flex-1 items-center overflow-x-auto">
                  {apartments.map((aptRaw, index) => {
                    const apt = aptRaw as ApartmentWithSection;
                    const prev =
                      index > 0
                        ? (apartments[index - 1] as ApartmentWithSection)
                        : undefined;
                    const isNewSection =
                      !!prev && apt.section_number !== prev.section_number;
                    const fillColor =
                      apt.status === "reserved"
                        ? colors.reserved
                        : apt.status === "sold"
                          ? colors.sold
                          : colors.available;

                    const popupSettings = {
                      showNumbers: fieldVisibility.number,
                      showTooltip: fieldVisibility.tooltip,
                      showArea: fieldVisibility.area,
                      showPrice: fieldVisibility.price,
                      showRooms: fieldVisibility.rooms,
                    };

                    const shouldRenderTooltip = hasAnyPopupContent(
                      popupSettings,
                      apt,
                      {
                        showStatus: fieldVisibility.status,
                        showFloor: fieldVisibility.floor,
                      },
                    );

                    return (
                      <div
                        key={apt.id}
                        className={cn(
                          "flex items-center",
                          isNewSection && "ml-4 lg:ml-8",
                        )}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => onApartmentSelect(apt)}
                              className={cn(
                                "group/number mx-[2px] flex h-8 w-8 shrink-0 items-center justify-center rounded text-xs font-bold shadow-sm transition-all",
                                getStatusColorClass(apt.status),
                              )}
                              style={{ backgroundColor: fillColor }}
                            >
                              <span className="group-hover/number:scale-140 block transition-all">
                                {apt.type !== "apartment"
                                  ? apt.apartment_number.slice(0, 2)
                                  : apt.rooms == 0
                                    ? "S"
                                    : apt.rooms}
                              </span>
                            </button>
                          </TooltipTrigger>
                          {shouldRenderTooltip && (
                            <TooltipContent
                              side="top"
                              className="border-none bg-transparent p-0 shadow-none"
                            >
                              <ApartmentPopup
                                apartment={apt}
                                variant="static"
                                showFloor={fieldVisibility.floor}
                                settings={popupSettings}
                                showStatus={fieldVisibility.status}
                                className="min-w-[200px]"
                                currency={project.currency || null}
                                selectedCurrency={selectedCurrency}
                              />
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>

                {/* Right Interactions (Hover) */}
                <div className="relative hidden shrink-0 items-center justify-end md:flex">
                  {/* "Plan X floor" - Visible on Hover */}
                  <div
                    className={cn(
                      "absolute right-0 flex items-center justify-end transition-opacity duration-200",
                      hoveredFloor === floor ? "z-10 opacity-100" : "opacity-0",
                    )}
                  >
                    <Button
                      type="button"
                      variant="link"
                      className="h-8 whitespace-nowrap px-0 text-sm font-normal text-blue-600"
                      onClick={() => onOpenFloorPlan(floor)}
                    >
                      {t("project.plan_floor", { floor })}
                    </Button>
                  </div>

                  {/* Floor Number - Visible when NOT hovering */}
                  <div
                    className={cn(
                      "text-sm font-medium text-gray-400 transition-opacity duration-200",
                      hoveredFloor === floor ? "opacity-0" : "opacity-100",
                    )}
                  >
                    {floor}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};
