import { useMemo } from 'react';
import type { Apartment } from '@/entities/apartment/model/types';
import type { Project } from '@/entities/project/queries/useProjects';
import type { UseApartmentsDataResult } from './hooks/useApartmentsData';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import FloorPlanView from '@/components/visualization/FloorPlanView';
import { cn } from '@/shared/lib/utils';
import { X } from 'lucide-react';

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
  widthPx = 520,
}: Props) => {
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
    };
  }, [language]);
  const headerTitle = useMemo(() => {
    if (!state) return '';
    if (state.kind === 'floor') return `${tt('project.floor')} ${state.floorNumber}`;
    return `${tt('project.apartmentNumber')} ${state.apartment.apartment_number}`;
  }, [state, tt]);

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

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        'h-full border-l bg-white overflow-hidden shrink-0',
        // closed: no width, no interaction
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      style={{
        width: open ? widthPx : 0,
        transition: 'width 300ms ease',
      }}
    >
      <div className="h-full flex flex-col">
        <div className="px-5 py-4 border-b flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-semibold truncate">{headerTitle}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!state ? null : state.kind === 'floor' ? (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-slate-600">
                  {tt('project.found')}: <span className="font-semibold text-slate-900">{floorStats.total}</span> {ui.unitsFound}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('border', statusBadgeClass('available'))}>
                    {tt('project.available')}: {floorStats.available}
                  </Badge>
                  <Badge variant="outline" className={cn('border', statusBadgeClass('reserved'))}>
                    {tt('project.reserved')}: {floorStats.reserved}
                  </Badge>
                  <Badge variant="outline" className={cn('border', statusBadgeClass('sold'))}>
                    {tt('project.sold')}: {floorStats.sold}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border bg-white">
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="text-sm font-medium">{tt('project.floorPlan')}</div>
                  <Button
                    size="sm"
                    onClick={() => onOpenFloorPlan(state.floorNumber)}
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
                  <div className="px-4 py-3 border-b text-sm font-medium">{tt('project.apartmentsList')}</div>
                  <div className="max-h-[320px] overflow-y-auto divide-y">
                    {floorApartments.slice(0, 20).map(a => (
                      <button
                        key={a.id}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                        onClick={() => onSelectApartmentPreview(a)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {tt('project.apartmentNumber')} {a.apartment_number}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {(a.rooms === 0 || a.rooms === '0') ? tt('apartment.studio') : `${a.rooms}`} • {a.area} м²
                            </div>
                          </div>
                          <Badge variant="outline" className={cn('border shrink-0', statusBadgeClass(a.status))}>
                            {a.status === 'available'
                              ? tt('project.available')
                              : a.status === 'reserved'
                                ? tt('project.reserved')
                                : tt('project.sold')}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="rounded-xl border bg-white overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div className="text-sm font-medium">{tt('project.layoutPreview')}</div>
                  <Badge variant="outline" className={cn('border', statusBadgeClass(state.apartment.status))}>
                    {state.apartment.status === 'available'
                      ? tt('project.available')
                      : state.apartment.status === 'reserved'
                        ? tt('project.reserved')
                        : tt('project.sold')}
                  </Badge>
                </div>
                <div className="p-4 bg-slate-50">
                  {apartmentLayoutPreview ? (
                    <img
                      src={apartmentLayoutPreview}
                      alt={tt('project.layoutPreview')}
                      className="w-full h-auto object-contain rounded-lg bg-white"
                    />
                  ) : (
                    <div className="text-sm text-slate-500">{tt('project.noImage')}</div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border bg-white overflow-hidden">
                <div className="px-4 py-3 border-b text-sm font-medium">{tt('project.summary')}</div>
                <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="text-slate-600">{tt('project.floor')}</div>
                  <div className="text-slate-900 font-medium">{state.apartment.floor_number}</div>
                  <div className="text-slate-600">{tt('project.rooms')}</div>
                  <div className="text-slate-900 font-medium">{String(state.apartment.rooms)}</div>
                  <div className="text-slate-600">{tt('project.area')}</div>
                  <div className="text-slate-900 font-medium">{state.apartment.area} м²</div>
                  <div className="text-slate-600">{tt('project.price')}</div>
                  <div className="text-slate-900 font-medium">
                    {state.apartment.price ? new Intl.NumberFormat('ru-RU').format(state.apartment.price) : tt('project.onRequest')}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => onOpenApartmentDetails(state.apartment)}
                  style={{ backgroundColor: themeColor, color: '#fff' }}
                >
                  {ui.details}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenFloorPlan(state.apartment.floor_number)}
                >
                  {tt('project.floorPlan')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

