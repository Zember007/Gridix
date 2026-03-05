import React from "react";
import { Apartment } from "@/entities/apartment/model/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn, convertPrice, formatMoney } from "@gridix/utils/lib";

type PopupSettings = {
  showNumbers: boolean;
  showTooltip: boolean;
  showArea: boolean;
  showPrice: boolean;
  showRooms?: boolean;
};

type CommonProps = {
  apartment: Apartment;
  settings: PopupSettings;
  currency?: string | null;
  selectedCurrency?: string;
  className?: string;
  /**
   * Controls absolute positioning for "floating" mode.
   * - `absolute` (default): requires `position`
   * - `static`: renders as a normal block (e.g. inside TooltipContent)
   */
  variant?: "absolute" | "static";
  /** Optional visibility toggles for compact contexts (e.g. chess tooltip) */
  showStatus?: boolean;
  showFloor?: boolean;
};

type AbsoluteVariantProps = CommonProps & {
  variant?: "absolute";
  position: { x: number; y: number };
};

type StaticVariantProps = CommonProps & {
  variant: "static";
  position?: never;
};

type ApartmentPopupProps = AbsoluteVariantProps | StaticVariantProps;

interface PopupContentOptions {
  showStatus: boolean;
  showFloor: boolean;
}

export const hasAnyPopupContent = (
  settings: PopupSettings,
  apartment: Apartment,
  options: PopupContentOptions,
): boolean => {
  if (settings.showNumbers) return true;
  if (options.showStatus) return true;
  if (options.showFloor) return true;
  if (settings.showArea) return true;
  if (
    settings.showRooms !== false &&
    apartment.rooms !== null &&
    apartment.rooms !== undefined
  )
    return true;
  // Keep popup useful when price is hidden: show "on request" fallback.
  if (!settings.showPrice) return true;
  if (typeof apartment.price === "number" && apartment.price > 0) return true;
  return false;
};

const ApartmentPopup = React.forwardRef<HTMLDivElement, ApartmentPopupProps>(
  (
    {
      apartment,
      settings,
      currency,
      selectedCurrency,
      className,
      variant = "absolute",
      showStatus = true,
      showFloor = true,
      ...rest
    },
    ref,
  ) => {
    const { t } = useLanguage();

    if (
      !settings.showTooltip ||
      !hasAnyPopupContent(settings, apartment, { showStatus, showFloor })
    )
      return null;
    const isAbsolute = variant !== "static";
    const position = isAbsolute
      ? (rest as AbsoluteVariantProps).position
      : undefined;
    return (
      <div
        ref={ref}
        className={cn(
          isAbsolute
            ? "absolute z-50 max-w-xs rounded-lg border border-gray-200 bg-white p-2 shadow-xl md:p-3"
            : "max-w-xs rounded-lg border border-gray-200 bg-white p-2 shadow-xl md:p-3",
          className,
        )}
        style={
          isAbsolute && position
            ? { left: position.x, top: position.y }
            : undefined
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col space-y-1">
          {/* Apartment number */}
          <div className="flex items-center justify-between gap-2">
            {settings.showNumbers && (
              <div className="text-sm font-bold text-gray-900 md:text-lg">
                № {apartment.apartment_number}
              </div>
            )}

            {showStatus && (
              <span
                className={`rounded px-2 py-1 text-xs ${
                  apartment.status === "available"
                    ? "bg-green-100 text-green-800"
                    : apartment.status === "reserved"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {t(`project.${apartment.status}`)}
              </span>
            )}
          </div>

          {/* Floor */}
          {showFloor && (
            <div className="text-sm text-gray-600">
              {t("project.floor")}: {apartment.floor_number}
            </div>
          )}

          {/* Area */}
          {settings.showArea && (
            <div className="text-sm text-gray-600">
              {t("project.area")}: {apartment.area} m²
            </div>
          )}

          {/* Price */}
          {(settings.showPrice ? !!apartment.price : true) && (
            <div className="text-sm font-semibold text-green-600">
              {t("project.price")}:{" "}
              {settings.showPrice && apartment.price
                ? formatMoney(
                    convertPrice(
                      apartment.price,
                      currency || null,
                      selectedCurrency || currency || null,
                    ),
                    selectedCurrency || currency || null,
                  )
                : t("project.onRequest")}
            </div>
          )}

          {/* Rooms */}
          {settings.showRooms !== false &&
            apartment.rooms !== null &&
            apartment.rooms !== undefined && (
              <div className="text-sm text-gray-600">
                {t("project.rooms")}:{" "}
                {apartment.rooms === 0 || apartment.rooms === "0"
                  ? t("project.studio")
                  : apartment.rooms}
              </div>
            )}
        </div>
      </div>
    );
  },
);

export default ApartmentPopup;
