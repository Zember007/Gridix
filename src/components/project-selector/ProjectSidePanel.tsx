import { useCallback, useMemo } from 'react';
import type { Apartment } from '@/entities/apartment/model/types';
import type { Project } from '@/entities/project/queries/useProjects';
import type { UseApartmentsDataResult } from './hooks/useApartmentsData';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import FloorPlanView from '@/components/visualization/FloorPlanView';
import { cn } from '@/shared/lib/utils';
import { Share2, X, Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

export type SidePanelState =
  | { kind: 'floor'; floorNumber: number }
  | { kind: 'apartment'; apartment: Apartment };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: SidePanelState | null;
  project: Project;
  language: string;
  themeColor: string;
  // i18next TFunction may return string or rich objects depending on options
  t: (key: string, options?: Record<string, unknown>) => unknown;
  preloadedLayoutPhotosByRooms: UseApartmentsDataResult['preloadedLayoutPhotosByRooms'];
  filteredApartments: Apartment[];
  // onSelectApartmentPreview removed as per instruction
  onOpenApartmentDetails: (apartment: Apartment) => void;
  onOpenFloorPlan: (floorNumber: number) => void;
};

const statusBadgeClass = (status: Apartment['status']) => {
  switch (status) {
    case 'available':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'reserved':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'sold':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return '';
  }
};

const getLayoutKey = (apartment: Apartment) => {
  if (apartment.type !== 'apartment') return apartment.type;
  if (apartment.rooms === 'free_layout') return 'free_layout';
  const roomsNum = typeof apartment.rooms === 'number' ? apartment.rooms : Number(apartment.rooms);
  if (Number.isFinite(roomsNum) && roomsNum === 0) return 'studio';
  if (Number.isFinite(roomsNum)) return `${ roomsNum } -room`;
  return 'apartment';
};

