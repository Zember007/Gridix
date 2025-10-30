import { useIsMobile } from '@/hooks/use-mobile';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '../ui/carousel';
import { useEffect, useState } from 'react';

interface FloorSelectorProps {
  selectedFloorForPlan: number | null;
  setSelectedFloorForPlan: (floor: number) => void;
  getUniqueFloors: () => number[];
  themeColor: string;
}

export const FloorSelector = ({
  selectedFloorForPlan,
  setSelectedFloorForPlan,
  getUniqueFloors,
  themeColor
}: FloorSelectorProps) => {
  const isMobile = useIsMobile();

  const floors = getUniqueFloors();

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
    <div className={`${isMobile ? 'h-20 w-full border-t border-l-0' : 'w-15 border-l'} bg-gradient-to-b from-gray-50 to-gray-100 border-gray-200 shadow-inner flex ${isMobile ? 'flex-row' : 'flex-col'} items-center justify-center p-4`}>
      <div className={`flex ${isMobile ? 'flex-row items-center gap-4 w-full' : 'flex-col items-center gap-3 h-full'}`}>


        {/* Floor Carousel */}
        <div className={`${isMobile ? 'flex-1 flex items-center justify-center min-h-0 py-2' : 'flex-1 flex flex-col items-center justify-center min-h-[650px] py-10'}`}>
          <div className={`${isMobile ? ' w-full max-w-[200px]' : 'w-10 h-full'} relative`}>
            <Carousel
              className="w-full h-full "
              orientation={isMobile ? "horizontal" : "vertical"}
              opts={{
                align: "center",
                loop: floors.length > 3,
              }}
              setApi={setCarouselApi}
            >
              <div className={`${isMobile ? ' w-full' : 'w-10 h-full'} shadow-xl border-2 border-white rounded-2xl bg-white backdrop-blur-sm flex flex-col justify-center`}>
                <CarouselContent className={`max-h-[600px]  ${isMobile ? '' : 'flex-col'}`}>
                  {floors.map((floor) => (
                    <CarouselItem key={floor} className={`${isMobile ? 'basis-1/2' : 'basis-1/3'} flex items-center justify-center`}>
                      <button
                        className={`w-full h-10 flex items-center justify-center text-lg font-semibold rounded-xl transition-colors ${selectedFloorForPlan === floor
                          ? 'text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        style={selectedFloorForPlan === floor ? { backgroundColor: themeColor } : {}}
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
                      <CarouselPrevious className="-left-12 h-8 w-8 shadow-lg border-2 border-white bg-white/90 backdrop-blur-sm hover:bg-white opacity-80 hover:opacity-100 transition-all" />
                      <CarouselNext className="-right-12 h-8 w-8 shadow-lg border-2 border-white bg-white/90 backdrop-blur-sm hover:bg-white opacity-80 hover:opacity-100 transition-all" />
                    </>
                  ) : (
                    <>
                      <CarouselPrevious className="-top-12 left-1/2 -translate-x-1/2 h-8 w-8 shadow-lg border-2 border-white bg-white/90 backdrop-blur-sm hover:bg-white opacity-80 hover:opacity-100 transition-all" />
                      <CarouselNext className="-bottom-12 left-1/2 -translate-x-1/2 h-8 w-8 shadow-lg border-2 border-white bg-white/90 backdrop-blur-sm hover:bg-white opacity-80 hover:opacity-100 transition-all" />
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
