import { Badge } from "@gridix/ui";
import { Checkbox } from "@gridix/ui";
import { Apartment } from "@/entities/apartment/model/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { ADMIN_THEME } from "@gridix/utils/lib";

interface ApartmentSyncTargetsListProps {
  targetApartments: Apartment[];
  sourceApartment: Apartment;
  selectedApartments: Set<string>;
  onApartmentToggle: (apartmentId: string) => void;
  formatPrice: (price: number | null | undefined) => string;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}

const ApartmentSyncTargetsList = ({
  targetApartments,
  sourceApartment,
  selectedApartments,
  onApartmentToggle,
  formatPrice,
  getStatusColor,
  getStatusLabel,
}: ApartmentSyncTargetsListProps) => {
  const { t } = useLanguage();

  return (
    <div
      className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3"
      style={{ borderColor: ADMIN_THEME.border }}
    >
      {targetApartments.map((apartment) => (
        <div
          key={apartment.id}
          className="flex items-start gap-4 rounded border p-3 transition-colors"
          style={{
            backgroundColor: ADMIN_THEME.backgroundSecondary,
            borderColor: ADMIN_THEME.borderLight,
          }}
        >
          <Checkbox
            id={`apartment-${apartment.id}`}
            checked={selectedApartments.has(apartment.id)}
            onCheckedChange={() => onApartmentToggle(apartment.id)}
            className="mt-1"
          />
          <div className="flex-1 space-y-1">
            <label
              htmlFor={`apartment-${apartment.id}`}
              className="cursor-pointer text-sm font-medium"
            >
              <strong>
                {t("apartmentsManager.apartment", {
                  number: apartment.apartment_number,
                })}
              </strong>{" "}
              (
              {t("apartmentsManager.floor", {
                floor: apartment.floor_number,
              })}
              )
            </label>
            <div
              className="space-y-1 text-xs"
              style={{ color: ADMIN_THEME.textSecondary }}
            >
              <div className="flex justify-between">
                <span>
                  {t("apartmentsManager.syncDialog.currentPrice")}:{" "}
                  {formatPrice(apartment.price)}
                </span>
                {apartment.price !== sourceApartment.price && (
                  <span style={{ color: ADMIN_THEME.info }}>
                    → {formatPrice(sourceApartment.price)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>
                  {t("apartmentsManager.status")}:{" "}
                  <Badge className={getStatusColor(apartment.status)}>
                    {getStatusLabel(apartment.status)}
                  </Badge>
                </span>
                {apartment.status !== sourceApartment.status && (
                  <span>
                    →{" "}
                    <Badge className={getStatusColor(sourceApartment.status)}>
                      {getStatusLabel(sourceApartment.status)}
                    </Badge>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApartmentSyncTargetsList;
