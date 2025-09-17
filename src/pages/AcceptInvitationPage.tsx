import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, CheckCircle, XCircle, User, Building, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface InvitationData {
  id: string;
  developer_id: string;
  email: string;
  full_name: string;
  phone?: string;
  status: string;
  expires_at: string;
  developer_name?: string;
  company_name?: string;
}

const AcceptInvitationPage = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const loadInvitationData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Загружаем данные приглашения
      const { data: invitationData, error: invitationError } = await supabase
        .from('manager_invitations')
        .select('*')
        .eq('invitation_token', token)
        .single();

      if (invitationError) {
        throw new Error('Приглашение не найдено');
      }

      // Загружаем данные разработчика отдельно
      const { data: developerData, error: developerError } = await supabase
        .from('user_profiles')
        .select('full_name, company_name')
        .eq('id', invitationData.developer_id)
        .single();

      if (invitationData.status !== 'pending') {
        throw new Error('Приглашение уже было использовано или отменено');
      }

      if (new Date(invitationData.expires_at) < new Date()) {
        throw new Error('Срок действия приглашения истек');
      }

      setInvitation({
        ...invitationData,
        developer_name: developerData?.full_name,
        company_name: developerData?.company_name
      });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки приглашения';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError('Токен приглашения не найден');
      setLoading(false);
      return;
    }

    loadInvitationData();
  }, [token, loadInvitationData]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Пароль должен содержать минимум 8 символов';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Пароль должен содержать строчные буквы';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Пароль должен содержать заглавные буквы';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Пароль должен содержать цифры';
    }
    return null;
  };

  const handleAcceptInvitation = async () => {
    if (!invitation || !password || !confirmPassword) {
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

    setAccepting(true);
    try {
      // Создаем аккаунт пользователя
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
        options: {
          data: {
            full_name: invitation.full_name,
            phone: invitation.phone
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Ошибка создания аккаунта');
      }

      // Создаем запись менеджера
      const { error: managerError } = await supabase
        .from('manager_accounts')
        .insert({
          developer_id: invitation.developer_id,
          manager_id: authData.user.id,
          email: invitation.email,
          full_name: invitation.full_name,
          phone: invitation.phone,
          status: 'active',
          accepted_at: new Date().toISOString()
        });

      if (managerError) {
        throw managerError;
      }

      // Обновляем статус приглашения на 'accepted'
      const { error: updateError } = await supabase
        .from('manager_invitations')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Error updating invitation status:', updateError);
        // Не прерываем процесс, так как основная задача выполнена
      }

      toast.success('Приглашение принято! Добро пожаловать в команду!');
      
      // Перенаправляем менеджера в административную панель застройщика
      setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 2000);

    } catch (error: unknown) {
      console.error('Error accepting invitation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при принятии приглашения';
      toast.error(errorMessage);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Ошибка</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => navigate('/')}
            >
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle>Приглашение в команду</CardTitle>
          <CardDescription>
            Завершите регистрацию для получения доступа
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Информация о приглашении */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Менеджер:</span>
              <span className="text-blue-800">{invitation.full_name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Email:</span>
              <span className="text-blue-800">{invitation.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Компания:</span>
              <span className="text-blue-800">{invitation.company_name}</span>
            </div>
            {invitation.developer_name && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Пригласил:</span>
                <span className="text-blue-800">{invitation.developer_name}</span>
              </div>
            )}
          </div>

          {/* Форма создания пароля */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Создайте пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Требования к паролю */}
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Требования к паролю:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Минимум 8 символов</li>
                <li>Строчные и заглавные буквы</li>
                <li>Минимум одна цифра</li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={handleAcceptInvitation} 
            disabled={accepting || !password || !confirmPassword}
            className="w-full"
          >
            {accepting ? 'Создание аккаунта...' : 'Принять приглашение'}
          </Button>

          <div className="text-center text-sm text-gray-500">
            <p>Приглашение действительно до:</p>
            <p className="font-medium">
              {new Date(invitation.expires_at).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitationPage;
