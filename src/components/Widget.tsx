
import { useState, useEffect } from 'react';
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
import { useUserProjects } from '@/hooks/useProjects';
import { ADMIN_THEME } from '@/lib/admin-theme-config';

interface Project {
  id: string;
  name: string;
}

const Widget = () => {
  const { projects, loading } = useUserProjects();
  const [widgetConfig, setWidgetConfig] = useState({
    projectId: '',
    width: '100%',
    height: '600px',
    showLegend: true,
    showSearch: false,
    showFilters: false,
    theme: 'light',
    autoHeight: false,
    borderRadius: '8px'
  });

  const [customCSS, setCustomCSS] = useState('');

  useEffect(() => {
    if (projects && projects.length > 0 && !widgetConfig.projectId) {
      setWidgetConfig(prev => ({ ...prev, projectId: projects[0].id }));
    }
  }, [projects, widgetConfig.projectId]);

  const generateWidgetCode = () => {
    if (!widgetConfig.projectId) return '';

    const params = new URLSearchParams({
      legend: widgetConfig.showLegend.toString(),
      search: widgetConfig.showSearch.toString(),
      filters: widgetConfig.showFilters.toString(),
      theme: widgetConfig.theme,
      autoHeight: widgetConfig.autoHeight.toString(),
      borderRadius: widgetConfig.borderRadius
    });

    const baseUrl = window.location.origin;
    return `<iframe 
  src="${baseUrl}/widget/${widgetConfig.projectId}?${params.toString()}"
  width="${widgetConfig.width}"
  height="${widgetConfig.height}"
  frameborder="0"
  style="border-radius: ${widgetConfig.borderRadius}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
  allowfullscreen>
</iframe>`;
  };

  const generateReactCode = () => {
    if (!widgetConfig.projectId) return '';

    const baseUrl = window.location.origin;
    return `import React from 'react';

const RealEstateWidget = () => {
  return (
    <iframe 
      src="${baseUrl}/widget/${widgetConfig.projectId}?theme=${widgetConfig.theme}&legend=${widgetConfig.showLegend}"
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
    toast.success('Code copied to clipboard');
  };

  const previewUrl = widgetConfig.projectId 
    ? `${window.location.origin}/widget/${widgetConfig.projectId}?theme=${widgetConfig.theme}&legend=${widgetConfig.showLegend}`
    : '';

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-real-estate-600" />
              Widget Settings
            </CardTitle>
            <CardDescription>
              Configure the appearance and functionality of the widget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="project-select">Project</Label>
              <Select 
                value={widgetConfig.projectId} 
                onValueChange={(value) => setWidgetConfig(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projects.length === 0 && (
                <p className="text-sm text-real-estate-600 mt-1">
                  Create a project to generate widget
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  value={widgetConfig.width}
                  onChange={(e) => setWidgetConfig(prev => ({ ...prev, width: e.target.value }))}
                  placeholder="100% or 800px"
                />
              </div>
              <div>
                <Label htmlFor="height">Height</Label>
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
              <Label htmlFor="theme">Theme</Label>
              <Select value={widgetConfig.theme} onValueChange={(value) => setWidgetConfig(prev => ({ ...prev, theme: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-legend">Show Legend</Label>
                <Switch
                  id="show-legend"
                  checked={widgetConfig.showLegend}
                  onCheckedChange={(checked) => setWidgetConfig(prev => ({ ...prev, showLegend: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-height">Auto Height</Label>
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
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              How the widget will look on your website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg min-h-[400px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <div 
                style={{ backgroundColor: ADMIN_THEME.primary }}
                className="w-16 h-16 bg-real-estate-600 rounded-lg mx-auto flex items-center justify-center">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-real-estate-900">Widget Preview</h3>
                  <p className="text-sm text-real-estate-600 mb-4">
                    Interactive floor plan will be displayed here
                  </p>
                  {previewUrl && (
                    <Button
                      style={{ backgroundColor: ADMIN_THEME.primary }}
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(previewUrl, '_blank')}
                      className="border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Window
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Code Generation */}
      {widgetConfig.projectId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-real-estate-600" />
              Integration Code
            </CardTitle>
            <CardDescription>
              Copy the code and paste it into your website
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
                  Paste this code into the HTML of any page on your website
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
                  Use this component in your React application
                </p>
              </TabsContent>

              <TabsContent value="wordpress" className="space-y-4">
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`[real-estate-widget project="${widgetConfig.projectId}" theme="${widgetConfig.theme}"]`}</code>
                  </pre>
                  <Button
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(`[real-estate-widget project="${widgetConfig.projectId}" theme="${widgetConfig.theme}"]`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-real-estate-600">
                  Use this shortcode in WordPress (requires plugin installation)
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Custom CSS */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Styles</CardTitle>
          <CardDescription>
            Customize widget appearance with CSS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="custom-css">CSS Styles</Label>
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
              toast.success('CSS styles saved');
              // Here you would save the custom CSS
            }}
            className="bg-real-estate-600 hover:bg-real-estate-700"
          >
            Save Styles
          </Button>
        </CardContent>
      </Card>

      {/* Integration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-real-estate-900 mb-3">1. Basic Integration</h4>
              <ul className="list-disc list-inside space-y-2 text-real-estate-700">
                <li>Copy the HTML code from the tab above</li>
                <li>Paste the code where you want it on your web page</li>
                <li>The widget will automatically load and be ready to use</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-real-estate-900 mb-3">2. Security Configuration</h4>
              <ul className="list-disc list-inside space-y-2 text-real-estate-700">
                <li>Add your domain to the allowed embedding list</li>
                <li>Configure CORS policies for proper widget operation</li>
                <li>Use HTTPS for secure data transmission</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-real-estate-900 mb-3">3. Additional Features</h4>
              <ul className="list-disc list-inside space-y-2 text-real-estate-700">
                <li>Use JavaScript API for advanced interaction</li>
                <li>Configure callbacks to track events</li>
                <li>Integrate with analytics and CRM systems</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Widget;
