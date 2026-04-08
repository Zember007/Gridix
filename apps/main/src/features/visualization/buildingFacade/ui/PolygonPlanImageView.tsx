import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useLayoutEffect,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
  type ImgHTMLAttributes,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@gridix/ui";
import { useIsMobile } from "@gridix/ui";
import { useLanguage } from "@gridix/utils/react";
import ApartmentPopup from "@/components/visualization/ApartmentPopup";
import { useLockBodyScroll } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Spinner } from "@/shared/ui/Spinner";
import type {
  PolygonPlanImageViewProps,
  BuildingFloor,
} from "@/features/visualization/buildingFacade/model/types";
import {
  computeMobileDockPosition as computeMobileDockPositionUtil,
  computePopupPositionForPolygon as computePopupPositionForPolygonUtil,
  getPolygonBoundsPct,
} from "@/features/visualization/buildingFacade/lib/popupPosition";
// import { HandTap } from "@phosphor-icons/react";
import InteractionHint from "@/components/visualization/InteractionHint";

const MobileFloorInfoBar = ({
  selectedFloor,
  project,
  isObjectLayout,
  apartments,
  facadeSettings,
  visibleFields,
  selectedCurrency,
  themeColor,
  onFloorClick,
  getFloorStats,
}: {
  selectedFloor: number;
  project: PolygonPlanImageViewProps["project"];
  isObjectLayout: boolean;
  apartments: PolygonPlanImageViewProps["apartments"];
  facadeSettings: PolygonPlanImageViewProps["facadeSettings"];
  visibleFields: PolygonPlanImageViewProps["visibleFields"];
  selectedCurrency?: string;
  themeColor: string;
  onFloorClick: (floorNumber: number) => void;
  getFloorStats: (floorNumber: number) => {
    total: number;
    available: number;
    sold: number;
    reserved: number;
  };
}) => {
  const { t } = useLanguage();

  if (isObjectLayout) {
    const apartment = apartments.find(
      (apt) => apt.apartment_number === selectedFloor.toString(),
    );
    if (!apartment) return null;

    const showArea =
      visibleFields.find((f) => f.field_name === "area")?.is_visible ?? false;
    const showPrice =
      visibleFields.find((f) => f.field_name === "price")?.is_visible ?? false;
    const showStatus =
      visibleFields.find((f) => f.field_name === "status")?.is_visible ?? false;

    return (
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 border-t border-gray-100 bg-white px-4 py-2.5 text-left active:bg-gray-50"
        onClick={() => onFloorClick(selectedFloor)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {facadeSettings?.display?.showNumbers && (
            <span className="shrink-0 text-xs font-semibold uppercase text-gray-500">
              №{apartment.apartment_number}
            </span>
          )}
          {showStatus && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase text-white"
              style={{
                backgroundColor:
                  apartment.status === "available"
                    ? "#22c55e"
                    : apartment.status === "reserved"
                      ? "#f59e0b"
                      : "#ef4444",
              }}
            >
              {t(`project.${apartment.status}`)}
            </span>
          )}
          {showArea && apartment.area && (
            <span className="truncate text-xs text-gray-600">
              {apartment.area} m²
            </span>
          )}
          {showPrice && apartment.price && (
            <span className="truncate text-xs font-medium text-gray-900">
              {Number(apartment.price).toLocaleString()}{" "}
              {selectedCurrency || project.currency || ""}
            </span>
          )}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
      </button>
    );
  }

  const stats = getFloorStats(selectedFloor);

  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-3 border-t border-gray-100 bg-white px-4 py-2.5 text-left active:bg-gray-50"
      onClick={() => onFloorClick(selectedFloor)}
    >
      <div className="flex items-center gap-3">
        {facadeSettings?.display?.showNumbers && (
          <span className="text-xs font-semibold uppercase text-gray-500">
            {t("project.floor")} {selectedFloor}
          </span>
        )}
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: themeColor || "#514A47" }}
        >
          {stats.available} {t("project.available")}
        </span>
        {stats.total > 0 && (
          <span className="text-[11px] text-gray-400">
            {stats.total} {t("project.total")}
          </span>
        )}
      </div>
      <span
        className="flex items-center gap-1 text-xs font-medium"
        style={{ color: themeColor }}
      >
        {t("customFields.show")}
        <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </button>
  );
};

