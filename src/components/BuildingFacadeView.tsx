
import { useState, useEffect, useRef, useCallback } from 'react';
import { Building2, Maximize2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Apartment } from '@/types/apartment';

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
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [containerHeight, setContainerHeight] = useState(COLLAPSED_HEIGHT);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0});
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const updateHeight = useCallback(() => {
    if (isExpanded && filtersRef?.current) {
      const filtersHeight = filtersRef.current.offsetHeight;
      const newHeight = window.innerHeight - filtersHeight - 20; // 20px margin
      setContainerHeight(Math.max(newHeight, 400));
    } else {
      setContainerHeight(COLLAPSED_HEIGHT);
    }
  }, [isExpanded, filtersRef]);

  const updateImageDimensions = useCallback(() => {
    if (imgRef.current && containerRef.current) {
      const img = imgRef.current;
      const filtersHeight = filtersRef.current.offsetHeight;
      const newHeight = window.innerHeight - filtersHeight - 20; 
       const height_res = newHeight;
       const width_res = ( img.naturalWidth / img.naturalHeight) * newHeight;
    
      
      setImgDimensions({
        width: width_res,
        height: height_res
      });
    }
  }, []);

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

  useEffect(() => {
    // Setup ResizeObserver for container
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      updateImageDimensions();
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, [updateImageDimensions]);

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

  const getFloorStatusColor = (floorNumber: number) => {
    const floorApartments = getFloorApartments(floorNumber);
    if (floorApartments.length === 0) return '#6b7280';
    const availableCount = floorApartments.filter(apt => apt.status === 'available').length;
    const totalCount = floorApartments.length;
    if (availableCount === totalCount) return '#22c55e';
    if (availableCount === 0) return '#ef4444';
    return '#f59e0b';
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



  // Находим границы всех полигонов для масштабирования
  const getPolygonBounds = () => {
    let minX = 100, minY = 100, maxX = 0, maxY = 0;
    buildingFloors.forEach(floor => {
      if (floor.polygon && floor.polygon.length > 0) {
        floor.polygon.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      }
    });
    return { minX, minY, maxX, maxY };
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E1E1E]"></div>
      </div>
    );
  }

  if (!project.building_image_url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <Building2 className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Изображение фасада не загружено</h3>
          <p className="text-sm">Обратитесь к администратору для загрузки изображения</p>
        </div>
      </div>
    );
  }




  return (
    <div
      ref={containerRef}
      className={`relative w-full mx-auto h-[288px] transition-all duration-500 bg-gray-50 overflow-hidden${isExpanded ? '' : ' rounded-lg'}`}
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
              
            console.log(`Floor ${floor.floor_number} polygon:`, floor.polygon, 'points:', points);

            const floorApartments = getFloorApartments(floor.floor_number);
            const statusColor = getFloorStatusColor(floor.floor_number);
            const isHovered = hoveredFloor === floor.floor_number;
            
            // Центр полигона для текста
            const centerX = floor.polygon.reduce((sum, p) => sum + p.x, 0) / floor.polygon.length;
            const centerY = floor.polygon.reduce((sum, p) => sum + p.y, 0) / floor.polygon.length;
            
            return (
              <g key={floor.id}>
                <polygon
                  points={points}
                  fill={statusColor}
                  fillOpacity={isHovered ? 0.6 : 0.4}
                  stroke={statusColor}
                  strokeWidth={isHovered ? 0.3 : 0.2}
                  className="cursor-pointer transition-all"
                  onClick={() => handleFloorClick(floor.floor_number)}
                  onMouseEnter={() => setHoveredFloor(floor.floor_number)}
                  onMouseLeave={() => setHoveredFloor(null)}
                  style={{ pointerEvents: 'auto' }}
                />
                <text
                  x={centerX}
                  y={centerY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white font-bold select-none pointer-events-none"
                  fontSize={isHovered ? "4" : "3"}
                  style={{ 
                    textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                    filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))'
                  }}
                >
                  {floor.floor_number}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      
      {!isExpanded && (
        <button
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-4 flex items-center justify-center z-10"
          onClick={() => {setIsExpanded(true)}}
        >
          <Maximize2 className="h-7 w-7 text-gray-900" />
        </button>
      )}
      {isExpanded && (
        <button
          className="absolute top-4 right-4 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 flex items-center justify-center z-20"
          onClick={() => setIsExpanded(false)}
        >
          <X className="h-6 w-6 text-gray-900" />
        </button>
      )}
    </div>
  );
};

export default BuildingFacadeView;
