
import { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { Maximize2 } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/shared/ui/carousel';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import ApartmentPopup from '@/components/visualization/ApartmentPopup';
import { useLockBodyScroll } from '@/hooks/use-lockscroll';
import { Button } from '@/shared/ui/button';
import type {
  BuildingFacadeViewProps,
  BuildingFloor,
} from "@/features/visualization/buildingFacade/model/types";
import {
  computeMobileDockPosition as computeMobileDockPositionUtil,
  computePopupPositionForPolygon as computePopupPositionForPolygonUtil,
  getPolygonBoundsPct,
} from "@/features/visualization/buildingFacade/lib/popupPosition";

const COLLAPSED_HEIGHT = 280;

const BuildingFacadeView = ({
  project,
  apartments,
  onFloorSelect,
  onApartmentSelect,
  filtersRef,
  externalImageLoaded,
  externalImageNaturalSize,
  showOnlyAvailable: _showOnlyAvailable = false,
  visibleFields,
  buildingFloors,
  facadeSettings,
  loading,
  themeColor
}: BuildingFacadeViewProps) => {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState((project.facade_open));
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Floor popup state
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupSize, setPopupSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [popupAnchor, setPopupAnchor] = useState<{
    floorNumber: number;
    polygonBounds: { minX: number; maxX: number; minY: number; maxY: number };
  } | null>(null);
  const [mobilePopupDockPosition, setMobilePopupDockPosition] = useState<{ x: number; y: number } | null>(null);
  const [isTouchZooming] = useState(false);
  const [touchOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  useLockBodyScroll(isTouchZooming);

  const visibleFloors = useMemo(() => {
    if (project.project_type === 'object') {
      return buildingFloors;
    }

    // Get unique floor numbers that have at least one available apartment
    const floorsWithAvailable = new Set(
      apartments
        .filter(apt => apt.status === 'available')
        .map(apt => apt.floor_number)
    );

    // Filter buildingFloors to only include floors with available apartments
    return buildingFloors.filter(floor => floorsWithAvailable.has(floor.floor_number));
  }, [buildingFloors, apartments, project.project_type]);

  const computeMobileDockPosition = useCallback(
    (size: { width: number; height: number }) =>
      computeMobileDockPositionUtil({
        containerEl: containerRef.current,
        isExpanded: isExpanded ?? false,
        imgDimensions,
        visibleFloors,
        size,
      }),
    [imgDimensions.height, imgDimensions.width, isExpanded, visibleFloors]
  );

  const computePopupPositionForPolygon = useCallback(
    (
      polygonBoundsPct: { minX: number; maxX: number; minY: number; maxY: number },
      size: { width: number; height: number }
    ) =>
      computePopupPositionForPolygonUtil({
        containerEl: containerRef.current,
        isExpanded: isExpanded ?? false,
        imgDimensions,
        polygonBoundsPct,
        size,
      }),
    [imgDimensions.height, imgDimensions.width, isExpanded]
  );

  const handleFloorHover = useCallback((floorNumber: number) => {
    if (!isExpanded) return;
    if (!containerRef.current) return;

    // Находим полигон для данного этажа
    const floor = buildingFloors.find(f => f.floor_number === floorNumber);
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
          (popupSize.width > 0 && popupSize.height > 0) ? popupSize : { width: 160, height: 120 };
        const dock = mobilePopupDockPosition ?? computeMobileDockPosition(sizeForInitial);
        if (dock) {
          setMobilePopupDockPosition(dock);
          setPopupPosition(dock);
        }
        return;
      }

      // Desktop: быстрое предварительное позиционирование (потом useLayoutEffect уточнит по реальному размеру)
      const sizeForInitial =
        (popupSize.width > 0 && popupSize.height > 0) ? popupSize : { width: 160, height: 120 };
      const nextPos = computePopupPositionForPolygon(polygonBounds, sizeForInitial);
      if (nextPos) setPopupPosition(nextPos);
    }
  }, [
    buildingFloors,
    computeMobileDockPosition,
    computePopupPositionForPolygon,
    facadeSettings?.display?.showTooltip,
    isExpanded,
    isMobile,
    mobilePopupDockPosition,
    popupSize,
  ]);

  const updateImageDimensionsRef = useRef<() => void>();

  const updateImageDimensions = useCallback(() => {
    const imgEl = imgRef.current;
    const containerEl = containerRef.current;
    if (!imgEl || !containerEl || imageNaturalSize.width === 0) return;

    setImgDimensions(prev => {
      let containerHeight: number;
      if (isExpanded && filtersRef?.current) {
        const filtersHeight = filtersRef.current.offsetHeight;
        const margin = isMobile ? 10 : 20;
        const newHeight = window.innerHeight - filtersHeight - margin;
        const minHeight = isMobile ? 300 : 400;
        containerHeight = Math.max(newHeight, minHeight);
      } else {
        containerHeight = isMobile ? 200 : COLLAPSED_HEIGHT;
      }

      const containerWidth = containerEl.clientWidth;
      const aspect = imageNaturalSize.width / imageNaturalSize.height;

      let width: number;
      let height: number;

      if (isExpanded) {
        // В развернутом режиме - object-contain поведение
        width = containerWidth;
        height = containerWidth / aspect;

        if (height > containerHeight && !isMobile) {
          height = containerHeight;
          width = height * aspect;
        }
      } else {
        // В свернутом режиме - object-cover поведение
        width = containerWidth;
        height = containerWidth / aspect;

        if (height < containerHeight) {
          height = containerHeight;
          width = height * aspect;
        }
      }

      const newDims = { width: Math.round(width), height: Math.round(height) };
      // Предотвращаем бесконечный цикл - обновляем только если размеры действительно изменились
      if (prev.width === newDims.width && prev.height === newDims.height) {
        return prev;
      }
      return newDims;
    });
  }, [imageNaturalSize.width, imageNaturalSize.height, isExpanded, isMobile, filtersRef]); // Убрали все изменяемые зависимости

  // Сохраняем актуальную функцию в ref
  updateImageDimensionsRef.current = updateImageDimensions;


  useEffect(() => {
    const handleResize = () => {
      updateImageDimensionsRef.current?.();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  // Пересчет размеров при изменении размеров контейнера
  useEffect(() => {
    if (!containerRef.current) return;
    let frame: number | null = null;
    const observer = new ResizeObserver(() => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        updateImageDimensionsRef.current?.();
      });
    });
    observer.observe(containerRef.current);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  // Пересчет при изменении высоты блока фильтров, влияющего на доступную высоту контейнера
  useEffect(() => {
    if (!filtersRef?.current) return;
    let frame: number | null = null;
    const observer = new ResizeObserver(() => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        updateImageDimensionsRef.current?.();
      });
    });
    observer.observe(filtersRef.current);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [filtersRef]);

  useEffect(() => {
    if (visibleFloors.length > 0) {
      updateImageDimensionsRef.current?.();
      if (isExpanded && isMobile && imgDimensions.width > 0 && imgDimensions.height > 0) {
        handleFloorHover(visibleFloors[0]?.floor_number ?? 0);
      }
    }
  }, [handleFloorHover, imgDimensions.height, imgDimensions.width, isExpanded, isMobile, visibleFloors]);







  // Sync image loading state with parent when provided
  useEffect(() => {
    if (externalImageLoaded && externalImageNaturalSize && externalImageNaturalSize.width > 0) {
      setImageNaturalSize(externalImageNaturalSize);
      // Немедленный пересчет после синхронизации размеров изображения (двойной rAF, чтобы дождаться layout)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updateImageDimensionsRef.current?.();
        });
      });
    }
  }, [externalImageLoaded, externalImageNaturalSize?.width, externalImageNaturalSize?.height, externalImageNaturalSize]);

  // Handle escape key to close popup
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPopup) {
        setShowPopup(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
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
    return apartments.filter(apt => apt.floor_number === floorNumber);
  };

  const getFloorStats = (floorNumber: number) => {
    const floorApartments = getFloorApartments(floorNumber);
    const available = floorApartments.filter(apt => apt.status === 'available').length;
    const sold = floorApartments.filter(apt => apt.status === 'sold').length;
    const reserved = floorApartments.filter(apt => apt.status === 'reserved').length;

    return {
      total: floorApartments.length,
      available,
      sold,
      reserved
    };
  };

  const getFloorFillColor = (floor: BuildingFloor) => {
    return facadeSettings?.colors?.building || floor.color || '#3b82f6';
  };

  // Floor Popup Component
  const FloorPopup = ({ Number, position }: { Number: number; position: { x: number; y: number } }) => {
    const { t } = useLanguage();



    // For project_type = object, Number is apartment number, not floor number
    if (project.project_type === 'object') {
      const apartment = apartments.find(apt => apt.apartment_number === Number.toString());

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
            showArea: visibleFields.find(field => field.field_name === 'area')?.is_visible ?? false,
            showPrice: visibleFields.find(field => field.field_name === 'price')?.is_visible ?? false,
          }}
          currency={project.currency || null}
        />
      );
    }

    // For project_type = building, Number is floor number
    const stats = getFloorStats(Number);

    return (
      <div
        ref={popupRef}
        className="absolute z-30 uppercase bg-white flex flex-col rounded-[20px] overflow-hidden md:text-[12px] text-[10px] shadow-xl border border-gray-200 md:min-w-[100px] md:h-[100px] min-w-[80px] h-[110px]"
        style={{
          left: position.x,
          top: position.y,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {facadeSettings?.display?.showNumbers && (
          <div className="text-center flex items-center justify-center gap-[7px] md:p-0 p-1">
            {t('project.floor')} <span className='font-bold'>{Number}</span>
          </div>
        )}

        <div className="md:mx-0 mx-1 flex flex-col items-center justify-center text-white h-full rounded-[20px] bg-[#514A47] px-2">
          <div className="md:text-[32px] text-[20px] leading-[1.1]">{stats.available}</div>
          {t('project.available')}
        </div>
        <Button
          onClick={() => { handleFloorClick(Number); }}
          variant="outline" className="md:hidden text-[10px] m-1 p-1 rounded-[20px]">
          {t('customFields.show')}
        </Button>
      </div>
    );
  };

  useLayoutEffect(() => {
    if (!showPopup || !containerRef.current || !popupRef.current) return;
    if (!isExpanded || imgDimensions.width === 0 || imgDimensions.height === 0) return;

    const rect = popupRef.current.getBoundingClientRect();
    const measured = { width: rect.width, height: rect.height };

    const sizeChanged =
      Math.abs(measured.width - popupSize.width) > 0.5 || Math.abs(measured.height - popupSize.height) > 0.5;
    if (sizeChanged) {
      setPopupSize(measured);
    }

    // Mobile: позиция всегда одна — выбираем best dock по всем полигонам и используем его
    if (isMobile) {
      const size = (measured.width > 0 && measured.height > 0)
        ? measured
        : (popupSize.width > 0 ? popupSize : { width: 160, height: 120 });
      const dock = computeMobileDockPosition(size);
      if (!dock) return;

      const dockChanged =
        !mobilePopupDockPosition ||
        Math.abs(dock.x - mobilePopupDockPosition.x) > 0.5 ||
        Math.abs(dock.y - mobilePopupDockPosition.y) > 0.5;
      if (dockChanged) setMobilePopupDockPosition(dock);

      const posChanged =
        !popupPosition || Math.abs(dock.x - popupPosition.x) > 0.5 || Math.abs(dock.y - popupPosition.y) > 0.5;
      if (posChanged) setPopupPosition(dock);
      return;
    }

    if (!popupAnchor) return;

    const nextPos =
      computePopupPositionForPolygon(
        popupAnchor.polygonBounds,
        (measured.width > 0 && measured.height > 0) ? measured : (popupSize.width > 0 ? popupSize : { width: 160, height: 120 })
      ) ?? null;

    if (!nextPos) return;
    const changed =
      !popupPosition || Math.abs(nextPos.x - popupPosition.x) > 0.5 || Math.abs(nextPos.y - popupPosition.y) > 0.5;
    if (changed) {
      setPopupPosition(nextPos);
    }
  }, [
    computeMobileDockPosition,
    computePopupPositionForPolygon,
    imgDimensions.height,
    imgDimensions.width,
    isExpanded,
    isMobile,
    mobilePopupDockPosition,
    popupAnchor,
    popupPosition,
    popupSize,
    showPopup
  ]);

  const handleFloorClick = (floorNumber: number) => {
    // For project_type = object, floorNumber is actually apartment number
    if (project.project_type === 'object') {
      const apartment = apartments.find(apt => apt.apartment_number === floorNumber.toString());
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
    if (!isMobile || !isExpanded || visibleFloors.length === 0 || !containerRef.current) {
      return;
    }

    if (imgDimensions.width === 0 || imgDimensions.height === 0) {
      return;
    }

    const containerEl = containerRef.current;
    const containerWidth = containerEl.clientWidth;
    const containerHeight = containerEl.clientHeight;

    // Берём только этажи с валидными полигонами
    const floorsWithPolygons = visibleFloors.filter(
      (f) => f.polygon && f.polygon.length >= 3
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
    const svgWidth = imgDimensions.width;
    const svgHeight = imgDimensions.height;
    const svgLeft = (containerWidth - svgWidth) / 2;
    const svgTop = (containerHeight - svgHeight) / 2;

    const bboxLeft = svgLeft + (minX / 100) * svgWidth;
    const bboxRight = svgLeft + (maxX / 100) * svgWidth;
    const bboxTop = svgTop + (minY / 100) * svgHeight;
    const bboxBottom = svgTop + (maxY / 100) * svgHeight;

    const margin = 12;           // отступ от краёв контейнера
    const gapFromPolygons = 8;   // минимальный зазор от полигонов
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
    addCandidate(containerWidth - margin - halfW, containerHeight - margin - halfH);

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


  }, [isMobile, isExpanded, visibleFloors, imgDimensions.width, imgDimensions.height]);

  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (!carouselApi) return;

    const index = visibleFloors.findIndex((f) => f.floor_number === selectedFloor);
    if (index >= 0) {
      carouselApi.scrollTo(index, true);
    }
  }, [carouselApi, selectedFloor, visibleFloors]);


  if (loading) {
    return (
      <div
        className="w-full h-full flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E1E1E]"></div>
      </div>
    );
  }

  if (!project.building_image_url) {
    return null;
  }





  return (
    <>
      <div
        ref={containerRef}
        className={`relative w-full bg-gray-50 overflow-hidden md:rounded-lg min-h-[200px] flex items-center justify-center flex-col ${isExpanded ? '' : 'mx-auto'} ${isMobile ? 'touch-manipulation' : ''}`}
        style={{
          height: isExpanded ? 'auto' : '200px',
          width: isExpanded ? '100%' : '100%',
          maxWidth: isExpanded ? '100%' : undefined,
          boxShadow: isExpanded ? '0 8px 32px rgba(0,0,0,0.12)' : undefined,
        }}
      >
        {/* Размытый фон для заполнения пустых областей в развернутом режиме */}
        {project.building_image_url && (
          <>

            <img
              src={project.building_image_url}
              alt="Building"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(8px)', transform: 'scale(1.1)' }}
              {...({ fetchpriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement> & { fetchpriority?: string })}
            />
            {/* Затемнение для лучшей читаемости */}
            <div className="absolute inset-0 bg-black/20" />
          </>
        )}

        {/* Показываем изображение только после загрузки для предотвращения скачков */}
        {project.building_image_url ? (
          <div
            ref={wrapperRef}
            style={{
              width: imgDimensions.width || 'auto',
              height: imgDimensions.height || 'auto',
              touchAction: isTouchZooming ? 'none' : 'manipulation'
            }}

          >
            <div
              style={{
                transform: isTouchZooming ? `scale(2)` : 'scale(1)',
                transformOrigin: `${touchOrigin.x}px ${touchOrigin.y}px`,
                touchAction: isTouchZooming ? 'none' : 'manipulation'
              }}
              className="w-full h-full">
              <img
                ref={imgRef}
                src={project.building_image_url}
                alt={project.name}
                className="block w-full h-full transition-all duration-500"
                draggable={false}
              />
              {isExpanded && visibleFloors.length > 0 && imgDimensions.width > 0 && (
                <svg
                  className="absolute inset-0 z-20"
                  style={{ width: '100%', height: '100%' }}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <rect x="0" y="0" width="100" height="100" fill="none" />
                  {visibleFloors.map((floor) => {
                    if (!floor.polygon || floor.polygon.length < 3) return null;
                    const points = floor.polygon
                      .map(point => `${point.x},${point.y}`)
                      .join(' ');
                    const baseColor = getFloorFillColor(floor);
                    const isHovered = hoveredFloor === floor.floor_number;
                    const isActive = hoveredFloor === floor.floor_number;
                    return (
                      <g key={floor.id}>
                        <polygon
                          points={points}
                          fill={baseColor}
                          fillOpacity={(isHovered || isActive) ? (facadeSettings?.opacity.hover ?? 0.7) : (facadeSettings?.opacity.normal ?? 0.4)}
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
                            pointerEvents: 'auto',
                            touchAction: 'none',
                            filter: isHovered && facadeSettings?.hoverEffects?.glow ? 'drop-shadow(0 0 8px rgba(0,0,0,0.4))' : undefined,
                            transform: isHovered && facadeSettings?.hoverEffects?.scale ? 'scale(1.02)' : 'scale(1)',
                            transformOrigin: 'center'
                          }}
                        />
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Если родитель не предоставил состояние загрузки, используем локальную подгрузку */}
            {!externalImageLoaded ? (
              <>
                <img
                  ref={imgRef}
                  src={project.building_image_url}
                  alt={project.name}
                  className="invisible absolute"
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                    // Двойной rAF для гарантии, что контейнер и изображение уже имеют корректные размеры
                    requestAnimationFrame(() => {
                      requestAnimationFrame(() => {
                        updateImageDimensionsRef.current?.();
                      });
                    });
                  }}
                  draggable={false}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E1E1E]"></div>
                </div>
              </>
            ) : null}
          </>
        )}

        {!isExpanded && (
          <button
            className={` absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full  items-center justify-center z-10 transition-all ${isMobile ? 'p-3 active:scale-95' : 'p-4 hover:scale-105'
              }`}
            onClick={() => setIsExpanded(true)}
            style={{ touchAction: 'manipulation' }}
          >
            <Maximize2 className={`text-gray-900 ${isMobile ? 'h-4 w-4' : 'h-7 w-7'}`} />
          </button>
        )}
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
        {showPopup && selectedFloor !== null && popupPosition && (
          <FloorPopup Number={selectedFloor} position={popupPosition} />
        )}
        {isMobile && isExpanded && visibleFloors.length > 0 && (
            <div className={`w-full border-t border-l-0 bg-gradient-to-b from-gray-50 to-gray-100 border-gray-200 shadow-inner flex flex-row items-center justify-center`}>
              <div className={`flex flex-row items-center gap-4 w-full`}>


                {/* Floor Carousel */}
                <div className={`flex-1 flex items-center justify-center min-h-0`}>
                  <div className={`w-full max-w-[100vw] relative`}>
                    <Carousel
                      className="w-full h-full "
                      orientation={isMobile ? "horizontal" : "vertical"}
                      opts={{
                        align: "center",
                        loop: visibleFloors.length > 3,
                      }}
                      setApi={setCarouselApi}
                    >
                      <div className={`w-full h-full shadow-xl border-2 border-white bg-white backdrop-blur-sm flex flex-col justify-center`}>
                        <CarouselContent>
                          {visibleFloors.map((floor, index) => (
                            <CarouselItem key={index} className={`basis-1/5 flex items-center justify-center`}>
                              <button
                                className={`w-full h-10 flex items-center justify-center text-lg font-semibold rounded-xl transition-colors ${selectedFloor === floor.floor_number
                                  ? 'text-white'
                                  : 'hover:bg-gray-100 text-gray-700'
                                  }`}
                                style={selectedFloor === floor.floor_number ? { backgroundColor: themeColor } : {}}
                                onClick={() => handleSVGFloorHover(floor.floor_number)}
                              >
                                {floor.floor_number}
                              </button>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                      </div>

                
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
