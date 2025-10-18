
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Apartment } from '@/types/apartment';
import { useLanguage } from '@/contexts/LanguageContext';
import ApartmentPopup from './ApartmentPopup';

interface FloorPlanViewProps {
  projectId: string;
  floorNumber: number;
  apartments: Apartment[];
  onApartmentSelect: (apartment: Apartment) => void;
  project?: {
    currency?: string | null;
  };
}

interface FloorPlan {
  id: string;
  image_url: string | null;
}

const FloorPlanView = ({ projectId, floorNumber, apartments, onApartmentSelect, project }: FloorPlanViewProps) => {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  type FloorSettings = {
    colors?: { available: string; reserved: string; sold: string };
    opacity?: { normal: number; hover: number };
    display?: { showNumbers?: boolean; showTooltip?: boolean; showArea?: boolean; showPrice?: boolean };
    hoverEffects?: { glow?: boolean; colorChange?: boolean; opacityChange?: boolean; scale?: boolean };
  };
  const [floorSettings, setFloorSettings] = useState<FloorSettings | null>(null);
  const [hoveredApartment, setHoveredApartment] = useState<Apartment | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    loadFloorPlan();
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, floorNumber]);

  const loadFloorPlan = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('floor_plans')
        .select('*')
        .eq('project_id', projectId)
        .eq('floor_number', floorNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setFloorPlan(data);
    } catch (error) {
      console.error('Error loading floor plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('polygon_settings_floor')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      type ProjectsSettingsRow = { polygon_settings_floor?: unknown };
      const row = data as unknown as ProjectsSettingsRow;
      if (row?.polygon_settings_floor) {
        setFloorSettings(row.polygon_settings_floor as FloorSettings);
      } else {
        setFloorSettings({
          colors: { available: '#3b82f6', reserved: '#f59e0b', sold: '#ef4444' },
          opacity: { normal: 0.3, hover: 0.5 },
          display: { showNumbers: true, showTooltip: false, showArea: false, showPrice: false },
          hoverEffects: { glow: true, colorChange: true, opacityChange: true },
        });
      }
    } catch (e) {
      setFloorSettings({
        colors: { available: '#3b82f6', reserved: '#f59e0b', sold: '#ef4444' },
        opacity: { normal: 0.3, hover: 0.5 },
        display: { showNumbers: true, showTooltip: false, showArea: false, showPrice: false },
        hoverEffects: { glow: true, colorChange: true, opacityChange: true },
      });
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.clientWidth, height: img.clientHeight });
  };

  const getApartmentColor = (apartment: Apartment) => {
    const colors = floorSettings?.colors;
    if (colors) {
      switch (apartment.status) {
        case 'available': return colors.available;
        case 'reserved': return colors.reserved;
        case 'sold': return colors.sold;
        default: return colors.available;
      }
    }
    return '#6b7280';
  };

  const convertToViewBox = (polygon: { x: number; y: number }[], imageWidth: number, imageHeight: number) => {
    return polygon.map(point => ({
      x: (point.x / 100) * imageWidth,
      y: (point.y / 100) * imageHeight
    }));
  };

  const handleApartmentHover = (apartment: Apartment, event: React.MouseEvent) => {
    if (!floorSettings?.display?.showTooltip) return;
    
    setHoveredApartment(apartment);
    setPopupPosition({ x: event.clientX, y: event.clientY });
    setShowPopup(true);
  };

  const handleApartmentLeave = () => {
    setHoveredApartment(null);
    setShowPopup(false);
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    setHoveredApartment(null);
  };

  if (loading) {
    return (
      <Card
         className='h-full grow'
      >
        <CardContent className="flex items-center justify-center min-h-96 h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (!floorPlan || !floorPlan.image_url) {
    return (
      <Card
      className='h-full grow'
      >
        <CardContent className="flex flex-col items-center justify-center min-h-96 h-full text-gray-500">
          <p>План {floorNumber} этажа не загружен</p>
          <p className="text-sm mt-1">Обратитесь к администратору для загрузки плана этажа</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='h-full grow'>
      <CardContent className="p-4 flex flex-col h-full">


        <div className="relative bg-gray-50 rounded-lg  flex-1">
          <div className="relative">
            <img
              src={floorPlan.image_url}
              alt={`План ${floorNumber} этажа`}
              className="w-auto mx-auto h-auto max-h-[600px]"
              onLoad={handleImageLoad}
            />

            {/* Overlay с квартирами */}
            {imageSize.width > 0 && (
              <svg
                viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: imageSize.width,
                  height: imageSize.height,

                }}
                preserveAspectRatio="none"
              >
                {apartments.map((apartment) => {
                  if (!apartment.polygon || apartment.polygon.length < 3) return null;

                  const convertedPolygon = convertToViewBox(apartment.polygon, imageSize.width, imageSize.height);
                  const points = convertedPolygon
                    .map(point => `${point.x},${point.y}`)
                    .join(' ');

                  const centerX = convertedPolygon.reduce((sum, p) => sum + p.x, 0) / convertedPolygon.length;
                  const centerY = convertedPolygon.reduce((sum, p) => sum + p.y, 0) / convertedPolygon.length;

                  const isHovered = hoveredApartment?.id === apartment.id;
                  const baseColor = getApartmentColor(apartment);
                  const hoverColor = floorSettings?.hoverEffects?.colorChange ? 
                    (apartment.status === 'available' ? '#10b981' : 
                     apartment.status === 'reserved' ? '#f59e0b' : '#ef4444') : baseColor;

                  return (
                    <g key={apartment.id}>
                      <polygon
                        points={points}
                        fill={isHovered ? hoverColor : baseColor}
                        fillOpacity={isHovered ? (floorSettings?.opacity?.hover ?? 0.5) : (floorSettings?.opacity?.normal ?? 0.3)}
                        stroke={isHovered ? hoverColor : baseColor}
                        strokeWidth={isHovered ? 3 : 2}
                        className="cursor-pointer transition-all duration-200"
                        style={{
                          filter: isHovered && floorSettings?.hoverEffects?.glow ? 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' : undefined,
                          transform: isHovered && floorSettings?.hoverEffects?.scale ? 'scale(1.02)' : 'scale(1)',
                          transformOrigin: 'center'
                        }}
                        onClick={() => onApartmentSelect(apartment)}
                        onMouseEnter={(e) => handleApartmentHover(apartment, e)}
                        onMouseLeave={handleApartmentLeave}
                      />
                      {floorSettings?.display?.showNumbers !== false && (
                      <text
                        x={centerX}
                        y={centerY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white font-bold text-sm pointer-events-none"
                        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
                      >
                        {apartment.apartment_number}
                      </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded opacity-60"
            style={{ backgroundColor: floorSettings?.colors?.available ?? '#3b82f6' }}
            ></div>
            <span>{t('project.available')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded opacity-60"
            style={{ backgroundColor: floorSettings?.colors?.reserved ?? '#f59e0b' }}
            ></div>
            <span>{t('project.reserved')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded opacity-60"
            style={{ backgroundColor: floorSettings?.colors?.sold ?? '#ef4444' }}
            ></div>
            <span>{t('project.sold')}</span>
          </div>
        </div>

        {/* Apartment Popup */}
        {showPopup && hoveredApartment && popupPosition && (
          <ApartmentPopup
            apartment={hoveredApartment}
            position={popupPosition}
            settings={{
              showNumbers: floorSettings?.display?.showNumbers ?? true,
              showTooltip: floorSettings?.display?.showTooltip ?? false,
              showArea: floorSettings?.display?.showArea ?? false,
              showPrice: floorSettings?.display?.showPrice ?? false,
            }}
            project={project}
            onClose={handlePopupClose}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default FloorPlanView;
