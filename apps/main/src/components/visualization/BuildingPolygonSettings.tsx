
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { Switch } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Slider } from "@gridix/ui";
import { Separator } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { toast } from 'sonner';
import { useProjectCRUD } from '@/entities/project/queries/useProjects';

interface BuildingPolygonSettings {
  colors: {
    available: string;
    sold: string;
    reserved: string;
  };
  hoverEffects: {
    colorChange: boolean;
    opacityChange: boolean;
    glow: boolean;
  };
  display: {
    showNumbers: boolean;
  };
  opacity: {
    normal: number;
    hover: number;
  };
}

interface BuildingPolygonSettingsProps {
  projectId: string;
  onSettingsChange?: (settings: BuildingPolygonSettings) => void;
}

const defaultSettings: BuildingPolygonSettings = {
  colors: {
    available: '#3b82f6',
    sold: '#ef4444',
    reserved: '#f59e0b'
  },
  hoverEffects: {
    colorChange: true,
    opacityChange: true,
    glow: true
  },
  display: {
    showNumbers: true
  },
  opacity: {
    normal: 0.4,
    hover: 0.7
  }
};

const BuildingPolygonSettingsComponent = ({ 
  projectId, 
  onSettingsChange 
}: BuildingPolygonSettingsProps) => {
  const [settings, setSettings] = useState<BuildingPolygonSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const { updateProject } = useProjectCRUD();

  useEffect(() => {
    loadSettings();
  }, [projectId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await (supabase
        .from('projects')
        .select('building_polygon_settings')
        .eq('id', projectId)
        .single() as any);

      if (error) throw error;
      
      const settingsFromDb = (data as any)?.building_polygon_settings;
      if (settingsFromDb) {
        setSettings(settingsFromDb as BuildingPolygonSettings);
      }
    } catch (error) {
      console.error('Error loading building polygon settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const success = await updateProject(projectId, {
        building_polygon_settings: settings as unknown as any,
      } as any);

      if (success) {
        toast.success('Настройки здания сохранены');
        onSettingsChange?.(settings);
      }
    } catch (error) {
      console.error('Error saving building polygon settings:', error);
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
        const key = keys[i];
        if (!key) continue;
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      
      const lastKey = keys[keys.length - 1];
      if (lastKey) current[lastKey] = value;
      return newSettings;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Настройки полигонов здания
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Цвета статусов */}
        <div className="space-y-4">
          <h4 className="font-medium">Цвета этажей</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Свободные квартиры</Label>
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
              <Label>Проданные квартиры</Label>
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
              <Label>Забронированные</Label>
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
          <div className="flex items-center justify-between">
            <Label>Показывать номера этажей</Label>
            <Switch
              checked={settings.display.showNumbers}
              onCheckedChange={(checked) => updateSettings('display.showNumbers', checked)}
            />
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

export default BuildingPolygonSettingsComponent;
