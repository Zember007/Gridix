
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, User, Phone, Mail, Building } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AdminSettings {
  company_name: string;
  company_description: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    company_name: '',
    company_description: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    contact_address: ''
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // В реальном проекте здесь будет загрузка настроек из базы данных
      // Пока что используем localStorage
      const savedSettings = localStorage.getItem('admin_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // В реальном проекте здесь будет сохранение в базу данных
      localStorage.setItem('admin_settings', JSON.stringify(settings));
      toast.success('Настройки сохранены');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof AdminSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Настройки</h1>
          <p className="text-gray-600">Управление настройками аккаунта и контактной информацией</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Компания
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Контакты менеджера
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Информация о компании</CardTitle>
              <CardDescription>
                Основная информация о вашей компании
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company_name">Название компании</Label>
                <Input
                  id="company_name"
                  value={settings.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="ООО «Название компании»"
                />
              </div>

              <div>
                <Label htmlFor="company_description">Описание компании</Label>
                <Textarea
                  id="company_description"
                  value={settings.company_description}
                  onChange={(e) => handleInputChange('company_description', e.target.value)}
                  placeholder="Краткое описание деятельности компании..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="contact_address">Адрес компании</Label>
                <Input
                  id="contact_address"
                  value={settings.contact_address}
                  onChange={(e) => handleInputChange('contact_address', e.target.value)}
                  placeholder="г. Город, ул. Улица, д. 1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Контактная информация менеджера</CardTitle>
              <CardDescription>
                Эта информация будет отображаться клиентам для связи
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contact_name">Имя менеджера</Label>
                <Input
                  id="contact_name"
                  value={settings.contact_name}
                  onChange={(e) => handleInputChange('contact_name', e.target.value)}
                  placeholder="Иван Иванов"
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">Телефон менеджера</Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <Label htmlFor="contact_email">Email менеджера</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder="manager@company.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
