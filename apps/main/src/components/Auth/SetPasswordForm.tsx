import { useState } from 'react';
import { Button } from "@gridix/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@gridix/utils/api";
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface SetPasswordFormProps {
  onSuccess?: () => void;
  userEmail?: string | undefined;
}

export const SetPasswordForm = ({ onSuccess, userEmail }: SetPasswordFormProps) => {
  // userEmail is available for future use (e.g., displaying user info)
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return t('auth.passwordMinLength');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return t('auth.passwordLowercase');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return t('auth.passwordUppercase');
    }
    if (!/(?=.*\d)/.test(password)) {
      return t('auth.passwordNumber');
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error(t('auth.fillAllFields'));
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      // Обновляем пароль и убираем флаг requires_password_setup
      const { error } = await supabase.auth.updateUser({
        password: password,
        data: {
          requires_password_setup: false
        }
      });

      if (error) throw error;

      toast.success(t('auth.passwordSetSuccess'));
      
      localStorage.setItem('password_set_required', 'false')
      
      // Если есть redirect параметр, перенаправляем туда, иначе используем onSuccess или админ панель
      const redirectPath = searchParams.get('redirect');
      if (redirectPath) {
        navigate(redirectPath);
      } else if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/${language}/admin`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.errorOccurred');
      console.error('Set password error:', error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {t('auth.setPasswordTitle')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('auth.setPasswordDescription')}
          </CardDescription>
        </CardHeader>
        
        <CardContent>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.newPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={8}
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmNewPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Требования к паролю */}
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium mb-2">{t('auth.passwordRequirements')}</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li className={password.length >= 8 ? 'text-green-600' : ''}>
                  {t('auth.minimumCharacters')}
                </li>
                <li className={/(?=.*[a-z])/.test(password) ? 'text-green-600' : ''}>
                  {t('auth.lowercaseLetters')}
                </li>
                <li className={/(?=.*[A-Z])/.test(password) ? 'text-green-600' : ''}>
                  {t('auth.uppercaseLetters')}
                </li>
                <li className={/(?=.*\d)/.test(password) ? 'text-green-600' : ''}>
                  {t('auth.numbers')}
                </li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.settingPassword') : t('auth.setPasswordButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

