import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ruler, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Apartment } from '@/types/apartment';
import { getCurrencySymbolSafe } from '@/lib/currency-utils';
import { FieldSetting } from '@/hooks/useFields';
import { Project } from '@/hooks/useProjectsManager';



interface LayoutPhoto {
  id: string;
  image_url: string;
  description?: string;
  order_index: number;
  type: 'layout';
}

interface LayoutGalleryProps {
  apartments: Apartment[];
  selectedRooms: string;
  selectedType: 'all' | 'apartment' | 'commercial' | 'parking';
  setSelectedRooms: (value: string) => void;
  setSelectedType: (value: 'all' | 'apartment' | 'commercial' | 'parking') => void;
  setViewMode: (mode: 'facade' | 'floor-plan' | 'list' | 'map' | 'favorites') => void;
  getUniqueRoomCounts: () => number[];
  hasFreeLayout?: () => boolean;
  preloadedLayoutPhotosByRooms: Record<string, LayoutPhoto[]>;
  project?: Project;
  formatPrice: (price: number) => string;
  selectedCurrency: string;
  isMobile: boolean;
  themeColor?: string;
  visibleFields?: FieldSetting[];
}

export const LayoutGallery = ({
  apartments,
  selectedRooms,
  selectedType,
  setSelectedRooms,
  setSelectedType,
  setViewMode,
  getUniqueRoomCounts,
  hasFreeLayout,
  preloadedLayoutPhotosByRooms,
  project,
  formatPrice,
  selectedCurrency,
  isMobile,
  themeColor = '#000000',
  visibleFields = []
}: LayoutGalleryProps) => {
  const { t } = useLanguage();

  const getButtonStyle = (isActive: boolean) =>
    isActive ? { backgroundColor: themeColor, color: 'white' } : {};

  const getButtonClass = (isActive: boolean) =>
    isActive ? 'text-white' : 'border-gray-300';

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>{t('project.layouts')}</h2>

        {/* Layout type filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={selectedRooms === 'all' && selectedType === 'all' ? 'default' : 'outline'}
            size="sm"
            className={getButtonClass(selectedRooms === 'all' && selectedType === 'all')}
            style={getButtonStyle(selectedRooms === 'all' && selectedType === 'all')}
            onClick={() => {
              setSelectedType('all');
              setSelectedRooms('all')
            }}
          >
            {t('project.allTypes')}
          </Button>
          <Button
            variant={selectedRooms === '0' ? 'default' : 'outline'}
            size="sm"
            className={getButtonClass(selectedRooms === '0')}
            style={getButtonStyle(selectedRooms === '0')}
            onClick={() => {
              setSelectedType('all');
              setSelectedRooms('0')
            }}
          >
            {t('apartment.studio')}
          </Button>
          {getUniqueRoomCounts().filter(rooms => rooms > 0).map(rooms => (
            <Button
              key={rooms}
              variant={selectedRooms === rooms.toString() ? 'default' : 'outline'}
              size="sm"
              className={getButtonClass(selectedRooms === rooms.toString())}
              style={getButtonStyle(selectedRooms === rooms.toString())}
              onClick={() => {
                setSelectedType('all');
                setSelectedRooms(rooms.toString())
              }}
            >
              {rooms}
            </Button>
          ))}
          {hasFreeLayout && hasFreeLayout() && (
            <Button
              variant={selectedRooms === 'free_layout' ? 'default' : 'outline'}
              size="sm"
              className={getButtonClass(selectedRooms === 'free_layout')}
              style={getButtonStyle(selectedRooms === 'free_layout')}
              onClick={() => {
                setSelectedType('all');
                setSelectedRooms('free_layout');
              }}
            >
              {t('apartment.freeLayout')}
            </Button>
          )}
          <Button
            variant={selectedRooms === '4+' ? 'default' : 'outline'}
            size="sm"
            className={getButtonClass(selectedRooms === '4+')}
            style={getButtonStyle(selectedRooms === '4+')}
            onClick={() => {
              // Handle 4+ rooms filter - includes free_layout
              const fourPlusApartments = apartments.filter(apt => 
                apt.type === 'apartment' && (
                  Number(apt.rooms) >= 4 || apt.rooms === 'free_layout'
                )
              );
              if (fourPlusApartments.length > 0) {
                setSelectedRooms('4+');
                setSelectedType('apartment');
              }
            }}
          >
            4+
          </Button>
          {project?.has_commercial && (
            <Button
              variant={selectedType === 'commercial' ? 'default' : 'outline'}
              size="sm"
              className={getButtonClass(selectedType === 'commercial')}
              style={getButtonStyle(selectedType === 'commercial')}
              onClick={() => {
                setSelectedType('commercial');
                setSelectedRooms('all');
              }}
            >
              {t('apartmentsManager.typeCommercial')}
            </Button>
          )}
          {project?.has_parking && (
            <Button
              variant={selectedType === 'parking' ? 'default' : 'outline'}
              size="sm"
              className={getButtonClass(selectedType === 'parking')}
              style={getButtonStyle(selectedType === 'parking')}
              onClick={() => {
                setSelectedType('parking');
                setSelectedRooms('all');
              }}
            >
              {t('apartmentsManager.typeParking')}
            </Button>
          )}
        </div>

        {/* Layout cards grid */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}`}>
          {(() => {
            // Group apartments by layout depending on type
            const layoutGroups: { [key: string]: Apartment[] } = {};

            let apartmentsToShow = apartments;

            // Apply selected type filter for gallery
            if (selectedType !== 'all') {
              apartmentsToShow = apartmentsToShow.filter(apt => apt.type === selectedType);
            }

            // Rooms filter applies only to residential apartments
            if (selectedRooms !== 'all') {
              if (selectedRooms === '4+') {
                apartmentsToShow = apartmentsToShow.filter(apt => 
                  apt.type === 'apartment' && (
                    Number(apt.rooms) >= 4 || apt.rooms === 'free_layout'
                  )
                );
              } else if (selectedRooms === 'free_layout') {
                apartmentsToShow = apartmentsToShow.filter(apt => apt.type === 'apartment' && apt.rooms === 'free_layout');
              } else {
                apartmentsToShow = apartmentsToShow.filter(apt => apt.type === 'apartment' && Number(apt.rooms) === parseInt(selectedRooms));
              }
            }

            apartmentsToShow.forEach(apt => {
              let key: string;
              if (apt.type === 'commercial') {
                key = 'commercial';
              } else if (apt.type === 'parking') {
                key = 'parking';
              } else if (apt.rooms === 'free_layout') {
                key = 'free_layout';
              } else {
                key = `${Number(apt.rooms)}-rooms`;
              }
              if (!layoutGroups[key]) {
                layoutGroups[key] = [];
              }
              layoutGroups[key]?.push(apt);
            });

            // Sort layout groups: numeric rooms ascending, then free_layout, then parking, then commercial
            const sortedEntries = Object.entries(layoutGroups).sort(([keyA], [keyB]) => {
              // Get sort order: 0 = numeric rooms, 1 = free_layout, 2 = parking, 3 = commercial
              const getSortOrder = (key: string): number => {
                if (key === 'commercial') return 3;
                if (key === 'parking') return 2;
                if (key === 'free_layout') return 1;
                return 0; // numeric rooms
              };
              
              const orderA = getSortOrder(keyA);
              const orderB = getSortOrder(keyB);
              
              // If different categories, sort by category order
              if (orderA !== orderB) {
                return orderA - orderB;
              }
              
              // Both are numeric rooms - compare numbers
              if (orderA === 0) {
                const numA = parseInt(keyA.replace('-rooms', ''));
                const numB = parseInt(keyB.replace('-rooms', ''));
                if (!isNaN(numA) && !isNaN(numB)) {
                  return numA - numB;
                }
              }
              
              return 0;
            });

            return sortedEntries.map(([key, apartmentGroup]) => {
              const representativeApt = apartmentGroup[0];
              const availableCount = apartmentGroup.filter(apt => apt.status === 'available').length;
              const totalCount = apartmentGroup.length;

              if (!representativeApt) return null;

              const isCommercial = representativeApt.type === 'commercial';
              const isParking = representativeApt.type === 'parking';
              const isFreeLayout = representativeApt.type === 'apartment' && representativeApt.rooms === 'free_layout';

              return (
                <Card key={key} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[4/3] bg-gray-100 relative">
                    {(() => {
                      let layoutKey: string;
                      if (representativeApt?.type === 'commercial') {
                        layoutKey = 'commercial';
                      } else if (representativeApt?.type === 'parking') {
                        layoutKey = 'parking';
                      } else if (representativeApt?.rooms === 'free_layout') {
                        layoutKey = 'free_layout';
                      } else {
                        layoutKey = representativeApt?.rooms == 0 ? 'studio' : `${Number(representativeApt?.rooms ?? 0)}-room`;
                      }


                      const photos = preloadedLayoutPhotosByRooms[layoutKey] || [];
                      const first = photos[0];

                      if (first) {
                        return (
                          <img
                            loading="lazy"
                            src={first.image_url}
                            alt={isCommercial ? t('apartmentsManager.typeCommercial') : isParking ? t('apartmentsManager.typeParking') : isFreeLayout ? t('apartment.freeLayout') : (representativeApt.rooms == 0 ? t('apartment.studio') : `${String(representativeApt.rooms)}-${t('apartment.rooms')}`)}
                            className="w-full h-full object-cover"
                          />
                        );
                      } else {
                        return (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            {isCommercial ? t('apartmentsManager.typeCommercial') : isParking ? t('apartmentsManager.typeParking') : isFreeLayout ? t('apartment.freeLayout') : t('project.layoutPreview')}
                          </div>
                        );
                      }
                    })()}

                    {/* Status badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <Badge
                        variant={availableCount > 0 ? 'default' : 'secondary'}
                        className={availableCount > 0 ? 'bg-green-500' : 'bg-gray-500'}
                      >
                        {availableCount > 0 ? `${availableCount} ${t('common.available')}` : t('common.unavailable')}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg">
                        {isCommercial ? t('apartmentsManager.typeCommercial') : isParking ? t('apartmentsManager.typeParking') : isFreeLayout ? t('apartment.freeLayout') : (representativeApt?.rooms == 0 ? t('apartment.studio') : `${String(representativeApt?.rooms ?? 0)}-${t('apartment.rooms')}`)}
                      </h4>

                      {
                        visibleFields.find(field => field.field_name === 'area')?.is_visible &&
                        <div className="text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Ruler className="h-4 w-4" />
                            {(() => {
                              const areas = apartmentGroup.map(apt => apt.area);
                              const minArea = Math.min(...areas);
                              const maxArea = Math.max(...areas);
                              return minArea === maxArea ? `${minArea} м²` : `${minArea}-${maxArea} м²`;
                            })()}
                          </span>
                        </div>
                      }

                      {/* Price range */}
                      {
                        visibleFields.find(field => field.field_name === 'price')?.is_visible &&
                        (() => {
                          const prices = apartmentGroup.map(apt => apt.price).filter(p => p);
                          if (prices.length > 0) {
                            const minPrice = Math.min(...prices as number[]);
                            const maxPrice = Math.max(...prices as number[]);
                            return (
                              <div className="font-bold text-lg">
                                {minPrice === maxPrice
                                  ? `${formatPrice(minPrice)} ${getCurrencySymbolSafe(selectedCurrency)}`
                                  : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)} ${getCurrencySymbolSafe(selectedCurrency)}`
                                }
                              </div>
                            );
                          }
                          return <div className="font-bold text-lg">{t('project.onRequest')}</div>;
                        })()}

                      <Button
                        className="w-full text-white hover:opacity-90"
                        style={{ backgroundColor: themeColor }}
                        onClick={() => {
                          if (isCommercial) {
                            setSelectedType('commercial');
                            setSelectedRooms('all');
                          } else if (isParking) {
                            setSelectedType('parking');
                            setSelectedRooms('all');
                          } else if (isFreeLayout) {
                            setSelectedType('apartment');
                            setSelectedRooms('free_layout');
                          } else {
                            setSelectedType('apartment');
                            setSelectedRooms(Number(representativeApt?.rooms ?? 0) >= 4 ? '4+' : String(representativeApt?.rooms ?? 0));
                          }
                          setViewMode('list');
                        }}
                      >
                        {t('project.viewApartments', { count: totalCount })}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            });
          })()}
        </div>

        {apartments.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('project.noApartments')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
