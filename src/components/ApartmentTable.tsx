
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Home, Ruler, DollarSign } from 'lucide-react';
import { Apartment } from '@/types/apartment';
import { useLanguage } from '@/contexts/LanguageContext';

interface ApartmentTableProps {
  apartments: Apartment[];
  onApartmentSelect: (apartment: Apartment) => void;
}

const ApartmentTable = ({ apartments, onApartmentSelect }: ApartmentTableProps) => {
  const { t } = useLanguage();

  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t('common.available')}</Badge>;
      case 'reserved':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t('common.reserved')}</Badge>;
      case 'sold':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{t('common.sold')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (apartments.length === 0) {
    return (
      <div className="text-center py-12">
        <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">{t('project.notFoundApartments')}</p>
        <p className="text-sm text-muted-foreground">{t('project.changeFilters')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{t('project.apartmentsList')}</h2>
        <p className="text-sm text-muted-foreground">{t('project.found')}: {apartments.length} {t('project.apartments')}</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('apartment.number')}</TableHead>
              <TableHead>{t('apartment.floor')}</TableHead>
              <TableHead>{t('apartment.rooms')}</TableHead>
              <TableHead>{t('apartment.area')}</TableHead>
              <TableHead>{t('apartment.price')}</TableHead>
              <TableHead>{t('apartment.pricePerSqm')}</TableHead>
              <TableHead>{t('apartment.status')}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apartments.map((apartment) => (
              <TableRow 
                key={apartment.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onApartmentSelect(apartment)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    {apartment.apartment_number}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {apartment.floor_number}
                  </div>
                </TableCell>
                <TableCell>
                  {apartment.rooms === 0 ? t('apartment.studio') : `${apartment.rooms} ${t('apartment.room')}`}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    {apartment.area} {t('apartment.sqm')}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {formatPrice(apartment.price)}
                </TableCell>
                <TableCell>
                  {apartment.price ? (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      {Math.round(apartment.price / apartment.area).toLocaleString('ru-RU')}
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {getStatusBadge(apartment.status)}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApartmentSelect(apartment);
                    }}
                  >
                    {t('common.more')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ApartmentTable;
