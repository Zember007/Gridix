import React from 'react';
import { Apartment } from '@/entities/apartment/model/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPriceWithCurrency } from "@gridix/utils/lib";

interface ApartmentPopupProps {
  apartment: Apartment;
  position: { x: number; y: number };
  settings: {
    showNumbers: boolean;
    showTooltip: boolean;
    showArea: boolean;
    showPrice: boolean;
  };
  currency?: string | null;
  selectedCurrency?: string;
}

const ApartmentPopup = React.forwardRef<HTMLDivElement, ApartmentPopupProps>(({
  apartment,
  position,
  settings,
  currency,
}, ref) => {
  const { t } = useLanguage();

  if (!settings.showTooltip) return null;

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 md:p-3 p-2 max-w-xs"
      style={{
        left: position.x,
        top: position.y,
      }}
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

          <span className={`px-2 py-1 rounded text-xs ${apartment.status === 'available' ? 'bg-green-100 text-green-800' :
            apartment.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
            {t(`project.${apartment.status}`)}
          </span>
        </div>

        {/* Floor */}
        <div className="text-sm text-gray-600">
          {t('project.floor')}: {apartment.floor_number}
        </div>

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
        {apartment.rooms && (
          <div className="text-sm text-gray-600">
            {t('project.rooms')}: {apartment.rooms}
          </div>
        )}
      </div>
    </div>
  );
});

export default ApartmentPopup;
