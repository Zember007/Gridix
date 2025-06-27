
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Home, Maximize, Ruler, Users } from 'lucide-react';

interface ApartmentDetailsPanelProps {
  apartment: {
    id: string;
    number: string;
    status: 'available' | 'sold' | 'reserved';
    area: number;
    rooms: number;
    price?: number;
  } | null;
  onClose: () => void;
}

const ApartmentDetailsPanel = ({ apartment, onClose }: ApartmentDetailsPanelProps) => {
  if (!apartment) return null;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Свободна';
      case 'sold':
        return 'Продана';
      case 'reserved':
        return 'Бронь';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-success-100 text-success-800 border-success-200';
      case 'sold':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reserved':
        return 'bg-warning-100 text-warning-800 border-warning-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="fixed top-4 right-4 w-80 z-50 shadow-lg animate-slide-in-right">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Home className="h-5 w-5 text-real-estate-600" />
            Квартира {apartment.number}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Badge className={`${getStatusColor(apartment.status)} px-3 py-1`}>
            {getStatusText(apartment.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-real-estate-50 rounded-lg">
            <Users className="h-5 w-5 mx-auto mb-2 text-real-estate-600" />
            <div className="text-sm text-real-estate-600">Комнат</div>
            <div className="text-lg font-semibold text-real-estate-900">{apartment.rooms}</div>
          </div>
          
          <div className="text-center p-3 bg-real-estate-50 rounded-lg">
            <Maximize className="h-5 w-5 mx-auto mb-2 text-real-estate-600" />
            <div className="text-sm text-real-estate-600">Площадь</div>
            <div className="text-lg font-semibold text-real-estate-900">{apartment.area} м²</div>
          </div>
        </div>

        {apartment.price && apartment.price > 0 && (
          <div className="text-center p-4 bg-gradient-to-r from-real-estate-50 to-real-estate-100 rounded-lg">
            <Ruler className="h-6 w-6 mx-auto mb-2 text-real-estate-600" />
            <div className="text-sm text-real-estate-600 mb-1">Цена</div>
            <div className="text-2xl font-bold text-real-estate-900">
              {apartment.price.toLocaleString()} ₽
            </div>
          </div>
        )}

        <div className="pt-2 border-t space-y-2">
          <div className="text-xs text-real-estate-500">
            ID квартиры: {apartment.id}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApartmentDetailsPanel;
