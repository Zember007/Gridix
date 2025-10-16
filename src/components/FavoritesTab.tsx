import { useLanguage } from '@/contexts/LanguageContext';
import { useFavorites } from '@/hooks/useFavorites';
import { formatPriceWithCurrency } from '@/lib/currency-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Home, Square, MapPin, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FavoritesTabProps {
  projectId: string;
  projectCurrency?: string | null;
}

const FavoritesTab = ({ projectId, projectCurrency }: FavoritesTabProps) => {
  const { t, language } = useLanguage();
  const { favorites, removeFromFavorites } = useFavorites();
  const [isWidgetContext, setIsWidgetContext] = useState(false);

  useEffect(() => {
    // Detect if we're in a widget/iframe context
    const isInIframe = window.self !== window.top;
    const hasWidgetParam = window.location.search.includes('widget') || 
                          window.location.pathname.includes('/widget/');
    setIsWidgetContext(isInIframe || hasWidgetParam);
  }, []);

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
      case 'available': return { backgroundColor: '#3b82f6' };
      default: return { backgroundColor: '#6b7280' };
    }
  };

  const handleViewApartment = (apartmentId: string) => {
    // Always open in new tab for now to avoid router issues in widget context
    // This is the safest approach that works in both contexts
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/${language}/project/${projectId}/apartment/${apartmentId}`;
    window.open(url, '_blank');
  };

  const handleRemoveFromFavorites = (apartmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromFavorites(apartmentId);
  };

  if (projectFavorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Heart className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('favorites.empty.title')}
        </h3>
        <p className="text-gray-500 max-w-sm">
          {t('favorites.empty.description')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('favorites.title') || 'Избранные квартиры'} ({projectFavorites.length})
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projectFavorites.map((apartment) => (
          <Card 
            key={apartment.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => handleViewApartment(apartment.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {t('apartment.apartment')} № {apartment.apartment_number}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {apartment.floor_number} {t('apartment.floor')}
                  </p>
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
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Home className="h-4 w-4" />
                  <span>
                    {apartment.rooms === 0 
                      ? t('apartment.studio') 
                      : `${apartment.rooms} ${t('apartment.rooms')}`
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Square className="h-4 w-4" />
                  <span>{apartment.area} м²</span>
                </div>
              </div>

              {apartment.price && (
                <div className="mb-3">
                  <div className="text-lg font-bold text-gray-900">
                    {formatPriceWithCurrency(apartment.price, projectCurrency)}
                  </div>
                </div>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewApartment(apartment.id);
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
