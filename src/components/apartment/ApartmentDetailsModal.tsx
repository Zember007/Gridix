
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Apartment } from '@/types/apartment';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import ApartmentPhotosViewer from './ApartmentPhotosViewer';
import { formatPriceWithCurrency } from '@/lib/currency-utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useFields } from '@/hooks/useFields';
import { Language } from '@/lib/language-utils';
import { useProject } from '@/hooks/useProjects';
import { useState } from 'react';
import ApartmentReservationForm from './ApartmentReservationForm';


interface ApartmentDetailsModalProps {
  apartment: Apartment | null;
  isOpen: boolean;
  onClose: () => void;
}

const ApartmentDetailsModal = ({ apartment, isOpen, onClose }: ApartmentDetailsModalProps) => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const { fields: fieldSettings } = useFields(apartment?.project_id || '');
  const { project } = useProject(apartment?.project_id || '');

  const [isReserveOpen, setIsReserveOpen] = useState(false);

  if (!apartment) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sold': return 'bg-red-100 text-red-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'available': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sold': return t('apartment.sold');
      case 'reserved': return t('apartment.reserved');
      case 'available': return t('apartment.available');
      default: return status;
    }
  };
  if(!isOpen) return null;



  const getFieldLabel = (field: { field_label: string; field_label_translations?: Partial<Record<Language, string>> }) => {
    if (field.field_label_translations && field.field_label_translations[language]) {
      return field.field_label_translations[language] as string;
    }
    return field.field_label;
  };

  const getVisibleFields = () => {
    return fieldSettings
      .filter(field => field.is_visible)
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  const getCustomFieldValue = (apt: Apartment, fieldName: string) => {
    if (!apt.custom_fields) return null;
    const customFields = apt.custom_fields as Record<string, unknown>;
    return customFields[fieldName] || null;
  };

  const formatFieldValue = (value: unknown, fieldType: string, fieldName: string) => {
    if (value === null || value === undefined) return '-';

    if (fieldName === 'price') {
      return typeof value === 'number' ? formatPriceWithCurrency(value, project?.currency || null) : '-';
    }

    if (fieldName === 'area') {
      return `${value} м²`;
    }

    if (fieldName === 'floor_number' || fieldName === 'floor') {
      return `${value} ${t('project.floor').toLowerCase()}`;
    }

    if (fieldName === 'rooms') {
      if (value === 0) {
        return t('apartment.studio');
      }
      return `${value} ${t('apartment.room').toLowerCase()}`;
    }

    switch (fieldType) {
      case 'boolean':
        return value ? 'Да' : 'Нет';
      case 'number':
        return typeof value === 'number' ? value.toString() : String(value);
      case 'select':
        return Array.isArray(value) ? value.join(', ') : String(value);
      default:
        return String(value);
    }
  };

  return (
        <div className="flex h-full flex-col container">
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background p-4">
            <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('common.back')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className={`flex flex-1 items-center justify-between ${isMobile ? '' : ''}`}>
              <span className={isMobile ? 'text-lg' : 'text-xl font-semibold'}>
                {t('apartment.number')} {apartment.apartment_number}
              </span>
              <Badge className={getStatusColor(apartment.status)}>
                {getStatusLabel(apartment.status)}
              </Badge>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 p-4">
              {/* Фотографии квартиры */}
              <ApartmentPhotosViewer apartmentId={apartment.id} projectId={apartment.project_id} />

              {/* Основная информация */}
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">{t('apartment.floor')}</h3>
                  <p className="text-lg">{apartment.floor_number}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">{t('apartment.rooms')}</h3>
                  <p className="text-lg">{apartment.rooms === 0 ? t('apartment.studio') : apartment.rooms}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">{t('apartment.area')}</h3>
                  <p className="text-lg">{apartment.area} м²</p>
                </div>
                {apartment.price && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">{t('apartment.price')}</h3>
                    <p className="text-lg font-semibold">{formatPriceWithCurrency(apartment.price, project?.currency || null)}</p>
                  </div>
                )}
              </div>

              {apartment.status === 'available' && !isReserveOpen && (
                <div className="pt-2">
                  <Button onClick={() => setIsReserveOpen(true)} className="w-full md:w-auto">{t('common.reserve')}</Button>
                </div>
              )}

              {isReserveOpen && (
                <div className="pt-2 rounded-md border p-4">
                  <h3 className="font-medium mb-3">{t('common.reserve')} {t('apartment.apartment')}</h3>
                  <ApartmentReservationForm
                    apartmentId={apartment.id}
                    projectId={apartment.project_id}
                    onSubmit={() => setIsReserveOpen(false)}
                    onCancel={() => setIsReserveOpen(false)}
                  />
                </div>
              )}

              {/* Дополнительные поля - как в ProjectApartmentSelector */}
              {getVisibleFields().length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-3">{t('apartment.additionalInfo')}</h3>
                    <div className="grid grid-cols-1 gap-3">
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

                        if (value === null) return null;

                        return (
                          <div key={field.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <span className="text-sm text-gray-600">{field.is_custom ? getFieldLabel(field) : t(`project.${field.field_name}`)}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatFieldValue(value, field.field_type, field.field_name)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      
  );
};

export default ApartmentDetailsModal;
