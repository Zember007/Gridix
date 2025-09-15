import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Grid, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Apartment } from '@/types/apartment';
import { getCurrencySymbolSafe } from '@/lib/currency-utils';

interface Project {
  has_commercial?: boolean;
  has_parking?: boolean;
  currency?: string;
}

interface LayoutPhoto {
  id: string;
  image_url: string;
  description?: string;
  order_index: number;
  type: 'layout';
}

interface FieldSetting {
  id?: string;
  field_name: string;
  field_label: string;
  field_label_translations?: Partial<Record<string, string>>;
  field_type: string;
  is_visible: boolean;
  is_custom: boolean;
  sort_order: number;
}

interface ListViewProps {
  filteredApartments: Apartment[];
  listViewMode: 'list' | 'grid';
  setListViewMode: (mode: 'list' | 'grid') => void;
  selectedType: 'all' | 'apartment' | 'commercial' | 'parking';
  setSelectedType: (value: 'all' | 'apartment' | 'commercial' | 'parking') => void;
  openApartmentDetails: (apartment: Apartment) => void;
  preloadedLayoutPhotosByRooms: Record<string, LayoutPhoto[]>;
  getVisibleFields: () => FieldSetting[];
  getCustomFieldValue: (apartment: Apartment, fieldName: string) => unknown;
  formatFieldValue: (value: unknown, fieldType: string, fieldName: string) => string;
  getFieldLabel: (field: FieldSetting) => string;
  groupApartmentsByFloor: () => { floor: number; apartments: Apartment[] }[];
  convertPrice: (price: number, fromCurrency: string | null | undefined, toCurrency: string) => number;
  formatPrice: (price: number) => string;
  project?: Project;
  selectedCurrency: string;
  isMobile: boolean;
}

