
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, User, Building } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

interface AdminSettings {
  id?: string;
  user_id: string;
  company_name: string;
  company_description: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  created_at?: string;
  updated_at?: string;
}

const AdminSettings = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [settings, setSettings] = useState<AdminSettings>({
    user_id: user?.id || '',
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
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          user_id: data.user_id,
          company_name: data.company_name || '',
          company_description: data.company_description || '',
          contact_name: data.contact_name || '',
          contact_phone: data.contact_phone || '',
          contact_email: data.contact_email || '',
          contact_address: data.contact_address || ''
        });
      } else {
        // Если настроек нет, устанавливаем user_id
        setSettings(prev => ({ ...prev, user_id: user.id }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error(t('adminSettings.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error(t('adminSettings.authRequired'));
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        user_id: user.id,
        company_name: settings.company_name,
        company_description: settings.company_description,
        contact_name: settings.contact_name,
        contact_phone: settings.contact_phone,
        contact_email: settings.contact_email,
        contact_address: settings.contact_address,
        updated_at: new Date().toISOString()
      };

      if (settings.id) {
        const { error } = await supabase
          .from('admin_settings')
          .update(saveData)
          .eq('id', settings.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('admin_settings')
          .insert([saveData])
          .select()
          .single();

        if (error) throw error;
        setSettings(prev => ({ ...prev, id: data.id }));
      }

      toast.success(t('adminSettings.settingsSaved'));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('adminSettings.errorSaving'));
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('adminSettings.title')}</h1>
          <p className="text-muted-foreground">{t('adminSettings.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? t('adminSettings.saving') : t('adminSettings.save')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            {t('adminSettings.company')}
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t('adminSettings.contacts')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
                      <CardHeader>
            <CardTitle>{t('adminSettings.companyInfo')}</CardTitle>
            <CardDescription>
              {t('adminSettings.companyInfoDesc')}
            </CardDescription>
          </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company_name">{t('adminSettings.companyName')}</Label>
                <Input
                  id="company_name"
                  value={settings.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder={t('adminSettings.companyNamePlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="company_description">{t('adminSettings.companyDescription')}</Label>
                <Textarea
                  id="company_description"
                  value={settings.company_description}
                  onChange={(e) => handleInputChange('company_description', e.target.value)}
                  placeholder={t('adminSettings.companyDescriptionPlaceholder')}
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="contact_address">{t('adminSettings.companyAddress')}</Label>
                <Input
                  id="contact_address"
                  value={settings.contact_address}
                  onChange={(e) => handleInputChange('contact_address', e.target.value)}
                  placeholder={t('adminSettings.companyAddressPlaceholder')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
                      <CardHeader>
            <CardTitle>{t('adminSettings.managerContacts')}</CardTitle>
            <CardDescription>
              {t('adminSettings.managerContactsDesc')}
            </CardDescription>
          </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contact_name">{t('adminSettings.managerName')}</Label>
                <Input
                  id="contact_name"
                  value={settings.contact_name}
                  onChange={(e) => handleInputChange('contact_name', e.target.value)}
                  placeholder={t('adminSettings.managerNamePlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">{t('adminSettings.managerPhone')}</Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder={t('adminSettings.managerPhonePlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="contact_email">{t('adminSettings.managerEmail')}</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  placeholder={t('adminSettings.managerEmailPlaceholder')}
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
