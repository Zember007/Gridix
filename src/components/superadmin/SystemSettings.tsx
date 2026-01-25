import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/shared/api/supabase';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Save, Database, Mail, Shield, Globe, Bell, Palette, FileText, Upload, X, Loader2, Percent, Plus, Trash2, Edit } from 'lucide-react';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

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

interface InvoiceConfig {
  company_name: string;
  tax_id: string;
  bank_name: string;
  iban: string;
  currency: string;
  logo_url: string;
  stamp_url: string;
  language: string;
  finance_email: string;
}

interface CommissionTier {
  id: string;
  min_projects: number;
  max_projects: number | null;
  commission_percentage: number;
  link_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfig>({
    company_name: 'GRIDIX LLC',
    tax_id: '',
    bank_name: 'Bank of Georgia',
    iban: '',
    currency: 'GEL',
    logo_url: '',
    stamp_url: '',
    language: 'ka',
    finance_email: 'finance@gridix.io',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [editingTier, setEditingTier] = useState<CommissionTier | null>(null);
  const [isTierDialogOpen, setIsTierDialogOpen] = useState(false);
  const [newTier, setNewTier] = useState<Partial<CommissionTier>>({
    min_projects: 0,
    max_projects: null,
    commission_percentage: 20,
    is_active: true,
  });

  useEffect(() => {
    loadSettings();
    loadCommissionTiers();
  }, []);

  const loadSettings = async () => {
    try {
      // Загружаем общие настройки
      const { data: generalSettings, error: generalError } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'general_settings')
        .single();

      if (generalError && generalError.code !== 'PGRST116') {
        throw generalError;
      }

      if (generalSettings?.setting_value) {
        setSettings(prev => ({ ...prev, ...(generalSettings.setting_value as unknown as SystemSettings) }));
      }

      // Загружаем настройки счетов
      const { data: invoiceSettings, error: invoiceError } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'invoice_config')
        .single();

      if (invoiceError && invoiceError.code !== 'PGRST116') {
        throw invoiceError;
      }

      if (invoiceSettings?.setting_value) {
        setInvoiceConfig(invoiceSettings.setting_value as unknown as InvoiceConfig);
      }

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
      // Сохраняем общие настройки
      const { error: generalError } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'general_settings',
          setting_value: JSON.parse(JSON.stringify(settings)),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (generalError) {
        throw generalError;
      }

      // Сохраняем настройки счетов
      const { error: invoiceError } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'invoice_config',
          setting_value: JSON.parse(JSON.stringify(invoiceConfig)),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (invoiceError) {
        throw invoiceError;
      }

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
      
      // Вызываем Edge Function для создания резервной копии
      const { error } = await supabase.functions.invoke('database-backup', {
        body: { action: 'create_backup' }
      });

      if (error) {
        throw error;
      }
      
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
      
      // Очищаем кэш в localStorage и sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Вызываем Edge Function для очистки серверного кэша
      const { error } = await supabase.functions.invoke('cache-clear', {
        body: { action: 'clear_cache' }
      });

      if (error) {
        throw error;
      }
      
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

  const handleTestEmail = async () => {
    try {
      toast({
        title: 'Отправка тестового письма',
        description: 'Проверка SMTP настроек...',
      });
      
      const { error } = await supabase.functions.invoke('test-email', {
        body: {
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
          smtpUser: settings.smtpUser,
          smtpPassword: settings.smtpPassword,
          to: settings.notificationEmail || settings.supportEmail
        }
      });

      if (error) {
        throw error;
      }
      
      toast({
        title: 'Успешно',
        description: 'Тестовое письмо отправлено',
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить тестовое письмо',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'stamp') => {
    try {
      if (type === 'logo') {
        setUploadingLogo(true);
      } else {
        setUploadingStamp(true);
      }

      // Создаем уникальное имя файла
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `invoice-assets/${fileName}`;

      // Загружаем файл в Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Получаем публичный URL
      const { data } = supabase.storage
        .from('invoices')
        .getPublicUrl(filePath);

      // Обновляем соответствующий URL в конфигурации
      if (type === 'logo') {
        setInvoiceConfig(prev => ({ ...prev, logo_url: data.publicUrl }));
      } else {
        setInvoiceConfig(prev => ({ ...prev, stamp_url: data.publicUrl }));
      }

      toast({
        title: 'Успешно',
        description: `${type === 'logo' ? 'Логотип' : 'Печать'} загружена`,
      });
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast({
        title: 'Ошибка',
        description: `Не удалось загрузить ${type === 'logo' ? 'логотип' : 'печать'}`,
        variant: 'destructive',
      });
    } finally {
      if (type === 'logo') {
        setUploadingLogo(false);
      } else {
        setUploadingStamp(false);
      }
    }
  };

  const handleLogoUpload = () => {
    logoInputRef.current?.click();
  };

  const handleStampUpload = () => {
    stampInputRef.current?.click();
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'logo');
    }
  };

  const handleStampFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'stamp');
    }
  };