export const ListView = ({
  filteredApartments,
  listViewMode,
  setListViewMode,
  selectedType,
  setSelectedType,
  openApartmentDetails,
  preloadedLayoutPhotosByRooms,
  getVisibleFields,
  getCustomFieldValue,
  formatFieldValue,
  getFieldLabel,
  groupApartmentsByFloor,
  convertPrice,
  formatPrice,
  project,
  selectedCurrency,
  isMobile
}: ListViewProps) => {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 grow">
      <div className={(project?.has_commercial || project?.has_parking) ? "space-y-6" : "space-y-1"}>
        <div className="flex gap-[20px] justify-between">
          <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>{t('project.apartmentsList')}</h2>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant={listViewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              className={listViewMode === 'list' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
              onClick={() => setListViewMode('list')}
            >
              <List className="h-4 w-4 mr-1" />
              {t('common.list')}
            </Button>
            <Button
              variant={listViewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              className={listViewMode === 'grid' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
              onClick={() => setListViewMode('grid')}
            >
              <Grid className="h-4 w-4 mr-1" />
              {t('common.grid')}
            </Button>
          </div>
        </div>

        {/* Type selector tabs - only show if project has commercial or parking */}
        {(project?.has_commercial || project?.has_parking) && (
          <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as 'all' | 'apartment' | 'commercial' | 'parking')}>
            <TabsList className="flex w-full md:flex-row flex-col h-auto">
              <TabsTrigger className="w-full" value="all">{t('project.allTypes')}</TabsTrigger>
              <TabsTrigger className="w-full" value="apartment">{t('apartmentsManager.typeApartment')}</TabsTrigger>
              {project?.has_commercial && (
                <TabsTrigger className="w-full" value="commercial">{t('apartmentsManager.typeCommercial')}</TabsTrigger>
              )}
              {project?.has_parking && (
                <TabsTrigger className="w-full" value="parking">{t('apartmentsManager.typeParking')}</TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        )}

        <div className="space-y-4 overflow-y-auto">
          {listViewMode === 'list' ? (
            // Desktop table layout
            <>
              {isMobile ? (
                // Mobile card layout
                <div className="space-y-4">
                  {filteredApartments.map((apartment) => (
                    <Card key={apartment.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => openApartmentDetails(apartment)}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                              {(() => {
                                const layoutKey = apartment.rooms === 0 ? 'studio' : `${apartment.rooms}-room`;
                                const photos = preloadedLayoutPhotosByRooms[layoutKey] || [];
                                const first = photos[0];
                                return first ? (
                                  <img
                                    src={first.image_url}
                                    alt={apartment.rooms === 0 ? t('apartment.studio') : `${apartment.rooms}-${t('apartment.rooms')}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Building2 className="h-8 w-8 text-gray-400" />
                                );
                              })()}
                            </div>
                          </div>
                          <div className="flex-grow space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">
                                {apartment.rooms === 0 ? t('apartment.studio') : `${apartment.rooms} ${t('apartment.rooms')}`}
                              </span>
                              <Badge
                                variant={apartment.status === 'available' ? 'default' : 'secondary'}
                                className={apartment.status === 'available' ? 'bg-green-500' : 'bg-gray-500'}
                              >
                                {apartment.status === 'available' ? t('common.available') : t('common.unavailable')}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>{apartment.area} м² • {apartment.floor_number} {t('project.floor').toLowerCase()}</div>
                              <div className="font-bold text-sm text-gray-900">
                                {apartment.price ? `${formatPrice(convertPrice(apartment.price, project?.currency, selectedCurrency))} ${getCurrencySymbolSafe(selectedCurrency)}` : t('project.onRequest')}
                              </div>
                              {/* Custom fields for mobile */}
                              {getVisibleFields().slice(0, 2).map((field) => {
                                let value: unknown = null;

                                if (field.is_custom) {
                                  value = getCustomFieldValue(apartment, field.field_name);
                                } else {
                                  switch (field.field_name) {
                                    case 'rooms':
                                      value = apartment.rooms;
                                      break;
                                    case 'area':
                                      value = apartment.area;
                                      break;
                                    case 'price':
                                      value = apartment.price;
                                      break;
                                    case 'status':
                                      value = apartment.status;
                                      break;
                                    case 'floor':
                                      value = apartment.floor_number;
                                      break;
                                    case 'number':
                                      value = apartment.apartment_number;
                                      break;
                                    default:
                                      value = null;
                                  }
                                }

                                if (value === null) return null;

                                return (
                                  <div key={field.id} className="text-xs text-gray-500">
                                    {
                                      field.is_custom ?
                                        getFieldLabel(field)
                                        :
                                        t(`project.${field.field_name}`)
                                    }: {formatFieldValue(value, field.field_type, field.field_name)}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <>
                  <div className={`hidden md:grid gap-4 py-3 text-sm text-gray-500 border-b`}
                    style={{ gridTemplateColumns: `200px 120px 100px 100px 150px ${getVisibleFields().map(() => '120px').join(' ')}` }}>
                    <div></div>
                    {getVisibleFields().map((field) => (
                      <div key={field.id}>{
                        field.is_custom ?
                          getFieldLabel(field)
                          :
                          t(`project.${field.field_name}`)
                      }</div>
                    ))}
                  </div>

                  {/* Apartment rows */}
                  {filteredApartments.map((apartment) => (
                    <div key={apartment.id}
                      className="hidden md:grid gap-4 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      style={{ gridTemplateColumns: `200px 120px 100px 100px 150px ${getVisibleFields().map(() => '120px').join(' ')}` }}
                      onClick={() => openApartmentDetails(apartment)}>
                      <div className="flex items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {(() => {
                            const layoutKey = apartment.rooms === 0 ? 'studio' : `${apartment.rooms}-room`;
                            const photos = preloadedLayoutPhotosByRooms[layoutKey] || [];
                            const first = photos[0];
                            return first ? (
                              <img
                                src={first.image_url}
                                alt={apartment.rooms === 0 ? t('apartment.studio') : `${apartment.rooms}-${t('apartment.rooms')}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Building2 className="h-8 w-8 text-gray-400" />
                            );
                          })()}
                        </div>
                      </div>

                      {getVisibleFields().map((field) => {
                        let value: unknown = null;

                        if (field.is_custom) {
                          value = getCustomFieldValue(apartment, field.field_name);
                        } else {
                          switch (field.field_name) {
                            case 'rooms':
                              value = apartment.rooms;
                              break;
                            case 'area':
                              value = apartment.area;
                              break;
                            case 'price':
                              value = apartment.price;
                              break;
                            case 'status':
                              value = apartment.status;
                              break;
                            case 'floor':
                              value = apartment.floor_number;
                              break;
                            case 'number':
                              value = apartment.apartment_number;
                              break;
                            default:
                              value = null;
                          }
                        }

                        return (
                          <div key={field.id} className="flex items-center">
                            <span>{formatFieldValue(value, field.field_type, field.field_name)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            // Desktop grid layout - grouped by floors
            <div className=" space-y-8">
              {groupApartmentsByFloor().map(({ floor, apartments: floorApartments }) => (
                <div key={floor} className="space-y-4">
                  {/* Floor header */}
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-semibold text-gray-800">
                      {floor} {t('project.floor').toLowerCase()}
                    </h3>
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-sm text-gray-500">
                      {floorApartments.length} {floorApartments.length === 1 ? t('apartment.apartment') : t('apartment.apartments')}
                    </span>
                  </div>

                  {/* Apartments grid for this floor */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {floorApartments.map((apartment) => (
                      <Card
                        key={apartment.id}
                        className={`aspect-square overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2 ${apartment.status === 'available'
                          ? 'border-green-200 hover:border-green-400 bg-green-50 hover:bg-green-100'
                          : 'border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                          }`}
                        onClick={() => openApartmentDetails(apartment)}
                      >
                        <CardContent className="p-3 h-full flex flex-col justify-between">
                          {/* Apartment number */}
                          <div className="text-center flex flex-col items-center gap-[5px]">
                            <div className="text-sm font-bold text-gray-900 ">
                              {apartment.apartment_number || `#${apartment.id.slice(-4)}`}
                            </div>
                            <Badge
                              variant={apartment.status === 'available' ? 'default' : 'secondary'}
                              className={`text-[8px] !flex justify-center leading-[1] ${apartment.status === 'available'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-500 text-white'
                                }`}
                            >
                              {apartment.status === 'available' ? t('common.available') : t('common.unavailable')}
                            </Badge>
                          </div>

                          {/* Apartment info */}
                          <div className="text-center space-y-1">
                            <div className="text-sm font-medium text-gray-700">
                              {!Number.isNaN(apartment.rooms) &&
                                <>
                                  {apartment.rooms === 0 ? t('apartment.studio') : `${apartment.rooms} ${t('apartment.rooms')}`}
                                </>
                              }
                            </div>
                            <div className="text-xs text-gray-600">
                              {apartment.area} м²
                            </div>
                            <div className="text-xs font-semibold text-gray-900">
                              {apartment.price ?
                                `${formatPrice(convertPrice(apartment.price, project?.currency, selectedCurrency))} ${getCurrencySymbolSafe(selectedCurrency)}`
                                : t('project.onRequest')
                              }
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
