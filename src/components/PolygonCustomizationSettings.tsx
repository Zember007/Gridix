
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PolygonSettings {
  colors: {
    available: string;
    sold: string;
    reserved: string;
  };
  hoverEffects: {
    scale: boolean;
    colorChange: boolean;
    opacityChange: boolean;
    glow: boolean;
  };
  display: {
    showNumbers: boolean;
    showTooltip: boolean;
    showArea: boolean;
    showPrice: boolean;
  };
  opacity: {
    normal: number;
    hover: number;
  };
}

interface PolygonCustomizationSettingsProps {
  projectId: string;
  type: 'building' | 'floor';
  floorNumber?: number;
  onSettingsChange?: (settings: PolygonSettings) => void;
}

const defaultSettings: PolygonSettings = {
  colors: {
    available: '#3b82f6',
    sold: '#ef4444',
    reserved: '#f59e0b'
  },
  hoverEffects: {
    scale: false,
    colorChange: true,
    opacityChange: true,
    glow: true
  },
  display: {
    showNumbers: true,
    showTooltip: false,
    showArea: false,
    showPrice: false
  },
  opacity: {
    normal: 0.4,
    hover: 0.7
  }
};

const PolygonCustomizationSettings = ({ 
  projectId, 
  type, 
  floorNumber,
  onSettingsChange 
}: PolygonCustomizationSettingsProps) => {
  const [settings, setSettings] = useState<PolygonSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [projectId, type, floorNumber]);

  const loadSettings = async () => {
    try {
      if (type === 'building') {
        const { data, error } = await supabase
          .from('projects')
          .select('building_polygon_settings')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        
        if (data?.building_polygon_settings) {
          setSettings(data.building_polygon_settings as unknown as PolygonSettings);
        }
      } else {
        if (!floorNumber) return;
        
        const { data, error } = await supabase
          .from('floor_plans')
          .select('polygon_settings')
          .eq('project_id', projectId)
          .eq('floor_number', floorNumber)
          .maybeSingle();

        if (error) throw error;
        
        if (data?.polygon_settings) {
          setSettings(data.polygon_settings as unknown as PolygonSettings);
        }
      }
    } catch (error) {
      console.error('Error loading polygon settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      if (type === 'building') {
        const { error } = await supabase
          .from('projects')
          .update({ building_polygon_settings: settings as unknown as any })
          .eq('id', projectId);

        if (error) throw error;
      } else {
        if (!floorNumber) return;

        const { error } = await supabase
          .from('floor_plans')
          .update({ polygon_settings: settings as unknown as any })
          .eq('project_id', projectId)
          .eq('floor_number', floorNumber);

        if (error) throw error;
      }

      toast.success('Настройки сохранены');
      onSettingsChange?.(settings);
    } catch (error) {
      console.error('Error saving polygon settings:', error);
      toast.error('Ошибка сохранения настроек');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Настройки полигонов {type === 'building' ? 'здания' : 'этажа'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Цвета статусов */}
        <div className="space-y-4">
          <h4 className="font-medium">Цвета статусов</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Свободна</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.colors.available}
                  onChange={(e) => updateSettings('colors.available', e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <span className="text-sm text-gray-600">{settings.colors.available}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Продана</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.colors.sold}
                  onChange={(e) => updateSettings('colors.sold', e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <span className="text-sm text-gray-600">{settings.colors.sold}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Бронь</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.colors.reserved}
                  onChange={(e) => updateSettings('colors.reserved', e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <span className="text-sm text-gray-600">{settings.colors.reserved}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Эффекты при наведении */}
        <div className="space-y-4">
          <h4 className="font-medium">Эффекты при наведении</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>Изменение цвета</Label>
              <Switch
                checked={settings.hoverEffects.colorChange}
                onCheckedChange={(checked) => updateSettings('hoverEffects.colorChange', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Изменение прозрачности</Label>
              <Switch
                checked={settings.hoverEffects.opacityChange}
                onCheckedChange={(checked) => updateSettings('hoverEffects.opacityChange', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Свечение</Label>
              <Switch
                checked={settings.hoverEffects.glow}
                onCheckedChange={(checked) => updateSettings('hoverEffects.glow', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Отображение информации */}
        <div className="space-y-4">
          <h4 className="font-medium">Отображение информации</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>Показывать номера</Label>
              <Switch
                checked={settings.display.showNumbers}
                onCheckedChange={(checked) => updateSettings('display.showNumbers', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Всплывающие подсказки</Label>
              <Switch
                checked={settings.display.showTooltip}
                onCheckedChange={(checked) => updateSettings('display.showTooltip', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Показывать площадь</Label>
              <Switch
                checked={settings.display.showArea}
                onCheckedChange={(checked) => updateSettings('display.showArea', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Показывать цену</Label>
              <Switch
                checked={settings.display.showPrice}
                onCheckedChange={(checked) => updateSettings('display.showPrice', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Настройки прозрачности */}
        <div className="space-y-4">
          <h4 className="font-medium">Прозрачность</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Обычное состояние: {Math.round(settings.opacity.normal * 100)}%</Label>
              <Slider
                value={[settings.opacity.normal]}
                onValueChange={([value]) => updateSettings('opacity.normal', value)}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>При наведении: {Math.round(settings.opacity.hover * 100)}%</Label>
              <Slider
                value={[settings.opacity.hover]}
                onValueChange={([value]) => updateSettings('opacity.hover', value)}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={saveSettings} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Сохранение...' : 'Сохранить настройки'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PolygonCustomizationSettings;
