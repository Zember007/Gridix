import { useMemo, useState } from 'react';
import type { Apartment } from '@/entities/apartment/model/types';
import type { Project } from '@/entities/project/queries/useProjects';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/shared/ui/tooltip';
import { Badge } from '@/shared/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

type ApartmentWithSection = Apartment & {
    section_number?: number | null;
};

type Props = {
    project: Project;
    apartments: Apartment[];
    onApartmentSelect: (apartment: Apartment) => void;
    onOpenFloorPlan: (floorNumber: number) => void;
    themeColor: string;
    // Extra props can be passed from parent; keep them optional for TS safety
    language?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t?: (key: string, options?: Record<string, any>) => string;
};

// Helper to determine text/hover classes based on status
const getStatusColorClass = (status: Apartment['status']) => {
    switch (status) {
        case 'available':
            return 'text-white hover:scale-110';
        case 'reserved':
            return 'text-gray-800';
        case 'sold':
            return 'text-gray-800 opacity-70';
        default:
            return 'text-gray-800 opacity-50';
    }
};

export const ChessView = ({
    project,
    apartments,
    onApartmentSelect,
    onOpenFloorPlan,
}: Props) => {
    const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);

    const { t } = useLanguage();

    // Group apartments by floor
    // Sort floors descending (top to bottom)
    const floorsData = useMemo(() => {
        const grouped: Record<number, ApartmentWithSection[]> = {};
        apartments.forEach((aptRaw) => {
            const apt = aptRaw as ApartmentWithSection;
            const f = apt.floor_number;
            if (!grouped[f]) grouped[f] = [];
            grouped[f].push(apt);
        });

        const floorNumbers = Object.keys(grouped)
            .map(Number)
            .sort((a, b) => b - a);

        return floorNumbers.map((f) => {
            // Sort by section then number
            const apts = ((grouped[f] ?? []) as ApartmentWithSection[]).sort((a, b) => {
                const sectionA = a.section_number ?? 0;
                const sectionB = b.section_number ?? 0;
                if (sectionA !== sectionB) {
                    return sectionA - sectionB;
                }
                const numA = parseInt(a.apartment_number.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.apartment_number.replace(/\D/g, '')) || 0;
                return numA - numB;
            });
            return { floor: f, apartments: apts };
        });
    }, [apartments]);

    const floorSettings = project.polygon_settings_floor as
        | {
            colors?: { available?: string; reserved?: string; sold?: string };
        }
        | undefined;

    const colors = {
        available: floorSettings?.colors?.available || '#3b82f6',
        reserved: floorSettings?.colors?.reserved || '#f59e0b',
        sold: floorSettings?.colors?.sold || '#ef4444',
    };


    return (
        <div className="flex flex-col h-full w-full bg-white overflow-hidden select-none">
            <div className="px-6 py-4 flex gap-4 shrink-0 border-b border-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: colors.available }}
                    ></div>
                    <span>{t('project.available')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: colors.reserved }}
                    ></div>
                    <span>{t('project.reserved')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: colors.sold }}
                    ></div>
                    <span>{t('project.sold')}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar">
                <TooltipProvider delayDuration={100}>
                    <div className="flex flex-col gap-1 min-w-max py-4">
                        {floorsData.map(({ floor, apartments }) => (
                            <div
                                key={floor}
                                className="flex items-center hover:bg-slate-50 transition-colors rounded-lg gap-4 px-2 py-0.5 group min-h-[40px]"
                                onMouseEnter={() => setHoveredFloor(floor)}
                                onMouseLeave={() => setHoveredFloor(null)}
                            >
                                {/* Left Floor Number */}
                                <div className="w-8 text-sm text-gray-400 font-medium shrink-0 text-right ">
                                    {floor}
                                </div>

                                {/* Apartments Grid Row */}
                                <div className="flex items-center flex-1 overflow-x-auto no-scrollbar max-w-[calc(100vw-32px-100px-48px)]">
                                    {apartments.map((aptRaw, index) => {
                                        const apt = aptRaw as ApartmentWithSection;
                                        const prev = index > 0 ? (apartments[index - 1] as ApartmentWithSection) : undefined;
                                        const isNewSection = !!prev && apt.section_number !== prev.section_number;
                                        const fillColor =
                                            apt.status === 'reserved'
                                                ? colors.reserved
                                                : apt.status === 'sold'
                                                    ? colors.sold
                                                    : colors.available;

                                        return (
                                            <div
                                                key={apt.id}
                                                className={cn('flex items-center', isNewSection && 'ml-4 lg:ml-8')}
                                            >
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => onApartmentSelect(apt)}
                                                            className={cn(
                                                                'w-8 h-8 rounded shrink-0 flex items-center justify-center text-xs font-bold transition-all shadow-sm mx-[2px]',
                                                                getStatusColorClass(apt.status),
                                                            )}
                                                            style={{ backgroundColor: fillColor }}
                                                        >
                                                            {apt.rooms == 0 ? 'S' : apt.rooms}
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="p-0 border-none shadow-xl rounded-xl">
                                                        <div className="bg-white p-4 rounded-xl border border-gray-100 min-w-[200px]">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[10px] uppercase font-bold px-1.5 h-5">
                                                                    {apt.rooms} Квартира
                                                                </Badge>
                                                                <span className="text-sm font-bold text-gray-900">№{apt.apartment_number}</span>
                                                            </div>
                                                            <div className="font-bold text-lg mb-1">
                                                                {Number(apt.price).toLocaleString('ru-RU')} ₽
                                                            </div>
                                                            <div className="text-xs text-gray-500 font-medium">
                                                                {apt.area} м² • {Math.round(Number(apt.price) / Number(apt.area)).toLocaleString('ru-RU')} ₽/м²
                                                            </div>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Right Interactions (Hover) */}
                                <div className=" flex items-center shrink-0 justify-end relative">
                                    {/* "Plan X floor" - Visible on Hover */}
                                    <div className={cn(
                                        "absolute right-0 transition-opacity duration-200 flex items-center justify-end",
                                        hoveredFloor === floor ? "opacity-100 z-10" : "opacity-0"
                                    )}>
                                        <Button
                                            variant="link"
                                            className="text-blue-600 h-8 px-0 text-sm font-normal whitespace-nowrap"
                                            onClick={() => onOpenFloorPlan(floor)}
                                        >
                                            {t('project.plan_floor', { floor })}
                                        </Button>
                                    </div>

                                    {/* Floor Number - Visible when NOT hovering */}
                                    <div className={cn(
                                        "text-sm text-gray-400 font-medium transition-opacity duration-200",
                                        hoveredFloor === floor ? "opacity-0" : "opacity-100"
                                    )}>
                                        {floor}
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                </TooltipProvider>
            </div>
        </div>
    );
};

