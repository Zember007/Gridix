import { Suspense, lazy, type ReactNode } from 'react';
import { Sheet, SheetContent } from '@gridix/ui';
import type { Apartment } from '@/entities/apartment/model/types';

const ApartmentDetailsPage = lazy(() => import('@/pages/ApartmentDetailsPage'));

interface ApartmentDetailsSheetProps {
    open: boolean;
    onClose: () => void;
    apartment: Apartment | null;
    projectId: string;
    loaderFallback: ReactNode;
}

export const ApartmentDetailsSheet = ({
    open,
    onClose,
    apartment,
    projectId,
    loaderFallback,
}: ApartmentDetailsSheetProps) => (
    <Sheet
        open={open}
        onOpenChange={(isOpen) => {
            if (!isOpen) onClose();
        }}
    >
        <SheetContent
            side="right"
            noCloseButton
            className="p-0 w-full !max-w-full z-[60] overflow-y-auto"
        >
            {apartment && (
                <Suspense fallback={loaderFallback}>
                    <ApartmentDetailsPage
                        useId={true}
                        apartmentIdProp={apartment.id}
                        projectIdProp={projectId}
                        onClose={onClose}
                    />
                </Suspense>
            )}
        </SheetContent>
    </Sheet>
);
