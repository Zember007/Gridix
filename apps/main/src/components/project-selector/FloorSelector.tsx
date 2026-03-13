import { useIsMobile } from "@gridix/ui";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@gridix/ui";
import {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
  type PointerEvent,
  type TouchEvent,
  type MouseEvent,
} from "react";
import { Apartment } from "@/entities/apartment/model/types";

interface FloorSelectorProps {
  selectedFloorForPlan: number | null;
  setSelectedFloorForPlan: (floor: number) => void;
  getUniqueFloors: () => number[];
  themeColor: string;
  apartments: Apartment[];
  showOnlyAvailable: boolean;
  filteredApartments: Apartment[];
}

export const FloorSelector = ({
  selectedFloorForPlan,
  setSelectedFloorForPlan,
  getUniqueFloors,
  themeColor,
  apartments: _apartments,
  showOnlyAvailable,
  filteredApartments,
}: FloorSelectorProps) => {
  const isMobile = useIsMobile();

  // Filter floors based on:
  // 1. If showOnlyAvailable is true, only show floors with at least one available apartment (from filteredApartments)
  // 2. Always show only floors with at least one apartment that has a polygon
  const floors = useMemo(() => {
    const allFloors = getUniqueFloors();

    return allFloors.filter((floor) => {
      if (showOnlyAvailable) {
        const hasAvailable = filteredApartments.some(
          (apt) => apt.floor_number === floor && apt.status === "available",
        );
        return hasAvailable;
      }

      return true;
    });
  }, [getUniqueFloors, showOnlyAvailable, filteredApartments]);

  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const isCarouselInteractingRef = useRef(false);
  const swipeGuardRef = useRef({ x: 0, y: 0, moved: false });

  const blockArrowDragStart = useCallback(
    (
      event:
        | PointerEvent<HTMLButtonElement>
        | TouchEvent<HTMLButtonElement>
        | MouseEvent<HTMLButtonElement>,
    ) => {
      event.stopPropagation();
    },
    [],
  );

  const beginSwipeGuard = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      swipeGuardRef.current = {
        x: event.clientX,
        y: event.clientY,
        moved: false,
      };
    },
    [],
  );

  const trackSwipeGuard = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const dx = Math.abs(event.clientX - swipeGuardRef.current.x);
      const dy = Math.abs(event.clientY - swipeGuardRef.current.y);
      if (dx > 8 || dy > 8) {
        swipeGuardRef.current.moved = true;
      }
    },
    [],
  );

  const handleFloorButtonClick = useCallback(
    (floor: number) => {
      if (swipeGuardRef.current.moved) {
        swipeGuardRef.current.moved = false;
        return;
      }

      // A plain tap should not stay blocked by carousel drag state.
      isCarouselInteractingRef.current = false;
      setSelectedFloorForPlan(floor);

      if (!carouselApi) return;
      const index = floors.findIndex((f) => f === floor);
      if (index >= 0) {
        carouselApi.scrollTo(index, false);
      }
    },
    [carouselApi, floors, setSelectedFloorForPlan],
  );

  useEffect(() => {
    if (!carouselApi) return;
    if (selectedFloorForPlan == null) return;

    const index = floors.findIndex((f) => f === selectedFloorForPlan);
    if (index < 0) return;

    const currentIndex = carouselApi.selectedScrollSnap();
    const currentFloor = floors[currentIndex];
    if (currentFloor === selectedFloorForPlan) return;
    if (isCarouselInteractingRef.current) return;

    carouselApi.scrollTo(index, false);
  }, [carouselApi, selectedFloorForPlan, floors]);

  useEffect(() => {
    if (!carouselApi) return;

    const syncSelectedFloorWithCarousel = () => {
      const currentIndex = carouselApi.selectedScrollSnap();
      const currentFloor = floors[currentIndex];
      if (currentFloor == null) return;
      setSelectedFloorForPlan(currentFloor);
    };

    syncSelectedFloorWithCarousel();
    carouselApi.on("select", syncSelectedFloorWithCarousel);
    carouselApi.on("reInit", syncSelectedFloorWithCarousel);

    return () => {
      carouselApi.off("select", syncSelectedFloorWithCarousel);
      carouselApi.off("reInit", syncSelectedFloorWithCarousel);
    };
  }, [carouselApi, floors, setSelectedFloorForPlan]);

  useEffect(() => {
    if (!carouselApi) return;

    const handlePointerDown = () => {
      isCarouselInteractingRef.current = true;
    };
    const handleSettle = () => {
      isCarouselInteractingRef.current = false;
    };

    carouselApi.on("pointerDown", handlePointerDown);
    carouselApi.on("settle", handleSettle);
    carouselApi.on("reInit", handleSettle);

    return () => {
      carouselApi.off("pointerDown", handlePointerDown);
      carouselApi.off("settle", handleSettle);
      carouselApi.off("reInit", handleSettle);
    };
  }, [carouselApi]);

  if (floors.length === 0) return null;

  return (
    <div
      className={`${isMobile ? "h-20 w-full" : "w-15"} flex ${isMobile ? "flex-row" : "flex-col"} items-center justify-center p-4`}
    >
      <div
        className={`flex ${isMobile ? "w-full flex-row items-center gap-4" : "h-full flex-col items-center gap-3"}`}
      >
        {/* Floor Carousel */}
        <div
          className={`${isMobile ? "flex min-h-0 flex-1 items-center justify-center py-2" : "flex min-h-[650px] flex-1 flex-col items-center justify-center py-10"}`}
        >
          <div
            className={`${isMobile ? "w-full max-w-[60vw]" : "h-full w-12"} relative`}
          >
            <Carousel
              className={`h-full w-full ${isMobile ? "touch-pan-y" : ""}`}
              orientation={isMobile ? "horizontal" : "vertical"}
              opts={{
                align: "center",
                loop: floors.length > 3,
                dragFree: true,
                skipSnaps: true,
                containScroll: "trimSnaps",
              }}
              setApi={setCarouselApi}
            >
              <div
                className={`${isMobile ? "w-full" : "h-full w-12"} flex flex-col justify-center`}
              >
                <CarouselContent
                  className={`max-h-[600px] ${isMobile ? "" : "flex-col"}`}
                >
                  {floors.map((floor) => (
                    <CarouselItem
                      key={floor}
                      className={`${isMobile ? "basis-1/5" : "basis-1/3"} flex items-center justify-center`}
                    >
                      <button
                        className={`flex h-10 w-full items-center justify-center rounded-xl text-lg font-semibold transition-colors ${
                          selectedFloorForPlan === floor
                            ? "text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        style={
                          selectedFloorForPlan === floor
                            ? { backgroundColor: themeColor }
                            : {}
                        }
                        onPointerDown={beginSwipeGuard}
                        onPointerMove={trackSwipeGuard}
                        onClick={() => handleFloorButtonClick(floor)}
                      >
                        {floor}
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </div>

              {/* Navigation buttons */}
              {floors.length > 3 && (
                <>
                  {isMobile ? (
                    <>
                      <CarouselPrevious
                        className="-left-10 h-8 w-8 border-2 border-white bg-white/90 opacity-80 backdrop-blur-sm transition-all hover:bg-white hover:opacity-100"
                        style={{ touchAction: "manipulation" }}
                        onPointerDown={blockArrowDragStart}
                        onTouchStart={blockArrowDragStart}
                        onMouseDown={blockArrowDragStart}
                      />
                      <CarouselNext
                        className="-right-10 h-8 w-8 border-2 border-white bg-white/90 opacity-80 backdrop-blur-sm transition-all hover:bg-white hover:opacity-100"
                        style={{ touchAction: "manipulation" }}
                        onPointerDown={blockArrowDragStart}
                        onTouchStart={blockArrowDragStart}
                        onMouseDown={blockArrowDragStart}
                      />
                    </>
                  ) : (
                    <>
                      <CarouselPrevious
                        className="-top-10 left-1/2 h-8 w-8 -translate-x-1/2 border-2 border-white bg-white/90 opacity-80 backdrop-blur-sm transition-all hover:bg-white hover:opacity-100"
                        style={{ touchAction: "manipulation" }}
                        onPointerDown={blockArrowDragStart}
                        onTouchStart={blockArrowDragStart}
                        onMouseDown={blockArrowDragStart}
                      />
                      <CarouselNext
                        className="-bottom-10 left-1/2 h-8 w-8 -translate-x-1/2 border-2 border-white bg-white/90 opacity-80 backdrop-blur-sm transition-all hover:bg-white hover:opacity-100"
                        style={{ touchAction: "manipulation" }}
                        onPointerDown={blockArrowDragStart}
                        onTouchStart={blockArrowDragStart}
                        onMouseDown={blockArrowDragStart}
                      />
                    </>
                  )}
                </>
              )}
            </Carousel>
          </div>
        </div>
      </div>
    </div>
  );
};
