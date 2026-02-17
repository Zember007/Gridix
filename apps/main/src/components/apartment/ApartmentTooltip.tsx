import { Badge } from "@gridix/ui";
import { Home, Maximize, BadgeRussianRuble } from "lucide-react";

interface ApartmentTooltipProps {
  apartment: {
    number: string;
    status: "available" | "sold" | "reserved";
    area: number;
    rooms: number;
    price?: number;
  };
  settings: {
    showArea: boolean;
    showPrice: boolean;
  };
}

const ApartmentTooltip = ({ apartment, settings }: ApartmentTooltipProps) => {
  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Свободна";
      case "sold":
        return "Продана";
      case "reserved":
        return "Бронь";
      default:
        return "Неизвестно";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-success-100 text-success-800";
      case "sold":
        return "bg-red-100 text-red-800";
      case "reserved":
        return "bg-warning-100 text-warning-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-xs rounded-lg border bg-white p-3 shadow-lg">
      <div className="mb-2 flex items-center gap-2">
        <Home className="h-4 w-4 text-real-estate-600" />
        <span className="font-semibold text-real-estate-900">
          Квартира {apartment.number}
        </span>
        <Badge className={getStatusColor(apartment.status)}>
          {getStatusText(apartment.status)}
        </Badge>
      </div>

      <div className="space-y-1 text-sm text-real-estate-600">
        <div className="flex items-center gap-1">
          <span>{apartment.rooms} комн.</span>
        </div>

        {settings.showArea && (
          <div className="flex items-center gap-1">
            <Maximize className="h-3 w-3" />
            <span>{apartment.area} м²</span>
          </div>
        )}

        {settings.showPrice && apartment.price && apartment.price > 0 && (
          <div className="flex items-center gap-1 font-medium text-real-estate-700">
            <BadgeRussianRuble className="h-3 w-3" />
            <span>{apartment.price.toLocaleString()} руб.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentTooltip;