const PolygonPlanImageView = ({
  project,
  entityKind,
  imageUrl,
  apartments,
  onFloorSelect,
  onApartmentSelect,
  filtersRef: _filtersRef,
  externalImageLoaded: _externalImageLoaded,
  externalImageNaturalSize: _externalImageNaturalSize,
  showOnlyAvailable: _showOnlyAvailable = false,
  visibleFields,
  buildingFloors,
  facadeSettings,
  loading,
  selectedCurrency,
  themeColor,
  facades,
  activeFacadeIndex,
  onFacadeChange,
  planKind = "facade",
  masterplanPolygons,
  onMasterplanAreaClick,
  masterplanRenderTooltip,
  masterplanPolygonLabels,
}: PolygonPlanImageViewProps) => {
  const isObjectLayout = entityKind === "object";
  const isMobile = useIsMobile();
  const [imageRect, setImageRect] = useState<{
    offset: { x: number; y: number };
    size: { width: number; height: number };
  } | null>(null);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  // This ref MUST point to the "image area" only (not including the bottom carousel),
  // because popup positioning and svg overlay are relative to this container.
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Floor popup state
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupSize, setPopupSize] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 },
  );
  const [popupAnchor, setPopupAnchor] = useState<{
    floorNumber: number;
    polygonBounds: { minX: number; maxX: number; minY: number; maxY: number };
  } | null>(null);
  const [mobilePopupDockPosition, setMobilePopupDockPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isTouchZooming] = useState(false);
  const [touchOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [masterplanTooltipAreaId, setMasterplanTooltipAreaId] = useState<
    string | null
  >(null);

  useLockBodyScroll(isTouchZooming);

  const facadeImageUrl = imageUrl ?? project.building_image_url ?? null;

  const floorsSource = useMemo((): BuildingFloor[] => {
    if (planKind === "masterplan" && masterplanPolygons?.length) {
      let n = 0;
      const out: BuildingFloor[] = [];
      for (const p of masterplanPolygons) {
        if (!p.polygon || p.polygon.length < 3) continue;
        n += 1;
        out.push({
          id: p.id,
          floor_number: n,
          polygon: p.polygon,
          color: p.fillColor ?? facadeSettings?.colors?.building ?? "#3b82f6",
        });
      }
      return out;
    }
    return buildingFloors;
  }, [planKind, masterplanPolygons, buildingFloors, facadeSettings]);

  const showFacadeNav =
    !!facades &&
    facades.length > 1 &&
    typeof activeFacadeIndex === "number" &&
    typeof onFacadeChange === "function";

  const handlePrevFacade = useCallback(() => {
    if (!showFacadeNav) return;
    const next = (activeFacadeIndex! - 1 + facades!.length) % facades!.length;
    onFacadeChange?.(next);
  }, [activeFacadeIndex, facades, onFacadeChange, showFacadeNav]);

  const handleNextFacade = useCallback(() => {
    if (!showFacadeNav) return;
    const next = (activeFacadeIndex! + 1) % facades!.length;
    onFacadeChange?.(next);
  }, [activeFacadeIndex, facades, onFacadeChange, showFacadeNav]);

  const visibleFloors = useMemo(() => {
    if (planKind === "masterplan") {
      return floorsSource;
    }
    if (isObjectLayout) {
      return floorsSource;
    }

    // When filter is enabled, show only floors with available apartments,
    // but never hide ALL polygons (old projects often have 0 available).
    if (_showOnlyAvailable) {
      const floorsWithAvailable = new Set(
        apartments
          .filter((apt) => apt.status === "available")
          .map((apt) => apt.floor_number),
      );

      const filtered = floorsSource.filter((floor) =>
        floorsWithAvailable.has(floor.floor_number),
      );
      return filtered.length > 0 ? filtered : floorsSource;
    }

    return floorsSource;
  }, [planKind, floorsSource, apartments, isObjectLayout, _showOnlyAvailable]);

  const floorsWithPolygon = useMemo(
    () =>
      visibleFloors.filter(
        (floor) => floor.polygon && floor.polygon.length >= 3,
      ),
    [visibleFloors],
  );

  const svgViewBox = useMemo(() => {
    if (
      !imageRect ||
      !naturalSize ||
      naturalSize.width === 0 ||
      naturalSize.height === 0 ||
      imageRect.size.width === 0 ||
      imageRect.size.height === 0
    ) {
      return "0 0 100 100";
    }

    const naturalAspect = naturalSize.width / naturalSize.height;
    const elementAspect = imageRect.size.width / imageRect.size.height;

    if (naturalAspect > elementAspect) {
      const visibleW = (elementAspect / naturalAspect) * 100;
      const cropLeft = (100 - visibleW) / 2;
      return `${cropLeft} 0 ${visibleW} 100`;
    } else {
      const visibleH = (naturalAspect / elementAspect) * 100;
      const cropTop = (100 - visibleH) / 2;
      return `0 ${cropTop} 100 ${visibleH}`;
    }
  }, [imageRect, naturalSize]);

  const computeMobileDockPosition = useCallback(
    (size: { width: number; height: number }) =>
      computeMobileDockPositionUtil({
        containerEl: containerRef.current,
        imageRect,
        visibleFloors: floorsWithPolygon,
        size,
      }),
    [floorsWithPolygon, imageRect],
  );

  const computePopupPositionForPolygon = useCallback(
    (
      polygonBoundsPct: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
      },
      size: { width: number; height: number },
    ) =>
      computePopupPositionForPolygonUtil({
        containerEl: containerRef.current,
        imageRect,
        polygonBoundsPct,
        size,
      }),
    [imageRect],
  );

  const handleFloorHover = useCallback(
    (floorNumber: number) => {
      if (!containerRef.current) return;

      // Находим полигон для данного этажа
      const floor = floorsWithPolygon.find(
        (f) => f.floor_number === floorNumber,
      );
      if (!floor || !floor.polygon || floor.polygon.length === 0) return;

      // Set hovered floor for visual effects
      setHoveredFloor(floorNumber);
      setSelectedFloor(floorNumber);

      // Show popup if tooltip is enabled in settings
      if (facadeSettings?.display?.showTooltip) {
        if (planKind === "masterplan") {
          setMasterplanTooltipAreaId(floor.id);
        }
        const polygonBounds = getPolygonBoundsPct(floor.polygon);
        setPopupAnchor({ floorNumber, polygonBounds });
        setShowPopup(true);

        // Mobile: фиксируем попап в одной "лучшей" позиции (не зависит от выбранного полигона)
        if (isMobile) {
          const sizeForInitial =
            popupSize.width > 0 && popupSize.height > 0
              ? popupSize
              : { width: 160, height: 120 };
          const dock =
            mobilePopupDockPosition ??
            computeMobileDockPosition(sizeForInitial);
          if (dock) {
            setMobilePopupDockPosition(dock);
            setPopupPosition(dock);
          }
          return;
        }

        // Desktop: быстрое предварительное позиционирование (потом useLayoutEffect уточнит по реальному размеру)
        const sizeForInitial =
          popupSize.width > 0 && popupSize.height > 0
            ? popupSize
            : { width: 160, height: 120 };
        const nextPos = computePopupPositionForPolygon(
          polygonBounds,
          sizeForInitial,
        );
        if (nextPos) setPopupPosition(nextPos);
      } else {
        setShowPopup(false);
        setPopupAnchor(null);
        setPopupPosition(null);
        if (planKind === "masterplan") {
          setMasterplanTooltipAreaId(null);
        }
      }
    },
    [
      planKind,
      computeMobileDockPosition,
      computePopupPositionForPolygon,
      facadeSettings?.display?.showTooltip,
      floorsWithPolygon,
      isMobile,
      mobilePopupDockPosition,
      popupSize,
    ],
  );

  const measureImageRect = useCallback(() => {
    const containerEl = containerRef.current;
    const imageEl = imgRef.current;
    if (!containerEl || !imageEl) return;

    const containerRect = containerEl.getBoundingClientRect();
    const imgRect = imageEl.getBoundingClientRect();

    const nextRect = {
      offset: {
        x: imgRect.left - containerRect.left,
        y: imgRect.top - containerRect.top,
      },
      size: {
        width: imgRect.width,
        height: imgRect.height,
      },
    };

    if (nextRect.size.width <= 0 || nextRect.size.height <= 0) return;

    setImageRect((prev) => {
      if (!prev) return nextRect;
      const same =
        Math.abs(prev.offset.x - nextRect.offset.x) <= 0.5 &&
        Math.abs(prev.offset.y - nextRect.offset.y) <= 0.5 &&
        Math.abs(prev.size.width - nextRect.size.width) <= 0.5 &&
        Math.abs(prev.size.height - nextRect.size.height) <= 0.5;
      return same ? prev : nextRect;
    });

    if (imageEl.naturalWidth > 0 && imageEl.naturalHeight > 0) {
      setNaturalSize((prev) => {
        if (
          prev &&
          prev.width === imageEl.naturalWidth &&
          prev.height === imageEl.naturalHeight
        )
          return prev;
        return { width: imageEl.naturalWidth, height: imageEl.naturalHeight };
      });
    }
  }, []);

  useLayoutEffect(() => {
    // After any layout-affecting change, measure the real image-area container.
    measureImageRect();
  }, [measureImageRect, isMobile, facadeImageUrl]);

  useEffect(() => {
    const containerEl = containerRef.current;
    const imageEl = imgRef.current;
    const wrapperEl = outerRef.current;
    if (!containerEl) return;

    let frame: number | null = null;
    let settleTimer: number | null = null;

    const queueMeasure = () => {
      if (frame) cancelAnimationFrame(frame);
      if (settleTimer) clearTimeout(settleTimer);

      frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          measureImageRect();
        });
      });

      // Re-measure after CSS transitions settle (side panel is 300ms).
      settleTimer = window.setTimeout(measureImageRect, 350);
    };

    const observer = new ResizeObserver(queueMeasure);
    observer.observe(containerEl);
    if (imageEl) observer.observe(imageEl);
    if (wrapperEl) observer.observe(wrapperEl);

    window.addEventListener("resize", queueMeasure);
    window.addEventListener("orientationchange", queueMeasure);
    window.visualViewport?.addEventListener("resize", queueMeasure);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (settleTimer) clearTimeout(settleTimer);
      observer.disconnect();
      window.removeEventListener("resize", queueMeasure);
      window.removeEventListener("orientationchange", queueMeasure);
      window.visualViewport?.removeEventListener("resize", queueMeasure);
    };
  }, [measureImageRect]);

  useEffect(() => {
    if (
      !imageRect ||
      imageRect.size.width === 0 ||
      imageRect.size.height === 0
    ) {
      return;
    }

    if (floorsWithPolygon.length === 0) {
      setHoveredFloor(null);
      setShowPopup(false);
      setPopupAnchor(null);
      setPopupPosition(null);
      setSelectedFloor(null);
      return;
    }

    const selectedExists = floorsWithPolygon.some(
      (floor) => floor.floor_number === selectedFloor,
    );

    if (!selectedExists) {
      const firstFloor = floorsWithPolygon[0]!.floor_number;
      if (isMobile) {
        handleFloorHover(firstFloor);
      } else {
        setSelectedFloor(firstFloor);
        setHoveredFloor(null);
        setShowPopup(false);
        setPopupAnchor(null);
        setPopupPosition(null);
      }
    }
  }, [floorsWithPolygon, handleFloorHover, imageRect, isMobile, selectedFloor]);

  // When facade image changes, reset cached dimensions to force a clean recompute.
  useEffect(() => {
    setImageRect(null);
    setNaturalSize(null);
    setShowPopup(false);
    setPopupAnchor(null);
    setPopupPosition(null);
    setSelectedFloor(null);
    setHoveredFloor(null);
    setMasterplanTooltipAreaId(null);
  }, [facadeImageUrl]);

  // Handle escape key to close popup
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showPopup) {
        setShowPopup(false);
        setMasterplanTooltipAreaId(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showPopup]);

  const getFloorApartments = (floorNumber: number) => {
    return apartments.filter((apt) => apt.floor_number === floorNumber);
  };

  const getFloorStats = (floorNumber: number) => {
    const floorApartments = getFloorApartments(floorNumber);
    const available = floorApartments.filter(
      (apt) => apt.status === "available",
    ).length;
    const sold = floorApartments.filter((apt) => apt.status === "sold").length;
    const reserved = floorApartments.filter(
      (apt) => apt.status === "reserved",
    ).length;

    return {
      total: floorApartments.length,
      available,
      sold,
      reserved,
    };
  };

  const getFloorFillColor = (floor: BuildingFloor) => {
    return facadeSettings?.colors?.building || floor.color || "#3b82f6";
  };

  // Floor Popup Component
  const FloorPopup = ({
    Number,
    position,
  }: {
    Number: number;
    position: { x: number; y: number };
  }) => {
    const { t } = useLanguage();

    // For object layout, Number is apartment number, not floor number
    if (isObjectLayout) {
      const apartment = apartments.find(
        (apt) => apt.apartment_number === Number.toString(),
      );

      if (!apartment) {
        return null;
      }

      return (
        <ApartmentPopup
          ref={popupRef}
          apartment={apartment}
          position={{ x: position.x, y: position.y }}
          settings={{
            showNumbers: facadeSettings?.display?.showNumbers ?? true,
            showTooltip: facadeSettings?.display?.showTooltip ?? false,
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
          currency={project.currency || null}
          selectedCurrency={selectedCurrency}
        />
      );
    }

    // For building layout, Number is floor number
    const stats = getFloorStats(Number);

    return (
      <div
        ref={popupRef}
        className="absolute z-30 flex h-[110px] min-w-[80px] flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white text-[10px] uppercase shadow-xl md:h-[100px] md:min-w-[100px] md:text-[12px]"
        style={{
          left: position.x,
          top: position.y,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {facadeSettings?.display?.showNumbers && (
          <div className="flex items-center justify-center gap-[7px] p-1 text-center md:p-0">
            {t("project.floor")} <span className="font-bold">{Number}</span>
          </div>
        )}

        <div className="mx-1 flex h-full flex-col items-center justify-center rounded-[20px] bg-[#514A47] px-2 text-white md:mx-0">
          <div className="text-[20px] leading-[1.1] md:text-[32px]">
            {stats.available}
          </div>
          {t("project.available")}
        </div>
        <Button
          onClick={() => {
            handleFloorClick(Number);
          }}
          variant="outline"
          className="m-1 rounded-[20px] p-1 text-[10px] md:hidden"
        >
          {t("customFields.show")}
        </Button>
      </div>
    );
  };

  useLayoutEffect(() => {
    if (!showPopup || !containerRef.current || !popupRef.current) return;
    if (!imageRect || imageRect.size.width === 0 || imageRect.size.height === 0)
      return;

    const rect = popupRef.current.getBoundingClientRect();
    const measured = { width: rect.width, height: rect.height };

    const sizeChanged =
      Math.abs(measured.width - popupSize.width) > 0.5 ||
      Math.abs(measured.height - popupSize.height) > 0.5;
    if (sizeChanged) {
      setPopupSize(measured);
    }

    // Mobile: позиция всегда одна — выбираем best dock по всем полигонам и используем его
    if (isMobile) {
      const size =
        measured.width > 0 && measured.height > 0
          ? measured
          : popupSize.width > 0
            ? popupSize
            : { width: 160, height: 120 };
      const dock = computeMobileDockPosition(size);
      if (!dock) return;

      const dockChanged =
        !mobilePopupDockPosition ||
        Math.abs(dock.x - mobilePopupDockPosition.x) > 0.5 ||
        Math.abs(dock.y - mobilePopupDockPosition.y) > 0.5;
      if (dockChanged) setMobilePopupDockPosition(dock);

      const posChanged =
        !popupPosition ||
        Math.abs(dock.x - popupPosition.x) > 0.5 ||
        Math.abs(dock.y - popupPosition.y) > 0.5;
      if (posChanged) setPopupPosition(dock);
      return;
    }

    if (!popupAnchor) return;

    const nextPos =
      computePopupPositionForPolygon(
        popupAnchor.polygonBounds,
        measured.width > 0 && measured.height > 0
          ? measured
          : popupSize.width > 0
            ? popupSize
            : { width: 160, height: 120 },
      ) ?? null;

    if (!nextPos) return;
    const changed =
      !popupPosition ||
      Math.abs(nextPos.x - popupPosition.x) > 0.5 ||
      Math.abs(nextPos.y - popupPosition.y) > 0.5;
    if (changed) {
      setPopupPosition(nextPos);
    }
  }, [
    computeMobileDockPosition,
    computePopupPositionForPolygon,
    imageRect,
    isMobile,
    mobilePopupDockPosition,
    popupAnchor,
    popupPosition,
    popupSize,
    showPopup,
  ]);

  const handleFloorClick = (floorNumber: number) => {
    // For object layout, floorNumber is actually apartment number
    if (isObjectLayout) {
      const apartment = apartments.find(
        (apt) => apt.apartment_number === floorNumber.toString(),
      );
      if (apartment) {
        onApartmentSelect(apartment);
      }
      return;
    }

    if (onFloorSelect) {
      onFloorSelect(floorNumber);
    } else {
      const floorApartments = getFloorApartments(floorNumber);
      if (floorApartments.length > 0) {
        onApartmentSelect(floorApartments[0]!);
      }
    }
  };

  const handleFloorLeave = () => {
    setHoveredFloor(null);
    setMasterplanTooltipAreaId(null);
    if (!isMobile) {
      setShowPopup(false);
      setPopupAnchor(null);
      setPopupPosition(null);
    }
  };

  const handlePolygonSvgClick = (floor: BuildingFloor) => {
    setShowPopup(false);
    if (planKind === "masterplan") {
      onMasterplanAreaClick?.(floor.id);
      return;
    }
    handleFloorClick(floor.floor_number);
  };

  const handleSVGFloorClick = (floorNumber: number) => {
    // Закрываем попап если он открыт
    setShowPopup(false);
    // Выполняем обычное действие клика
    handleFloorClick(floorNumber);
  };

  const handleSVGFloorHover = (floorNumber: number) => {
    setHoveredFloor(floorNumber);
    handleFloorHover(floorNumber);
  };

  const activateFloor = useCallback(
    (floorNumber: number) => {
      // Keep visual state single-sourced: one active floor at a time.
      setHoveredFloor(floorNumber);
      handleFloorHover(floorNumber);
    },
    [handleFloorHover],
  );

  // Автоматическое позиционирование мобильного переключателя этажей так,
  // чтобы он по возможности не перекрывал полигоны.
  // Приоритет: сверху слева → сверху справа → другие доступные места.
  useEffect(() => {
    if (!isMobile || floorsWithPolygon.length === 0 || !containerRef.current) {
      return;
    }

    if (
      !imageRect ||
      imageRect.size.width === 0 ||
      imageRect.size.height === 0
    ) {
      return;
    }

    const containerEl = containerRef.current;
    const containerWidth = containerEl.clientWidth;
    const containerHeight = containerEl.clientHeight;

    // Границы всех видимых полигонов в процентах SVG (0–100)
    let minX = 100;
    let maxX = 0;
    let minY = 100;
    let maxY = 0;

    floorsWithPolygon.forEach((floor) => {
      floor.polygon.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
    });

    // Переводим проценты в пиксели относительно контейнера,
    // учитывая, что изображение центрируется внутри него
    const svgWidth = imageRect.size.width;
    const svgHeight = imageRect.size.height;
    const svgLeft = imageRect.offset.x;
    const svgTop = imageRect.offset.y;

    const bboxLeft = svgLeft + (minX / 100) * svgWidth;
    const bboxRight = svgLeft + (maxX / 100) * svgWidth;
    const bboxTop = svgTop + (minY / 100) * svgHeight;
    const bboxBottom = svgTop + (maxY / 100) * svgHeight;

    const margin = 12; // отступ от краёв контейнера
    const gapFromPolygons = 8; // минимальный зазор от полигонов
    // Реальный размер переключателя (min-w-[90px] и примерно 40px по высоте)
    const estimatedWidth = Math.min(90, containerWidth - margin * 2);
    const estimatedHeight = Math.min(40, containerHeight - margin * 2);

    type Candidate = { cx: number; cy: number };
    const candidates: Candidate[] = [];

    const halfW = estimatedWidth / 2;
    const halfH = estimatedHeight / 2;

    // Вспомогательная функция добавления кандидата, если он помещается в контейнер
    const addCandidate = (cx: number, cy: number) => {
      const left = cx - halfW;
      const right = cx + halfW;
      const top = cy - halfH;
      const bottom = cy + halfH;
      if (
        left >= margin &&
        right <= containerWidth - margin &&
        top >= margin &&
        bottom <= containerHeight - margin
      ) {
        candidates.push({ cx, cy });
      }
    };

    // 1. Приоритет: сверху слева
    addCandidate(margin + halfW, margin + halfH);
    // 2. Если справа — то снизу: правый нижний угол
    addCandidate(
      containerWidth - margin - halfW,
      containerHeight - margin - halfH,
    );

    // 3. Слева по центру относительно полигонов
    addCandidate(margin + halfW, (bboxTop + bboxBottom) / 2);
    // 4. Снизу по центру
    addCandidate(containerWidth / 2, containerHeight - margin - halfH);

    // Проверка пересечения кандидата с bounding box полигонов
    const intersectsPolygons = (c: Candidate) => {
      const left = c.cx - halfW;
      const right = c.cx + halfW;
      const top = c.cy - halfH;
      const bottom = c.cy + halfH;

      const noOverlap =
        right < bboxLeft - gapFromPolygons ||
        left > bboxRight + gapFromPolygons ||
        bottom < bboxTop - gapFromPolygons ||
        top > bboxBottom + gapFromPolygons;

      return !noOverlap;
    };
    void intersectsPolygons;
  }, [floorsWithPolygon, imageRect, isMobile]);

  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const isCarouselInteractingRef = useRef(false);
  const swipeGuardRef = useRef({ x: 0, y: 0, moved: false });

  const blockArrowDragStart = useCallback(
    (
      event:
        | PointerEvent<HTMLButtonElement>
        | TouchEvent<HTMLButtonElement>
        | MouseEvent<HTMLButtonElement>,
    ) => {
      // Keep arrow click working, but don't let Embla start a drag gesture
      // from the arrow button itself.
      event.stopPropagation();
    },
    [],
  );

  const beginSwipeGuard = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      swipeGuardRef.current = {
        x: event.clientX,
        y: event.clientY,
        moved: false,
      };
    },
    [],
  );

  const trackSwipeGuard = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const dx = Math.abs(event.clientX - swipeGuardRef.current.x);
      const dy = Math.abs(event.clientY - swipeGuardRef.current.y);
      if (dx > 8 || dy > 8) {
        swipeGuardRef.current.moved = true;
      }
    },
    [],
  );

  useEffect(() => {
    if (!carouselApi) return;

    const index = floorsWithPolygon.findIndex(
      (f) => f.floor_number === selectedFloor,
    );
    if (index < 0) return;

    const currentIndex = carouselApi.selectedScrollSnap();
    const currentFloor = floorsWithPolygon[currentIndex]?.floor_number;

    // Skip redundant scrolls when carousel itself already selected this floor.
    if (currentFloor === selectedFloor) return;
    // Avoid fighting with Embla while user drags with inertia.
    if (isCarouselInteractingRef.current) return;

    if (index >= 0) {
      carouselApi.scrollTo(index, false);
    }
  }, [carouselApi, floorsWithPolygon, selectedFloor]);

  useEffect(() => {
    if (!carouselApi) return;

    const syncSelectedFloorWithCarousel = () => {
      const currentIndex = carouselApi.selectedScrollSnap();
      const currentFloor = floorsWithPolygon[currentIndex];
      if (!currentFloor) return;

      const floorNumber = currentFloor.floor_number;
      setSelectedFloor((prev) => (prev === floorNumber ? prev : floorNumber));
      setHoveredFloor((prev) => (prev === floorNumber ? prev : floorNumber));
    };

    // Initialize and then keep selected floor in sync
    // when user navigates with carousel arrows.
    syncSelectedFloorWithCarousel();
    carouselApi.on("select", syncSelectedFloorWithCarousel);
    carouselApi.on("reInit", syncSelectedFloorWithCarousel);

    return () => {
      carouselApi.off("select", syncSelectedFloorWithCarousel);
      carouselApi.off("reInit", syncSelectedFloorWithCarousel);
    };
  }, [carouselApi, floorsWithPolygon]);

  useEffect(() => {
    if (!carouselApi) return;

    const handlePointerDown = () => {
      isCarouselInteractingRef.current = true;
    };
    const handleSettle = () => {
      isCarouselInteractingRef.current = false;
    };

    carouselApi.on("pointerDown", handlePointerDown);
    carouselApi.on("settle", handleSettle);
    carouselApi.on("reInit", handleSettle);

    return () => {
      carouselApi.off("pointerDown", handlePointerDown);
      carouselApi.off("settle", handleSettle);
      carouselApi.off("reInit", handleSettle);
    };
  }, [carouselApi]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[200px] w-full items-center justify-center">
        <Spinner size="md" className="border-[#1E1E1E]" />
      </div>
    );
  }

  if (!facadeImageUrl) {
    return null;
  }

  return (
    <>
      <div
        ref={outerRef}
        className={`relative flex min-h-0 w-full flex-col items-stretch justify-center overflow-hidden bg-gray-50 md:rounded-lg ${isMobile ? "touch-manipulation" : ""}`}
        style={{
          minHeight: isMobile ? "auto" : 600,
          height: isMobile ? "auto" : "calc(100dvh - 200px)",
          width: "100%",
          maxWidth: "100%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        {/* Image area (popup positioning & svg overlay are relative to THIS container) */}
        <div
          ref={containerRef}
          className={`relative flex min-h-0 w-full items-center justify-center overflow-hidden ${isMobile ? "" : "flex-1"}`}
          style={{ touchAction: isTouchZooming ? "none" : "manipulation" }}
        >
          {/* Blurred background – visible on sm+ (≥640px); hidden on small phones */}
          {facadeImageUrl && (
            <div className="hidden sm:contents">
              <img
                src={facadeImageUrl}
                alt="Building"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ filter: "blur(8px)", transform: "scale(1.1)" }}
                {...({
                  fetchpriority: "high",
                } as ImgHTMLAttributes<HTMLImageElement> & {
                  fetchpriority?: string;
                })}
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          )}

          <div
            className="relative h-full w-full"
            style={{
              transform: isTouchZooming ? `scale(2)` : "scale(1)",
              transformOrigin: `${touchOrigin.x}px ${touchOrigin.y}px`,
              touchAction: isTouchZooming ? "none" : "manipulation",
            }}
          >
            <div
              className={
                isMobile
                  ? "relative mx-auto w-fit max-w-full"
                  : "relative mx-auto h-full w-fit"
              }
            >
              <img
                ref={imgRef}
                src={facadeImageUrl}
                alt={project.name}
                className={
                  isMobile
                    ? "block h-auto w-auto max-w-full"
                    : "block h-full w-auto"
                }
                draggable={false}
                onLoad={measureImageRect}
              />
              {floorsWithPolygon.length > 0 && (
                <svg
                  className="pointer-events-none absolute inset-0 z-20 h-full w-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {floorsWithPolygon.map((floor) => {
                    const points = floor.polygon
                      .map((point) => `${point.x},${point.y}`)
                      .join(" ");
                    const baseColor = getFloorFillColor(floor);
                    const isHovered = hoveredFloor === floor.floor_number;
                    const isActive = selectedFloor === floor.floor_number;
                    const labelText =
                      planKind === "masterplan" &&
                      facadeSettings?.display?.showNumbers &&
                      masterplanPolygonLabels?.[floor.id]
                        ? masterplanPolygonLabels[floor.id]
                        : null;
                    const labelCenter = labelText
                      ? getPolygonBoundsPct(floor.polygon)
                      : null;
                    const labelCx = labelCenter
                      ? (labelCenter.minX + labelCenter.maxX) / 2
                      : 0;
                    const labelCy = labelCenter
                      ? (labelCenter.minY + labelCenter.maxY) / 2
                      : 0;
                    return (
                      <g key={floor.id}>
                        <polygon
                          points={points}
                          fill={baseColor}
                          fillOpacity={
                            isHovered || isActive
                              ? (facadeSettings?.opacity.hover ?? 0.7)
                              : (facadeSettings?.opacity.normal ?? 0.4)
                          }
                          className="cursor-pointer transition-all duration-200"
                          data-floor={floor.floor_number}
                          onClick={() => handlePolygonSvgClick(floor)}
                          onMouseEnter={() => {
                            handleSVGFloorHover(floor.floor_number);
                          }}
                          onMouseLeave={() => {
                            setHoveredFloor(null);
                            handleFloorLeave();
                          }}
                          style={{
                            pointerEvents: "auto",
                            touchAction: "none",
                            filter:
                              isHovered && facadeSettings?.hoverEffects?.glow
                                ? "drop-shadow(0 0 8px rgba(0,0,0,0.4))"
                                : undefined,
                            transform:
                              isHovered && facadeSettings?.hoverEffects?.scale
                                ? "scale(1.02)"
                                : "scale(1)",
                            transformOrigin: "center",
                          }}
                        />
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          {showFacadeNav && (
            <>
              <button
                type="button"
                aria-label="Previous facade"
                className={`absolute left-3 top-1/2 z-30 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all hover:bg-white ${isMobile ? "p-2.5 active:scale-95" : "p-3 hover:scale-105"}`}
                onClick={handlePrevFacade}
                style={{ touchAction: "manipulation" }}
              >
                <ChevronLeft
                  className={`text-gray-900 ${isMobile ? "h-4 w-4" : "h-5 w-5"}`}
                />
              </button>
              <button
                type="button"
                aria-label="Next facade"
                className={`absolute right-3 top-1/2 z-30 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all hover:bg-white ${isMobile ? "p-2.5 active:scale-95" : "p-3 hover:scale-105"}`}
                onClick={handleNextFacade}
                style={{ touchAction: "manipulation" }}
              >
                <ChevronRight
                  className={`text-gray-900 ${isMobile ? "h-4 w-4" : "h-5 w-5"}`}
                />
              </button>
            </>
          )}

          {showFacadeNav && (
            <div className="absolute bottom-2 left-1/2 z-30 -translate-x-1/2">
              <div className="flex items-end gap-3 rounded-full bg-white/80 px-3 py-2 shadow-lg backdrop-blur">
                {facades!.map((f, idx) => {
                  const isActive = idx === activeFacadeIndex;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onFacadeChange?.(idx)}
                      className="flex max-w-[90px] flex-col items-center gap-1"
                      aria-label={f.name}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isActive ? "bg-gray-900" : "bg-gray-400"
                        }`}
                      />
                      <span
                        className={`truncate text-[10px] leading-none ${isActive ? "font-semibold text-gray-900" : "text-gray-700"}`}
                      >
                        {f.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {showPopup &&
            popupPosition &&
            !isMobile &&
            planKind === "masterplan" &&
            masterplanTooltipAreaId &&
            masterplanRenderTooltip && (
              <div
                ref={popupRef}
                className="absolute z-30"
                style={{ left: popupPosition.x, top: popupPosition.y }}
                onClick={(e) => e.stopPropagation()}
              >
                {masterplanRenderTooltip(masterplanTooltipAreaId)}
              </div>
            )}
          {showPopup &&
            selectedFloor !== null &&
            popupPosition &&
            !isMobile &&
            planKind !== "masterplan" && (
              <FloorPopup Number={selectedFloor} position={popupPosition} />
            )}
          <InteractionHint storageKey="building" />
        </div>

        {planKind !== "masterplan" && isMobile && selectedFloor !== null && (
          <MobileFloorInfoBar
            selectedFloor={selectedFloor}
            project={project}
            isObjectLayout={isObjectLayout}
            apartments={apartments}
            facadeSettings={facadeSettings}
            visibleFields={visibleFields}
            selectedCurrency={selectedCurrency}
            themeColor={themeColor}
            onFloorClick={handleFloorClick}
            getFloorStats={getFloorStats}
          />
        )}

        {planKind !== "masterplan" &&
          isMobile &&
          floorsWithPolygon.length > 0 && (
            <div className="flex h-20 w-full flex-row items-center justify-center p-4">
              <div className="flex w-full flex-row items-center gap-4">
                <div className="flex min-h-0 flex-1 items-center justify-center py-2">
                  <div className="relative w-full max-w-[60vw]">
                    <Carousel
                      className="h-full w-full touch-pan-y"
                      orientation="horizontal"
                      opts={{
                        align: "center",
                        loop: floorsWithPolygon.length > 3,
                        dragFree: false,
                        skipSnaps: false,
                        containScroll: "trimSnaps",
                      }}
                      setApi={setCarouselApi}
                    >
                      <div className="flex w-full flex-col justify-center">
                        <CarouselContent className="max-h-[600px]">
                          {floorsWithPolygon.map((floor) => (
                            <CarouselItem
                              key={floor.floor_number}
                              className="flex basis-1/5 items-center justify-center"
                            >
                              <button
                                className={`flex h-10 w-full items-center justify-center rounded-xl text-lg font-semibold transition-colors ${
                                  selectedFloor === floor.floor_number
                                    ? "text-white"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                                style={
                                  selectedFloor === floor.floor_number
                                    ? { backgroundColor: themeColor }
                                    : {}
                                }
                                onPointerDown={beginSwipeGuard}
                                onPointerMove={trackSwipeGuard}
                                onClick={() => {
                                  if (swipeGuardRef.current.moved) {
                                    swipeGuardRef.current.moved = false;
                                    return;
                                  }
                                  activateFloor(floor.floor_number);
                                }}
                              >
                                {floor.floor_number}
                              </button>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                      </div>

                      {floorsWithPolygon.length > 3 && (
                        <>
                          <CarouselPrevious
                            className="-left-12 h-8 w-8 border-2 border-white bg-white/90 opacity-80 backdrop-blur-sm transition-all hover:bg-white hover:opacity-100"
                            style={{ touchAction: "manipulation" }}
                            onPointerDown={blockArrowDragStart}
                            onTouchStart={blockArrowDragStart}
                            onMouseDown={blockArrowDragStart}
                          />
                          <CarouselNext
                            className="-right-12 h-8 w-8 border-2 border-white bg-white/90 opacity-80 backdrop-blur-sm transition-all hover:bg-white hover:opacity-100"
                            style={{ touchAction: "manipulation" }}
                            onPointerDown={blockArrowDragStart}
                            onTouchStart={blockArrowDragStart}
                            onMouseDown={blockArrowDragStart}
                          />
                        </>
                      )}
                    </Carousel>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </>
  );
};

export default PolygonPlanImageView;
