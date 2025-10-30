
import { useState, useEffect, useRef, useCallback } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Apartment } from '@/types/apartment';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import ApartmentPopup from './ApartmentPopup';
import { useLockBodyScroll } from '@/hooks/use-lockscroll';

interface BuildingFacadeViewProps {
  projectId: string;
  project: {
    id: string;
    name: string;
    building_image_url: string | null;
    project_type?: 'building' | 'object' | null;
    currency?: string | null;
    facade_open?: boolean | null;
  };
  apartments: Apartment[];
  onFloorSelect?: (floor: number) => void;
  onApartmentSelect: (apartment: Apartment) => void;
  filtersRef?: React.RefObject<HTMLDivElement>;
  externalImageLoaded?: boolean;
  externalImageNaturalSize?: { width: number; height: number };
}

interface BuildingFloor {
  id: string;
  floor_number: number;
  polygon: { x: number; y: number }[];
  color: string;
}

const COLLAPSED_HEIGHT = 288;

const BuildingFacadeView = ({ projectId, project, apartments, onFloorSelect, onApartmentSelect, filtersRef, externalImageLoaded, externalImageNaturalSize }: BuildingFacadeViewProps) => {
  const isMobile = useIsMobile();
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState((project.facade_open));
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);


  const [facadeSettings, setFacadeSettings] = useState<{
    colors: { building: string };
    opacity: { normal: number; hover: number };
    hoverEffects: { glow: boolean; colorChange?: boolean; opacityChange?: boolean; scale?: boolean };
    display: { showNumbers: boolean; showTooltip: boolean; };
  } | null>(null);

  // Floor popup state
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const [isTouchZooming, setIsTouchZooming] = useState(false);
  const [touchOrigin, setTouchOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  useLockBodyScroll(isTouchZooming);

  const getContainerHeight = useCallback(() => {
    if (isExpanded && filtersRef?.current) {
      const filtersHeight = filtersRef.current.offsetHeight;
      const margin = isMobile ? 10 : 20;
      const newHeight = window.innerHeight - filtersHeight - margin;

      const minHeight = isMobile ? 300 : 400;
      const maxHeight = isMobile ? imgDimensions.height : 1200;

      return Math.min(Math.max(newHeight, minHeight), maxHeight);
    } else {
      return isMobile ? 200 : COLLAPSED_HEIGHT;
    }
  }, [isExpanded, filtersRef, isMobile, imgDimensions.height]); // Убрали imgDimensions из зависимостей, оставили только height

  // Используем useRef для хранения функции обновления, чтобы избежать бесконечных циклов
  const updateImageDimensionsRef = useRef<() => void>();

  const updateImageDimensions = useCallback(() => {
    const imgEl = imgRef.current;
    const containerEl = containerRef.current;
    if (!imgEl || !containerEl || !imageLoaded || imageNaturalSize.width === 0) return;

    // Вычисляем containerHeight внутри функции, без зависимости от getContainerHeight
    // Используем текущее значение imgDimensions через ref или state
    setImgDimensions(prev => {
      let containerHeight: number;
      if (isExpanded && filtersRef?.current) {
        const filtersHeight = filtersRef.current.offsetHeight;
        const margin = isMobile ? 10 : 20;
        const newHeight = window.innerHeight - filtersHeight - margin;
        const minHeight = isMobile ? 300 : 400;
        const maxHeight = isMobile ? prev.height : 1200;
        containerHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);
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
  }, [imageLoaded, imageNaturalSize.width, imageNaturalSize.height, isExpanded, isMobile, filtersRef]); // Убрали все изменяемые зависимости

  // Сохраняем актуальную функцию в ref
  updateImageDimensionsRef.current = updateImageDimensions;


  const loadBuildingFloors = useCallback(async () => {
    if (!projectId) {
      setBuildingFloors([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('building_floors')
        .select('*')
        .eq('project_id', projectId)
        .order('floor_number');

      if (error) throw error;

      const processedFloors = data.map(floor => ({
        ...floor,
        polygon: Array.isArray(floor.polygon) ? floor.polygon as { x: number; y: number }[] : []
      }));

      setBuildingFloors(processedFloors);
    } catch (error) {
      console.error('Error loading building floors:', error);
      setBuildingFloors([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadBuildingFloors();
  }, [loadBuildingFloors]);



  // Load project-level facade settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('polygon_settings_facade')
          .eq('id', projectId)
          .single();
        if (error) throw error;
        if (data && 'polygon_settings_facade' in data && data.polygon_settings_facade) {
          const s = data.polygon_settings_facade as Record<string, unknown>;
          setFacadeSettings({
            colors: {
              building: (s?.colors as Record<string, unknown>)?.building as string || '#3b82f6'
            },
            opacity: {
              normal: typeof (s?.opacity as Record<string, unknown>)?.normal === 'number' ? (s.opacity as Record<string, unknown>).normal as number : 0.4,
              hover: typeof (s?.opacity as Record<string, unknown>)?.hover === 'number' ? (s.opacity as Record<string, unknown>).hover as number : 0.7,
            },
            hoverEffects: {
              glow: !!(s?.hoverEffects as Record<string, unknown>)?.glow,
              colorChange: !!(s?.hoverEffects as Record<string, unknown>)?.colorChange,
              opacityChange: !!(s?.hoverEffects as Record<string, unknown>)?.opacityChange,
            },
            display: {
              showNumbers: !!(s?.display as Record<string, unknown>)?.showNumbers,
              showTooltip: !!(s?.display as Record<string, unknown>)?.showTooltip,
            },
          });
        } else {
          setFacadeSettings({
            colors: { building: '#3b82f6' },
            opacity: { normal: 0.4, hover: 0.7 },
            hoverEffects: { glow: true, colorChange: true, opacityChange: true },
            display: { showNumbers: true, showTooltip: false }
          });
        }
      } catch (e) {
        setFacadeSettings({
          colors: { building: '#3b82f6' },
          opacity: { normal: 0.4, hover: 0.7 },
          hoverEffects: { glow: true, colorChange: true, opacityChange: true },
          display: { showNumbers: true, showTooltip: false }
        });
      }
    };
    loadSettings();
  }, [projectId]);

  useEffect(() => {
    if (!imageLoaded) return;
    const handleResize = () => {
      updateImageDimensionsRef.current?.();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageLoaded]);



  // Пересчет размеров при изменении размеров контейнера
  useEffect(() => {
    if (!containerRef.current || !imageLoaded) return;
    let frame: number | null = null;
    const observer = new ResizeObserver(() => {
      if (!imageLoaded) return;
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
  }, [imageLoaded]);

  // Пересчет при изменении высоты блока фильтров, влияющего на доступную высоту контейнера
  useEffect(() => {
    if (!filtersRef?.current || !imageLoaded) return;
    let frame: number | null = null;
    const observer = new ResizeObserver(() => {
      if (!imageLoaded) return;
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
  }, [filtersRef, imageLoaded]);

  useEffect(() => {
    if (imageLoaded && buildingFloors.length > 0) {
      updateImageDimensionsRef.current?.();
      setHoveredFloor(buildingFloors[0]?.floor_number ?? null);
    }
  }, [isExpanded, imageLoaded, buildingFloors.length]);







  // Sync image loading state with parent when provided
  useEffect(() => {
    if (externalImageLoaded && externalImageNaturalSize && externalImageNaturalSize.width > 0) {
      setImageNaturalSize(externalImageNaturalSize);
      setImageLoaded(true);
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
    const tSafe = t || ((key: string) => key);

    // Position popup to the left of the polygon
    const popupWidth = 256; // min-w-64 = 16rem = 256px
    const popupHeight = 160; // estimated height
    const margin = 20;

    // Позиционируем слева от полигона с отступом
    let adjustedX = position.x - popupWidth - 20;
    let adjustedY = position.y;

    // Проверяем границы экрана и корректируем при необходимости
    if (adjustedX < margin) {
      // Если слева не помещается, показываем справа от полигона
      adjustedX = position.x + 20;
    }

    // Центрируем всплывающее окно по вертикали относительно позиции полигона
    adjustedY = position.y - popupHeight / 2;

    // Проверяем вертикальные границы
    if (adjustedY < margin) {
      adjustedY = margin;
    } else if (adjustedY + popupHeight > window.innerHeight - margin) {
      adjustedY = window.innerHeight - popupHeight - margin;
    }

    // For project_type = object, Number is apartment number, not floor number
    if (project.project_type === 'object') {
      const apartment = apartments.find(apt => apt.apartment_number === Number.toString());

      if (!apartment) {
        return null;
      }

      // Use ApartmentPopup for objects
      return (
        <ApartmentPopup
          apartment={apartment}
          position={{ x: adjustedX, y: adjustedY }}
          settings={{
            showNumbers: facadeSettings?.display?.showNumbers ?? true,
            showTooltip: facadeSettings?.display?.showTooltip ?? false,
            showArea: true,
            showPrice: true,
          }}
          currency={project.currency || null}
        />
      );
    }

    // For project_type = building, Number is floor number
    const stats = getFloorStats(Number);

    return (
      <div
        className="absolute z-30 uppercase bg-white flex flex-col rounded-[20px] overflow-hidden md:text-[12px] text-[10px] shadow-xl border border-gray-200 md:w-[100px] md:h-[100px] w-[70px] h-[70px]"
        style={{
          left: adjustedX,
          top: adjustedY,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {facadeSettings?.display?.showNumbers && (
          <div className="text-center flex items-center justify-center gap-[7px]">
            {tSafe('project.floor')} <span className='font-bold'>{Number}</span>
          </div>
        )}

        <div className="flex flex-col items-center justify-center text-white h-full rounded-[20px] bg-[#514A47]">
          <div className="md:text-[32px] text-[20px] leading-[1.1]">{stats.available}</div>
          {tSafe('project.available')}
        </div>
      </div>
    );
  };

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

  const handleFloorHover = (floorNumber: number) => {
    if (!isExpanded) return;

    if (!containerRef.current) return;

    // Находим полигон для данного этажа
    const floor = buildingFloors.find(f => f.floor_number === floorNumber);
    if (!floor || !floor.polygon || floor.polygon.length === 0) return;

    // Set hovered floor for visual effects
    setHoveredFloor(floorNumber);

    // Show popup if tooltip is enabled in settings
    if (facadeSettings?.display?.showTooltip) {
      // Вычисляем границы полигона
      const polygonBounds = {
        minX: Math.min(...floor.polygon.map(p => p.x)),
        maxX: Math.max(...floor.polygon.map(p => p.x)),
        minY: Math.min(...floor.polygon.map(p => p.y)),
        maxY: Math.max(...floor.polygon.map(p => p.y))
      };

      // Преобразуем координаты полигона из процентов SVG в пиксели контейнера
      const containerRect = containerRef.current.getBoundingClientRect();

      // В расширенном режиме SVG центрирован и имеет размеры imgDimensions
      if (!isExpanded || imgDimensions.width === 0) return;

      const svgWidth = imgDimensions.width;
      const svgHeight = imgDimensions.height;
      const svgLeft = (containerRect.width - svgWidth) / 2;
      const svgTop = (containerRect.height - svgHeight) / 2;

      // Переводим проценты полигона в пиксели
      const polygonLeftPx = svgLeft + (polygonBounds.minX / 100) * svgWidth + 100;
      const polygonCenterY = svgTop + ((polygonBounds.minY + polygonBounds.maxY) / 2 / 100) * svgHeight;

      setSelectedFloor(floorNumber);
      setPopupPosition({ x: polygonLeftPx, y: polygonCenterY });
      setShowPopup(true);
    }
  };

  const handleFloorLeave = () => {
    if (!isExpanded) return;
    setHoveredFloor(null);
    setShowPopup(false);
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


  const getPointRelativeToWrapper = (clientX: number, clientY: number) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return { x: 0, y: 0 };
    const rect = wrapper.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const mobileTouchStart = (e: React.TouchEvent, floorNumber?: number) => {
    if (!isMobile) return;
    if (e.touches.length === 0) return;
    const touch = e.touches.item(0);
    if (!touch) return;
    const origin = getPointRelativeToWrapper(touch.clientX, touch.clientY);
    setTouchOrigin(origin);
    setIsTouchZooming(true);
    if (typeof floorNumber === 'number') handleSVGFloorHover(floorNumber);

    e.preventDefault();
    e.stopPropagation();
  };

  const mobileTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    if (e.touches.length === 0) return;
    const touch = e.touches.item(0);
    if (!touch) return;
    // Update origin so zoomed area follows the finger
    const origin = getPointRelativeToWrapper(touch.clientX, touch.clientY);
    setTouchOrigin(origin);

    // Detect polygon under finger
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el instanceof SVGPolygonElement) {
      const ds = (el as Element).getAttribute('data-floor');
      const floorNum = ds ? parseInt(ds, 10) : undefined;
      if (typeof floorNum === 'number' && !Number.isNaN(floorNum)) {
        handleSVGFloorHover(floorNum)
      } else {
        setHoveredFloor(null);
        handleFloorLeave();
      }
    } else {
      setHoveredFloor(null);
      handleFloorLeave();
    }
    e.preventDefault();
    e.stopPropagation();
  };

  const mobileTouchEnd = () => {
    if (!isMobile) return;
    const active = hoveredFloor;
    setIsTouchZooming(false);

    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
    // Open the active floor
    if (typeof active === 'number') {
      handleFloorClick(active);
    }

    // Clear hover shortly after to allow click transition
    setTimeout(() => setHoveredFloor(null), 150);
  };



  // Находим границы всех полигонов для масштабирования

  const containerHeight = getContainerHeight();

  if (loading) {
    return (
      <div
        style={{
          height: containerHeight,
        }}
        className="w-full h-full flex items-center justify-center">
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
        className={`relative w-full transition-all duration-500 bg-gray-50 overflow-hidden rounded-lg ${isExpanded ? '' : 'mx-auto'} ${isMobile ? 'touch-manipulation' : ''}`}
        style={{
          height: containerHeight,
          width: isExpanded ? '100%' : '100%',
          maxWidth: isExpanded ? '100%' : undefined,
          boxShadow: isExpanded ? '0 8px 32px rgba(0,0,0,0.12)' : undefined,
        }}
      >
        {/* Размытый фон для заполнения пустых областей в развернутом режиме */}
        {imageLoaded && project.building_image_url && (
          <>
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                backgroundImage: `url(${project.building_image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'blur(8px)',
                transform: 'scale(1.1)', // Небольшое увеличение для избежания белых краев
              }}
            />
            {/* Затемнение для лучшей читаемости */}
            <div className="absolute inset-0 bg-black/20" />
          </>
        )}

        {/* Показываем изображение только после загрузки для предотвращения скачков */}
        {imageLoaded ? (
          <div
            ref={wrapperRef}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              width: imgDimensions.width || 'auto',
              height: imgDimensions.height || 'auto',
              touchAction: isTouchZooming ? 'none' : 'manipulation'
            }}
            onTouchStart={(e) => mobileTouchStart(e)}
            onTouchMove={(e) => mobileTouchMove(e)}
            onTouchEnd={() => mobileTouchEnd()}
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
              {isExpanded && buildingFloors.length > 0 && imgDimensions.width > 0 && (
                <svg
                  className="absolute inset-0 z-20"
                  style={{ width: '100%', height: '100%' }}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <rect x="0" y="0" width="100" height="100" fill="none" />
                  {buildingFloors.map((floor) => {
                    if (!floor.polygon || floor.polygon.length < 3) return null;
                    const points = floor.polygon
                      .map(point => `${point.x},${point.y}`)
                      .join(' ');
                    const baseColor = getFloorFillColor(floor);
                    const isHovered = hoveredFloor === floor.floor_number;
                    const isActive = hoveredFloor === floor.floor_number;
                    const hoverColor = facadeSettings?.hoverEffects?.colorChange ?
                      (baseColor === '#3b82f6' ? '#10b981' : baseColor) : baseColor;
                    return (
                      <g key={floor.id}>
                        <polygon
                          points={points}
                          fill={(isHovered || isActive) ? hoverColor : baseColor}
                          fillOpacity={(isHovered || isActive) ? (facadeSettings?.opacity.hover ?? 0.7) : (facadeSettings?.opacity.normal ?? 0.4)}
                          stroke={(isHovered || isActive) ? hoverColor : baseColor}
                          strokeWidth={(isHovered || isActive) ? (isMobile ? 0.6 : 0.5) : (isMobile ? 0.3 : 0.2)}
                          className="cursor-pointer transition-all duration-200"
                          data-floor={floor.floor_number}
                          onClick={() => handleSVGFloorClick(floor.floor_number)}
                          onTouchStart={(e) => {
                            mobileTouchStart(e, floor.floor_number);

                          }}
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
                    setImageLoaded(true);
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
        {isExpanded && (
          <button
            className={`absolute top-4 right-4 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center z-20 transition-all ${isMobile ? 'p-3 active:scale-95' : 'p-3 hover:scale-105'
              }`}
            onClick={() => setIsExpanded(false)}
            style={{ touchAction: 'manipulation' }}
          >
            <X className={`text-gray-900 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
          </button>
        )}
        {showPopup && selectedFloor !== null && popupPosition && (
          <FloorPopup Number={selectedFloor} position={popupPosition} />
        )}
      </div>
      {
        isMobile && buildingFloors.length > 0 && (
          <div className="flex justify-center">
            <div
              className="flex items-center  gap-3 bg-white/90 backdrop-blur rounded-full shadow-lg px-3 py-2 mt-4 mx-auto"
              style={{ touchAction: 'manipulation' }}
            >
              <button
                className="p-2 rounded-full hover:bg-white active:scale-95 transition"
                onClick={() => {
                  if (buildingFloors.length === 0) return;
                  const sorted = [...buildingFloors].sort((a, b) => a.floor_number - b.floor_number);
                  const idx = sorted.findIndex(f => f.floor_number === hoveredFloor);
                  const prevIdx = idx > 0 ? idx - 1 : sorted.length - 1;
                  const newFloor = sorted[prevIdx]?.floor_number;
                  if (typeof newFloor === 'number') {
                    handleSVGFloorHover(newFloor);
                  }
                }}
              >
                <ChevronLeft className={isMobile ? 'h-5 w-5' : 'h-6 w-6'} />
              </button>
              <div className="text-sm font-medium uppercase">
                {project.project_type === 'object' ? '№' : ''}{hoveredFloor ?? '-'}
              </div>
              <button
                className="p-2 rounded-full hover:bg-white active:scale-95 transition"
                onClick={() => {
                  if (buildingFloors.length === 0) return;
                  const sorted = [...buildingFloors].sort((a, b) => a.floor_number - b.floor_number);
                  const idx = sorted.findIndex(f => f.floor_number === hoveredFloor);
                  const nextIdx = idx >= 0 && idx < sorted.length - 1 ? idx + 1 : 0;
                  const newFloor = sorted[nextIdx]?.floor_number;
                  if (typeof newFloor === 'number') {
                    handleSVGFloorHover(newFloor);
                  }
                }}
              >
                <ChevronRight className={isMobile ? 'h-5 w-5' : 'h-6 w-6'} />
              </button>
            </div>
          </div>
        )
      }
    </>
  );
};

export default BuildingFacadeView;
