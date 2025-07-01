
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Home, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ApartmentStats {
  total: number;
  available: number;
  sold: number;
  reserved: number;
  totalPrice: number;
  averagePrice: number;
}

interface ApartmentStatsPanelProps {
  projectId: string;
  selectedFloor?: number | null;
}

const ApartmentStatsPanel = ({ projectId, selectedFloor }: ApartmentStatsPanelProps) => {
  const [stats, setStats] = useState<ApartmentStats>({
    total: 0,
    available: 0,
    sold: 0,
    reserved: 0,
    totalPrice: 0,
    averagePrice: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [projectId, selectedFloor]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('apartments')
        .select('status, price')
        .eq('project_id', projectId);

      if (selectedFloor) {
        query = query.eq('floor_number', selectedFloor);
      }

      const { data, error } = await query;

      if (error) throw error;

      const apartments = data || [];
      const total = apartments.length;
      const available = apartments.filter(apt => apt.status === 'available').length;
      const sold = apartments.filter(apt => apt.status === 'sold').length;
      const reserved = apartments.filter(apt => apt.status === 'reserved').length;
      
      const prices = apartments.map(apt => Number(apt.price) || 0);
      const totalPrice = prices.reduce((sum, price) => sum + price, 0);
      const averagePrice = total > 0 ? totalPrice / total : 0;

      setStats({
        total,
        available,
        sold,
        reserved,
        totalPrice,
        averagePrice
      });
    } catch (error) {
      console.error('Error loading apartment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {selectedFloor ? `Этаж ${selectedFloor}` : 'Статистика квартир'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Общая статистика */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-700">Всего</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-green-700">Свободно</div>
          </div>
        </div>

        {/* Статусы */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Продано:</span>
            <Badge variant="destructive" className="text-xs">
              {stats.sold}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Бронь:</span>
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
              {stats.reserved}
            </Badge>
          </div>
        </div>

        {/* Прогресс продаж */}
        {stats.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Продано</span>
              <span>{Math.round((stats.sold / stats.total) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${(stats.sold / stats.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Цены */}
        {stats.averagePrice > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-3 w-3" />
              <span className="font-medium">Средняя цена:</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(stats.averagePrice)} ₽
            </div>
            {stats.totalPrice > 0 && (
              <div className="text-xs text-gray-500">
                Общая стоимость: {formatPrice(stats.totalPrice)} ₽
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApartmentStatsPanel;