export const ProjectSidePanel = ({
  open,
  onOpenChange,
  state,
  project,
  language,
  themeColor,
  t,
  preloadedLayoutPhotosByRooms,
  filteredApartments,
  // onSelectApartmentPreview removed from destructuring
  onOpenApartmentDetails,
  onOpenFloorPlan,
}: Props) => {
  const { toggleFavorite, isFavorite } = useFavorites(project.id);

  const tt = useMemo(
    () => (key: string, options?: Record<string, unknown>) => String(t(key, options)),
    [t],
  );

  const ui = useMemo(() => {
    const isRu = language === 'ru';
    return {
      open: isRu ? 'Открыть' : 'Open',
      openFloorPlan: isRu ? 'Открыть план этажа' : 'Open floor plan',
      details: isRu ? 'Подробнее' : 'Details',
      unitsFound: isRu ? 'помещений' : 'units',
      book: isRu ? 'Забронировать' : 'Book',
      rooms: isRu ? 'к' : 'rooms',
      floor: isRu ? 'этаж' : 'floor',
      area: isRu ? 'м²' : 'm²',
      share: isRu ? 'Поделиться' : 'Share',
      priceFrom: isRu ? 'от' : 'from',
      available: isRu ? 'Свободно' : 'Available',
      reserved: isRu ? 'Забронировано' : 'Reserved',
      sold: isRu ? 'Продано' : 'Sold',
      studio: isRu ? 'Студия' : 'Studio',
      found: isRu ? 'Найдено' : 'Found',
      summary: isRu ? 'Характеристики' : 'Summary',
      apartmentNumber: isRu ? 'Номер квартиры' : 'Apartment number',
      status: isRu ? 'Статус' : 'Status',
      onRequest: isRu ? 'По запросу' : 'On request',
    };
  }, [language]);

  const floorApartments = useMemo(() => {
    if (!state || state.kind !== 'floor') return [];
    return filteredApartments.filter(a => a.floor_number === state.floorNumber);
  }, [filteredApartments, state]);

  // Safely get image URL
  const getApartmentImage = useCallback((apt: Apartment) => {
    // Check property existence safely or fallback to preloaded images
    const imgUrl = (apt as { layout_image_url?: string | null }).layout_image_url;
    if (imgUrl) return imgUrl;

    // Fallback to preloaded category image
    const key = getLayoutKey(apt);
    const photos = preloadedLayoutPhotosByRooms[key] || [];
    return photos[0]?.image_url ?? null;
  }, [preloadedLayoutPhotosByRooms]);

  const currentApartmentImage = useMemo(() => {
    if (!state || state.kind !== 'apartment') return null;
    return getApartmentImage(state.apartment);
  }, [state, getApartmentImage]);


  const handleFavoriteClick = () => {
    if (state && state.kind === 'apartment') {
      toggleFavorite({
        id: state.apartment.id,
        project_id: project.id,
        apartment_number: state.apartment.apartment_number,
        rooms: typeof state.apartment.rooms === 'number' ? state.apartment.rooms : 0,
        area: state.apartment.area,
        price: state.apartment.price || 0,
        status: state.apartment.status,
        floor_number: state.apartment.floor_number,
      });
    }
  };

  const handleShare = async () => {
    if (state?.kind === 'apartment') {
      const url = window.location.href;
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${ project.name } - Apt ${ state.apartment.apartment_number } `,
            url,
          });
        } catch (err) {
          console.error('Share failed', err);
        }
      } else {
        await navigator.clipboard.writeText(url);
        // Toast or feedback could go here
      }
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return tt('project.onRequest');
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: project.currency || 'RUB', maximumFractionDigits: 0 }).format(price);
  };

  const formatPricePerMeter = (price?: number, area?: number) => {
    if (!price || !area) return '';
    const ppm = Math.round(price / area);
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: project.currency || 'RUB', maximumFractionDigits: 0 }).format(ppm);
  };

  if (!state) return null;

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        'sticky top-0 bg-white overflow-y-auto flex flex-col w-full max-h-screen',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
        <div>
          {state.kind === 'apartment' ? (
            <h2 className="text-xl font-bold text-gray-900">
               № {state.apartment.apartment_number}
            </h2>
          ) : (
            <h2 className="text-xl font-bold text-gray-900">
              {state.floorNumber} {ui.floor}
            </h2>
          )}
        </div>
        <div className="flex items-center gap-2">
          {state.kind === 'apartment' && (
             <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-600"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
              </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-gray-600"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {state.kind === 'floor' ? (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Floor Preview Section */}
            <div className="p-6 border-b border-gray-100 shrink-0">
              <div className="text-sm text-gray-500 mb-4">{project.name}</div>
              
              <div className="relative  w-full bg-gray-50 rounded-lg overflow-hidden mb-4 flex items-center justify-center border border-gray-100">
                  <FloorPlanView
                    floorNumber={state.floorNumber}
                    projectId={project.id}
                  />
              </div>
              
              <div className="flex justify-center">
                <Button 
                    variant="link" 
                    className="text-blue-600 font-medium"
                    onClick={() => onOpenFloorPlan(Number(state.floorNumber))}
                >
                    {ui.openFloorPlan}
                </Button>
              </div>
            </div>

            {/* Apartment List */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3 custom-scrollbar">
              <div className="text-sm text-gray-500 mb-2 px-1">
                {tt('project.found')}: {floorApartments.length}
              </div>

              {floorApartments.map(apt => (
                  <div 
                    key={apt.id} 
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all duration-200" 
                    onClick={() => onOpenApartmentDetails(apt)}
                  >
                      {/* Layout Image Thumbnail */}
                      <div className="w-20 h-20 bg-gray-50 rounded-lg shrink-0 overflow-hidden flex items-center justify-center p-1">
                          {getApartmentImage(apt) ? (
                            <img src={getApartmentImage(apt)!} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                          ) : (
                            <span className="text-[10px] text-gray-300 text-center leading-tight">No Img</span>
                          )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex flex-col justify-between grow min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                                <div className="font-bold text-gray-900 border-b border-gray-100 pb-1 mb-1 inline-block">
                                № {apt.apartment_number}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {(apt.rooms === 0 || apt.rooms === '0') ? tt('apartment.studio') : `${ apt.rooms }${ ui.rooms } `}, {apt.area} {ui.area}
                                </div>
                            </div>
                            <Badge variant="outline" className={cn('border ml-2 whitespace-nowrap', statusBadgeClass(apt.status))}>
                                {apt.status === 'available' ? ui.available : apt.status === 'reserved' ? ui.reserved : ui.sold}
                            </Badge>
                          </div>
                          
                          <div className="font-bold text-lg mt-1 text-gray-900">
                            {formatPrice(apt.price || 0)}
                          </div>
                      </div>
                  </div>
                ))
              }
            </div>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          {/* Summary */}
          <div className="px-6 py-4 flex items-center gap-6 border-b border-gray-50 bg-white shrink-0">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900">
                {(state.apartment.rooms === 0 || state.apartment.rooms === '0') ? tt('apartment.studio') : `${ state.apartment.rooms }${ ui.rooms } `}
              </span>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900">{state.apartment.area} <span className="text-base font-medium text-gray-500">{ui.area}</span></span>
            </div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900">{state.apartment.floor_number} <span className="text-base font-medium text-gray-500">{ui.floor}</span></span>
            </div>
          </div>

          {/* Plan Image */}
          <div className="relative aspect-square w-full shrink-0 p-6 bg-white overflow-hidden flex items-center justify-center border-b border-gray-100">
            <div className="relative w-full h-full cursor-zoom-in group">
              {currentApartmentImage ? (
                <img
                  src={currentApartmentImage}
                  alt="Plan"
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                  onClick={() => onOpenApartmentDetails(state.apartment)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300 text-sm">No Image</div>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="px-6 py-4 shrink-0 bg-white">
            <div className="flex flex-col">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(state.apartment.price ?? undefined)}
                </span>
                <span className="text-sm text-gray-500 font-medium">
                  {formatPricePerMeter(state.apartment.price ?? undefined, state.apartment.area)} / {ui.area}
                </span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 grid grid-cols-[auto_1fr] gap-3 shrink-0 bg-white border-b border-gray-100">
              <Button
                variant="outline"
                size="icon"
                className={cn("h-12 w-12 rounded-xl border-gray-200 hover:bg-gray-50 hover:text-red-500", isFavorite(state.apartment.id) && "border-red-200 bg-red-50 text-red-500")}
                onClick={(e) => { e.stopPropagation(); handleFavoriteClick(); }}
              >
                <Heart className={cn("h-6 w-6 transition-colors", isFavorite(state.apartment.id) ? "fill-red-500 text-red-500" : "")} />
              </Button>
              <Button
                className="h-12 text-lg font-semibold rounded-xl w-full text-white shadow-lg transition-all active:scale-[0.98]"
                style={{ backgroundColor: themeColor }}
                onClick={() => onOpenApartmentDetails(state.apartment)}
              >
                  {ui.book}
              </Button>
          </div>

          {/* Characteristics */}
          <div className="p-6 pb-12">
            <h3 className="text-lg font-bold mb-4 border-b border-gray-100 pb-2">
              {ui.summary}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{ui.apartmentNumber}</span>
                <span className="font-medium text-gray-900">
                  {state.apartment.apartment_number}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{ui.status}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'border ml-2 whitespace-nowrap',
                    statusBadgeClass(state.apartment.status),
                  )}
                >
                  {state.apartment.status === 'available'
                    ? ui.available
                    : state.apartment.status === 'reserved'
                      ? ui.reserved
                      : ui.sold}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

