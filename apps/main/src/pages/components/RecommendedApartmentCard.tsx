import { Home } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Badge } from '@gridix/ui';
import { Apartment } from '@/entities/apartment/model/types';
import type { FieldSetting } from '@/hooks/useFields';
import { getApartmentFieldVisibility } from '@/shared/lib/fieldVisibility';

interface RecommendedApartmentCardProps {
  apartment: Apartment;
  thumbnailUrl: string | null;
  onClick: () => void;
  title: string;
  floorLabel: string;
  roomText: string;
  isPriceVisible?: boolean;
  isAreaVisible?: boolean;
  visibility?: Partial<{ price: boolean; area: boolean }>;
  fieldSettings?: FieldSetting[];
  formattedPrice?: string | null;
  priceOnRequestText?: string;
  getStatusColor: (status: Apartment['status']) => string;
  getStatusStyle: (status: Apartment['status']) => CSSProperties;
  getStatusLabel: (status: Apartment['status']) => string;
}

const RecommendedApartmentCard = ({
  apartment,
  thumbnailUrl,
  onClick,
  title,
  floorLabel,
  roomText,
  isPriceVisible = true,
  isAreaVisible = true,
  visibility,
  fieldSettings,
  formattedPrice,
  priceOnRequestText = 'по запросу',
  getStatusColor,
  getStatusStyle,
  getStatusLabel,
}: RecommendedApartmentCardProps) => {
  const settingsVisibility = fieldSettings ? getApartmentFieldVisibility(fieldSettings) : null;

  const showPrice = settingsVisibility?.price ?? visibility?.price ?? isPriceVisible;
  const showArea = settingsVisibility?.area ?? visibility?.area ?? isAreaVisible;

  const detailsParts = [
    roomText,
    showArea ? `${apartment.area} m²` : null,
    !showPrice ? priceOnRequestText : null,
  ].filter((value): value is string => Boolean(value));

  const detailsText = detailsParts.join(' • ');

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`Apartment ${apartment.apartment_number}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Home className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge
            className={`${getStatusColor(apartment.status)} px-2 py-1 rounded-full text-xs font-medium font-poppins`}
            style={getStatusStyle(apartment.status)}
          >
            {getStatusLabel(apartment.status)}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-900 font-poppins">{title}</h3>
          <span className="text-sm text-gray-500 font-poppins">
            {apartment.floor_number} {floorLabel}
          </span>
        </div>
        {detailsText && <div className="text-sm text-gray-600 mb-2 font-poppins">{detailsText}</div>}
        {showPrice && formattedPrice && (
          <div className="text-lg font-medium text-gray-900 font-poppins">{formattedPrice}</div>
        )}
      </div>
    </div>
  );
};

export default RecommendedApartmentCard;
