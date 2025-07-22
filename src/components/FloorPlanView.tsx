
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Apartment } from '@/types/apartment';
import PolygonEditor from './polygon-editor/PolygonEditor';

interface FloorPlanViewProps {
  projectId: string;
  floorNumber: number;
  apartments: Apartment[];
  onApartmentSelect: (apartment: Apartment) => void;
}

interface FloorPlan {
  id: string;
  image_url: string | null;
  polygon_settings: any;
}

const FloorPlanView = ({ projectId, floorNumber, apartments, onApartmentSelect }: FloorPlanViewProps) => {
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFloorPlan();
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

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.clientWidth, height: img.clientHeight });
  };

  const getApartmentColor = (apartment: Apartment) => {
    switch (apartment.status) {
      case 'available': return '#3b82f6';
      case 'reserved': return '#f59e0b';
      case 'sold': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const convertToViewBox = (polygon: { x: number; y: number }[], imageWidth: number, imageHeight: number) => {
    return polygon.map(point => ({
      x: (point.x / 100) * imageWidth,
      y: (point.y / 100) * imageHeight
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (!floorPlan || !floorPlan.image_url) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-96 text-gray-500">
          <p>План {floorNumber} этажа не загружен</p>
          <p className="text-sm mt-1">Обратитесь к администратору для загрузки плана этажа</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
 

        <div className="relative bg-gray-50 rounded-lg overflow-hidden">
          <div className="relative">
            <img 
              src={floorPlan.image_url} 
              alt={`План ${floorNumber} этажа`}
              className="w-full h-auto max-h-[600px] object-contain"
              onLoad={handleImageLoad}
            />
            
            {/* Overlay с квартирами */}
            {imageSize.width > 0 && (
              <svg 
                className="absolute inset-0 w-full h-full"
                viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
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

                  return (
                    <g key={apartment.id}>
                      <polygon
                        points={points}
                        fill={getApartmentColor(apartment)}
                        fillOpacity={0.3}
                        stroke={getApartmentColor(apartment)}
                        strokeWidth={2}
                        className="cursor-pointer hover:fill-opacity-50 transition-all"
                        onClick={() => onApartmentSelect(apartment)}
                      />
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
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Легенда */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded opacity-60"></div>
            <span>Доступно</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-600 rounded opacity-60"></div>
            <span>Забронировано</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded opacity-60"></div>
            <span>Продано</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FloorPlanView;
