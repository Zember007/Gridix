
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { Switch } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Slider } from "@gridix/ui";
import { Separator } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Json } from '@gridix/types/database';
interface PolygonSettings {
  colors: {
    available: string;
    sold: string;
    reserved: string;
    building?: string; // For building type - single color
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
  onSettingsChange?: (settings: PolygonSettings) => void;
}

const defaultSettings: PolygonSettings = {
  colors: {
    available: '#3b82f6',
    sold: '#ef4444',
    reserved: '#f59e0b',
    building: '#3b82f6'
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

// Функция для валидации и дополнения настроек дефолтными значениями
const validateAndMergeSettings = (loadedSettings: unknown, type: 'building' | 'floor'): PolygonSettings => {
  const merged = { ...defaultSettings };
  
  if (!loadedSettings || typeof loadedSettings !== 'object') {
    return merged;
  }

  const settings = loadedSettings as Partial<PolygonSettings>;

  // Валидация и слияние colors
  if (settings.colors && typeof settings.colors === 'object') {
    merged.colors = {
      ...defaultSettings.colors,
      ...settings.colors
    };
  }

  // Валидация и слияние hoverEffects
  if (settings.hoverEffects && typeof settings.hoverEffects === 'object') {
    merged.hoverEffects = {
      ...defaultSettings.hoverEffects,
      ...settings.hoverEffects
    };
  }

  // Валидация и слияние display
  if (settings.display && typeof settings.display === 'object') {
    merged.display = {
      ...defaultSettings.display,
      ...settings.display
    };
  }

  // Валидация и слияние opacity
  if (settings.opacity && typeof settings.opacity === 'object') {
    merged.opacity = {
      ...defaultSettings.opacity,
      ...settings.opacity
    };
  }

  // Для типа building убеждаемся, что есть building цвет
  if (type === 'building' && !merged.colors.building) {
    merged.colors.building = '#3b82f6';
  }

  return merged;
};

const PolygonCustomizationSettings = ({
  projectId,
  type,
  onSettingsChange
}: PolygonCustomizationSettingsProps) => {
  const [settings, setSettings] = useState<PolygonSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const loadSettings = useCallback(async () => {
    try {
      if (type === 'building') {
        const { data, error } = await supabase
          .from('projects')
          .select('polygon_settings_facade')
          .eq('id', projectId)
          .single();

        if (error) throw error;

        if ((data)?.polygon_settings_facade) {
          const loadedSettings = (data).polygon_settings_facade as unknown as PolygonSettings;
          const validatedSettings = validateAndMergeSettings(loadedSettings, 'building');
          setSettings(validatedSettings);
        }
      } else {
        const { data, error } = await supabase
          .from('projects')
          .select('polygon_settings_floor')
          .eq('id', projectId)
          .single();

        if (error) throw error;

        if ((data)?.polygon_settings_floor) {
          const loadedSettings = (data).polygon_settings_floor as unknown as PolygonSettings;
          const validatedSettings = validateAndMergeSettings(loadedSettings, 'floor');
          setSettings(validatedSettings);
        }
      }
    } catch (error) {
      console.error('Error loading polygon settings:', error);
    }
  }, [projectId, type]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    setLoading(true);
    try {
      if (type === 'building') {
        const { error } = await supabase
          .from('projects')
          .update({ polygon_settings_facade: settings as unknown as Json})
          .eq('id', projectId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('projects')
          .update({ polygon_settings_floor: settings as unknown as Json })
          .eq('id', projectId);
        if (error) throw error;
      }

      toast.success(t('polygonSettings.saved'));
      onSettingsChange?.(settings);
    } catch (error) {
      console.error('Error saving polygon settings:', error);
      toast.error(t('polygonSettings.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (path: string, value: string | number | boolean) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: Record<string, unknown> = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!key) continue;
        const next = current[key];
        if (!next || typeof next !== 'object') {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }

      const lastKey = keys[keys.length - 1];
      if (lastKey) {
        current[lastKey] = value;
      }
      return newSettings;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {type === 'building' ? t('polygonSettings.buildingTitle') : t('polygonSettings.floorTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Цвета - для здания один цвет, для этажа - по статусам */}
        <div className="space-y-4">
          <h4 className="font-medium">{t('polygonSettings.colors')}</h4>
          {type === 'building' ? (
            <div className="space-y-2">
              <Label>{t('polygonSettings.buildingColor')}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.colors.building || '#3b82f6'}
                  onChange={(e) => updateSettings('colors.building', e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <span className="text-sm text-gray-600">{settings.colors.building || '#3b82f6'}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('project.available')}</Label>
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
                <Label>{t('project.sold')}</Label>
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
                <Label>{t('project.reserved')}</Label>
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
          )}
        </div>

        <Separator />

        {/* Эффекты при наведении */}
        <div className="space-y-4">
          <h4 className="font-medium">{t('polygonSettings.hoverEffects')}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>{t('polygonSettings.colorChange')}</Label>
              <Switch
                checked={settings.hoverEffects.colorChange}
                onCheckedChange={(checked) => updateSettings('hoverEffects.colorChange', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('polygonSettings.opacityChange')}</Label>
              <Switch
                checked={settings.hoverEffects.opacityChange}
                onCheckedChange={(checked) => updateSettings('hoverEffects.opacityChange', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('polygonSettings.glow')}</Label>
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
          <h4 className="font-medium">{t('polygonSettings.display')}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label>{t('polygonSettings.showNumbers')}</Label>
              <Switch
                checked={settings.display.showNumbers}
                onCheckedChange={(checked) => updateSettings('display.showNumbers', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('polygonSettings.showTooltip')}</Label>
              <Switch
                checked={settings.display.showTooltip}
                onCheckedChange={(checked) => updateSettings('display.showTooltip', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('polygonSettings.showArea')}</Label>
              <Switch
                checked={settings.display.showArea}
                onCheckedChange={(checked) => updateSettings('display.showArea', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>{t('polygonSettings.showPrice')}</Label>
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
          <h4 className="font-medium">{t('polygonSettings.opacity')}</h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('polygonSettings.normalOpacity')}: {Math.round(settings.opacity.normal * 100)}%</Label>
              <Slider
                value={[settings.opacity.normal]}
                onValueChange={([value]) => updateSettings('opacity.normal', value ?? settings.opacity.normal)}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('polygonSettings.hoverOpacity')}: {Math.round(settings.opacity.hover * 100)}%</Label>
              <Slider
                value={[settings.opacity.hover]}
                onValueChange={([value]) => updateSettings('opacity.hover', value ?? settings.opacity.hover)}
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
          {loading ? t('polygonSettings.saving') : t('polygonSettings.save')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PolygonCustomizationSettings;
