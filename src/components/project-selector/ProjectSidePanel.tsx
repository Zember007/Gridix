import { useMemo } from 'react';
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
  onSelectApartmentPreview: (apartment: Apartment) => void;
  onOpenApartmentDetails: (apartment: Apartment) => void;
  onOpenFloorPlan: (floorNumber: number) => void;
  widthPx?: number;
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
  if (Number.isFinite(roomsNum)) return `${roomsNum}-room`;
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
  onSelectApartmentPreview,
  onOpenApartmentDetails,
  onOpenFloorPlan,
  widthPx = 450,
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
      openFloorPlan: isRu ? 'Открыть план' : 'Open floor plan',
      details: isRu ? 'Подробнее' : 'Details',
      unitsFound: isRu ? 'помещений' : 'units',
      book: isRu ? 'Забронировать' : 'Book',
      rooms: isRu ? 'к' : 'rooms',
      floor: isRu ? 'этаж' : 'floor',
      area: isRu ? 'м²' : 'm²',
      share: isRu ? 'Поделиться' : 'Share',
      pdf: isRu ? 'PDF' : 'PDF',
      priceFrom: isRu ? 'от' : 'from',
    };
  }, [language]);

  const floorApartments = useMemo(() => {
    if (!state || state.kind !== 'floor') return [];
    return filteredApartments.filter(a => a.floor_number === state.floorNumber);
  }, [filteredApartments, state]);

  const floorStats = useMemo(() => {
    const total = floorApartments.length;
    const available = floorApartments.filter(a => a.status === 'available').length;
    const reserved = floorApartments.filter(a => a.status === 'reserved').length;
    const sold = floorApartments.filter(a => a.status === 'sold').length;
    return { total, available, reserved, sold };
  }, [floorApartments]);

  const apartmentLayoutPreview = useMemo(() => {
    if (!state || state.kind !== 'apartment') return null;
    const key = getLayoutKey(state.apartment);
    const photos = preloadedLayoutPhotosByRooms[key] || [];
    return photos[0]?.image_url ?? null;
  }, [preloadedLayoutPhotosByRooms, state]);

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
      const url = window.location.href; // In real app, build specific URL
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${project.name} - Apt ${state.apartment.apartment_number}`,
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
        'h-full border-l bg-white overflow-hidden shrink-0 shadow-2xl z-30 absolute right-0 top-0 bottom-0',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      style={{
        width: widthPx,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="h-full flex flex-col w-full">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between gap-3 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            {state.kind === 'apartment' ? (
              <div className="text-2xl font-bold text-gray-900 truncate">
                № {state.apartment.apartment_number}
              </div>
            ) : (
              <div className="text-xl font-bold text-gray-900 truncate">
                {tt('project.floor')} {state.floorNumber}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {state.kind === 'apartment' && (
              <>
                <Button variant="ghost" size="icon" onClick={handleShare} title={ui.share} className="h-9 w-9 text-gray-400 hover:text-gray-900">
                  <Share2 className="h-5 w-5" />
                </Button>
                {/* PDF Button placeholder - hidden if not implemented */}
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="shrink-0 hover:bg-gray-100 rounded-full h-9 w-9 ml-2 text-gray-400 hover:text-gray-900"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {state.kind === 'floor' ? (
            <div className="p-5 space-y-4">
              {/* Keep existing Floor logic simplified */}
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-slate-600">
                  {tt('project.found')}: <span className="font-semibold text-slate-900">{floorStats.total}</span> {ui.unitsFound}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('border', statusBadgeClass('available'))}>
                    {floorStats.available}
                  </Badge>
                  <Badge variant="outline" className={cn('border', statusBadgeClass('reserved'))}>
                    {floorStats.reserved}
                  </Badge>
                  <Badge variant="outline" className={cn('border', statusBadgeClass('sold'))}>
                    {floorStats.sold}
                  </Badge>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border bg-white">
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="text-sm font-medium">{tt('project.floorPlan')}</div>
                  <Button
                    size="sm"
                    onClick={() => onOpenFloorPlan(Number(state.floorNumber))}
                    style={{ backgroundColor: themeColor, color: '#fff' }}
                  >
                    {ui.openFloorPlan}
                  </Button>
                </div>
                <div className="p-3">
                  <FloorPlanView
                    projectId={project.id}
                    floorNumber={state.floorNumber}
                    apartments={floorApartments}
                    onApartmentSelect={onSelectApartmentPreview}
                    currency={project.currency}
                    visibleFields={[]}
                  />
                </div>
              </div>
              {floorApartments.length > 0 && (
                <div className="rounded-xl border bg-white overflow-hidden">
                  <div className="max-h-[320px] overflow-y-auto divide-y">
                    {floorApartments.slice(0, 20).map(a => (
                      <button
                        key={a.id}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                        onClick={() => onSelectApartmentPreview(a)}
                      >
                        <div className="text-sm font-semibold text-slate-900">
                          {tt('project.apartmentNumber')} {a.apartment_number}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Summary */}
              <div className="px-6 py-4 flex items-center gap-6 border-b border-gray-50 bg-white shrink-0">
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-900">
                    {(state.apartment.rooms === 0 || state.apartment.rooms === '0') ? tt('apartment.studio') : `${state.apartment.rooms}${ui.rooms}`}
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

              {/* Image */}
              <div className="relative flex-1 min-h-[300px] p-6 flex items-center justify-center bg-white cursor-zoom-in" onClick={() => onOpenApartmentDetails(state.apartment)}>
                {apartmentLayoutPreview ? (
                  <img
                    src={apartmentLayoutPreview}
                    alt="Plan"
                    className="w-full h-full object-contain mix-blend-multiply transition-transform hover:scale-105 duration-300"
                  />
                ) : (
                  <div className="text-sm text-slate-400">{tt('project.noImage')}</div>
                )}
              </div>

              {/* Price & Actions Section */}
              <div className="px-6 py-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-10 shrink-0">
                <div className="mb-6">
                  <div className="text-3xl font-bold text-gray-900 tracking-tight">
                    {formatPrice(state.apartment.price)}
                  </div>
                  {state.apartment.price && state.apartment.area && (
                    <div className="text-sm text-gray-400 mt-1 font-medium">
                      {formatPricePerMeter(state.apartment.price, state.apartment.area)} / {ui.area}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn("h-12 w-12 rounded-xl shrink-0 border-2", isFavorite(state.apartment.id) && "border-red-200 bg-red-50 text-red-500 hover:text-red-600 hover:bg-red-100 hover:border-red-300")}
                    onClick={handleFavoriteClick}
                  >
                    <Heart className={cn("h-6 w-6", isFavorite(state.apartment.id) && "fill-current")} />
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 h-12 rounded-xl text-lg font-semibold shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 active:scale-[0.98]"
                    style={{ backgroundColor: themeColor, color: '#fff' }}
                    onClick={() => onOpenApartmentDetails(state.apartment)}
                  >
                    {ui.book}
                  </Button>
                </div>
              </div>

              {/* Characteristics Table */}
              <div className="px-6 py-6 bg-gray-50 border-t border-gray-100 shrink-0">
                <h3 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-wider opacity-70">{tt('project.summary')}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0 border-dashed">
                    <span className="text-sm text-gray-500">{tt('project.apartmentNumber')}</span>
                    <span className="text-sm font-medium text-gray-900">{state.apartment.apartment_number}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0 border-dashed">
                    <span className="text-sm text-gray-500">{tt('project.floor')}</span>
                    <span className="text-sm font-medium text-gray-900">{state.apartment.floor_number}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0 border-dashed">
                    <span className="text-sm text-gray-500">{tt('project.rooms')}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(state.apartment.rooms === 0 || state.apartment.rooms === '0') ? tt('apartment.studio') : state.apartment.rooms}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0 border-dashed">
                    <span className="text-sm text-gray-500">{tt('project.area')}</span>
                    <span className="text-sm font-medium text-gray-900">{state.apartment.area} {ui.area}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0 border-dashed">
                    <span className="text-sm text-gray-500">{tt('project.status')}</span>
                    <Badge variant="outline" className={cn('border', statusBadgeClass(state.apartment.status))}>
                      {state.apartment.status === 'available'
                        ? tt('project.available')
                        : state.apartment.status === 'reserved'
                          ? tt('project.reserved')
                          : tt('project.sold')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

