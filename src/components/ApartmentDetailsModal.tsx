
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Home, Ruler, DollarSign, Phone, Mail } from 'lucide-react';
import { Apartment } from '@/types/apartment';

interface ApartmentDetailsModalProps {
  apartment: Apartment;
  open: boolean;
  onClose: () => void;
}

const ApartmentDetailsModal = ({ apartment, open, onClose }: ApartmentDetailsModalProps) => {
  const formatPrice = (price: number | null) => {
    if (!price) return 'Цена по запросу';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Доступно</Badge>;
      case 'reserved':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Забронировано</Badge>;
      case 'sold':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Продано</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              Квартира {apartment.apartment_number}
            </DialogTitle>
            {getStatusBadge(apartment.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <MapPin className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-lg font-semibold">{apartment.floor_number}</div>
                <div className="text-sm text-muted-foreground">Этаж</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Home className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-lg font-semibold">
                  {apartment.rooms === 0 ? 'Студия' : `${apartment.rooms} комн.`}
                </div>
                <div className="text-sm text-muted-foreground">Комнаты</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Ruler className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-lg font-semibold">{apartment.area} м²</div>
                <div className="text-sm text-muted-foreground">Площадь</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-lg font-semibold">
                  {apartment.price ? 
                    Math.round(apartment.price / apartment.area).toLocaleString('ru-RU') : '—'
                  }
                </div>
                <div className="text-sm text-muted-foreground">₽/м²</div>
              </CardContent>
            </Card>
          </div>

          {/* Price */}
          {apartment.price && (
            <Card className="border-primary">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatPrice(apartment.price)}
                </div>
                <div className="text-muted-foreground">Полная стоимость квартиры</div>
              </CardContent>
            </Card>
          )}

          {/* Tabs with details */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Описание</TabsTrigger>
              <TabsTrigger value="layout">Планировка</TabsTrigger>
              <TabsTrigger value="gallery">Галерея</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Характеристики квартиры</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Номер квартиры:</span>
                      <span className="font-medium">{apartment.apartment_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Этаж:</span>
                      <span className="font-medium">{apartment.floor_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Комнаты:</span>
                      <span className="font-medium">
                        {apartment.rooms === 0 ? 'Студия' : `${apartment.rooms} комн.`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Общая площадь:</span>
                      <span className="font-medium">{apartment.area} м²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Статус:</span>
                      <span className="font-medium">
                        {apartment.status === 'available' ? 'Доступно' :
                         apartment.status === 'reserved' ? 'Забронировано' : 'Продано'}
                      </span>
                    </div>
                  </div>

                  {/* Custom fields */}
                  {apartment.custom_fields && typeof apartment.custom_fields === 'object' && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-medium mb-3">Дополнительные характеристики</h4>
                      <div className="space-y-2">
                        {Object.entries(apartment.custom_fields).map(([key, value]) => (
                          value && (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground capitalize">{key}:</span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12 text-muted-foreground">
                    <Home className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg">Планировка квартиры</p>
                    <p className="text-sm">Изображение планировки будет загружено позже</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gallery">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12 text-muted-foreground">
                    <Home className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg">Галерея изображений</p>
                    <p className="text-sm">Фотографии квартиры будут загружены позже</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action buttons */}
          <div className="flex gap-4">
            <Button 
              className="flex-1" 
              size="lg"
              disabled={apartment.status !== 'available'}
            >
              {apartment.status === 'available' ? 'Забронировать квартиру' : 'Квартира недоступна'}
            </Button>
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Позвонить
            </Button>
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Написать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApartmentDetailsModal;
