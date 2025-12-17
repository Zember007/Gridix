
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, User, Building, CreditCard, KeyRound } from 'lucide-react';
import { ADMIN_THEME, getAdminThemeVariables } from '@/lib/admin-theme-config';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { User as SupabaseUser } from '@supabase/supabase-js';
import ManagerAccountsManager from '@/components/admin/ManagerAccountsManager';
import { ManagerRole } from '@/hooks/useUserRole';
import { Tables } from '@/integrations/supabase/types';


interface AdminSettings {
  id?: string;
  user_id: string;
  company_name: string;
  created_at?: string;
  updated_at?: string;
}

type CompanySettings = Tables<'company_settings'>;

interface AdminSettingsProps {
  userProfile: SupabaseUser;
  loading: boolean;
  developerId?: string;
  isManager?: boolean;
  managerData?: ManagerRole[];
}

const AdminSettings = ({ userProfile, loading, developerId, managerData }: AdminSettingsProps) => {
  const { t } = useLanguage();
  const { isManagerMode } = useWorkspace();
  const [settings, setSettings] = useState<AdminSettings>({
    user_id: userProfile?.id || '',
    company_name: '',
  });
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    id: '',
    user_id: userProfile?.id || '',
    company_name: '',
    tax_id: '',
    address: null,
    phone: null,
    email: null,
    bank_name: null,
    iban: null,
    currency: 'GEL',
    vat_payer: false,
    created_at: null,
    updated_at: null,
  });
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Применяем CSS переменные темы
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  useEffect(() => {

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

      // Load company settings
      const loadCompanySettings = async () => {
        try {
          const { data, error } = await supabase
            .from('company_settings')
            .select('*')
            .eq('user_id', userProfile.id)
            .single();

          if (error) {
            console.error('Error loading company settings:', error);
            // Set default values if no company settings found
            setCompanySettings({
              id: '',
              user_id: userProfile.id,
              company_name: '',
              tax_id: '',
              address: null,
              phone: null,
              email: null,
              bank_name: null,
              iban: null,
              currency: 'GEL',
              vat_payer: false,
              created_at: null,
              updated_at: null,
            });
          } else {
            setCompanySettings({
              id: data?.id || '',
              user_id: userProfile.id,
              company_name: data?.company_name || '',
              tax_id: data?.tax_id || '',
              address: data?.address || null,
              phone: data?.phone || null,
              email: data?.email || null,
              bank_name: data?.bank_name || null,
              iban: data?.iban || null,
              currency: data?.currency || 'GEL',
              vat_payer: data?.vat_payer || false,
              created_at: data?.created_at || null,
              updated_at: data?.updated_at || null,
            });
          }
        } catch (error) {
          console.error('Error in loadCompanySettings:', error);
          // Set default values on error
          setCompanySettings({
            id: '',
            user_id: userProfile.id,
            company_name: '',
            tax_id: '',
            address: null,
            phone: null,
            email: null,
            bank_name: null,
            iban: null,
            currency: 'GEL',
            vat_payer: false,
            created_at: null,
            updated_at: null,
          });
        }
      };

      loadProfileData();
      loadCompanySettings();
    }
  }, [userProfile]);

  const handleUpdateEmail = async () => {
    if (!newEmail) {
      toast.error(t('adminSettings.errorUpdatingEmail'));
      return;
    }

    setUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        console.error('Error updating email:', error);
        if (error.message?.includes('same') || error.code === 'same_email') {
          toast.error(t('adminSettings.sameEmail'));
        } else if (error.message?.includes('already') || error.code === 'email_exists') {
          toast.error(t('adminSettings.emailExists'));
        } else {
          toast.error(t('adminSettings.errorUpdatingEmail'));
        }
      } else {
        toast.success(t('adminSettings.emailUpdated'));
        setNewEmail('');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error(t('adminSettings.errorUpdatingEmail'));
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error(t('adminSettings.errorUpdatingPassword'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('adminSettings.passwordsDoNotMatch'));
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error updating password:', error);
        if (error.code === 'same_password') {
          toast.error(t('adminSettings.samePassword'));
        } else {
          toast.error(t('adminSettings.errorUpdatingPassword'));
        }
      } else {
        toast.success(t('adminSettings.passwordUpdated'));
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(t('adminSettings.errorUpdatingPassword'));
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSave = async () => {
    if (!userProfile) {
      toast.error(t('adminSettings.authRequired'));
      return;
    }

    setSaving(true);
    try {
      // Save user profile data
      const profileData = {
        company_name: settings.company_name,
        updated_at: new Date().toISOString()
      };


      const { data: profileResult, error: profileError } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', userProfile.id)
        .select();


      if (profileError) {
        console.error('Supabase profile error:', profileError);
        throw profileError;
      }

      // Save company settings data
      const companyData = {
        company_name: companySettings.company_name,
        tax_id: companySettings.tax_id,
        address: companySettings.address,
        phone: companySettings.phone,
        email: companySettings.email,
        bank_name: companySettings.bank_name,
        iban: companySettings.iban,
        currency: companySettings.currency,
        vat_payer: companySettings.vat_payer,
        updated_at: new Date().toISOString()
      };


      const { data: companyResult, error: companyError } = await supabase
        .from('company_settings')
        .update(companyData)
        .eq('user_id', userProfile.id)
        .select();


      if (companyError) {
        console.error('Supabase company settings error:', companyError);
        throw companyError;
      }

      // Update local state with the saved data
      if (profileResult && profileResult.length > 0) {
        setSettings(prev => ({
          ...prev,
          company_name: profileResult[0]?.company_name || ''
        }));
      }

      if (companyResult && companyResult.length > 0) {
        setCompanySettings(prev => ({
          ...prev,
          ...(companyResult[0]),
          user_id: userProfile.id
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

  const handleCompanyInputChange = (field: keyof CompanySettings, value: string | boolean | null) => {
    setCompanySettings(prev => ({ ...prev, [field]: value }));
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
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {t('adminSettings.billing')}
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            {t('adminSettings.account')}
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

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>{t('adminSettings.billingInfo')}</CardTitle>
              <CardDescription>
                {t('adminSettings.billingInfoDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name_billing">{t('adminSettings.companyName')}</Label>
                  <Input
                    id="company_name_billing"
                    value={companySettings.company_name}
                    onChange={(e) => handleCompanyInputChange('company_name', e.target.value)}
                    placeholder={t('adminSettings.companyNamePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="tax_id">{t('adminSettings.taxId')}</Label>
                  <Input
                    id="tax_id"
                    value={companySettings.tax_id || ''}
                    onChange={(e) => handleCompanyInputChange('tax_id', e.target.value || null)}
                    placeholder={t('adminSettings.taxIdPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">{t('adminSettings.companyAddress')}</Label>
                <Textarea
                  id="address"
                  value={companySettings.address || ''}
                  onChange={(e) => handleCompanyInputChange('address', e.target.value || null)}
                  placeholder={t('adminSettings.companyAddressPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">{t('adminSettings.phone')}</Label>
                  <Input
                    id="phone"
                    value={companySettings.phone || ''}
                    onChange={(e) => handleCompanyInputChange('phone', e.target.value || null)}
                    placeholder={t('adminSettings.phonePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('adminSettings.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companySettings.email || ''}
                    onChange={(e) => handleCompanyInputChange('email', e.target.value || null)}
                    placeholder={t('adminSettings.emailPlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_name">{t('adminSettings.bankName')}</Label>
                  <Input
                    id="bank_name"
                    value={companySettings.bank_name || ''}
                    onChange={(e) => handleCompanyInputChange('bank_name', e.target.value || null)}
                    placeholder={t('adminSettings.bankNamePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="iban">{t('adminSettings.iban')}</Label>
                  <Input
                    id="iban"
                    value={companySettings.iban || ''}
                    onChange={(e) => handleCompanyInputChange('iban', e.target.value || null)}
                    placeholder={t('adminSettings.ibanPlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">{t('adminSettings.currency')}</Label>
                  <Select
                    value={companySettings.currency || 'GEL'}
                    onValueChange={(value) => handleCompanyInputChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('adminSettings.currencyPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GEL">GEL (Georgian Lari)</SelectItem>
                      <SelectItem value="USD">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="RUB">RUB (Russian Ruble)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="vat_payer"
                    checked={companySettings.vat_payer || false}
                    onCheckedChange={(checked) => handleCompanyInputChange('vat_payer', checked as boolean)}
                  />
                  <Label htmlFor="vat_payer">{t('adminSettings.vatPayer')}</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('adminSettings.changeEmail')}</CardTitle>
                <CardDescription>
                  {t('adminSettings.accountInfoDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="current_email">{t('adminSettings.currentEmail')}</Label>
                  <Input
                    id="current_email"
                    type="email"
                    value={userProfile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="new_email">{t('adminSettings.newEmail')}</Label>
                  <Input
                    id="new_email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={'email@example.com'}
                  />
                </div>
                <Button 
                  onClick={handleUpdateEmail}
                  disabled={updatingEmail || !newEmail}
                  style={{
                    backgroundColor: ADMIN_THEME.primary,
                    color: ADMIN_THEME.textOnPrimary,
                  }}
                  onMouseEnter={(e) => {
                    if (!updatingEmail && newEmail) {
                      e.currentTarget.style.backgroundColor = ADMIN_THEME.primaryHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!updatingEmail && newEmail) {
                      e.currentTarget.style.backgroundColor = ADMIN_THEME.primary;
                    }
                  }}
                >
                  {updatingEmail ? t('adminSettings.saving') : t('adminSettings.updateEmail')}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('adminSettings.changePassword')}</CardTitle>
                <CardDescription>
                  {t('adminSettings.accountInfoDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="new_password">{t('adminSettings.newPassword')}</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('adminSettings.newPasswordPlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm_password">{t('adminSettings.confirmNewPassword')}</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('adminSettings.confirmPasswordPlaceholder')}
                  />
                </div>
                <Button 
                  onClick={handleUpdatePassword}
                  disabled={updatingPassword || !newPassword || !confirmPassword}
                  style={{
                    backgroundColor: ADMIN_THEME.primary,
                    color: ADMIN_THEME.textOnPrimary,
                  }}
                  onMouseEnter={(e) => {
                    if (!updatingPassword && newPassword && confirmPassword) {
                      e.currentTarget.style.backgroundColor = ADMIN_THEME.primaryHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!updatingPassword && newPassword && confirmPassword) {
                      e.currentTarget.style.backgroundColor = ADMIN_THEME.primary;
                    }
                  }}
                >
                  {updatingPassword ? t('adminSettings.saving') : t('adminSettings.updatePassword')}
                </Button>
              </CardContent>
            </Card>
          </div>
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
