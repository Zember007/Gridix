
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
import { useAuth, UserProfile } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { User as SupabaseUser } from '@supabase/supabase-js';


interface AdminSettings {
  id?: string;
  user_id: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  created_at?: string;
  updated_at?: string;
}

const AdminSettings = ({ userProfile, loading }: { userProfile: SupabaseUser, loading: boolean }) => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<AdminSettings>({
    user_id: userProfile?.id || '',
    company_name: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    console.log('userProfile', userProfile);

    if (userProfile) {
      setSettings({
        user_id: userProfile.id,
        company_name: userProfile.user_metadata.company_name || '',
        contact_name: userProfile.user_metadata.full_name || '',
        contact_phone: userProfile.user_metadata.phone || '',
        contact_email: userProfile.email || '',
      })
    }
  }, [userProfile]);



  const handleSave = async () => {
    if (!userProfile) {
      toast.error(t('adminSettings.authRequired'));
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        company_name: settings.company_name,
        full_name: settings.contact_name,
        phone: settings.contact_phone,
        email: settings.contact_email,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_profiles')
        .update(saveData)
        .eq('id', userProfile.id)

      if (error) throw error;


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

              {/* <div>
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
              </div> */}
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
