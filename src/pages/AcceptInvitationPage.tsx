import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, User, Building, Mail } from 'lucide-react';
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
  const [accepting, setAccepting] = useState(false);

  const autoAcceptInvitation = useCallback(async (invitationData: InvitationData, userId: string) => {
    try {
      console.log('Auto-accepting invitation for user:', userId);

      // Создаем запись менеджера
      const { error: managerError } = await supabase
        .from('manager_accounts')
        .insert({
          developer_id: invitationData.developer_id,
          manager_id: userId,
          email: invitationData.email,
          full_name: invitationData.full_name,
          phone: invitationData.phone,
          status: 'active',
          accepted_at: new Date().toISOString()
        });

      if (managerError) {
        // Проверяем, может уже существует
        if (managerError.code === '23505') { // duplicate key
          console.log('Manager account already exists');
        } else {
          throw managerError;
        }
      }

      // Обновляем статус приглашения на 'accepted'
      const { error: updateError } = await supabase
        .from('manager_invitations')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationData.id);

      if (updateError) {
        console.error('Error updating invitation status:', updateError);
      }

      toast.success(t('invitation.acceptedSuccess'));
      
      // Перенаправляем на установку пароля или в админку
      setTimeout(() => {
        navigate('/admin');
      }, 1000);

    } catch (error: unknown) {
      console.error('Error auto-accepting invitation:', error);
      const errorMessage = error instanceof Error ? error.message : t('invitation.acceptError');
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [navigate, t]);

  const loadInvitationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading invitation with token:', token);
      
      // Проверяем, авторизован ли уже пользователь
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
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
          throw new Error(t('invitation.notFound'));
        }
        throw new Error(t('invitation.loadingError', { message: invitationError.message }));
      }

      if (!invitationData) {
        throw new Error(t('invitation.notFound'));
      }

      // Проверяем статус и срок действия
      if (invitationData.status !== 'pending') {
        throw new Error(t('invitation.alreadyUsed'));
      }

      if (new Date(invitationData.expires_at) < new Date()) {
        throw new Error(t('invitation.expired'));
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
        developer_name: developerData?.full_name || t('invitation.unknown'),
        company_name: developerData?.company_name || t('invitation.unknown')
      });

      // Если пользователь уже авторизован с правильным email - автоматически принимаем приглашение
      if (currentUser && currentUser.email === invitationData.email) {
        console.log('User already authenticated with correct email, auto-accepting invitation');
        // Автоматически принимаем приглашение
        await autoAcceptInvitation(invitationData, currentUser.id);
        return;
      }

    } catch (err: unknown) {
      console.error('Error in loadInvitationData:', err);
      const errorMessage = err instanceof Error ? err.message : t('invitation.loadingError', { message: 'Unknown error' });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, t, autoAcceptInvitation]);

  useEffect(() => {
    if (!token) {
      setError(t('invitation.tokenNotFound'));
      setLoading(false);
      return;
    }

    loadInvitationData();
  }, [token, loadInvitationData, t]);

  // Отслеживаем изменения авторизации и автоматически принимаем приглашение
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      // Если пользователь авторизовался и есть приглашение
      if (event === 'SIGNED_IN' && session?.user && invitation && session.user.email === invitation.email) {
        console.log('User signed in via magic link, auto-accepting invitation');
        await autoAcceptInvitation(invitation, session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [invitation, autoAcceptInvitation]);

  const handleAcceptInvitation = async () => {
    if (!invitation) {
      toast.error(t('invitation.dataNotFound'));
      return;
    }

    setAccepting(true);
    try {
      // Проверяем, авторизован ли пользователь
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        toast.error('Пожалуйста, войдите в систему для принятия приглашения');
        // Перенаправляем на страницу входа
        navigate(`/ru/auth?redirect=/ru/accept-invitation?token=${encodeURIComponent(token || '')}`);
        return;
      }

      if (currentUser.email !== invitation.email) {
        toast.error(`Это приглашение для ${invitation.email}. Пожалуйста, войдите с правильным email.`);
        return;
      }

      const userId = currentUser.id;

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

      toast.success(t('invitation.acceptedSuccess'));
      
      // Перенаправляем менеджера в административную панель
      setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 2000);

    } catch (error: unknown) {
      console.error('Error accepting invitation:', error);
      const errorMessage = error instanceof Error ? error.message : t('invitation.acceptError');
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
            <CardTitle className="text-red-600">{t('invitation.error')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => navigate('/')}
            >
              {t('invitation.returnHome')}
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
          <CardTitle>{t('invitation.teamInvitation')}</CardTitle>
          <CardDescription>
            {t('invitation.completeRegistration')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Информация о приглашении */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">{t('invitation.manager')}</span>
              <span className="text-blue-800">{invitation.full_name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">{t('invitation.email')}</span>
              <span className="text-blue-800">{invitation.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">{t('invitation.company')}</span>
              <span className="text-blue-800">{invitation.company_name}</span>
            </div>
            {invitation.developer_name && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">{t('invitation.invitedBy')}</span>
                <span className="text-blue-800">{invitation.developer_name}</span>
              </div>
            )}
          </div>

          {/* Инструкция для пользователя */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Важно!
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Для принятия приглашения войдите в систему с email: <strong>{invitation.email}</strong>
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleAcceptInvitation} 
            disabled={accepting}
            className="w-full"
          >
            {accepting 
              ? 'Принимаем приглашение...'
              : t('invitation.acceptInvitation')
            }
          </Button>

          <div className="text-center text-sm text-gray-500">
            <p>{t('invitation.validUntil')}</p>
            <p className="font-medium">
              {new Date(invitation.expires_at).toLocaleDateString('en-US', {
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
