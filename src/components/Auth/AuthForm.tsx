import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, User, Building, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface AuthFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  defaultMode?: 'signin' | 'signup' | undefined;
}

export const AuthForm = ({ onSuccess, redirectTo, defaultMode }: AuthFormProps) => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode || 'signin');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showReset, setShowReset] = useState(false);
  
  // Реферальный код и партнер
  const refCode = searchParams.get('ref');
  const inviteCode = searchParams.get('invite');
  const [partnerInfo, setPartnerInfo] = useState<{
    id: string;
    partner_code: string;
    user_profiles: {
      full_name: string | null;
      email: string | null;
    };
  } | null>(null);
  const [checkingPartner, setCheckingPartner] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
    phone: ''
  });

  // Проверяем партнера по реферальному коду
  useEffect(() => {
    const checkPartner = async () => {
      if (!refCode) return;
      
      setCheckingPartner(true);
      try {
        const { data, error } = await supabase
          .from('partner_profiles')
          .select(`
            id,
            partner_code,
            user_profiles!partner_profiles_user_id_fkey (
              full_name,
              email
            )
          `)
          .eq('partner_code', refCode)
          .single();


        if (error || !data) {
          toast.error(t('auth.invalidReferralCode'));
          return;
        }

        setPartnerInfo(data);
      } catch (error) {
        console.error('Error checking partner:', error);
        toast.error(t('auth.failedToCheckPartner'));
      } finally {
        setCheckingPartner(false);
      }
    };

    checkPartner();
  }, [refCode, t]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data: authData, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              company_name: formData.companyName,
              phone: formData.phone,
              account_type: 'developer'
            }
          }
        });

        if (error) throw error;

        if (authData.user) {
          // Создаем профиль пользователя
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              email: formData.email,
              full_name: formData.fullName,
              account_type: 'developer',
              partner_id: partnerInfo?.id || null
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
          }

          // Если есть реферальный код, создаем связь с партнером
          if (refCode && partnerInfo) {
            const { error: linkError } = await supabase
              .from('partner_links')
              .insert({
                partner_id: partnerInfo.id,
                client_id: authData.user.id,
                type: 'referral',
                status: 'active',
                accepted_at: new Date().toISOString()
              });

            if (linkError) {
              console.error('Error creating partner link:', linkError);
            }
          }

          // Если есть код приглашения, обновляем статус приглашения
          if (inviteCode) {
            const { error: inviteError } = await supabase
              .from('partner_invitations')
              .update({ 
                status: 'accepted',
                accepted_at: new Date().toISOString()
              })
              .eq('invitation_code', inviteCode)
              .eq('email', formData.email);

            if (inviteError) {
              console.error('Error updating invitation:', inviteError);
            }
          }
        }

        toast.success(t('auth.checkEmail'));
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast.success(t('auth.welcome'));
        onSuccess?.();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.errorOccurred');
      console.error('Auth error:', error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo || window.location.origin
        }
      });

      if (error) throw error;
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.googleAuthError');
      console.error('Google auth error:', error);
      toast.error(message);
    }
  };

  const handleSendReset = async () => {
    if (!resetEmail) {
      toast.error(t('auth.enterEmail'));
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/en/set-password`,
      });
      if (error) throw error;
      toast.success(t('auth.resetEmailSent'));
      setShowReset(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.failedToSendEmail');
      console.error('Reset email error:', err);
      toast.error(message);
    } finally {
      setResetLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12  sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {mode === 'signin' ? t('auth.signInTitle') : t('auth.signUpTitle')}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === 'signin' 
              ? t('auth.signInDescription')
              : t('auth.signUpDescription')
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {refCode && partnerInfo && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {t('auth.partnerInvitation')} {partnerInfo?.user_profiles?.full_name}
              </AlertDescription>
            </Alert>
          )}

          {checkingPartner && (
            <div className="flex items-center justify-center py-4 mb-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {t('auth.checkingPartner')}
            </div>
          )}

          <Tabs value={mode} onValueChange={(value) => setMode(value as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <TabsContent value="signin" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
               

                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.passwordPlaceholder')}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder={t('auth.fullNamePlaceholder')}
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">{t('auth.companyName')}</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="companyName"
                      type="text"
                      placeholder={t('auth.companyNamePlaceholder')}
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.passwordPlaceholder')}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <Button type="submit" className="w-full" disabled={loading || checkingPartner}>
                {loading 
                  ? t('auth.loading') 
                  : mode === 'signin' 
                    ? t('auth.signInButton') 
                    : t('auth.signUpButton')
                }
              </Button>

              <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setShowReset(true)}
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
            </form>

           {/*  <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">{t('auth.or')}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-4"
                onClick={handleGoogleAuth}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {t('auth.signInWithGoogle')}
              </Button>
            </div> */}
          </Tabs>
        </CardContent>
      </Card>

      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">{t('auth.resetPasswordTitle')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t('auth.resetPasswordDescription')}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">{t('auth.resetEmail')}</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" type="button" onClick={() => setShowReset(false)}>{t('auth.cancel')}</Button>
                <Button type="button" onClick={handleSendReset} disabled={resetLoading}>
                  {resetLoading ? t('auth.sending') : t('auth.sendLink')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 