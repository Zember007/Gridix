
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Code, Eye, Settings, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const Widget = () => {
  const [widgetConfig, setWidgetConfig] = useState({
    projectId: 'project-1',
    width: '100%',
    height: '600px',
    showLegend: true,
    showSearch: true,
    showFilters: true,
    theme: 'light',
    autoHeight: false,
    borderRadius: '8px'
  });

  const [customCSS, setCustomCSS] = useState('');

  const generateWidgetCode = () => {
    const params = new URLSearchParams({
      project: widgetConfig.projectId,
      width: widgetConfig.width,
      height: widgetConfig.height,
      legend: widgetConfig.showLegend.toString(),
      search: widgetConfig.showSearch.toString(),
      filters: widgetConfig.showFilters.toString(),
      theme: widgetConfig.theme,
      autoHeight: widgetConfig.autoHeight.toString(),
      borderRadius: widgetConfig.borderRadius
    });

    return `<iframe 
  src="https://your-domain.com/widget?${params.toString()}"
  width="${widgetConfig.width}"
  height="${widgetConfig.height}"
  frameborder="0"
  style="border-radius: ${widgetConfig.borderRadius}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
  allowfullscreen>
</iframe>`;
  };

  const generateReactCode = () => {
    return `import React from 'react';

const RealEstateWidget = () => {
  return (
    <iframe 
      src="https://your-domain.com/widget?project=${widgetConfig.projectId}&theme=${widgetConfig.theme}"
      width="${widgetConfig.width}"
      height="${widgetConfig.height}"
      frameBorder="0"
      style={{
        borderRadius: '${widgetConfig.borderRadius}',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
      allowFullScreen
    />
  );
};

export default RealEstateWidget;`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Код скопирован в буфер обмена');
  };

  const previewUrl = `https://your-domain.com/widget?project=${widgetConfig.projectId}&theme=${widgetConfig.theme}`;

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-real-estate-600" />
              Настройки виджета
            </CardTitle>
            <CardDescription>
              Настройте внешний вид и функциональность виджета
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="project-select">Проект</Label>
              <Select value={widgetConfig.projectId} onValueChange={(value) => setWidgetConfig(prev => ({ ...prev, projectId: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project-1">ЖК "Северная звезда"</SelectItem>
                  <SelectItem value="project-2">ЖК "Морские дали"</SelectItem>
                  <SelectItem value="project-3">ЖК "Центральный"</SelectItem>
                  <SelectItem value="project-4">ЖК "Парковый"</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Ширина</Label>
                <Input
                  id="width"
                  value={widgetConfig.width}
                  onChange={(e) => setWidgetConfig(prev => ({ ...prev, width: e.target.value }))}
                  placeholder="100% или 800px"
                />
              </div>
              <div>
                <Label htmlFor="height">Высота</Label>
                <Input
                  id="height"
                  value={widgetConfig.height}
                  onChange={(e) => setWidgetConfig(prev => ({ ...prev, height: e.target.value }))}
                  placeholder="600px"
                  disabled={widgetConfig.autoHeight}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="theme">Тема</Label>
              <Select value={widgetConfig.theme} onValueChange={(value) => setWidgetConfig(prev => ({ ...prev, theme: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Светлая</SelectItem>
                  <SelectItem value="dark">Темная</SelectItem>
                  <SelectItem value="auto">Автоматическая</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-legend">Показать легенду</Label>
                <Switch
                  id="show-legend"
                  checked={widgetConfig.showLegend}
                  onCheckedChange={(checked) => setWidgetConfig(prev => ({ ...prev, showLegend: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-search">Показать поиск</Label>
                <Switch
                  id="show-search"
                  checked={widgetConfig.showSearch}
                  onCheckedChange={(checked) => setWidgetConfig(prev => ({ ...prev, showSearch: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-filters">Показать фильтры</Label>
                <Switch
                  id="show-filters"
                  checked={widgetConfig.showFilters}
                  onCheckedChange={(checked) => setWidgetConfig(prev => ({ ...prev, showFilters: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-height">Автоматическая высота</Label>
                <Switch
                  id="auto-height"
                  checked={widgetConfig.autoHeight}
                  onCheckedChange={(checked) => setWidgetConfig(prev => ({ ...prev, autoHeight: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Предпросмотр</CardTitle>
            <CardDescription>
              Как будет выглядеть виджет на вашем сайте
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg min-h-[400px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-real-estate-600 rounded-lg mx-auto flex items-center justify-center">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-real-estate-900">Предпросмотр виджета</h3>
                  <p className="text-sm text-real-estate-600 mb-4">
                    Интерактивная шахматка будет отображаться здесь
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(previewUrl, '_blank')}
                    className="border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Открыть в новом окне
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Code Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-real-estate-600" />
            Код для интеграции
          </CardTitle>
          <CardDescription>
            Скопируйте код и вставьте его на ваш сайт
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="html" className="space-y-4">
            <TabsList>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="react">React</TabsTrigger>
              <TabsTrigger value="wordpress">WordPress</TabsTrigger>
            </TabsList>

            <TabsContent value="html" className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{generateWidgetCode()}</code>
                </pre>
                <Button
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(generateWidgetCode())}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-real-estate-600">
                Вставьте этот код в HTML любой страницы вашего сайта
              </p>
            </TabsContent>

            <TabsContent value="react" className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{generateReactCode()}</code>
                </pre>
                <Button
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(generateReactCode())}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-real-estate-600">
                Используйте этот компонент в вашем React приложении
              </p>
            </TabsContent>

            <TabsContent value="wordpress" className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`[real-estate-widget project="${widgetConfig.projectId}" width="${widgetConfig.width}" height="${widgetConfig.height}" theme="${widgetConfig.theme}"]`}</code>
                </pre>
                <Button
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(`[real-estate-widget project="${widgetConfig.projectId}" width="${widgetConfig.width}" height="${widgetConfig.height}" theme="${widgetConfig.theme}"]`)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-real-estate-600">
                Используйте этот шорткод в WordPress (требуется установка плагина)
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Custom CSS */}
      <Card>
        <CardHeader>
          <CardTitle>Дополнительные стили</CardTitle>
          <CardDescription>
            Настройте внешний вид виджета с помощью CSS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="custom-css">CSS стили</Label>
            <Textarea
              id="custom-css"
              value={customCSS}
              onChange={(e) => setCustomCSS(e.target.value)}
              placeholder=".real-estate-widget {
  border: 2px solid #3b82f6;
  border-radius: 12px;
}

.apartment-available {
  background-color: #22c55e;
}

.apartment-sold {
  background-color: #ef4444;
}"
              rows={8}
              className="font-mono text-sm"
            />
          </div>
          <Button
            onClick={() => {
              toast.success('CSS стили сохранены');
              // Here you would save the custom CSS
            }}
            className="bg-real-estate-600 hover:bg-real-estate-700"
          >
            Сохранить стили
          </Button>
        </CardContent>
      </Card>

      {/* Integration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Инструкции по интеграции</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-real-estate-900 mb-3">1. Базовая интеграция</h4>
              <ul className="list-disc list-inside space-y-2 text-real-estate-700">
                <li>Скопируйте HTML код из вкладки выше</li>
                <li>Вставьте код в нужное место на вашей веб-странице</li>
                <li>Виджет автоматически загрузится и будет готов к использованию</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-real-estate-900 mb-3">2. Настройка безопасности</h4>
              <ul className="list-disc list-inside space-y-2 text-real-estate-700">
                <li>Добавьте ваш домен в список разрешенных для встраивания</li>
                <li>Настройте CORS политики для корректной работы виджета</li>
                <li>Используйте HTTPS для безопасной передачи данных</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-real-estate-900 mb-3">3. Дополнительные возможности</h4>
              <ul className="list-disc list-inside space-y-2 text-real-estate-700">
                <li>Используйте JavaScript API для расширенного взаимодействия</li>
                <li>Настройте обратные вызовы для отслеживания событий</li>
                <li>Интегрируйте с системами аналитики и CRM</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Widget;
