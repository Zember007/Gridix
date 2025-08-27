
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Apartment } from '@/types/apartment';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import ApartmentPhotosViewer from './ApartmentPhotosViewer';
import { formatPriceWithCurrency } from '@/lib/currency-utils';


interface ApartmentDetailsModalProps {
  apartment: Apartment | null;
  isOpen: boolean;
  onClose: () => void;
}

const ApartmentDetailsModal = ({ apartment, isOpen, onClose }: ApartmentDetailsModalProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] h-[90vh]' : 'max-w-2xl max-h-[90vh]'} overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center justify-between'}`}>
            <span className={isMobile ? 'text-lg' : ''}>{t('apartment.number')} {apartment.apartment_number}</span>
            <Badge className={getStatusColor(apartment.status)}>
              {getStatusLabel(apartment.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
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
                <p className="text-lg font-semibold">{apartment.price.toLocaleString()} </p>
              </div>
            )}
          </div>

          {/* Дополнительные поля */}
          {apartment.custom_fields && Object.keys(apartment.custom_fields).length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-3">{t('apartment.additionalInfo')}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(apartment.custom_fields).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">{key}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApartmentDetailsModal;
