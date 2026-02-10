import { Suspense, lazy } from 'react';
import ApartmentFloorPlan from '../../apartment/ApartmentFloorPlan';
import type { Apartment } from '@/entities/apartment/model/types';
import type { Project } from '@/entities/project/queries/useProjects';
import type { FieldSetting } from '@/hooks/useFields';

const FloorSelector = lazy(() =>
    import('../FloorSelector').then(module => ({ default: module.FloorSelector })),
);

interface FloorPlanSectionProps {
    project: Project;
    filteredApartments: Apartment[];
    allApartments: Apartment[];
    selectedFloorForPlan: number | null;
    setSelectedFloorForPlan: (floor: number | null) => void;
    onApartmentSelect: (apartment: Apartment) => void;
    visibleFields: FieldSetting[];
    getUniqueFloors: () => number[];
    themeColor: string;
    showOnlyAvailable: boolean;
    isMobile: boolean;
}

export const FloorPlanSection = ({
    project,
    filteredApartments,
    allApartments,
    selectedFloorForPlan,
    setSelectedFloorForPlan,
    onApartmentSelect,
    visibleFields,
    getUniqueFloors,
    themeColor,
    showOnlyAvailable,
    isMobile,
}: FloorPlanSectionProps) => (
    <div className="w-full bg-white min-h-[600px] h-full">
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-full`}>
            {/* Main floor plan area */}
            <div className="flex-1 relative">
                <ApartmentFloorPlan
                    project={project}
                    projectId={project.id}
                    apartments={filteredApartments.filter(apt =>
                        selectedFloorForPlan !== null
                            ? apt.floor_number === selectedFloorForPlan
                            : true,
                    )}
                    onApartmentSelect={onApartmentSelect}
                    selectedFloorNumber={selectedFloorForPlan ?? 0}
                    visibleFields={visibleFields}
                />
            </div>

            <Suspense fallback={null}>
                <FloorSelector
                    selectedFloorForPlan={selectedFloorForPlan}
                    setSelectedFloorForPlan={setSelectedFloorForPlan}
                    getUniqueFloors={getUniqueFloors}
                    themeColor={themeColor}
                    apartments={allApartments}
                    showOnlyAvailable={showOnlyAvailable}
                    filteredApartments={filteredApartments}
                />
            </Suspense>
        </div>
    </div>
);
