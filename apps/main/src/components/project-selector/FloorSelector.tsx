import { useIsMobile } from "@gridix/ui";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@gridix/ui";
import { useEffect, useState, useMemo } from "react";
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
  apartments,
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
  }, [getUniqueFloors, apartments, showOnlyAvailable, filteredApartments]);

  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (!carouselApi) return;
    if (selectedFloorForPlan == null) return;

    const index = floors.findIndex((f) => f === selectedFloorForPlan);
    if (index >= 0) {
      carouselApi.scrollTo(index, true);
    }
  }, [carouselApi, selectedFloorForPlan, floors]);

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
              className="h-full w-full"
              orientation={isMobile ? "horizontal" : "vertical"}
              opts={{
                align: "center",
                loop: floors.length > 3,
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
                        onClick={() => setSelectedFloorForPlan(floor)}
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
                      <CarouselPrevious className="-left-10 h-8 w-8 border-2 border-white bg-white/90 opacity-80 backdrop-blur-sm transition-all hover:bg-white hover:opacity-100" />
                      <CarouselNext className="-right-10 h-8 w-8 border-2 border-white bg-white/90 opacity-80 backdrop-blur-sm transition-all hover:bg-white hover:opacity-100" />
                    </>
                  ) : (
                    <>
                      <CarouselPrevious className="-top-10 left-1/2 h-8 w-8 -translate-x-1/2 border-2 border-white bg-white/90 opacity-80 backdrop-blur-sm transition-all hover:bg-white hover:opacity-100" />
                      <CarouselNext className="-bottom-10 left-1/2 h-8 w-8 -translate-x-1/2 border-2 border-white bg-white/90 opacity-80 backdrop-blur-sm transition-all hover:bg-white hover:opacity-100" />
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
