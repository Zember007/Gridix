
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Palette, MousePointer, Eye, Settings } from 'lucide-react';

export interface PolygonSettings {
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
  settings: PolygonSettings;
  onSettingsChange: (settings: PolygonSettings) => void;
  isBuilding?: boolean;
}

const PolygonCustomizationSettings = ({ 
  settings, 
  onSettingsChange, 
  isBuilding = false 
}: PolygonCustomizationSettingsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateSettings = (path: string, value: any) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i] as keyof typeof current] as any;
    }
    
    current[keys[keys.length - 1] as keyof typeof current] = value;
    onSettingsChange(newSettings);
  };

  const presetColors = [
    { name: 'Зеленый', value: '#22c55e' },
    { name: 'Синий', value: '#3b82f6' },
    { name: 'Красный', value: '#ef4444' },
    { name: 'Оранжевый', value: '#f59e0b' },
    { name: 'Фиолетовый', value: '#8b5cf6' },
    { name: 'Розовый', value: '#ec4899' },
    { name: 'Серый', value: '#6b7280' },
  ];

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {isBuilding ? 'Настройки этажей здания' : 'Настройки квартир'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Скрыть' : 'Показать'}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Color Settings */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4" />
              <Label className="text-sm font-medium">Цвета полигонов</Label>
            </div>
            
            {!isBuilding ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(settings.colors).map(([status, color]) => (
                  <div key={status} className="space-y-2">
                    <Label className="text-xs">
                      {status === 'available' ? 'Доступные' : 
                       status === 'sold' ? 'Проданные' : 'Забронированные'}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => updateSettings(`colors.${status}`, e.target.value)}
                        className="w-16 h-8 p-0 border-0"
                      />
                      <Select
                        value={color}
                        onValueChange={(value) => updateSettings(`colors.${status}`, value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {presetColors.map((preset) => (
                            <SelectItem key={preset.value} value={preset.value}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded" 
                                  style={{ backgroundColor: preset.value }}
                                />
                                {preset.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs">Единый цвет для всех этажей</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.colors.available}
                    onChange={(e) => updateSettings('colors.available', e.target.value)}
                    className="w-16 h-8 p-0 border-0"
                  />
                  <Select
                    value={settings.colors.available}
                    onValueChange={(value) => updateSettings('colors.available', value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {presetColors.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded" 
                              style={{ backgroundColor: preset.value }}
                            />
                            {preset.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Hover Effects */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MousePointer className="h-4 w-4" />
              <Label className="text-sm font-medium">Эффекты при наведении</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scale-effect"
                  checked={settings.hoverEffects.scale}
                  onCheckedChange={(checked) => updateSettings('hoverEffects.scale', checked)}
                />
                <Label htmlFor="scale-effect" className="text-sm">Увеличение</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="color-effect"
                  checked={settings.hoverEffects.colorChange}
                  onCheckedChange={(checked) => updateSettings('hoverEffects.colorChange', checked)}
                />
                <Label htmlFor="color-effect" className="text-sm">Изменение цвета</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="opacity-effect"
                  checked={settings.hoverEffects.opacityChange}
                  onCheckedChange={(checked) => updateSettings('hoverEffects.opacityChange', checked)}
                />
                <Label htmlFor="opacity-effect" className="text-sm">Изменение прозрачности</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="glow-effect"
                  checked={settings.hoverEffects.glow}
                  onCheckedChange={(checked) => updateSettings('hoverEffects.glow', checked)}
                />
                <Label htmlFor="glow-effect" className="text-sm">Свечение</Label>
              </div>
            </div>
          </div>

          {/* Opacity Settings */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Прозрачность</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Обычная ({Math.round(settings.opacity.normal * 100)}%)</Label>
                <Input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={settings.opacity.normal}
                  onChange={(e) => updateSettings('opacity.normal', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-xs">При наведении ({Math.round(settings.opacity.hover * 100)}%)</Label>
                <Input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={settings.opacity.hover}
                  onChange={(e) => updateSettings('opacity.hover', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Display Settings */}
          {!isBuilding && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4" />
                <Label className="text-sm font-medium">Отображение информации</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-numbers"
                    checked={settings.display.showNumbers}
                    onCheckedChange={(checked) => updateSettings('display.showNumbers', checked)}
                  />
                  <Label htmlFor="show-numbers" className="text-sm">Номера квартир</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-tooltip"
                    checked={settings.display.showTooltip}
                    onCheckedChange={(checked) => updateSettings('display.showTooltip', checked)}
                  />
                  <Label htmlFor="show-tooltip" className="text-sm">Всплывающие подсказки</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-area"
                    checked={settings.display.showArea}
                    onCheckedChange={(checked) => updateSettings('display.showArea', checked)}
                  />
                  <Label htmlFor="show-area" className="text-sm">Площадь в подсказке</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-price"
                    checked={settings.display.showPrice}
                    onCheckedChange={(checked) => updateSettings('display.showPrice', checked)}
                  />
                  <Label htmlFor="show-price" className="text-sm">Цена в подсказке</Label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default PolygonCustomizationSettings;
