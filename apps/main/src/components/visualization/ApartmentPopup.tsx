import React from 'react';
import { Apartment } from '@/entities/apartment/model/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn, formatPriceWithCurrency } from "@gridix/utils/lib";

type PopupSettings = {
  showNumbers: boolean;
  showTooltip: boolean;
  showArea: boolean;
  showPrice: boolean;
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
  variant?: 'absolute' | 'static';
  /** Optional visibility toggles for compact contexts (e.g. chess tooltip) */
  showStatus?: boolean;
  showFloor?: boolean;
};

type AbsoluteVariantProps = CommonProps & {
  variant?: 'absolute';
  position: { x: number; y: number };
};

type StaticVariantProps = CommonProps & {
  variant: 'static';
  position?: never;
};

type ApartmentPopupProps = AbsoluteVariantProps | StaticVariantProps;

const ApartmentPopup = React.forwardRef<HTMLDivElement, ApartmentPopupProps>(({
  apartment,
  settings,
  currency,
  className,
  variant = 'absolute',
  showStatus = true,
  showFloor = true,
  ...rest
}, ref) => {
  const { t } = useLanguage();

  if (!settings.showTooltip) return null;

  const isAbsolute = variant !== 'static';
  const position = isAbsolute ? (rest as AbsoluteVariantProps).position : undefined;

  return (
    <div
      ref={ref}
      className={cn(
        isAbsolute
          ? 'absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 md:p-3 p-2 max-w-xs'
          : 'bg-white rounded-lg shadow-xl border border-gray-200 md:p-3 p-2 max-w-xs',
        className,
      )}
      style={isAbsolute && position ? { left: position.x, top: position.y } : undefined}
      onClick={(e) => e.stopPropagation()}
    >

      <div className="space-y-1 flex flex-col">
        {/* Apartment number */}
        <div className="flex justify-between items-center gap-2">
          {settings.showNumbers && (
            <div className="md:text-lg text-sm font-bold text-gray-900">
              № {apartment.apartment_number}
            </div>
          )}

          {showStatus && (
            <span className={`px-2 py-1 rounded text-xs ${apartment.status === 'available' ? 'bg-green-100 text-green-800' :
              apartment.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
              {t(`project.${apartment.status}`)}
            </span>
          )}
        </div>

        {/* Floor */}
        {showFloor && (
          <div className="text-sm text-gray-600">
            {t('project.floor')}: {apartment.floor_number}
          </div>
        )}

        {/* Area */}
        {settings.showArea && (
          <div className="text-sm text-gray-600">
            {t('project.area')}: {apartment.area} m²
          </div>
        )}

        {/* Price */}
        {settings.showPrice && apartment.price && (
          <div className="text-sm font-semibold text-green-600">
            {t('project.price')}: {formatPriceWithCurrency(apartment.price, currency || null)}
          </div>
        )}

        {/* Rooms */}
        {apartment.rooms !== null && apartment.rooms !== undefined && (
          <div className="text-sm text-gray-600">
            {t('project.rooms')}: {apartment.rooms === 0 ? 'S' : apartment.rooms}
          </div>
        )}
      </div>
    </div>
  );
});

export default ApartmentPopup;
