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
  const rawToken = searchParams.get('token');
  // Декодируем токен, если он был URL-encoded
  const token = rawToken ? decodeURIComponent(rawToken) : null;
  
  console.log('URL params:', window.location.search);
  console.log('Raw token from params:', rawToken);
  console.log('Decoded token:', token);

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');

  const loadInvitationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading invitation with token:', token);
      
      // Загружаем данные приглашения
      const { data: invitationData, error: invitationError } = await supabase
        .from('manager_invitations')
        .select('*')
        .eq('invitation_token', token)
        .single();

      console.log('Invitation query result:', { data: invitationData, error: invitationError });

      if (invitationError) {
        console.error('Invitation error:', invitationError);
        if (invitationError.code === 'PGRST116') {
          throw new Error('Приглашение не найдено или недоступно');
        }
        throw new Error(`Ошибка загрузки приглашения: ${invitationError.message}`);
      }

      if (!invitationData) {
        throw new Error('Приглашение не найдено');
      }

      // Проверяем статус и срок действия
      if (invitationData.status !== 'pending') {
        throw new Error('Приглашение уже было использовано или отменено');
      }

      if (new Date(invitationData.expires_at) < new Date()) {
        throw new Error('Срок действия приглашения истек');
      }

      // Загружаем данные разработчика отдельно
      const { data: developerData, error: developerError } = await supabase
        .from('user_profiles')
        .select('full_name, company_name')
        .eq('id', invitationData.developer_id)
        .single();

      console.log('Developer query result:', { data: developerData, error: developerError });

      if (developerError) {
        console.warn('Could not load developer data:', developerError);
      }

      setInvitation({
        ...invitationData,
        developer_name: developerData?.full_name || 'Неизвестно',
        company_name: developerData?.company_name || 'Неизвестно'
      });

    } catch (err: unknown) {
      console.error('Error in loadInvitationData:', err);
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
    if (!invitation) {
      toast.error('Данные приглашения не найдены');
      return;
    }

    setAccepting(true);
    try {
      // Проверяем, есть ли уже пользователь с таким email
      const { data: { user: existingUser }, error: getUserError } = await supabase.auth.getUser();
      
      let userId: string;
      
      if (existingUser && existingUser.email === invitation.email) {
        // Пользователь уже авторизован с нужным email
        userId = existingUser.id;
        toast.info('Вы уже авторизованы. Принимаем приглашение...');
      } else if (isExistingUser) {
        // Пользователь существует, нужно войти
        if (!loginPassword) {
          toast.error('Введите пароль для входа');
          return;
        }

        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: invitation.email,
          password: loginPassword
        });

        if (signInError) {
          throw new Error('Неверный пароль или email');
        }

        if (!authData.user) {
          throw new Error('Ошибка входа в аккаунт');
        }

        userId = authData.user.id;
      } else {
        // Создаем новый аккаунт
        if (!password || !confirmPassword) {
          toast.error('Заполните все поля для создания аккаунта');
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

        userId = authData.user.id;
      }

      // Создаем запись менеджера
      const { error: managerError } = await supabase
        .from('manager_accounts')
        .insert({
          developer_id: invitation.developer_id,
          manager_id: userId,
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
      
      // Перенаправляем менеджера в административную панель
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

          {/* Переключатель между входом и регистрацией */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <button
              type="button"
              onClick={() => setIsExistingUser(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !isExistingUser 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Создать аккаунт
            </button>
            <button
              type="button"
              onClick={() => setIsExistingUser(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isExistingUser 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              У меня есть аккаунт
            </button>
          </div>

          {isExistingUser ? (
            /* Форма входа */
            <div className="space-y-4">
              <div>
                <Label htmlFor="loginPassword">Введите пароль</Label>
                <div className="relative">
                  <Input
                    id="loginPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Ваш пароль"
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
            </div>
          ) : (
            /* Форма создания пароля */
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
          )}

          <Button 
            onClick={handleAcceptInvitation} 
            disabled={accepting || (isExistingUser ? !loginPassword : (!password || !confirmPassword))}
            className="w-full"
          >
            {accepting ? (isExistingUser ? 'Вход и принятие приглашения...' : 'Создание аккаунта...') : 'Принять приглашение'}
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
