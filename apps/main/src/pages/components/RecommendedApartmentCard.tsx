import { Home } from "lucide-react";
import type { CSSProperties } from "react";
import { Badge } from "@gridix/ui";
import { Apartment } from "@/entities/apartment/model/types";
import type { FieldSetting } from "@/hooks/useFields";
import { getApartmentFieldVisibility } from "@/shared/lib/fieldVisibility";
import { useLanguage } from "@/contexts/LanguageContext";

interface RecommendedApartmentCardProps {
  apartment: Apartment;
  thumbnailUrl: string | null;
  onClick: () => void;
  title: string;
  floorLabel: string;
  roomText: string;
  fieldSettings?: FieldSetting[];
  formattedPrice?: string | null;
  getStatusColor: (status: Apartment["status"]) => string;
  getStatusStyle: (status: Apartment["status"]) => CSSProperties;
  getStatusLabel: (status: Apartment["status"]) => string;
}

const RecommendedApartmentCard = ({
  apartment,
  thumbnailUrl,
  onClick,
  title,
  floorLabel,
  roomText,
  fieldSettings,
  formattedPrice,
  getStatusColor,
  getStatusStyle,
  getStatusLabel,
}: RecommendedApartmentCardProps) => {
  const { t } = useLanguage();
  const visibility = fieldSettings
    ? getApartmentFieldVisibility(fieldSettings)
    : { price: true, area: true };

  const detailsParts = [
    roomText,
    visibility.area ? `${apartment.area} m²` : null,
    !visibility.price ? t("project.onRequest") : null,
  ].filter((value): value is string => Boolean(value));

  const detailsText = detailsParts.join(" • ");

  return (
    <div
      className="cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow hover:shadow-lg"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`Apartment ${apartment.apartment_number}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Home className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="absolute right-3 top-3">
          <Badge
            className={`${getStatusColor(apartment.status)} rounded-full px-2 py-1 font-poppins text-xs font-medium`}
            style={getStatusStyle(apartment.status)}
          >
            {getStatusLabel(apartment.status)}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="font-poppins font-medium text-gray-900">{title}</h3>
          <span className="font-poppins text-sm text-gray-500">
            {apartment.floor_number} {floorLabel}
          </span>
        </div>
        {detailsText && (
          <div className="mb-2 font-poppins text-sm text-gray-600">
            {detailsText}
          </div>
        )}
        {visibility.price && formattedPrice && (
          <div className="font-poppins text-lg font-medium text-gray-900">
            {formattedPrice}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendedApartmentCard;
