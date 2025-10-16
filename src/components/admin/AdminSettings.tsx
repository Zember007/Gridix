
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, User, Building } from 'lucide-react';
import { ADMIN_THEME, getAdminThemeVariables } from '@/lib/admin-theme-config';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, UserProfile } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { User as SupabaseUser } from '@supabase/supabase-js';
import ManagerAccountsManager from '@/components/admin/ManagerAccountsManager';
import { ManagerRole } from '@/hooks/useUserRole';


interface AdminSettings {
  id?: string;
  user_id: string;
  company_name: string;
  created_at?: string;
  updated_at?: string;
}

interface AdminSettingsProps {
  userProfile: SupabaseUser;
  loading: boolean;
  developerId?: string;
  isManager?: boolean;
  managerData?: ManagerRole[];
}

const AdminSettings = ({ userProfile, loading, developerId, isManager, managerData }: AdminSettingsProps) => {
  const { t } = useLanguage();
  const { isManagerMode } = useWorkspace();
  const [settings, setSettings] = useState<AdminSettings>({
    user_id: userProfile?.id || '',
    company_name: '',
  });
  const [saving, setSaving] = useState(false);

  // Применяем CSS переменные темы
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  useEffect(() => {
    console.log('userProfile', userProfile);

    if (userProfile) {
      // Load profile data from user_profiles table instead of user_metadata
      const loadProfileData = async () => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('company_name')
            .eq('id', userProfile.id)
            .single();

          if (error) {
            console.error('Error loading profile:', error);
            // Fallback to user_metadata if database query fails
            setSettings({
              user_id: userProfile.id,
              company_name: userProfile.user_metadata.company_name || '',
            });
          } else {
            console.log('Loaded profile data:', data);
            setSettings({
              user_id: userProfile.id,
              company_name: data?.company_name || '',
            });
          }
        } catch (error) {
          console.error('Error in loadProfileData:', error);
          // Fallback to user_metadata
          setSettings({
            user_id: userProfile.id,
            company_name: userProfile.user_metadata.company_name || '',
          });
        }
      };

      loadProfileData();
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
        updated_at: new Date().toISOString()
      };

      console.log('Saving data:', saveData);
      console.log('User ID:', userProfile.id);

      const { data, error } = await supabase
        .from('user_profiles')
        .update(saveData)
        .eq('id', userProfile.id)
        .select();

      console.log('Update result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Update local state with the saved data
      if (data && data.length > 0) {
        setSettings(prev => ({
          ...prev,
          company_name: data[0].company_name || ''
        }));
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
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: ADMIN_THEME.primary }}
        ></div>
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
          <Button 
            onClick={handleSave} 
            disabled={saving}
            style={{
              backgroundColor: ADMIN_THEME.primary,
              color: ADMIN_THEME.textOnPrimary,
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = ADMIN_THEME.primaryHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = ADMIN_THEME.primary;
              }
            }}
          >
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

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          {!isManagerMode && (
            <ManagerAccountsManager developerId={developerId || userProfile?.id || ''} />
          )}
          {isManagerMode && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Managing managers is only available to the account owner
              </p>
              {managerData && managerData.length > 0 && (
                <div className="text-sm text-muted-foreground mt-2">
                  <p>Ask owner of the account to add you as a manager</p>
                  <ul className="mt-1 space-y-1">
                    {managerData.map((data) => (
                      <li key={data.id}>
                        • {data.developer_profile?.full_name} ({data.developer_profile?.company_name})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
