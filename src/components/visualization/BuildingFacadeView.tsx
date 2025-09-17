
import { useState, useEffect, useRef, useCallback } from 'react';
import { Building2, Maximize2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Apartment } from '@/types/apartment';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';

interface BuildingFacadeViewProps {
  projectId: string;
  project: {
    id: string;
    name: string;
    building_image_url: string | null;
  };
  apartments: Apartment[];
  onFloorSelect?: (floor: number) => void;
  onApartmentSelect: (apartment: Apartment) => void;
  filtersRef?: React.RefObject<HTMLDivElement>;
}

interface BuildingFloor {
  id: string;
  floor_number: number;
  polygon: { x: number; y: number }[];
  color: string;
}

const COLLAPSED_HEIGHT = 288;

const BuildingFacadeView = ({ projectId, project, apartments, onFloorSelect, onApartmentSelect, filtersRef }: BuildingFacadeViewProps) => {
  const isMobile = useIsMobile();
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [containerHeight, setContainerHeight] = useState(COLLAPSED_HEIGHT);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0});
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Floor popup state
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const updateHeight = useCallback(() => {
    if (isExpanded && filtersRef?.current) {
      const filtersHeight = filtersRef.current.offsetHeight;
      const margin = isMobile ? 10 : 20;
      const newHeight = window.innerHeight - filtersHeight - margin;
  
      const minHeight = isMobile ? 300 : 400;
      const maxHeight = isMobile ? 800 : 1200; // 👈 верхний предел
  
      setContainerHeight(
        Math.min(Math.max(newHeight, minHeight), maxHeight)
      );
    } else {
      const collapsedHeight = isMobile ? 200 : COLLAPSED_HEIGHT;
      setContainerHeight(collapsedHeight);
    }
  }, [isExpanded, filtersRef, isMobile]);
  

  const updateImageDimensions = useCallback(() => {
    const imgEl = imgRef.current;
    const containerEl = containerRef.current;
    if (!imgEl || !containerEl) return;
    if (imgEl.naturalHeight === 0) return;
  
    // высота фильтров/отступы (если используешь)
    const filtersHeight = filtersRef?.current ? filtersRef.current.offsetHeight : 0;
    const margin = 20;
  
    // Используем containerHeight (который ты вычисляешь в updateHeight)
    // Если его нет — падаем back на window.innerHeight - filters - margin
    const baseHeight = typeof containerHeight === "number"
      ? containerHeight
      : Math.max(0, window.innerHeight - filtersHeight - margin);
  
    // Можно учесть паддинги контейнера, если нужно:
    const containerPaddingTop = parseFloat(getComputedStyle(containerEl).paddingTop) || 0;
    const containerPaddingBottom = parseFloat(getComputedStyle(containerEl).paddingBottom) || 0;
    let availableHeight = Math.max(0, baseHeight - containerPaddingTop - containerPaddingBottom);
  
    // Считаем пропорции по натуральному соотношению
    const aspect = imgEl.naturalWidth / imgEl.naturalHeight;
    let width = Math.round(aspect * availableHeight);
    let height = Math.round(availableHeight);
  
    // Ограничиваем ширину контейнером, чтобы не выходила боком
    const containerWidth = containerEl.clientWidth || Infinity;
    if (width > containerWidth) {
      width = containerWidth;
      height = Math.round(containerWidth / aspect);
    }
  
    setImgDimensions({ width, height });
  }, [imgRef, containerRef, filtersRef, containerHeight]);
  

  useEffect(() => {
    loadBuildingFloors();
  }, [projectId]);

  useEffect(() => {
    
    updateHeight()
    const handleResize = () => {
      updateHeight();
      updateImageDimensions();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateHeight, updateImageDimensions]);

  useEffect(() => {
    
    updateImageDimensions()
  }, [containerHeight, updateImageDimensions]);

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

  const loadBuildingFloors = async () => {
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
  };

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

  const getFloorStatusColor = () => {
    return 'green';
  };

  // Floor Popup Component
  const FloorPopup = ({ floorNumber, position }: { floorNumber: number; position: { x: number; y: number } }) => {
    const stats = getFloorStats(floorNumber);
    
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
    

    const { t } = useLanguage();
    
    return (
      <div
        className="absolute z-30  uppercase bg-white flex flex-col rounded-[20px] overflow-hidden text-[12px] shadow-xl border border-gray-200 w-[100px] h-[105px]"
        style={{
          left: adjustedX,
          top: adjustedY,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center flex items-center justify-center gap-[7px]">
        {t('project.floor')} <span className='font-bold'>{floorNumber} </span>
        </div>

        <div className="flex flex-col items-center justify-center text-white h-full rounded-[20px] bg-[#514A47]">
       
              <div className="text-[32px] leading-[1.1]">{stats.available}</div>
              {t('project.available')}
          </div>
        

      </div>
    );
  };

  const handleFloorClick = (floorNumber: number) => {
    if (onFloorSelect) {
      onFloorSelect(floorNumber);
    } else {
      const floorApartments = getFloorApartments(floorNumber);
      if (floorApartments.length > 0) {
        onApartmentSelect(floorApartments[0]);
      }
    }
  };

  const handleFloorHover = (floorNumber: number, event: React.MouseEvent) => {
    if (isMobile || !isExpanded) return; // Показываем только в расширенном режиме на десктопе
    
    if (!containerRef.current) return;
    
    // Находим полигон для данного этажа
    const floor = buildingFloors.find(f => f.floor_number === floorNumber);
    if (!floor || !floor.polygon || floor.polygon.length === 0) return;
    
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
    let svgLeft, svgTop, svgWidth, svgHeight;
    
    if (isExpanded && imgDimensions.width > 0) {
      svgWidth = imgDimensions.width;
      svgHeight = imgDimensions.height;
      svgLeft = (containerRect.width - svgWidth) / 2;
      svgTop = (containerRect.height - svgHeight) / 2;
    } else {
      // В свернутом режиме используем размеры контейнера
      svgWidth = containerRect.width;
      svgHeight = containerRect.height;
      svgLeft = 0;
      svgTop = 0;
    }
    
    // Переводим проценты полигона в пиксели
    const polygonLeftPx = svgLeft + (polygonBounds.minX / 100) * svgWidth + 100;
    const polygonCenterY = svgTop + ((polygonBounds.minY + polygonBounds.maxY) / 2 / 100) * svgHeight;
    
    setSelectedFloor(floorNumber);
    setPopupPosition({ x: polygonLeftPx, y: polygonCenterY });
    setShowPopup(true);
  };

  const handleFloorLeave = () => {
    if (isMobile || !isExpanded) return;
    setShowPopup(false);
  };

  const handleSVGFloorClick = (floorNumber: number) => {
    // Закрываем попап если он открыт
    setShowPopup(false);
    // Выполняем обычное действие клика
    handleFloorClick(floorNumber);
  };

  const handleSVGFloorHover = (floorNumber: number, event: React.MouseEvent<SVGPolygonElement>) => {
    if (isMobile || !isExpanded) return;
    
    setHoveredFloor(floorNumber);
    handleFloorHover(floorNumber, event);
  };

  const handleFloorTouch = (floorNumber: number, event?: React.TouchEvent) => {
    // For mobile devices, show hover state on touch and then navigate
    if (isMobile) {
      setHoveredFloor(floorNumber);
      // Clear hover state after a delay
      setTimeout(() => {
        setHoveredFloor(null);
      }, 1500);
    }
    handleFloorClick(floorNumber);
  };

  // Close popup when clicking outside



  // Находим границы всех полигонов для масштабирования


  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E1E1E]"></div>
      </div>
    );
  }

  if (!project.building_image_url) {
    return null;
  }




  return (
    <div
      ref={containerRef}
      className={`relative w-full mx-auto transition-all duration-500 bg-gray-50 overflow-hidden${isExpanded ? '' : ' rounded-lg'} ${isMobile ? 'touch-manipulation' : ''}`}
      style={{
        height: containerHeight,
        width: '100%',
        maxWidth: '100vw',
        boxShadow: isExpanded ? '0 8px 32px rgba(0,0,0,0.12)' : undefined,
      }}
    >
      <img
        ref={imgRef}
        src={project.building_image_url}
        alt={project.name}
        className={`w-full h-full  transition-all duration-500 ${isExpanded ? 'object-contain' : 'object-cover'}`}
        onLoad={updateImageDimensions}
        draggable={false}
      />
      
      {/* SVG полигоны - точно поверх отображаемого изображения */}
      {isExpanded && buildingFloors.length > 0 && imgDimensions.width > 0 && (
        <svg
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: imgDimensions.width,
            height: imgDimensions.height,
          
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Debug rectangle to see SVG bounds */}
          <rect x="0" y="0" width="100" height="100" fill="none" />
          {buildingFloors.map((floor) => {
            if (!floor.polygon || floor.polygon.length < 3) return null;
            
            // Используем исходные координаты полигонов (они уже в процентах 0-100)
            const points = floor.polygon
              .map(point => `${point.x},${point.y}`)
              .join(' ');
              

            const statusColor = getFloorStatusColor();
            const isHovered = hoveredFloor === floor.floor_number;
            
            
            
            return (
              <g key={floor.id}>
                <polygon
                  points={points}
                  fill={statusColor}
                  fillOpacity={isHovered ? 0.6 : 0.4}
                  stroke={statusColor}
                  strokeWidth={isHovered ? (isMobile ? 0.4 : 0.3) : (isMobile ? 0.3 : 0.2)}
                  className="cursor-pointer transition-all"
                  onClick={(e) => handleSVGFloorClick(floor.floor_number)}
                  onTouchStart={(e) => {
                    if (isMobile) {
                      setHoveredFloor(floor.floor_number);
                      handleFloorTouch(floor.floor_number, e);
                    }
                  }}
                  onTouchEnd={() => {
                    if (isMobile) {
                      setTimeout(() => setHoveredFloor(null), 1500);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!isMobile && isExpanded) {
                      handleSVGFloorHover(floor.floor_number, e);
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isMobile && isExpanded) {
                      setHoveredFloor(null);
                      handleFloorLeave();
                    }
                  }}
                  style={{ 
                    pointerEvents: 'auto',
                    touchAction: 'manipulation'
                  }}
                />
             
              </g>
            );
          })}
        </svg>
      )}
      
      {!isExpanded && (
        <button
          className={` absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full md:flex hidden items-center justify-center z-10 transition-all ${
            isMobile ? 'p-3 active:scale-95' : 'p-4 hover:scale-105'
          }`}
          onClick={() => {setIsExpanded(true)}}
          style={{ touchAction: 'manipulation' }}
        >
          <Maximize2 className={`text-gray-900 ${isMobile ? 'h-6 w-6' : 'h-7 w-7'}`} />
        </button>
      )}
      {isExpanded && (
        <button
          className={`absolute top-4 right-4 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center z-20 transition-all ${
            isMobile ? 'p-3 active:scale-95' : 'p-3 hover:scale-105'
          }`}
          onClick={() => setIsExpanded(false)}
          style={{ touchAction: 'manipulation' }}
        >
          <X className={`text-gray-900 ${isMobile ? 'h-6 w-6' : 'h-6 w-6'}`} />
        </button>
      )}
      {showPopup && selectedFloor !== null && popupPosition && (
        <FloorPopup floorNumber={selectedFloor} position={popupPosition} />
      )}
    </div>
  );
};

export default BuildingFacadeView;
