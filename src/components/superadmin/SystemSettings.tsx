import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Save, Database, Mail, Shield, Globe, Bell, Palette } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SystemSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  maxProjectsPerUser: number;
  maxApartmentsPerProject: number;
  defaultCurrency: string;
  defaultLanguage: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  enableNotifications: boolean;
  notificationEmail: string;
  supportEmail: string;
  companyName: string;
  companyAddress: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  platformTheme: string;
}

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    maxProjectsPerUser: 10,
    maxApartmentsPerProject: 1000,
    defaultCurrency: 'USD',
    defaultLanguage: 'ru',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    enableNotifications: true,
    notificationEmail: '',
    supportEmail: '',
    companyName: 'Gridix',
    companyAddress: '',
    privacyPolicyUrl: '/privacy',
    termsOfServiceUrl: '/terms',
    platformTheme: 'light',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // В реальном приложении загружайте настройки из базы данных
      // Здесь используем placeholder данные
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить настройки',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // В реальном приложении сохраняйте настройки в базу данных
      // Пример:
      // await supabase.from('system_settings').upsert(settings);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Симуляция задержки

      toast({
        title: 'Успешно',
        description: 'Настройки сохранены',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDatabaseBackup = async () => {
    try {
      toast({
        title: 'Создание резервной копии',
        description: 'Процесс создания резервной копии начат...',
      });
      
      // В реальном приложении вызовите функцию резервного копирования
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Успешно',
        description: 'Резервная копия создана',
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать резервную копию',
        variant: 'destructive',
      });
    }
  };

  const handleClearCache = async () => {
    try {
      toast({
        title: 'Очистка кэша',
        description: 'Очистка кэша начата...',
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Успешно',
        description: 'Кэш очищен',
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось очистить кэш',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="p-6">Загрузка настроек...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Системные настройки</h2>
          <p className="text-muted-foreground">
            Управление глобальными настройками платформы
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Сохранение...' : 'Сохранить все'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            Общие
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Безопасность
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            База данных
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Уведомления
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Внешний вид
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Основные настройки</CardTitle>
              <CardDescription>
                Управление основными параметрами платформы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Название компании</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) =>
                    setSettings({ ...settings, companyName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">Адрес компании</Label>
                <Textarea
                  id="companyAddress"
                  value={settings.companyAddress}
                  onChange={(e) =>
                    setSettings({ ...settings, companyAddress: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportEmail">Email поддержки</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) =>
                    setSettings({ ...settings, supportEmail: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Валюта по умолчанию</Label>
                <Select
                  value={settings.defaultCurrency}
                  onValueChange={(value) =>
                    setSettings({ ...settings, defaultCurrency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="RUB">RUB (₽)</SelectItem>
                    <SelectItem value="GEL">GEL (₾)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Язык по умолчанию</Label>
                <Select
                  value={settings.defaultLanguage}
                  onValueChange={(value) =>
                    setSettings({ ...settings, defaultLanguage: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ka">ქართული</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Лимиты</CardTitle>
              <CardDescription>
                Управление ограничениями для пользователей
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxProjects">
                  Максимум проектов на пользователя
                </Label>
                <Input
                  id="maxProjects"
                  type="number"
                  value={settings.maxProjectsPerUser}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxProjectsPerUser: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxApartments">
                  Максимум квартир на проект
                </Label>
                <Input
                  id="maxApartments"
                  type="number"
                  value={settings.maxApartmentsPerProject}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxApartmentsPerProject: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Безопасность и доступ</CardTitle>
              <CardDescription>
                Управление параметрами безопасности платформы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Режим обслуживания</Label>
                  <p className="text-sm text-muted-foreground">
                    Отключить доступ к платформе для обслуживания
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, maintenanceMode: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Регистрация включена</Label>
                  <p className="text-sm text-muted-foreground">
                    Разрешить новым пользователям регистрироваться
                  </p>
                </div>
                <Switch
                  checked={settings.registrationEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, registrationEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Подтверждение email</Label>
                  <p className="text-sm text-muted-foreground">
                    Требовать подтверждение email при регистрации
                  </p>
                </div>
                <Switch
                  checked={settings.emailVerificationRequired}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailVerificationRequired: checked })
                  }
                />
              </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="privacyPolicy">URL политики конфиденциальности</Label>
                <Input
                  id="privacyPolicy"
                  value={settings.privacyPolicyUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, privacyPolicyUrl: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="termsOfService">URL условий использования</Label>
                <Input
                  id="termsOfService"
                  value={settings.termsOfServiceUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, termsOfServiceUrl: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMTP настройки</CardTitle>
              <CardDescription>
                Конфигурация сервера для отправки email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP хост</Label>
                <Input
                  id="smtpHost"
                  placeholder="smtp.example.com"
                  value={settings.smtpHost}
                  onChange={(e) =>
                    setSettings({ ...settings, smtpHost: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP порт</Label>
                <Input
                  id="smtpPort"
                  placeholder="587"
                  value={settings.smtpPort}
                  onChange={(e) =>
                    setSettings({ ...settings, smtpPort: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpUser">SMTP пользователь</Label>
                <Input
                  id="smtpUser"
                  type="email"
                  placeholder="noreply@example.com"
                  value={settings.smtpUser}
                  onChange={(e) =>
                    setSettings({ ...settings, smtpUser: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPassword">SMTP пароль</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  placeholder="••••••••"
                  value={settings.smtpPassword}
                  onChange={(e) =>
                    setSettings({ ...settings, smtpPassword: e.target.value })
                  }
                />
              </div>

              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Отправить тестовое письмо
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Settings */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Управление базой данных</CardTitle>
              <CardDescription>
                Резервное копирование и обслуживание БД
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Резервное копирование</h4>
                <p className="text-sm text-muted-foreground">
                  Создайте резервную копию базы данных
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      Создать резервную копию
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Создать резервную копию?</DialogTitle>
                      <DialogDescription>
                        Будет создана полная резервная копия базы данных. Это может
                        занять несколько минут.
                      </DialogDescription>
                    </DialogHeader>
                    <Button onClick={handleDatabaseBackup}>
                      Подтвердить
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2 pt-4">
                <h4 className="text-sm font-medium">Очистка кэша</h4>
                <p className="text-sm text-muted-foreground">
                  Очистить кэш приложения для обновления данных
                </p>
                <Button variant="outline" onClick={handleClearCache}>
                  Очистить кэш
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Уведомления</CardTitle>
              <CardDescription>
                Настройка системных уведомлений
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Включить уведомления</Label>
                  <p className="text-sm text-muted-foreground">
                    Получать уведомления о системных событиях
                  </p>
                </div>
                <Switch
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enableNotifications: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notificationEmail">Email для уведомлений</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  placeholder="admin@example.com"
                  value={settings.notificationEmail}
                  onChange={(e) =>
                    setSettings({ ...settings, notificationEmail: e.target.value })
                  }
                  disabled={!settings.enableNotifications}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Внешний вид</CardTitle>
              <CardDescription>
                Настройка внешнего вида платформы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platformTheme">Тема платформы</Label>
                <Select
                  value={settings.platformTheme}
                  onValueChange={(value) =>
                    setSettings({ ...settings, platformTheme: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Светлая</SelectItem>
                    <SelectItem value="dark">Темная</SelectItem>
                    <SelectItem value="system">Системная</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

