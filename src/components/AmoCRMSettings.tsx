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
  const [savingSettings, setSavingSettings] = useState(false);
  const [amocrmData, setAmocrmData] = useState<AmoCRMData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  
  // Local selection state for configuration
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editingConfiguration, setEditingConfiguration] = useState(false);

  // Computed values
  const isAuthorized = settings.access_token && settings.refresh_token;
  const tokenExpired = settings.token_expires_at ? new Date(settings.token_expires_at) < new Date() : false;
  const isConfigured = isAuthorized && !tokenExpired && settings.pipeline_id;
  const needsConfiguration = isAuthorized && !tokenExpired && !settings.pipeline_id;

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
        // Если авторизован, но нет настроек воронки - загружаем данные AmoCRM
        if (data.access_token && !data.pipeline_id) {
          fetchAmoCRMData(data);
        }
      }
    } catch (error) {
      console.error('Error fetching AmoCRM settings:', error);
      toast.error('Ошибка при загрузке настроек AmoCRM');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchAmoCRMData = async (currentSettings: AmoCRMSettings) => {
    if (!currentSettings.access_token || !currentSettings.subdomain) return;
    
    setLoadingData(true);
    try {
      // Загружаем воронки
      const pipelinesResponse = await fetch(`https://${currentSettings.subdomain}.amocrm.ru/api/v4/leads/pipelines`, {
        headers: {
          'Authorization': `Bearer ${currentSettings.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      // Загружаем пользователей
      const usersResponse = await fetch(`https://${currentSettings.subdomain}.amocrm.ru/api/v4/users`, {
        headers: {
          'Authorization': `Bearer ${currentSettings.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      // Загружаем информацию об аккаунте
      const accountResponse = await fetch(`https://${currentSettings.subdomain}.amocrm.ru/api/v4/account`, {
        headers: {
          'Authorization': `Bearer ${currentSettings.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (pipelinesResponse.ok && usersResponse.ok && accountResponse.ok) {
        const pipelinesData = await pipelinesResponse.json();
        const usersData = await usersResponse.json();
        const accountData = await accountResponse.json();

        const data: AmoCRMData = {
          account: {
            id: accountData.id,
            name: accountData.name,
            subdomain: accountData.subdomain,
            country: accountData.country
          },
          pipelines: pipelinesData._embedded?.pipelines || [],
          users: usersData._embedded?.users || []
        };

        setAmocrmData(data);
      } else {
        throw new Error('Не удалось загрузить данные из AmoCRM');
      }
    } catch (error) {
      console.error('Error fetching AmoCRM data:', error);
      toast.error('Ошибка при загрузке данных из AmoCRM');
    } finally {
      setLoadingData(false);
    }
  };


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

  const saveAmoCRMSettings = async (pipelineId: number, statusId?: number, responsibleUserId?: number) => {
    if (!amocrmData) return;
    
    setSavingSettings(true);
    try {
      // Находим выбранные объекты для получения имен
      const selectedPipeline = amocrmData.pipelines.find(p => p.id === pipelineId);
      const selectedStatus = statusId ? selectedPipeline?.statuses.find(s => s.id === statusId) : null;
      const selectedUser = responsibleUserId ? amocrmData.users.find(u => u.id === responsibleUserId) : null;

      const updateData = {
        pipeline_id: pipelineId,
        pipeline_name: selectedPipeline?.name || null,
        status_id: statusId || null,
        status_name: selectedStatus?.name || null,
        responsible_user_id: responsibleUserId || null,
        user_name: selectedUser?.name || null,
        account_name: amocrmData.account.name
      };

      const { error } = await supabase
        .from('amocrm_settings')
        .update(updateData)
        .eq('project_id', projectId);

      if (error) throw error;

      // Обновляем локальное состояние
      setSettings(prev => ({ ...prev, ...updateData }));
      toast.success('Настройки AmoCRM сохранены');
    } catch (error) {
      console.error('Error saving AmoCRM settings:', error);
      toast.error('Ошибка при сохранении настроек');
    } finally {
      setSavingSettings(false);
    }
  };


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

  const handlePipelineChange = (pipelineId: string) => {
    const id = parseInt(pipelineId);
    setSelectedPipelineId(id);
    
    // Проверяем, принадлежит ли текущий выбранный статус новой воронке
    if (selectedStatusId && amocrmData) {
      const newPipeline = amocrmData.pipelines.find(p => p.id === id);
      const statusExists = newPipeline?.statuses.some(s => s.id === selectedStatusId);
      if (!statusExists) {
        setSelectedStatusId(null); // Сбрасываем статус, если он не принадлежит новой воронке
      }
    }
  };

  const handleSaveConfiguration = async () => {
    if (!selectedPipelineId) {
      toast.error('Выберите воронку');
      return;
    }
    
    await saveAmoCRMSettings(selectedPipelineId, selectedStatusId || undefined, selectedUserId || undefined);
    setEditingConfiguration(false);
  };

  const handleEditConfiguration = async () => {
    setEditingConfiguration(true);
    // Устанавливаем текущие значения как выбранные
    setSelectedPipelineId(settings.pipeline_id || null);
    setSelectedStatusId(settings.status_id || null);
    setSelectedUserId(settings.responsible_user_id || null);
    
    // Загружаем данные AmoCRM если их еще нет
    if (!amocrmData) {
      await fetchAmoCRMData(settings);
    }
  };

  const handleCancelEdit = () => {
    setEditingConfiguration(false);
    setSelectedPipelineId(null);
    setSelectedStatusId(null);
    setSelectedUserId(null);
  };

  // Get available statuses for selected pipeline
  const getAvailableStatuses = () => {
    if (!amocrmData || !selectedPipelineId) return [];
    const pipeline = amocrmData.pipelines.find(p => p.id === selectedPipelineId);
    return pipeline?.statuses || [];
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
            {!editingConfiguration ? (
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
                    onClick={handleEditConfiguration}
                    disabled={loadingData}
                    variant="outline"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Изменить настройки
                  </Button>
                  
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
              // Edit configuration form
              <>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="h-5 w-5 text-amber-600" />
                    <h4 className="font-medium text-amber-900">Редактирование настроек</h4>
                  </div>
                  <p className="text-sm text-amber-700">
                    Измените настройки воронки, статуса и ответственного пользователя.
                  </p>
                </div>

                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>Загрузка данных из AmoCRM...</span>
                  </div>
                ) : amocrmData ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="pipeline-select">Воронка *</Label>
                      <Select 
                        onValueChange={handlePipelineChange}
                        value={selectedPipelineId?.toString() || ''}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите воронку" />
                        </SelectTrigger>
                        <SelectContent>
                          {amocrmData.pipelines
                            .filter(pipeline => !pipeline.is_archive)
                            .map(pipeline => (
                              <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                                {pipeline.name} {pipeline.is_main && '(основная)'}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedPipelineId && (
                      <div>
                        <Label htmlFor="status-select">Статус (опционально)</Label>
                        <Select 
                          onValueChange={(value) => setSelectedStatusId(value === 'none' ? null : parseInt(value))}
                          value={selectedStatusId?.toString() || 'none'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите статус" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Не выбрано</SelectItem>
                            {getAvailableStatuses().map(status => (
                              <SelectItem key={status.id} value={status.id.toString()}>
                                {status.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="user-select">Ответственный (опционально)</Label>
                      <Select 
                        onValueChange={(value) => setSelectedUserId(value === 'none' ? null : parseInt(value))}
                        value={selectedUserId?.toString() || 'none'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите ответственного" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Не выбрано</SelectItem>
                          {amocrmData.users.map(user => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name} {user.is_admin && '(админ)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleSaveConfiguration}
                        disabled={!selectedPipelineId || savingSettings}
                        className="flex-1"
                      >
                        {savingSettings ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Сохранить изменения
                      </Button>
                      
                      <Button 
                        onClick={handleCancelEdit}
                        variant="outline"
                      >
                        Отменить
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Не удалось загрузить данные из AmoCRM. Попробуйте переподключиться.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </>
        ) : needsConfiguration ? (
          // Authorized but not configured - show configuration form
          <>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Настройка интеграции</h4>
              </div>
              <p className="text-sm text-blue-700">
                Авторизация прошла успешно! Теперь выберите воронку и настройки для автоматической отправки заявок.
              </p>
            </div>

            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Загрузка данных из AmoCRM...</span>
              </div>
            ) : amocrmData ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pipeline-select">Воронка *</Label>
                  <Select onValueChange={handlePipelineChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите воронку" />
                    </SelectTrigger>
                    <SelectContent>
                      {amocrmData.pipelines
                        .filter(pipeline => !pipeline.is_archive)
                        .map(pipeline => (
                          <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                            {pipeline.name} {pipeline.is_main && '(основная)'}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPipelineId && (
                  <div>
                    <Label htmlFor="status-select">Статус (опционально)</Label>
                    <Select onValueChange={(value) => setSelectedStatusId(value === 'none' ? null : parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Не выбрано</SelectItem>
                        {getAvailableStatuses().map(status => (
                          <SelectItem key={status.id} value={status.id.toString()}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="user-select">Ответственный (опционально)</Label>
                  <Select onValueChange={(value) => setSelectedUserId(value === 'none' ? null : parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите ответственного" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не выбрано</SelectItem>
                      {amocrmData.users.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} {user.is_admin && '(админ)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSaveConfiguration}
                    disabled={!selectedPipelineId || savingSettings}
                    className="flex-1"
                  >
                    {savingSettings ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Сохранить настройки
                  </Button>
                  
                  <Button 
                    onClick={handleDisconnect}
                    variant="outline"
                  >
                    Отменить
                  </Button>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Не удалось загрузить данные из AmoCRM. Попробуйте переподключиться.
                </AlertDescription>
              </Alert>
            )}
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