  const loadCommissionTiers = async () => {
    setLoadingTiers(true);
    try {
      const { data, error } = await supabase
        .from('commission_tiers')
        .select('*')
        .order('min_projects', { ascending: true });

      if (error) throw error;
      setCommissionTiers(data || []);
    } catch (error) {
      console.error('Error loading commission tiers:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить настройки комиссий',
        variant: 'destructive',
      });
    } finally {
      setLoadingTiers(false);
    }
  };

  const handleSaveTier = async (tier: Partial<CommissionTier>) => {
    try {
      if (editingTier) {
        // Обновление существующего tier
        // @ts-ignore: commission_tiers таблица есть в БД, но ещё не описана в сгенерированных типах
        const { error } = await supabase
          .from('commission_tiers')
          .update({
            min_projects: tier.min_projects,
            max_projects: tier.max_projects === undefined ? null : tier.max_projects,
            commission_percentage: tier.commission_percentage,
            is_active: tier.is_active ?? true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTier.id);

        if (error) throw error;
        toast({
          title: 'Успешно',
          description: 'Настройка комиссии обновлена',
        });
      } else {
        // Создание нового tier
        // @ts-ignore: commission_tiers таблица есть в БД, но ещё не описана в сгенерированных типах
        const { error } = await supabase
          .from('commission_tiers')
          .insert({
            min_projects: tier.min_projects || 0,
            max_projects: tier.max_projects === undefined ? null : tier.max_projects,
            commission_percentage: tier.commission_percentage || 20,
            is_active: tier.is_active ?? true,
          });

        if (error) throw error;
        toast({
          title: 'Успешно',
          description: 'Новая настройка комиссии добавлена',
        });
      }

      setEditingTier(null);
      setIsTierDialogOpen(false);
      setNewTier({
        min_projects: 0,
        max_projects: null,
        commission_percentage: 20,
        is_active: true,
      });
      await loadCommissionTiers();
    } catch (error) {
      console.error('Error saving tier:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройку комиссии',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTier = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту настройку комиссии?')) {
      return;
    }

    try {
      // @ts-ignore: commission_tiers таблица есть в БД, но ещё не описана в сгенерированных типах
      const { error } = await supabase
        .from('commission_tiers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: 'Успешно',
        description: 'Настройка комиссии удалена',
      });
      await loadCommissionTiers();
    } catch (error) {
      console.error('Error deleting tier:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить настройку комиссии',
        variant: 'destructive',
      });
    }
  };

  const handleToggleTierActive = async (tier: CommissionTier) => {
    try {
      // @ts-ignore: commission_tiers таблица есть в БД, но ещё не описана в сгенерированных типах
      const { error } = await supabase
        .from('commission_tiers')
        .update({
          is_active: !tier.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tier.id);

      if (error) throw error;
      await loadCommissionTiers();
    } catch (error) {
      console.error('Error toggling tier:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить статус настройки',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="p-6"><Loader2 className="h-4 w-4 animate-spin" /></div>;
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
          <TabsTrigger value="invoices">
            <FileText className="h-4 w-4 mr-2" />
            Счета
          </TabsTrigger>
          <TabsTrigger value="commissions">
            <Percent className="h-4 w-4 mr-2" />
            Комиссии
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
                    <SelectItem value="he">עברית</SelectItem>
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

              <Button 
                variant="outline" 
                onClick={handleTestEmail}
                disabled={!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword}
              >
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

        {/* Invoice Settings */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Настройки выставления счетов</CardTitle>
              <CardDescription>
                Конфигурация реквизитов GRIDIX для генерации счетов
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_company_name">Название получателя</Label>
                  <Input
                    id="invoice_company_name"
                    value={invoiceConfig.company_name}
                    onChange={(e) =>
                      setInvoiceConfig({ ...invoiceConfig, company_name: e.target.value })
                    }
                    placeholder="GRIDIX LLC"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_tax_id">Идентификационный код</Label>
                  <Input
                    id="invoice_tax_id"
                    value={invoiceConfig.tax_id}
                    onChange={(e) =>
                      setInvoiceConfig({ ...invoiceConfig, tax_id: e.target.value })
                    }
                    placeholder="Код компании GRIDIX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_bank_name">Банк</Label>
                  <Input
                    id="invoice_bank_name"
                    value={invoiceConfig.bank_name}
                    onChange={(e) =>
                      setInvoiceConfig({ ...invoiceConfig, bank_name: e.target.value })
                    }
                    placeholder="Bank of Georgia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_iban">IBAN</Label>
                  <Input
                    id="invoice_iban"
                    value={invoiceConfig.iban}
                    onChange={(e) =>
                      setInvoiceConfig({ ...invoiceConfig, iban: e.target.value })
                    }
                    placeholder="Основной расчётный счёт"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_currency">Валюта</Label>
                  <Input
                    id="invoice_currency"
                    value={invoiceConfig.currency}
                    onChange={(e) =>
                      setInvoiceConfig({ ...invoiceConfig, currency: e.target.value })
                    }
                    placeholder="GEL"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_finance_email">Email для уведомлений</Label>
                  <Input
                    id="invoice_finance_email"
                    type="email"
                    value={invoiceConfig.finance_email}
                    onChange={(e) =>
                      setInvoiceConfig({ ...invoiceConfig, finance_email: e.target.value })
                    }
                    placeholder="finance@gridix.io"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_language">Язык счёта</Label>
                  <Select
                    value={invoiceConfig.language}
                    onValueChange={(value) =>
                      setInvoiceConfig({ ...invoiceConfig, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ka">Грузинский</SelectItem>
                      <SelectItem value="en">Английский</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Логотип</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      value={invoiceConfig.logo_url}
                      onChange={(e) =>
                        setInvoiceConfig({ ...invoiceConfig, logo_url: e.target.value })
                      }
                      placeholder="URL логотипа или загрузите файл"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleLogoUpload}
                      disabled={uploadingLogo}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingLogo ? 'Загрузка...' : 'Загрузить'}
                    </Button>
                    {invoiceConfig.logo_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setInvoiceConfig({ ...invoiceConfig, logo_url: '' })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                  {invoiceConfig.logo_url && (
                    <div className="mt-2">
                      <img 
                        src={invoiceConfig.logo_url} 
                        alt="Логотип" 
                        className="h-16 w-auto object-contain border rounded"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Печать</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      value={invoiceConfig.stamp_url}
                      onChange={(e) =>
                        setInvoiceConfig({ ...invoiceConfig, stamp_url: e.target.value })
                      }
                      placeholder="URL печати или загрузите файл"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleStampUpload}
                      disabled={uploadingStamp}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingStamp ? 'Загрузка...' : 'Загрузить'}
                    </Button>
                    {invoiceConfig.stamp_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setInvoiceConfig({ ...invoiceConfig, stamp_url: '' })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <input
                    ref={stampInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleStampFileChange}
                    className="hidden"
                  />
                  {invoiceConfig.stamp_url && (
                    <div className="mt-2">
                      <img 
                        src={invoiceConfig.stamp_url} 
                        alt="Печать" 
                        className="h-16 w-auto object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Settings */}
        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Настройки комиссий партнёров</CardTitle>
              <CardDescription>
                Управление процентами комиссии в зависимости от суммарного количества проектов
                всех клиентов партнёра (для реферальных и управляемых клиентов одновременно)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingTiers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Текущие настройки</h3>
                      <Button
                        onClick={() => {
                          setEditingTier(null);
                          setNewTier({
                            min_projects: 0,
                            max_projects: null,
                            commission_percentage: 20,
                            link_type: 'referral',
                            is_active: true,
                          });
                          setIsTierDialogOpen(true);
                        }}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">
                        Комиссии партнёрской программы (общие для рефералов и управляемых клиентов)
                      </h4>
                      <div className="space-y-2">
                        {commissionTiers
                          .sort((a, b) => (a.min_projects ?? 0) - (b.min_projects ?? 0))
                          .map((tier) => (
                            <div
                              key={tier.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                                <div>
                                  <span className="text-sm font-medium">
                                    {tier.min_projects} - {tier.max_projects === null ? '∞' : tier.max_projects}
                                  </span>
                                  <p className="text-xs text-muted-foreground">проектов</p>
                                </div>
                                <div>
                                  <span className="text-sm font-medium">{tier.commission_percentage}%</span>
                                  <p className="text-xs text-muted-foreground">комиссия</p>
                                </div>
                                <div>
                                  <Switch
                                    checked={tier.is_active}
                                    onCheckedChange={() => handleToggleTierActive(tier)}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {tier.is_active ? 'Активна' : 'Неактивна'}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingTier(tier);
                                      setIsTierDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteTier(tier.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Add/Edit Tier Dialog */}
                  <Dialog open={isTierDialogOpen} onOpenChange={setIsTierDialogOpen}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {editingTier ? 'Редактировать настройку' : 'Добавить настройку комиссии'}
                        </DialogTitle>
                        <DialogDescription>
                          Укажите диапазон проектов и процент комиссии
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="tier_min_projects">Мин. проектов</Label>
                            <Input
                              id="tier_min_projects"
                              type="number"
                              min="0"
                              value={editingTier?.min_projects ?? newTier.min_projects ?? 0}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                if (editingTier) {
                                  setEditingTier({ ...editingTier, min_projects: value });
                                } else {
                                  setNewTier({ ...newTier, min_projects: value });
                                }
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="tier_max_projects">Макс. проектов (оставьте пустым для ∞)</Label>
                            <Input
                              id="tier_max_projects"
                              type="number"
                              min="0"
                              placeholder="∞"
                              value={editingTier?.max_projects ?? newTier.max_projects ?? ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? null : (parseInt(e.target.value) || null);
                                if (editingTier) {
                                  setEditingTier({ ...editingTier, max_projects: value });
                                } else {
                                  setNewTier({ ...newTier, max_projects: value });
                                }
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tier_percentage">Процент комиссии (%)</Label>
                          <Input
                            id="tier_percentage"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={editingTier?.commission_percentage ?? newTier.commission_percentage ?? 20}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              if (editingTier) {
                                setEditingTier({ ...editingTier, commission_percentage: value });
                              } else {
                                setNewTier({ ...newTier, commission_percentage: value });
                              }
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="tier_active">Активна</Label>
                          <Switch
                            id="tier_active"
                            checked={editingTier?.is_active ?? newTier.is_active ?? true}
                            onCheckedChange={(checked) => {
                              if (editingTier) {
                                setEditingTier({ ...editingTier, is_active: checked });
                              } else {
                                setNewTier({ ...newTier, is_active: checked });
                              }
                            }}
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingTier(null);
                              setIsTierDialogOpen(false);
                              setNewTier({
                                min_projects: 0,
                                max_projects: null,
                                commission_percentage: 20,
                                link_type: 'referral',
                                is_active: true,
                              });
                            }}
                          >
                            Отмена
                          </Button>
                          <Button
                            onClick={() => {
                              const tierToSave = editingTier || newTier;
                              if (tierToSave.min_projects !== undefined && tierToSave.commission_percentage !== undefined) {
                                handleSaveTier(tierToSave);
                              }
                            }}
                          >
                            Сохранить
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

