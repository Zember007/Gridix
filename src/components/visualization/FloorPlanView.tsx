
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { supabase } from '@/shared/api/supabase';
import { Apartment } from '@/entities/apartment/model/types';
import { useLanguage } from '@/contexts/LanguageContext';
import ApartmentPopup from './ApartmentPopup';
import { FieldSetting } from '@/hooks/useFields';
import polylabel from 'polylabel';
import { useIsMobile } from '@/hooks/use-mobile';

interface FloorPlanViewProps {
  projectId: string;
  floorNumber: number;
  apartments?: Apartment[];
  onApartmentSelect?: (apartment: Apartment) => void;
  currency?: string | null;
  visibleFields?: FieldSetting[];
}

interface FloorPlan {
  id: string;
  image_url: string | null;
}

const FloorPlanView = ({ projectId, floorNumber, apartments, onApartmentSelect, currency, visibleFields = [] }: FloorPlanViewProps) => {
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
  const isMobile = useIsMobile();
  useEffect(() => {
    setImageSize({ width: 0, height: 0 });
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

  // Geometry helpers for better label placement
  type PointXY = { x: number; y: number };





  // Approximate pole of inaccessibility (visual center) using iterative grid search
  const computeVisualCenter = (polygon: PointXY[]): PointXY => {

    const visualCenter = polylabel([polygon.map(p => [p.x, p.y])], 0.5);
    return { x: visualCenter?.[0] ?? 0, y: visualCenter?.[1] ?? 0 };

  };

  // Intersections helpers to estimate available width/height at center
  const intersectionsAtY = (polygon: PointXY[], y: number): number[] => {
    if (polygon.length < 2) return [];
    const xs: number[] = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i]!;
      const b = polygon[(i + 1) % polygon.length]!;
      if ((a.y <= y && b.y <= y) || (a.y >= y && b.y >= y) || a.y === b.y) continue;
      const t = (y - a.y) / (b.y - a.y);
      const x = a.x + t * (b.x - a.x);
      xs.push(x);
    }
    return xs.sort((m, n) => m - n);
  };

  const intersectionsAtX = (polygon: PointXY[], x: number): number[] => {
    if (polygon.length < 2) return [];
    const ys: number[] = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i]!;
      const b = polygon[(i + 1) % polygon.length]!;
      if ((a.x <= x && b.x <= x) || (a.x >= x && b.x >= x) || a.x === b.x) continue;
      const t = (x - a.x) / (b.x - a.x);
      const y = a.y + t * (b.y - a.y);
      ys.push(y);
    }
    return ys.sort((m, n) => m - n);
  };

  const segmentSpanContaining = (sorted: number[], coord: number): number => {
    for (let i = 0; i + 1 < sorted.length; i += 2) {
      const left = sorted[i];
      const right = sorted[i + 1];
      if (left === undefined || right === undefined) continue;
      if (coord >= left && coord <= right) return Math.max(0, right - left);
    }
    return 0;
  };

  const estimateTextSize = (text: string): { w: number; h: number } => {
    // Approximate font size: 12px base, 14px on md screens
    const isMd = typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
    const fontSize = isMd ? 14 : 12;
    const charWidth = fontSize * 0.6;
    return { w: text.length * charWidth, h: fontSize };
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

  const handleApartmentHover = (apartment: Apartment, event: React.MouseEvent | React.TouchEvent) => {
    if (!floorSettings?.display?.showTooltip) return;

    setHoveredApartment(apartment);
    const e = event;
    if ('clientX' in e && 'clientY' in e) {
      setPopupPosition({ x: e.clientX, y: e.clientY });
    } else if ('touches' in e && e.touches?.[0]) {
      setPopupPosition({ x: e.touches[0]?.clientX ?? 0, y: e.touches[0]?.clientY ?? 0 });
    }
    setShowPopup(true);
  };

  const handleApartmentLeave = () => {
    setHoveredApartment(null);
    setShowPopup(false);
  };



  if (loading) {
    return (
      <Card
        className={`h-full grow ${apartments ? 'min-h-[400px]' : 'min-h-[100px]'}`}
      >
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (!floorPlan || !floorPlan.image_url) {
    return (
      <Card
        className={`h-full grow  ${apartments ? 'min-h-[400px]' : 'min-h-[100px]'}`}
      >
        <CardContent className="flex flex-col items-center justify-center  h-full text-gray-500">
          <p>План {floorNumber} этажа не загружен</p>
          <p className="text-sm mt-1">Обратитесь к администратору для загрузки плана этажа</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='h-full grow rounded-none'>
      <CardContent className="flex flex-col h-full">


        <div className="relative bg-gray-50 rounded-lg  flex-1 flex items-center justify-center">
          <div className="relative">
            <img
              src={floorPlan.image_url}
              alt={`План ${floorNumber} этажа`}
              className={`w-auto mx-auto h-auto  ${apartments ? 'max-h-[600px] md:min-h-[400px]' : 'min-h-[100px]'}`}
              onLoad={handleImageLoad}
            />

            {/* Overlay с квартирами */}
            {imageSize.width > 0 && onApartmentSelect && (
              <svg
                viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: imageSize.width,
                  height: imageSize.height,

                }}
                preserveAspectRatio="none"
              >
                {apartments?.map((apartment) => {
                  if (!apartment.polygon || apartment.polygon.length < 3) return null;

                  const convertedPolygon = convertToViewBox(apartment.polygon, imageSize.width, imageSize.height);
                  const points = convertedPolygon
                    .map(point => `${point.x},${point.y}`)
                    .join(' ');

                  const visualCenter = computeVisualCenter(convertedPolygon);
                  const centerX = visualCenter.x;
                  const centerY = visualCenter.y;

                  // Determine if text fits horizontally; if not and vertical fits, rotate 90deg
                  const { w: textW, h: textH } = estimateTextSize(String(apartment.apartment_number ?? ''));
                  const horizSpans = intersectionsAtY(convertedPolygon, centerY);
                  const availW = segmentSpanContaining(horizSpans, centerX);
                  const vertSpans = intersectionsAtX(convertedPolygon, centerX);
                  const availH = segmentSpanContaining(vertSpans, centerY);
                  const padding = 10; // px padding from edges
                  const rotate = (textW + padding > availW) && (textH + padding <= availH);

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
                        className={`cursor-pointer transition-all duration-200`}
                        style={{
                          filter: isHovered && floorSettings?.hoverEffects?.glow ? 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' : undefined,
                          transform: isHovered && floorSettings?.hoverEffects?.scale ? 'scale(1.02)' : 'scale(1)',
                          transformOrigin: 'center'
                        }}
                        onClick={() => onApartmentSelect(apartment)}
                        onMouseEnter={(e) => {
                          if (isMobile) return;
                          handleApartmentHover(apartment, e)
                        }}
                        onMouseLeave={() => { if (isMobile) return; handleApartmentLeave() }}
                      /*                        onTouchStart={(e) => {if(isMobile) handleApartmentHover(apartment, e)}}
                                             onTouchEnd={() => {if(isMobile) handleApartmentLeave()}} */

                      />
                      {floorSettings?.display?.showNumbers !== false && (
                        <text
                          x={centerX}
                          y={centerY}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-white font-bold md:text-sm sm:text-xs text-[8px] text-center max-w-[100%] pointer-events-none"
                          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
                          transform={rotate ? `rotate(90 ${centerX} ${centerY})` : undefined}
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

        {apartments?.length && onApartmentSelect && (
          <>
            <div className="mt-4 flex items-center gap-6 md:text-sm text-[10px] flex-wrap">
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
                  showArea: visibleFields.find(field => field.field_name === 'area')?.is_visible ?? false,
                  showPrice: visibleFields.find(field => field.field_name === 'price')?.is_visible ?? false,
                }}
                currency={currency || null}
              />
            )}
          </>
        )}

      </CardContent>
    </Card>
  );
};

export default FloorPlanView;
