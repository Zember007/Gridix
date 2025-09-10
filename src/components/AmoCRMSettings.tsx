import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Settings, ExternalLink, CheckCircle, AlertCircle, RefreshCw, Download, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface AmoCRMSettingsProps {
  projectId: string;
}

interface AmoCRMSettings {
  id?: string;
  project_id: string;
  subdomain: string;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  pipeline_id?: number;
  status_id?: number;
  responsible_user_id?: number;
  pipeline_name?: string;
  status_name?: string;
  user_name?: string;
  account_name?: string;
}

interface AmoCRMPipeline {
  id: number;
  name: string;
  sort: number;
  is_main: boolean;
  is_archive: boolean;
  statuses: AmoCRMStatus[];
}

interface AmoCRMStatus {
  id: number;
  name: string;
  sort: number;
  color: string;
  type: number;
  pipeline_id: number;
}

interface AmoCRMUser {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  group: {
    id: number;
    name: string;
  };
}

interface AmoCRMData {
  account: {
    id: number;
    name: string;
    subdomain: string;
    country: string;
  };
  pipelines: AmoCRMPipeline[];
  users: AmoCRMUser[];
}

const AmoCRMSettings = ({ projectId }: AmoCRMSettingsProps) => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<AmoCRMSettings>({
    project_id: projectId,
    subdomain: '',
  });
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);

  // Computed values
  const isAuthorized = settings.access_token && settings.refresh_token;
  const tokenExpired = settings.token_expires_at ? new Date(settings.token_expires_at) < new Date() : false;
  const isConfigured = isAuthorized && !tokenExpired && settings.pipeline_id;

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('amocrm_settings')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching AmoCRM settings:', error);
      toast.error('Ошибка при загрузке настроек AmoCRM');
    } finally {
      setLoading(false);
    }
  }, [projectId]);


  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleAuth = async () => {
    try {
      setAuthorizing(true);
      
      // Очищаем предыдущие данные авторизации, если они есть
      if (settings?.id) {
        await supabase
          .from('amocrm_settings')
          .update({ 
            authorization_code: null,
            access_token: null,
            refresh_token: null,
            token_expires_at: null 
          })
          .eq('id', settings.id);
      }
      
      // Используем edge function для генерации правильного URL авторизации
      const { data, error } = await supabase.functions.invoke('amocrm-start-auth', {
        body: { project_id: projectId }
      });

      if (error) {
        throw error;
      }

      if (data?.auth_url) {
        window.open(data.auth_url, '_blank');

      } else {
        throw new Error('Не получен URL авторизации');
      }
      
    } catch (error) {
      console.error('Ошибка при запуске авторизации:', error);
      toast.error('Не удалось запустить авторизацию AmoCRM');
    } finally {
      setAuthorizing(false);
    }
  };

  const handleAuthSuccess = useCallback(async () => {
    // Обновляем настройки после успешной авторизации
    await fetchSettings();
   
  }, [fetchSettings]);


  const handleDisconnect = async () => {
    try {
      const { error } = await supabase
        .from('amocrm_settings')
        .update({
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
          pipeline_id: null,
          status_id: null,
          responsible_user_id: null,
          pipeline_name: null,
          status_name: null,
          user_name: null,
          account_name: null
        })
        .eq('project_id', projectId);

      if (error) throw error;
      
      await fetchSettings();
      toast.success('Интеграция отключена');
    } catch (error) {
      console.error('Error disconnecting AmoCRM:', error);
      toast.error('Ошибка при отключении');
    }
  };

  const handleAuthorize = async () => {
    try {
      setAuthorizing(true);
      
      // Очищаем предыдущие данные авторизации, если они есть
      if (settings?.id) {
        await supabase
          .from('amocrm_settings')
          .update({ 
            authorization_code: null,
            access_token: null,
            refresh_token: null,
            token_expires_at: null 
          })
          .eq('id', settings.id);
      }
      
      // Используем edge function для генерации правильного URL авторизации
      const { data, error } = await supabase.functions.invoke('amocrm-start-auth', {
        body: { project_id: projectId }
      });

      if (error) {
        throw error;
      }

      if (data?.auth_url) {
        window.open(data.auth_url, '_blank');

      } else {
        throw new Error('Не получен URL авторизации');
      }
      
    } catch (error) {
      console.error('Ошибка при запуске авторизации:', error);
      toast.error('Не удалось запустить авторизацию AmoCRM');
    } finally {
      setAuthorizing(false);
    }
  };

  const handleSubdomainChange = (value: string) => {
    // Clean subdomain input
    const cleanSubdomain = value.replace(/https?:\/\//, '').replace(/\.amocrm\.ru.*/, '').trim();
    setSettings(prev => ({ ...prev, subdomain: cleanSubdomain }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }


  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Интеграция с AmoCRM
          {isConfigured && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Настроена
            </Badge>
          )}
          {isAuthorized && tokenExpired && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Требует переподключения
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isConfigured ? 
            'Интеграция настроена и готова к работе. Заявки автоматически попадают в AmoCRM.' :
            'Подключите AmoCRM для автоматической отправки заявок в CRM'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {isConfigured ? (
          // Configured state - show connection info and disconnect option
          <>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-900">
                    {settings.account_name ? `Подключено к: ${settings.account_name}` : 'Интеграция активна'}
                  </h4>
                  <p className="text-sm text-green-700">
                    Аккаунт: {settings.subdomain}.amocrm.ru
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Воронка:</span>
                  <span className="font-medium">{settings.pipeline_name || `ID: ${settings.pipeline_id}`}</span>
                </div>
                {settings.status_name && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Статус:</span>
                    <span className="font-medium">{settings.status_name}</span>
                  </div>
                )}
                {settings.user_name && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Ответственный:</span>
                    <span className="font-medium">{settings.user_name}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAuthorize} 
                disabled={authorizing}
                variant="outline"
              >
                {authorizing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Переподключить
              </Button>
              
              <Button 
                onClick={handleDisconnect}
                variant="destructive"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Отключить
              </Button>
            </div>
          </>
        ) : (
          // Not configured state - single button auth
          <>
            <Button 
              onClick={handleAuth} 
              disabled={authorizing}
              className="w-full"
              size="lg"
            >
              {authorizing ? (
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-5 w-5 mr-2" />
              )}
              {authorizing ? 'Подключение...' : 'Подключить AmoCRM'}
            </Button>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Как это работает:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Нажмите "Подключить AmoCRM"</li>
                <li>Вас перенаправит на страницу авторизации AmoCRM</li>
                <li>После подтверждения доступа вы вернетесь в приложение, и мы настроим интеграцию</li>
              </ol>
            </div>
          </>
        )}
      </CardContent>
    </Card>
    

    </>
  );
};

export default AmoCRMSettings;
