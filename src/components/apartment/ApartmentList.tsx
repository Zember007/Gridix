
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home, Maximize, Banknote, MapPin } from 'lucide-react';
import { Apartment } from '@/types/apartment';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPriceWithCurrency } from '@/lib/currency-utils';
import { useProjectCurrency } from '@/hooks/useProjectCache';

interface ApartmentListProps {
  apartments: Apartment[];
  onApartmentSelect: (apartment: Apartment) => void;
  projectId?: string; // Добавляем ID проекта для получения информации о валюте
}

const ApartmentList = ({ apartments, onApartmentSelect, projectId }: ApartmentListProps) => {
  const { t } = useLanguage();
  const { currency, loading: currencyLoading } = useProjectCurrency(projectId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'reserved': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sold': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return t('apartment.available');
      case 'reserved': return t('apartment.reserved');
      case 'sold': return t('apartment.sold');
      default: return status;
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return t('common.priceOnRequest');
    return formatPriceWithCurrency(price, currency);
  };

  if (apartments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Home className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">
            {t('project.notFoundApartments')}
          </p>
          <p className="text-sm text-gray-400 text-center mt-1">
            {t('project.changeFilters')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {t('project.found')}: <span className="font-semibold">{apartments.length}</span> {t('project.apartments')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {apartments.map((apartment) => (
          <Card 
            key={apartment.id}
            className="hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => onApartmentSelect(apartment)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold">№ {apartment.apartment_number}</span>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(apartment.status)}`}
                >
                  {getStatusText(apartment.status)}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{apartment.floor_number} {t('apartment.floor')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    <span>
                      {apartment.rooms == 0 
                        ? t('apartment.studio') 
                        : apartment.rooms === 'free_layout'
                          ? t('apartment.freeLayout')
                          : `${apartment.rooms} ${t('apartment.room')}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Maximize className="h-3 w-3" />
                    <span>{apartment.area} {t('apartment.sqm')}</span>
                  </div>
                  {apartment.price && (
                    <div className="flex items-center gap-1">
                      <Banknote className="h-3 w-3" />
                      <span className="text-xs">
                        {formatPriceWithCurrency(apartment.price / apartment.area, currency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-blue-600">
                  {formatPrice(apartment.price)}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {t('common.more')}
                </Button>
              </div>

              {/* Пользовательские поля */}
              {apartment.custom_fields && typeof apartment.custom_fields === 'object' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="space-y-1">
                    {Object.entries(apartment.custom_fields).map(([key, value]) => (
                      value && (
                        <div key={key} className="flex justify-between text-xs text-gray-500">
                          <span className="capitalize">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ApartmentList;
