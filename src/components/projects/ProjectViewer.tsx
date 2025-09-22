import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/hooks/useProjects';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import ApartmentDetailsPanel from './ApartmentDetailsPanel';
import ApartmentTooltip from './ApartmentTooltip';
import { Apartment, normalizeApartmentData } from '@/types/apartment';
import type { Json } from '@/integrations/supabase/types';

interface Project {
  id: string;
  name: string;
  description: string;
  floors: number;
  building_image_url: string;
}

interface BuildingFloor {
  id: string;
  floor_number: number;
  polygon: { x: number; y: number }[];
  color: string;
}

interface FloorPlan {
  id: string;
  floor_number: number;
  image_url: string;
}

const ProjectViewer = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { project: cachedProject } = useProject(projectId);
  const [project, setProject] = useState<Project | null>(null);
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [polygonSettings, setPolygonSettings] = useState<any>(null);
  const [buildingPolygonSettings, setBuildingPolygonSettings] = useState<any>(null);
  const [hoveredApartment, setHoveredApartment] = useState<Apartment | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId, cachedProject]);

  useEffect(() => {
    if (selectedFloor && projectId) {
      loadFloorPlan();
      loadApartments();
    } else {
      setFloorPlan(null);
      setApartments([]);
      setSelectedApartment(null);
    }
  }, [selectedFloor, projectId]);

  const parsePolygon = (polygon: Json): { x: number; y: number }[] => {
    console.log('Parsing polygon:', polygon);
    
    if (!polygon) {
      console.log('No polygon data');
      return [];
    }
    
    if (Array.isArray(polygon)) {
      const result = polygon.filter(p => 
        typeof p === 'object' && 
        p !== null && 
        'x' in p && 
        'y' in p &&
        typeof p.x === 'number' &&
        typeof p.y === 'number'
      ) as { x: number; y: number }[];
      
      console.log('Parsed polygon result:', result);
      return result;
    }
    
    console.log('Polygon is not an array:', typeof polygon);
    return [];
  };

  const loadProject = async () => {
    try {
      console.log('Loading project:', projectId);
      
      if (cachedProject) {
        console.log('Project loaded from cache:', cachedProject);
        setProject(cachedProject);

        if (cachedProject.building_polygon_settings) {
          setBuildingPolygonSettings(cachedProject.building_polygon_settings);
        }
      }

      // Load building floors
      const { data: floorsData, error: floorsError } = await supabase
        .from('building_floors')
        .select('*')
        .eq('project_id', cachedProject?.id || projectId)
        .order('floor_number');

      if (floorsError) {
        console.error('Floors error:', floorsError);
        throw floorsError;
      }
      
      console.log('Raw floors data:', floorsData);
      
      const transformedFloors: BuildingFloor[] = (floorsData || []).map(floor => {
        const polygon = parsePolygon(floor.polygon);
        console.log(`Floor ${floor.floor_number} polygon:`, polygon);
        
        return {
          id: floor.id,
          floor_number: floor.floor_number,
          polygon: polygon,
          color: floor.color || '#3b82f6'
        };
      });

      console.log('Transformed floors:', transformedFloors);
      setBuildingFloors(transformedFloors);
      
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Error loading project');
    } finally {
      setLoading(false);
    }
  };

  const loadFloorPlan = async () => {
    try {
      console.log('Loading floor plan for floor:', selectedFloor);
      
      const { data, error } = await supabase
        .from('floor_plans')
        .select('*, polygon_settings')
        .eq('project_id', projectId)
        .eq('floor_number', selectedFloor)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Floor plan error:', error);
        throw error;
      }
      
      console.log('Floor plan loaded:', data);
      setFloorPlan(data);

      if (data?.polygon_settings) {
        setPolygonSettings(data.polygon_settings);
      }
    } catch (error) {
      console.error('Error loading floor plan:', error);
    }
  };

  const loadApartments = async () => {
    try {
      console.log('Loading apartments for floor:', selectedFloor);
      
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('project_id', projectId)
        .eq('floor_number', selectedFloor);

      if (error) {
        console.error('Apartments error:', error);
        throw error;
      }
      
      console.log('Raw apartments data:', data);
      
      // Use normalizeApartmentData to ensure proper type casting
      const transformedApartments = (data || []).map(normalizeApartmentData);
      console.log('Transformed apartments:', transformedApartments);
      setApartments(transformedApartments);
    } catch (error) {
      console.error('Error loading apartments:', error);
    }
  };

  const polygonToPath = (polygon: { x: number; y: number }[]) => {
    if (!polygon || polygon.length === 0) {
      console.log('Empty polygon for path conversion');
      return '';
    }
    
    const path = `M ${polygon.map(p => `${p.x} ${p.y}`).join(' L ')} Z`;
    console.log('Generated path:', path);
    return path;
  };

  const getStatusColor = (status: string) => {
    if (polygonSettings?.colors) {
      switch (status) {
        case 'available': return polygonSettings.colors.available;
        case 'sold': return polygonSettings.colors.sold;
        case 'reserved': return polygonSettings.colors.reserved;
        default: return polygonSettings.colors.available;
      }
    }

    // Fallback colors
    switch (status) {
      case 'available': return '#22c55e';
      case 'sold': return '#ef4444';
      case 'reserved': return '#f59e0b';
      default: return '#22c55e';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'sold': return 'Sold';
      case 'reserved': return 'Reserved';
      default: return 'Available';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  const handleFloorClick = (floorNumber: number) => {
    console.log('Floor clicked:', floorNumber);
    setSelectedFloor(floorNumber);
  };

  const handleApartmentClick = (apartment: Apartment) => {
    console.log('Apartment clicked:', apartment);
    setSelectedApartment(apartment);
  };

  const getPolygonStyle = (status: string, isSelected: boolean = false, isHovered: boolean = false) => {
    const settings = selectedFloor ? polygonSettings : buildingPolygonSettings;
    if (!settings) return {};

    const baseOpacity = settings.opacity?.normal || 0.4;
    const hoverOpacity = settings.opacity?.hover || 0.7;
    const opacity = isHovered ? hoverOpacity : isSelected ? 0.8 : baseOpacity;

    let style: React.CSSProperties = {
      fillOpacity: opacity,
      transition: 'all 0.3s ease'
    };

    if (isHovered && settings.hoverEffects?.glow) {
      style.filter = `drop-shadow(0 0 8px ${getStatusColor(status)}66)`;
    }

    return style;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-real-estate-50 via-white to-real-estate-100 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-real-estate-600 mx-auto mb-4 animate-pulse" />
          <p className="text-real-estate-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-real-estate-50 via-white to-real-estate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-real-estate-900 mb-4">Project not found</h1>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-real-estate-50 via-white to-real-estate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-real-estate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.history.back()}
                className="text-real-estate-600 hover:text-real-estate-700 hover:bg-real-estate-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-real-estate-600" />
                <div>
                  <h1 className="text-2xl font-bold text-real-estate-900">{project.name}</h1>
                  {project.description && (
                    <p className="text-sm text-real-estate-600">{project.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Building Image */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-real-estate-900 mb-4">
                  {selectedFloor ? `Floor ${selectedFloor}` : 'Select a floor'}
                </h2>
                
                {!selectedFloor && project.building_image_url && (
                  <div className="relative inline-block max-w-full">
                    <img
                      src={project.building_image_url}
                      alt="Building"
                      className="max-w-full max-h-[500px] object-contain rounded-lg"
                      onLoad={() => console.log('Building image loaded')}
                      onError={(e) => console.error('Building image failed to load:', e)}
                    />
                    <svg
                      className="absolute top-0 left-0 w-full h-full cursor-pointer"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      {buildingFloors.map(floor => {
                        const path = polygonToPath(floor.polygon);
                        console.log(`Rendering floor ${floor.floor_number} with path:`, path);
                        
                        if (!path) return null;
                        
                        return (
                          <g key={floor.id}>
                            <path
                              d={path}
                              fill={floor.color}
                              stroke={floor.color}
                              strokeWidth="0.5"
                              style={getPolygonStyle('available')}
                              className="hover:fill-opacity-60 transition-all cursor-pointer"
                              onClick={() => handleFloorClick(floor.floor_number)}
                            />
                            {buildingPolygonSettings?.display?.showNumbers !== false && (
                              <text
                                x={floor.polygon.reduce((sum, p) => sum + p.x, 0) / floor.polygon.length}
                                y={floor.polygon.reduce((sum, p) => sum + p.y, 0) / floor.polygon.length}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="white"
                                fontSize="2"
                                fontWeight="bold"
                                className="pointer-events-none"
                              >
                                {floor.floor_number}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}

                {selectedFloor && floorPlan?.image_url && (
                  <div className="relative inline-block max-w-full">
                    <img
                      src={floorPlan.image_url}
                      alt={`Floor ${selectedFloor} plan`}
                      className="max-w-full max-h-[500px] object-contain rounded-lg"
                      onLoad={() => console.log('Floor plan image loaded')}
                      onError={(e) => console.error('Floor plan image failed to load:', e)}
                    />
                    <svg
                      className="absolute top-0 left-0 w-full h-full cursor-pointer"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      {apartments.map(apartment => {
                        const path = polygonToPath(apartment.polygon);
                        console.log(`Rendering apartment ${apartment.apartment_number} with path:`, path);
                        
                        if (!path) return null;
                        
                        return (
                          <g key={apartment.id}>
                            <path
                              d={path}
                              fill={getStatusColor(apartment.status)}
                              stroke={getStatusColor(apartment.status)}
                              strokeWidth="0.3"
                              style={getPolygonStyle(
                                apartment.status, 
                                selectedApartment?.id === apartment.id,
                                hoveredApartment?.id === apartment.id
                              )}
                              className="transition-all cursor-pointer"
                              onClick={() => handleApartmentClick(apartment)}
                              onMouseEnter={() => setHoveredApartment(apartment)}
                              onMouseLeave={() => setHoveredApartment(null)}
                            />
                            {polygonSettings?.display?.showNumbers !== false && (
                              <text
                                x={apartment.polygon.reduce((sum, p) => sum + p.x, 0) / apartment.polygon.length}
                                y={apartment.polygon.reduce((sum, p) => sum + p.y, 0) / apartment.polygon.length}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="white"
                                fontSize="1.2"
                                fontWeight="bold"
                                className="pointer-events-none"
                              >
                                {apartment.apartment_number}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* Tooltip */}
                    {hoveredApartment && polygonSettings?.display?.showTooltip && (
                      <div className="absolute pointer-events-none z-10">
                        <ApartmentTooltip
                          apartment={{
                            number: hoveredApartment.apartment_number,
                            status: hoveredApartment.status,
                            area: hoveredApartment.area,
                            rooms: hoveredApartment.rooms,
                            price: hoveredApartment.price
                          }}
                          settings={{
                            showArea: polygonSettings.display?.showArea || false,
                            showPrice: polygonSettings.display?.showPrice || false
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {selectedFloor && !floorPlan?.image_url && (
                  <div className="text-center py-12 text-real-estate-600">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No floor plan uploaded</p>
                  </div>
                )}

                {!selectedFloor && !project.building_image_url && (
                  <div className="text-center py-12 text-real-estate-600">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No building image uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hide floor selection when apartment is selected */}
            {!selectedApartment && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-real-estate-900 mb-4">Floors</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: project.floors }, (_, i) => i + 1).map(floorNum => {
                      const hasFloor = buildingFloors.some(f => f.floor_number === floorNum);
                      const hasFloorPlan = selectedFloor === floorNum && floorPlan;
                      
                      return (
                        <Button
                          key={floorNum}
                          size="sm"
                          variant={selectedFloor === floorNum ? "default" : "outline"}
                          onClick={() => setSelectedFloor(selectedFloor === floorNum ? null : floorNum)}
                          disabled={!hasFloor}
                          className={`${
                            hasFloor 
                              ? selectedFloor === floorNum
                                ? 'bg-real-estate-600 hover:bg-real-estate-700'
                                : 'border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50'
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          Floor {floorNum}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Apartment Details */}
            {selectedApartment && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-real-estate-900">
                      Apartment {selectedApartment.apartment_number}
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedApartment(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-real-estate-600">Status:</span>
                      <Badge className={`${
                        selectedApartment.status === 'available' ? 'bg-success-100 text-success-800' :
                        selectedApartment.status === 'sold' ? 'bg-red-100 text-red-800' :
                        'bg-warning-100 text-warning-800'
                      }`}>
                        {getStatusText(selectedApartment.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-real-estate-600">Rooms:</span>
                      <span className="font-medium">{selectedApartment.rooms}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-real-estate-600">Area:</span>
                      <span className="font-medium">{selectedApartment.area} m²</span>
                    </div>
                    
                    {selectedApartment.price && selectedApartment.price > 0 && (
                      <div className="flex justify-between">
                        <span className="text-real-estate-600">Price:</span>
                        <span className="font-bold text-real-estate-900">
                          ${formatPrice(selectedApartment.price)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-real-estate-600">Floor:</span>
                      <span className="font-medium">{selectedFloor}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-real-estate-900 mb-4">Legend</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
                    <span className="text-sm text-real-estate-600">Available</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                    <span className="text-sm text-real-estate-600">Reserved</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                    <span className="text-sm text-real-estate-600">Sold</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Apartment Details Panel */}
      {selectedApartment && (
        <ApartmentDetailsPanel
          apartment={selectedApartment}
          projectId={projectId!}
          onClose={() => setSelectedApartment(null)}
          onUpdate={(updatedApartment) => {
            setApartments(prev => prev.map(apt => 
              apt.id === updatedApartment.id ? updatedApartment : apt
            ));
            setSelectedApartment(updatedApartment);
          }}
          onDelete={(apartmentId) => {
            setApartments(prev => prev.filter(apt => apt.id !== apartmentId));
            setSelectedApartment(null);
          }}
        />
      )}
    </div>
  );
};

export default ProjectViewer;
