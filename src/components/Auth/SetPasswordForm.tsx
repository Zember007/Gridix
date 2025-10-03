import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SetPasswordFormProps {
  onSuccess?: () => void;
  userEmail?: string;
}

export const SetPasswordForm = ({ onSuccess, userEmail }: SetPasswordFormProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Пароль должен содержать минимум 8 символов';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Пароль должен содержать строчную букву';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Пароль должен содержать заглавную букву';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Пароль должен содержать цифру';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('Заполните все поля');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Пароли не совпадают');
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

      toast.success('Пароль успешно установлен!');
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка';
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
            Установите пароль
          </CardTitle>
          <CardDescription className="text-center">
            Для безопасности вашего аккаунта необходимо создать пароль
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Вы вошли через magic link{userEmail && ` (${userEmail})`}. Пожалуйста, установите постоянный пароль для вашего аккаунта.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Новый пароль</Label>
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
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
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
              <p className="font-medium mb-2">Требования к паролю:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li className={password.length >= 8 ? 'text-green-600' : ''}>
                  Минимум 8 символов
                </li>
                <li className={/(?=.*[a-z])/.test(password) ? 'text-green-600' : ''}>
                  Строчные буквы (a-z)
                </li>
                <li className={/(?=.*[A-Z])/.test(password) ? 'text-green-600' : ''}>
                  Заглавные буквы (A-Z)
                </li>
                <li className={/(?=.*\d)/.test(password) ? 'text-green-600' : ''}>
                  Цифры (0-9)
                </li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Установка пароля...' : 'Установить пароль'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

