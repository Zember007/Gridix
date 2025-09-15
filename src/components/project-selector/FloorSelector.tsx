import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

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

  return (
    <div className="bg-white border-b py-4">
      <div className="mx-auto px-6">
        <div className="flex items-center justify-center gap-2 flex-col">
          <Label className="text-sm font-medium">{t('project.selectFloor')}:</Label>
          <div className="flex items-center gap-2 flex-wrap">
            {getUniqueFloors().map(floor => (
              <Button
                key={floor}
                variant={selectedFloorForPlan === floor ? 'default' : 'outline'}
                size="sm"
                className={selectedFloorForPlan === floor ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                onClick={() => setSelectedFloorForPlan(floor)}
              >
                {floor}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
