import { Suspense, lazy, useEffect, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTitle } from "@gridix/ui";
import type { Apartment } from "@/entities/apartment/model/types";

const ApartmentDetailsPage = lazy(() => import("@/pages/ApartmentDetailsPage"));

let widgetScrollLockCount = 0;
let prevBodyOverflow: string | null = null;
let prevBodyOverscrollBehavior: string | null = null;
let prevHtmlOverflow: string | null = null;
let prevHtmlOverscrollBehavior: string | null = null;

interface ApartmentDetailsSheetProps {
  open: boolean;
  onClose: () => void;
  apartment: Apartment | null;
  projectId: string;
  loaderFallback: ReactNode;
  portalContainer?: HTMLElement | null;
  isWidget?: boolean;
}

export const ApartmentDetailsSheet = ({
  open,
  onClose,
  apartment,
  projectId,
  loaderFallback,
  portalContainer,
  isWidget = false,
}: ApartmentDetailsSheetProps) => {
  useEffect(() => {
    if (!isWidget || !open || typeof document === "undefined") return;

    const { body, documentElement } = document;

    if (widgetScrollLockCount === 0) {
      prevBodyOverflow = body.style.overflow;
      prevBodyOverscrollBehavior = body.style.overscrollBehavior;
      prevHtmlOverflow = documentElement.style.overflow;
      prevHtmlOverscrollBehavior = documentElement.style.overscrollBehavior;

      body.style.overflow = "hidden";
      body.style.overscrollBehavior = "none";
      documentElement.style.overflow = "hidden";
      documentElement.style.overscrollBehavior = "none";
    }

    widgetScrollLockCount += 1;

    return () => {
      widgetScrollLockCount = Math.max(0, widgetScrollLockCount - 1);

      if (widgetScrollLockCount === 0) {
        body.style.overflow = prevBodyOverflow ?? "";
        body.style.overscrollBehavior = prevBodyOverscrollBehavior ?? "";
        documentElement.style.overflow = prevHtmlOverflow ?? "";
        documentElement.style.overscrollBehavior =
          prevHtmlOverscrollBehavior ?? "";
      }
    };
  }, [isWidget, open]);

  return (
    <Sheet
      modal={!isWidget}
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <SheetContent
        side="right"
        noCloseButton
        className="z-[60] w-full !max-w-full overflow-y-auto p-0"
        portalContainer={portalContainer}
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">
          {apartment
            ? `Apartment ${apartment.apartment_number}`
            : "Apartment details"}
        </SheetTitle>
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
};
