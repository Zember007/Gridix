import { useLanguage } from '@/contexts/LanguageContext';
import { useFavorites } from '@/hooks/useFavorites';
import { formatPriceWithCurrency } from '@/lib/currency-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Home, Square, ExternalLink } from 'lucide-react';

import { Apartment } from '@/types/apartment';

interface FavoritesTabProps {
  projectId: string;
  projectCurrency?: string | null;
  handleViewApartment: (apartment: Apartment) => void
  fieldVisible: string[]
}

const FavoritesTab = ({ projectId, projectCurrency, handleViewApartment, fieldVisible }: FavoritesTabProps) => {
  const { t } = useLanguage();
  const { favorites, removeFromFavorites } = useFavorites();

  //

  // Фильтруем избранные только для текущего проекта
  const projectFavorites = favorites.filter(fav => fav.project_id === projectId);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sold': return t('apartment.sold');
      case 'reserved': return t('apartment.reserved');
      case 'available': return t('apartment.available');
      default: return status;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'sold': return { backgroundColor: '#ef4444' };
      case 'reserved': return { backgroundColor: '#f59e0b' };
      case 'available': return { backgroundColor: '#1f984def' };
      default: return { backgroundColor: '#6b7280' };
    }
  };

  type FavoriteItem = {
    id: string;
    project_id: string;
    apartment_number: string;
    rooms: number;
    area: number;
    price?: number;
    status: string;
    floor_number: number;
  };

  const toApartment = (fav: FavoriteItem): Apartment => {
    const nowIso = new Date().toISOString();
    return {
      id: fav.id,
      apartment_number: fav.apartment_number,
      floor_number: Number(fav.floor_number),
      rooms: Number(fav.rooms),
      area: Number(fav.area),
      price: typeof fav.price === 'number' ? fav.price : null,
      status: (fav.status as 'available' | 'sold' | 'reserved') || 'available',
      type: 'apartment',
      polygon: [],
      custom_fields: null,
      project_id: fav.project_id,
      created_at: nowIso,
      updated_at: nowIso,
      floor_plan_id: null
    };
  };

  const handleRemoveFromFavorites = (apartmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromFavorites(apartmentId);
  };

  if (projectFavorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Heart className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t('favorites.empty.title')}
        </h2>
        <p className="text-gray-500 max-w-sm">
          {t('favorites.empty.description')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('favorites.title') || 'Избранные квартиры'} ({projectFavorites.length})
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projectFavorites.map((apartment) => (
          <Card 
            key={apartment.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => handleViewApartment(toApartment(apartment))}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {t('apartment.apartment')} № {apartment.apartment_number}
                  </h4>
                 {fieldVisible.includes('floor_number') && <p className="text-sm text-gray-500">
                    {apartment.floor_number} {t('apartment.floor')}
                  </p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className="text-white px-2 py-1 text-xs"
                    style={getStatusStyle(apartment.status)}
                  >
                    {getStatusLabel(apartment.status)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => handleRemoveFromFavorites(apartment.id, e)}
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 mb-3">
              {fieldVisible.includes('rooms') &&
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Home className="h-4 w-4" />
                  <span>
                    {apartment.rooms == 0 
                      ? t('apartment.studio') 
                      : `${apartment.rooms} ${t('apartment.rooms')}`
                    }
                  </span>
                </div>
                }
              {fieldVisible.includes('area') &&
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Square className="h-4 w-4" />
                  <span>{apartment.area} м²</span>
                </div>
                }
              </div>

              
                <div className="mb-3">
                  <div className="text-lg font-bold text-gray-900">
                    {apartment.price && fieldVisible.includes('price') ? formatPriceWithCurrency(apartment.price, projectCurrency || null) : t('common.priceOnRequest')}
                  </div>
                </div>
            

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewApartment(toApartment(apartment));
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('common.view')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FavoritesTab;
