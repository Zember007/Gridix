import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { WheelPicker, WheelPickerWrapper } from '@/components/ui/wheel-picker';
import type { WheelPickerOption } from '@/components/ui/wheel-picker';
import { useIsMobile } from '@/hooks/use-mobile';

interface FloorSelectorProps {
  selectedFloorForPlan: number | null;
  setSelectedFloorForPlan: (floor: number) => void;
  getUniqueFloors: () => number[];
}

export const FloorSelector = ({
  selectedFloorForPlan,
  setSelectedFloorForPlan,
  getUniqueFloors
}: FloorSelectorProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const floors = getUniqueFloors();
  
  // Convert floors to wheel picker options
  const floorOptions: WheelPickerOption[] = floors.map(floor => ({
    value: floor.toString(),
    label: `${floor} ${t('project.floor').toLowerCase()}`
  }));

  const handleFloorChange = (value: string) => {
    setSelectedFloorForPlan(Number(value));
  };

  if (floors.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="mx-auto px-4 sm:px-6">
        <div className={`flex items-center justify-center py-4 ${isMobile ? 'py-3' : 'py-4'}`}>
          <div className="flex flex-col items-center gap-3">
            <Label className={`text-sm font-medium text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {t('project.selectFloor')}
            </Label>
            <WheelPickerWrapper 
              className={`${isMobile ? 'w-40' : 'w-48'} shadow-md border border-gray-200 rounded-xl bg-white`}
            >
              <WheelPicker
                options={floorOptions}
                value={selectedFloorForPlan?.toString()}
                onValueChange={handleFloorChange}
                optionItemHeight={isMobile ? 32 : 36}
                visibleCount={isMobile ? 3 : 4}
                infinite={floors.length > 3}
                classNames={{
                  optionItem: "text-gray-500 text-sm font-medium transition-colors duration-200",
                  highlightWrapper: "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 font-semibold border-y border-gray-200 shadow-sm"
                }}
              />
            </WheelPickerWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};
