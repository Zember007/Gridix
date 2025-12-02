
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Apartment } from '@/types/apartment';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import ApartmentPopup from './ApartmentPopup';
import { useLockBodyScroll } from '@/hooks/use-lockscroll';
import { FieldSetting } from '@/hooks/useFields';
import { Button } from '../ui/button';

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
  showOnlyAvailable?: boolean;
  visibleFields: FieldSetting[];
}

interface BuildingFloor {
  id: string;
  floor_number: number;
  polygon: { x: number; y: number }[];
  color: string;
}

const COLLAPSED_HEIGHT = 288;

const BuildingFacadeView = ({ projectId, project, apartments, onFloorSelect, onApartmentSelect, filtersRef, externalImageLoaded, externalImageNaturalSize, showOnlyAvailable = false, visibleFields }: BuildingFacadeViewProps) => {
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
  const [mobileSwitcherPosition, setMobileSwitcherPosition] = useState<{ top: number; left: number } | null>(null);

  useLockBodyScroll(isTouchZooming);



  // Используем useRef для хранения функции обновления, чтобы избежать бесконечных циклов
  const updateImageDimensionsRef = useRef<() => void>();

  const updateImageDimensions = useCallback(() => {
    const imgEl = imgRef.current;
    const containerEl = containerRef.current;
    if (!imgEl || !containerEl || !imageLoaded || imageNaturalSize.width === 0) return;

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

  const visibleFloors = useMemo(() => {

    if(project.project_type === 'object') {
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
  }, [buildingFloors, apartments]);

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
    console.log('visibleFloors', visibleFloors);
    if (imageLoaded && visibleFloors.length > 0) {
      updateImageDimensionsRef.current?.();
      if (isExpanded && isMobile) {
        setHoveredFloor(visibleFloors[0]?.floor_number ?? null);
      }
    }
  }, [isExpanded, imageLoaded, visibleFloors, isMobile]);







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

    // Получаем размеры родительского контейнера
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight;

    let adjustedX = position.x;
    let adjustedY = position.y;
    let positionType: 'left' | 'right' | 'top' | 'bottom' = 'left';

    // Пытаемся позиционировать слева от полигона
    const leftX = position.x - popupWidth - 20;
    const rightX = position.x + 20;
    const topY = position.y - popupHeight - 20;
    const bottomY = position.y + 20;

    // Проверяем, помещается ли слева
    const fitsLeft = leftX >= margin;
    // Проверяем, помещается ли справа
    const fitsRight = rightX + popupWidth <= containerWidth - margin;
    // Проверяем, помещается ли сверху
    const fitsTop = topY >= margin;
    // Проверяем, помещается ли снизу
    const fitsBottom = bottomY + popupHeight <= containerHeight - margin;

    // Приоритет: слева -> справа -> сверху -> снизу
    if (fitsLeft) {
      adjustedX = leftX;
      adjustedY = position.y - popupHeight / 2;
      positionType = 'left';
    } else if (fitsRight) {
      adjustedX = rightX;
      adjustedY = position.y - popupHeight / 2;
      positionType = 'right';
    } else if (fitsTop) {
      adjustedX = position.x - popupWidth / 2;
      adjustedY = topY;
      positionType = 'top';
    } else if (fitsBottom) {
      adjustedX = position.x - popupWidth / 2;
      adjustedY = bottomY;
      positionType = 'bottom';
    } else {
      // Если не помещается нигде, показываем справа и обрезаем по границам
      adjustedX = Math.max(margin, Math.min(rightX, containerWidth - popupWidth - margin));
      adjustedY = position.y - popupHeight / 2;
      positionType = 'right';
    }

    // Финальная проверка вертикальных границ для левой/правой позиции
    if (positionType === 'left' || positionType === 'right') {
      if (adjustedY < margin) {
        adjustedY = margin;
      } else if (adjustedY + popupHeight > containerHeight - margin) {
        adjustedY = containerHeight - popupHeight - margin;
      }
    }

    // Финальная проверка горизонтальных границ для верхней/нижней позиции
    if (positionType === 'top' || positionType === 'bottom') {
      if (adjustedX < margin) {
        adjustedX = margin;
      } else if (adjustedX + popupWidth > containerWidth - margin) {
        adjustedX = containerWidth - popupWidth - margin;
      }
    }

    // For project_type = object, Number is apartment number, not floor number
    if (project.project_type === 'object') {
      const apartment = apartments.find(apt => apt.apartment_number === Number.toString());

      if (!apartment) {
        return null;
      }

      return (
        <ApartmentPopup
          apartment={apartment}
          position={{ x: adjustedX, y: adjustedY }}
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
        className="absolute z-30 uppercase bg-white flex flex-col rounded-[20px] overflow-hidden md:text-[12px] text-[10px] shadow-xl border border-gray-200 md:min-w-[100px] md:h-[100px] min-w-[80px] h-[110px]"
        style={{
          left: adjustedX,
          top: adjustedY,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {facadeSettings?.display?.showNumbers && (
          <div className="text-center flex items-center justify-center gap-[7px] md:p-0 p-1">
            {tSafe('project.floor')} <span className='font-bold'>{Number}</span>
          </div>
        )}

        <div className= "md:mx-0 mx-1 flex flex-col items-center justify-center text-white h-full rounded-[20px] bg-[#514A47] px-2">
          <div className="md:text-[32px] text-[20px] leading-[1.1]">{stats.available}</div>
          {tSafe('project.available')}
        </div>
        <Button
        onClick={() => {handleFloorClick(Number);}}
        variant="outline"  className="md:hidden text-[10px] m-1 p-1 rounded-[20px]">
          {t('customFields.show')}
        </Button>
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

  // Автоматическое позиционирование мобильного переключателя этажей так,
  // чтобы он по возможности не перекрывал полигоны.
  // Приоритет: сверху слева → сверху справа → другие доступные места.
  useEffect(() => {
    if (!isMobile || !isExpanded || visibleFloors.length === 0 || !containerRef.current) {
      setMobileSwitcherPosition(null);
      return;
    }

    if (imgDimensions.width === 0 || imgDimensions.height === 0) {
      setMobileSwitcherPosition(null);
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
      setMobileSwitcherPosition({
        top: containerHeight - 56,
        left: containerWidth / 2,
      });
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

    // Сначала ищем первый кандидат, который НЕ пересекает полигоны
    let chosen = candidates.find((c) => !intersectsPolygons(c));

    // Если все кандидаты пересекают полигоны, берём первый доступный (хотя бы влезает в контейнер)
    if (!chosen && candidates.length > 0) {
      chosen = candidates[0];
    }

    // Если кандидатов нет (контейнер очень маленький), ставим внизу по центру без сложных вычислений
    if (!chosen) {
      setMobileSwitcherPosition({
        top: containerHeight - estimatedHeight,
        left: containerWidth / 2,
      });
      return;
    }

    setMobileSwitcherPosition({ top: chosen.cy, left: chosen.cx });
  }, [isMobile, isExpanded, visibleFloors, imgDimensions.width, imgDimensions.height]);

  
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
        className={`relative w-full bg-gray-50 overflow-hidden rounded-lg min-h-[200px] flex items-center justify-center ${isExpanded ? '' : 'mx-auto'} ${isMobile ? 'touch-manipulation' : ''}`}
        style={{
          height: isExpanded ? 'auto' : '200px',
          width: isExpanded ? '100%' : '100%',
          maxWidth: isExpanded ? '100%' : undefined,
          boxShadow: isExpanded ? '0 8px 32px rgba(0,0,0,0.12)' : undefined,
        }}
      >
        {/* Размытый фон для заполнения пустых областей в развернутом режиме */}
        {imageLoaded && project.building_image_url && (
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
        {imageLoaded ? (
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
            className={`absolute top-[12px] right-[12px] bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center z-20 transition-all ${isMobile ? 'p-[10px] active:scale-95' : 'p-3 hover:scale-105'
              }`}
            aria-label={'Close'}
            onClick={() => setIsExpanded(false)}
            style={{ touchAction: 'manipulation' }}
          >
            <X className={`text-gray-900 ${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
          </button>
        )}
        {showPopup && selectedFloor !== null && popupPosition && (
          <FloorPopup Number={selectedFloor} position={popupPosition} />
        )}
        {isMobile && isExpanded && visibleFloors.length > 0 && mobileSwitcherPosition && (
          <div
            className="absolute z-30"
            style={{
              top: mobileSwitcherPosition.top,
              left: mobileSwitcherPosition.left,
              transform: 'translate(-50%, -50%)',
              touchAction: 'manipulation',
            }}
          >
            <div className="flex items-center min-w-[90px] justify-between bg-white/90 backdrop-blur rounded-full shadow-lg">
              <button
                className="p-3 rounded-full hover:bg-white active:scale-95 transition"
                onClick={() => {
                  if (visibleFloors.length === 0) return;
                  const sorted = [...visibleFloors]
                    .filter((f) => f.polygon && f.polygon.length >= 3)
                    .sort((a, b) => a.floor_number - b.floor_number);
                  const idx = sorted.findIndex((f) => f.floor_number === hoveredFloor);
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
                {project.project_type === 'object' ? '№' : ''}
                {hoveredFloor ?? '-'}
              </div>
              <button
                className="p-3 rounded-full hover:bg-white active:scale-95 transition"
                onClick={() => {
                  if (visibleFloors.length === 0) return;
                  const sorted = [...visibleFloors]
                    .filter((f) => f.polygon && f.polygon.length >= 3)
                    .sort((a, b) => a.floor_number - b.floor_number);
                  const idx = sorted.findIndex((f) => f.floor_number === hoveredFloor);
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
        )}
      </div>
    </>
  );
};

export default BuildingFacadeView;
