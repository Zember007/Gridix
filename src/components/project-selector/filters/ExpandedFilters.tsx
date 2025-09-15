import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrencySymbolSafe } from '@/lib/currency-utils';

interface ExpandedFiltersProps {
  priceRange: number[];
  setPriceRange: (value: number[]) => void;
  areaRange: number[];
  setAreaRange: (value: number[]) => void;
  selectedCurrency: string;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  formatPrice: (price: number) => string;
}

export const ExpandedFilters = ({
  priceRange,
  setPriceRange,
  areaRange,
  setAreaRange,
  selectedCurrency,
  minPrice,
  maxPrice,
  minArea,
  maxArea,
  formatPrice
}: ExpandedFiltersProps) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Price range */}
      <div className="space-y-2">
        <Label>{t('project.price')}: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])} {getCurrencySymbolSafe(selectedCurrency)}</Label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={maxPrice}
          min={minPrice}
          step={1}
          className="w-full"
        />
      </div>

      {/* Area range */}
      <div className="space-y-2">
        <Label>{t('project.area')}: {areaRange[0]} - {areaRange[1]} м²</Label>
        <Slider
          defaultValue={areaRange}
          onValueChange={setAreaRange}
          max={maxArea}
          min={minArea}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  );
};
