import React from 'react';
import { Apartment } from '@/types/apartment';
import { useLanguage } from '@/contexts/LanguageContext';
import { convertPrice, formatPrice, formatPriceWithCurrency } from '@/lib/currency-utils';
import { useIsMobile } from '@/hooks/use-mobile';

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

const ApartmentPopup: React.FC<ApartmentPopupProps> = ({
  apartment,
  position,
  settings,
  currency,
  selectedCurrency
}) => {
  const { t } = useLanguage();

  const isMobile = useIsMobile();

  if (!settings.showTooltip) return null;

  const popupWidth = 150;
  const popupHeight = 120;
  const margin = 20;

  // Calculate position to avoid screen edges
  let adjustedX = position.x + 10;
  let adjustedY = position.y - popupHeight / 2 - 30;

  // Adjust if popup goes off screen
  if (adjustedX + popupWidth > window.innerWidth - margin) {
    adjustedX = position.x - popupWidth - 10;
  }
  if (adjustedY < margin) {
    adjustedY = margin;
  }
  if (adjustedY + popupHeight > window.innerHeight - margin) {
    adjustedY = window.innerHeight - popupHeight - margin;
  }

  return (
    <div
      className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 md:p-3 p-2 max-w-xs"
      style={{
        left: adjustedX,
        top: adjustedY,
        width: popupWidth,
        minHeight: popupHeight,
      }}
      onClick={(e) => e.stopPropagation()}
    >

      <div className="space-y-1">
        {/* Apartment number */}
        {settings.showNumbers && (
          <div className="md:text-lg text-sm font-bold text-gray-900">
            № {apartment.apartment_number}
          </div>
        )}

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

        {/* Status */}
        <div className="text-sm">
          <span className="font-medium">{t('project.status')}: </span>
          <span className={`px-2 py-1 rounded text-xs ${apartment.status === 'available' ? 'bg-green-100 text-green-800' :
              apartment.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
            }`}>
            {t(`project.${apartment.status}`)}
          </span>
        </div>

        {/* Rooms */}
        {apartment.rooms && (
          <div className="text-sm text-gray-600">
            {t('project.rooms')}: {apartment.rooms}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApartmentPopup;
