import { ProjectSidePanel, type SidePanelState } from '../ProjectSidePanel';
import type { Apartment } from '@/entities/apartment/model/types';
import type { Project } from '@/entities/project/queries/useProjects';
import type { FieldVisibility, LayoutPhoto } from '../types';

interface SidePanelWrapperProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    state: SidePanelState | null;
    project: Project;
    language: string;
    themeColor: string;
    t: (key: string, options?: Record<string, unknown>) => unknown;
    preloadedLayoutPhotosByRooms: Record<string, LayoutPhoto[]>;
    filteredApartments: Apartment[];
    onOpenApartmentDetails: (apartment: Apartment) => void;
    onOpenFloorPlan: (floorNumber: number) => void;
    selectedCurrency: string;
    fieldVisibility: FieldVisibility;
}

export const SidePanelWrapper = ({
    open,
    onOpenChange,
    state,
    project,
    language,
    themeColor,
    t,
    preloadedLayoutPhotosByRooms,
    filteredApartments,
    onOpenApartmentDetails,
    onOpenFloorPlan,
    selectedCurrency,
    fieldVisibility,
}: SidePanelWrapperProps) => {
    const panelProps = {
        open,
        onOpenChange,
        state,
        project,
        language,
        themeColor,
        t,
        preloadedLayoutPhotosByRooms,
        filteredApartments,
        onOpenApartmentDetails,
        onOpenFloorPlan,
        selectedCurrency,
        fieldVisibility,
    };

    return (
        <>
            {/* Desktop push panel */}
            <div
                className="hidden md:block bg-white border-l border-gray-100 shadow-2xl transition-[width] duration-300 ease-in-out"
                style={{ width: open ? '35vw' : '0px' }}
            >
                {open && <ProjectSidePanel {...panelProps} />}
            </div>

            {/* Mobile overlay panel */}
            <div
                className={`md:hidden fixed right-0 top-0 h-full bg-white border-l border-gray-100 shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
                    open ? 'translate-x-0' : 'translate-x-full'
                }`}
                style={{ width: '100vw' }}
            >
                {open && <ProjectSidePanel {...panelProps} />}
            </div>
        </>
    );
};
