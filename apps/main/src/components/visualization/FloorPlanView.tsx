import {useMemo, useRef, useState, useEffect, useCallback} from 'react';
import {supabase} from "@gridix/utils/api";
import {Apartment} from '@/entities/apartment/model/types';
import {useLanguage} from '@/contexts/LanguageContext';
import ApartmentPopup from './ApartmentPopup';
import {FieldSetting} from '@/hooks/useFields';
import PolygonAnnotator from './polygon-editor/PolygonAnnotator';
import type {Shape} from './polygon-editor/GeometryShapes';
import InteractionHint from './InteractionHint';
import {Spinner} from "@/shared/ui/Spinner";
import {useProject} from "@/entities/project/queries/useProjects.ts";

interface FloorPlanViewProps {
    projectId: string;
    floorNumber: number;
    apartments?: Apartment[];
    onApartmentSelect?: (apartment: Apartment) => void;
    currency?: string | null;
    visibleFields?: FieldSetting[];
    selectedCurrency?: string;
}

interface FloorPlan {
    id: string;
    image_url: string | null;
}

const FloorPlanView = ({
                           projectId,
                           floorNumber,
                           apartments,
                           onApartmentSelect,
                           currency,
                           visibleFields = [],
                           selectedCurrency,
                       }: FloorPlanViewProps) => {
    const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
    const {project} = useProject(projectId);
    const [loading, setLoading] = useState(true);
    const {t} = useLanguage();
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
    const viewerWrapRef = useRef<HTMLDivElement>(null);
    const lastMousePosRef = useRef<{ x: number; y: number }>({x: 0, y: 0});
    useEffect(() => {
        loadFloorPlan();
        loadSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, floorNumber]);

    const loadFloorPlan = async () => {
        try {
            setLoading(true);
            const {data, error} = await supabase
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
            const {data, error} = await supabase
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
                    colors: {available: '#3b82f6', reserved: '#f59e0b', sold: '#ef4444'},
                    opacity: {normal: 0.3, hover: 0.5},
                    display: {showNumbers: true, showTooltip: false, showArea: false, showPrice: false},
                    hoverEffects: {glow: true, colorChange: true, opacityChange: true},
                });
            }
        } catch (e) {
            setFloorSettings({
                colors: {available: '#3b82f6', reserved: '#f59e0b', sold: '#ef4444'},
                opacity: {normal: 0.3, hover: 0.5},
                display: {showNumbers: true, showTooltip: false, showArea: false, showPrice: false},
                hoverEffects: {glow: true, colorChange: true, opacityChange: true},
            });
        }
    };

    const getApartmentColor = useCallback((apartment: Apartment) => {
        const colors = floorSettings?.colors;
        if (colors) {
            switch (apartment.status) {
                case 'available':
                    return colors.available;
                case 'reserved':
                    return colors.reserved;
                case 'sold':
                    return colors.sold;
                default:
                    return colors.available;
            }
        }
        return '#6b7280';
    }, [floorSettings]);

    const apartmentById = useMemo(() => {
        const map = new Map<string, Apartment>();
        (apartments ?? []).forEach((a) => map.set(a.id, a));
        return map;
    }, [apartments]);

    const shapes: Shape[] = useMemo(() => {
        return (apartments ?? [])
            .filter((a) => Array.isArray(a.polygon) && a.polygon.length >= 3)
            .map((a) => ({
                id: a.id,
                type: 'polygon',
                points: a.polygon,
                color: getApartmentColor(a),
                isSelected: false,
            }));
    }, [apartments, getApartmentColor]);

    const labelsById = useMemo(() => {
        const out: Record<string, string> = {};
        (apartments ?? []).forEach((a) => {
            out[a.id] = String(a.apartment_number ?? '');
        });
        return out;
    }, [apartments]);

    const getStyleById = useCallback((id: string) => {
        const apt = apartmentById.get(id);
        const baseColor = apt ? getApartmentColor(apt) : '#6b7280';
        return {
            fill: baseColor,
            fillOpacity: floorSettings?.opacity?.normal ?? 0.3,
            stroke: baseColor,
            strokeOpacity: 1,
            strokeWidth: 2,
        };
    }, [apartmentById, floorSettings, getApartmentColor]);

    const hidePopup = useCallback(() => {
        setHoveredApartment(null);
        setShowPopup(false);
    }, []);

    const updateMousePos = useCallback((e: React.MouseEvent) => {
        const rect = viewerWrapRef.current?.getBoundingClientRect();
        if (!rect) return;
        lastMousePosRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }, []);

    const getThemeColor = () => {
        return (project as unknown as Record<string, unknown>)?.theme_color as string || '#000000';
    };
    if (loading) {
        return (
            <div
                className={`h-full grow flex items-center justify-center p-6 ${apartments ? 'min-h-[400px]' : 'min-h-[100px]'}`}
            >
                <Spinner size="md" style={{borderColor: getThemeColor()}} />
            </div>
        );
    }

    if (!floorPlan || !floorPlan.image_url) {
        return (
            <div
                className={`h-full grow flex flex-col items-center justify-center p-6 text-gray-500 ${apartments ? 'min-h-[400px]' : 'min-h-[100px]'}`}
            >
                <p>План {floorNumber} этажа не загружен</p>
                <p className="text-sm mt-1">Обратитесь к администратору для загрузки плана этажа</p>
            </div>
        );
    }

    return (
        <div className='h-full grow rounded-none flex flex-col p-6'>


            <div
                ref={viewerWrapRef}
                className="relative bg-gray-50 rounded-lg  flex-1 flex items-center justify-center"
                onMouseMove={updateMousePos}
                onMouseLeave={hidePopup}
            >
                <PolygonAnnotator
                    imageUrl={floorPlan.image_url}
                    mode="view"
                    shapes={shapes}
                    showLabels={floorSettings?.display?.showNumbers !== false}
                    labelsById={labelsById}
                    getStyleById={getStyleById}
                    zoomToSelection={true}
                    onHoverAnnotationId={(id) => {
                        if (!(floorSettings?.display?.showTooltip ?? false)) return;
                        if (!id) {
                            hidePopup();
                            return;
                        }

                        const apt = apartmentById.get(id);
                        if (!apt) {
                            hidePopup();
                            return;
                        }

                        setHoveredApartment(apt);
                        setShowPopup(true);
                        setPopupPosition(lastMousePosRef.current);
                    }}
                    onSelectAnnotationId={(id) => {
                        // Always hide tooltip on click
                        hidePopup();

                        if (!id) {
                            return;
                        }

                        const apt = apartmentById.get(id);
                        if (apt && onApartmentSelect) onApartmentSelect(apt);
                    }}
                    className={`w-full ${apartments ? 'h-full' : 'min-h-[100px] h-[250px] md:h-[300px]'}`}
                />

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
                        selectedCurrency={selectedCurrency}
                    />
                )}
                <InteractionHint storageKey="floor-plan"/>
            </div>

            {apartments?.length && onApartmentSelect && (
                <>
                    <div className="mt-4 flex items-center gap-6 md:text-sm text-[10px] flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded opacity-60"
                                 style={{backgroundColor: floorSettings?.colors?.available ?? '#3b82f6'}}
                            ></div>
                            <span>{t('project.available')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded opacity-60"
                                 style={{backgroundColor: floorSettings?.colors?.reserved ?? '#f59e0b'}}
                            ></div>
                            <span>{t('project.reserved')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded opacity-60"
                                 style={{backgroundColor: floorSettings?.colors?.sold ?? '#ef4444'}}
                            ></div>
                            <span>{t('project.sold')}</span>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
};

export default FloorPlanView;
