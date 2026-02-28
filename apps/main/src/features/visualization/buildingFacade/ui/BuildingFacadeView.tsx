import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
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
  BuildingFacadeViewProps,
  BuildingFloor,
} from "@/features/visualization/buildingFacade/model/types";
import {
  computeMobileDockPosition as computeMobileDockPositionUtil,
  computePopupPositionForPolygon as computePopupPositionForPolygonUtil,
  getPolygonBoundsPct,
} from "@/features/visualization/buildingFacade/lib/popupPosition";
// import { HandTap } from "@phosphor-icons/react";
import InteractionHint from "@/components/visualization/InteractionHint";

const COLLAPSED_HEIGHT = 280;

const BuildingFacadeView = ({
  project,
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
}: BuildingFacadeViewProps) => {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(project.facade_open);
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

  useLockBodyScroll(isTouchZooming);

  const facadeImageUrl = imageUrl ?? project.building_image_url ?? null;

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
    if (project.project_type === "object") {
      return buildingFloors;
    }

    // When filter is enabled, show only floors with available apartments,
    // but never hide ALL polygons (old projects often have 0 available).
    if (_showOnlyAvailable) {
      const floorsWithAvailable = new Set(
        apartments
          .filter((apt) => apt.status === "available")
          .map((apt) => apt.floor_number),
      );

      const filtered = buildingFloors.filter((floor) =>
        floorsWithAvailable.has(floor.floor_number),
      );
      return filtered.length > 0 ? filtered : buildingFloors;
    }

    return buildingFloors;
  }, [buildingFloors, apartments, project.project_type, _showOnlyAvailable]);

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
        isExpanded: isExpanded ?? false,
        imageRect,
        visibleFloors,
        size,
      }),
    [imageRect, isExpanded, visibleFloors],
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
        isExpanded: isExpanded ?? false,
        imageRect,
        polygonBoundsPct,
        size,
      }),
    [imageRect, isExpanded],
  );

  const handleFloorHover = useCallback(
    (floorNumber: number) => {
      if (!isExpanded) return;
      if (!containerRef.current) return;

      // Находим полигон для данного этажа
      const floor = buildingFloors.find((f) => f.floor_number === floorNumber);
      if (!floor || !floor.polygon || floor.polygon.length === 0) return;

      // Set hovered floor for visual effects
      setHoveredFloor(floorNumber);

      // Show popup if tooltip is enabled in settings
      if (facadeSettings?.display?.showTooltip) {
        const polygonBounds = getPolygonBoundsPct(floor.polygon);
        setPopupAnchor({ floorNumber, polygonBounds });
        setSelectedFloor(floorNumber);
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
      }
    },
    [
      buildingFloors,
      computeMobileDockPosition,
      computePopupPositionForPolygon,
      facadeSettings?.display?.showTooltip,
      isExpanded,
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
  }, [measureImageRect, isExpanded, isMobile, facadeImageUrl]);

  useEffect(() => {
    const containerEl = containerRef.current;
    const imageEl = imgRef.current;
    const wrapperEl = outerRef.current;
    if (!containerEl) return;

    let frame: number | null = null;
    const queueMeasure = () => {
      if (frame) cancelAnimationFrame(frame);
      // Two RAF ticks help when layout changes are animated (e.g. side panel open/close).
      frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          measureImageRect();
        });
      });
    };

    const observer = new ResizeObserver(queueMeasure);
    observer.observe(containerEl);
    if (imageEl) observer.observe(imageEl);
    if (wrapperEl) observer.observe(wrapperEl);

    // Fallback for viewport-driven reflow on iOS and orientation changes.
    window.addEventListener("resize", queueMeasure);
    window.addEventListener("orientationchange", queueMeasure);
    window.visualViewport?.addEventListener("resize", queueMeasure);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", queueMeasure);
      window.removeEventListener("orientationchange", queueMeasure);
      window.visualViewport?.removeEventListener("resize", queueMeasure);
    };
  }, [measureImageRect]);

  useEffect(() => {
    if (visibleFloors.length > 0) {
      if (
        isExpanded &&
        isMobile &&
        imageRect &&
        imageRect.size.width > 0 &&
        imageRect.size.height > 0
      ) {
        handleFloorHover(visibleFloors[0]?.floor_number ?? 0);
      }
    }
  }, [handleFloorHover, imageRect, isExpanded, isMobile, visibleFloors]);

  // When facade image changes, reset cached dimensions to force a clean recompute.
  useEffect(() => {
    setImageRect(null);
    setNaturalSize(null);
    setShowPopup(false);
    setPopupAnchor(null);
    setPopupPosition(null);
    setSelectedFloor(null);
    setHoveredFloor(null);
  }, [facadeImageUrl]);

  // Handle escape key to close popup
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showPopup) {
        setShowPopup(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showPopup]);

  // Close popup when switching between expanded/collapsed modes
  useEffect(() => {
    if (showPopup && !isExpanded) {
      setShowPopup(false);
      setPopupAnchor(null);
      setPopupPosition(null);
      setSelectedFloor(null);
    }
  }, [isExpanded, showPopup]);

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

    // For project_type = object, Number is apartment number, not floor number
    if (project.project_type === "object") {
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

    // For project_type = building, Number is floor number
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
    if (
      !isExpanded ||
      !imageRect ||
      imageRect.size.width === 0 ||
      imageRect.size.height === 0
    )
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
    isExpanded,
    isMobile,
    mobilePopupDockPosition,
    popupAnchor,
    popupPosition,
    popupSize,
    showPopup,
  ]);

  const handleFloorClick = (floorNumber: number) => {
    // For project_type = object, floorNumber is actually apartment number
    if (project.project_type === "object") {
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
    if (!isExpanded) return;
    setHoveredFloor(null);
    setShowPopup(false);
    setPopupAnchor(null);
    setPopupPosition(null);
    setSelectedFloor(null);
  };

  const handleSVGFloorClick = (floorNumber: number) => {
    // Закрываем попап если он открыт
    setShowPopup(false);
    // Выполняем обычное действие клика
    handleFloorClick(floorNumber);
  };

  const handleSVGFloorHover = (floorNumber: number) => {
    if (!isExpanded) return;

    setHoveredFloor(floorNumber);
    handleFloorHover(floorNumber);
  };

  // Автоматическое позиционирование мобильного переключателя этажей так,
  // чтобы он по возможности не перекрывал полигоны.
  // Приоритет: сверху слева → сверху справа → другие доступные места.
  useEffect(() => {
    if (
      !isMobile ||
      !isExpanded ||
      visibleFloors.length === 0 ||
      !containerRef.current
    ) {
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

    // Берём только этажи с валидными полигонами
    const floorsWithPolygons = visibleFloors.filter(
      (f) => f.polygon && f.polygon.length >= 3,
    );

    // Если полигонов нет, просто ставим переключатель внизу по центру
    if (floorsWithPolygons.length === 0) {
      return;
    }

    // Границы всех видимых полигонов в процентах SVG (0–100)
    let minX = 100;
    let maxX = 0;
    let minY = 100;
    let maxY = 0;

    floorsWithPolygons.forEach((floor) => {
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
  }, [isMobile, isExpanded, visibleFloors, imageRect]);

  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (!carouselApi) return;

    const index = visibleFloors.findIndex(
      (f) => f.floor_number === selectedFloor,
    );
    if (index >= 0) {
      carouselApi.scrollTo(index, true);
    }
  }, [carouselApi, selectedFloor, visibleFloors]);

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
        className={`relative flex min-h-0 w-full flex-col items-stretch justify-center overflow-hidden bg-gray-50 md:rounded-lg ${isExpanded ? "" : "mx-auto"} ${isMobile ? "touch-manipulation" : ""}`}
        style={{
          minHeight: isExpanded ? (isMobile ? "auto" : 600) : "auto",
          height: isExpanded
            ? isMobile
              ? "auto"
              : "calc(100dvh - 200px)"
            : isMobile
              ? "200px"
              : `${COLLAPSED_HEIGHT}px`,
          width: isExpanded ? "100%" : "100%",
          maxWidth: isExpanded ? "100%" : undefined,
          boxShadow: isExpanded ? "0 8px 32px rgba(0,0,0,0.12)" : undefined,
        }}
      >
        {/* Image area (popup positioning & svg overlay are relative to THIS container) */}
        <div
          ref={containerRef}
          className={`relative flex min-h-0 w-full items-center justify-center overflow-hidden ${isMobile && isExpanded ? "" : "flex-1"}`}
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
                } as React.ImgHTMLAttributes<HTMLImageElement> & {
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
            <img
              ref={imgRef}
              src={facadeImageUrl}
              alt={project.name}
              className={
                isMobile
                  ? "mx-auto block h-auto w-auto max-w-full transition-all duration-500"
                  : "mx-auto block h-full w-auto transition-all duration-500"
              }
              draggable={false}
              onLoad={measureImageRect}
            />
            {visibleFloors.length > 0 && imageRect && (
              <svg
                className="absolute z-20"
                style={{
                  left: imageRect.offset.x,
                  top: imageRect.offset.y,
                  width: imageRect.size.width,
                  height: imageRect.size.height,
                }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <rect x="0" y="0" width="100" height="100" fill="none" />
                {visibleFloors.map((floor) => {
                  if (!floor.polygon || floor.polygon.length < 3) return null;
                  const points = floor.polygon
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ");
                  const baseColor = getFloorFillColor(floor);
                  const isHovered = hoveredFloor === floor.floor_number;
                  const isActive = hoveredFloor === floor.floor_number;
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
                        onClick={() => handleSVGFloorClick(floor.floor_number)}
                        onMouseEnter={() => {
                          if (isExpanded) {
                            handleSVGFloorHover(floor.floor_number);
                          }
                        }}
                        onMouseLeave={() => {
                          if (isExpanded) {
                            setHoveredFloor(null);
                            handleFloorLeave();
                          }
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

          {!isExpanded && (
            <button
              className={`absolute ${showFacadeNav ? "bottom-12" : "bottom-4"} left-1/2 z-10 -translate-x-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all hover:bg-white ${
                isMobile ? "p-3 active:scale-95" : "p-4 hover:scale-105"
              }`}
              onClick={() => setIsExpanded(true)}
              style={{ touchAction: "manipulation" }}
            >
              <Maximize2
                className={`text-gray-900 ${isMobile ? "h-4 w-4" : "h-7 w-7"}`}
              />
            </button>
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

          {showPopup && selectedFloor !== null && popupPosition && (
            <FloorPopup Number={selectedFloor} position={popupPosition} />
          )}
          <InteractionHint storageKey="building" />
        </div>

        {/*    {isExpanded && (
          <button
            className={`absolute top-[12px] right-[12px] bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center z-20 transition-all ${isMobile ? 'p-[10px] active:scale-95' : 'p-3 hover:scale-105'
              }`}
            aria-label={'Close'}
            onClick={() => setIsExpanded(false)}
            style={{ touchAction: 'manipulation' }}
          >
            <X className={`text-gray-900 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
          </button>
        )} */}
        {isMobile && isExpanded && visibleFloors.length > 0 && (
          <div className="flex h-20 w-full flex-row items-center justify-center p-4">
            <div className="flex w-full flex-row items-center gap-4">
              <div className="flex min-h-0 flex-1 items-center justify-center py-2">
                <div className="relative w-full max-w-[60vw]">
                  <Carousel
                    className="h-full w-full"
                    orientation="horizontal"
                    opts={{
                      align: "center",
                      loop: visibleFloors.length > 3,
                    }}
                    setApi={setCarouselApi}
                  >
                    <div className="flex w-full flex-col justify-center">
                      <CarouselContent className="max-h-[600px]">
                        {visibleFloors.map((floor) => (
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
                              onClick={() =>
                                handleSVGFloorHover(floor.floor_number)
                              }
                            >
                              {floor.floor_number}
                            </button>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </div>

                    {visibleFloors.length > 3 && (
                      <>
                        <CarouselPrevious className="-left-12 h-8 w-8 border-2 border-white bg-white/90 opacity-80 backdrop-blur-sm transition-all hover:bg-white hover:opacity-100" />
                        <CarouselNext className="-right-12 h-8 w-8 border-2 border-white bg-white/90 opacity-80 backdrop-blur-sm transition-all hover:bg-white hover:opacity-100" />
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

export default BuildingFacadeView;
