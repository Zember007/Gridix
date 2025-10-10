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

  const fetchAmoCRMData = useCallback(async (currentSettings: AmoCRMSettings) => {
    if (!currentSettings.access_token || !currentSettings.subdomain) return;
    
    setLoadingData(true);
    try {
      // Используем edge function для запросов к AmoCRM API
      const { data, error } = await supabase.functions.invoke('amocrm-api', {
        body: { 
          project_id: projectId,
          action: 'fetch_data'
        }
      });

      if (error) {
        throw error;
      }

      if (data?.data) {
        setAmocrmData(data.data);
      } else {
        throw new Error('Не удалось загрузить данные из AmoCRM');
      }
    } catch (error) {
      console.error('Error fetching AmoCRM data:', error);
      toast.error(t('amocrm.dataFetchError'));
    } finally {
      setLoadingData(false);
    }
  }, [projectId, t]);

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
      toast.error(t('amocrm.settingsLoadError'));
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchAmoCRMData, t]);


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
        window.open(data.auth_url);

      } else {
        throw new Error('Не получен URL авторизации');
      }
      
    } catch (error) {
      console.error('Ошибка при запуске авторизации:', error);
      toast.error(t('amocrm.authError'));
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
      toast.success(t('amocrm.settingsSaveSuccess'));
    } catch (error) {
      console.error('Error saving AmoCRM settings:', error);
      toast.error(t('amocrm.settingsSaveError'));
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
      toast.success(t('amocrm.disconnectSuccess'));
    } catch (error) {
      console.error('Error disconnecting AmoCRM:', error);
      toast.error(t('amocrm.disconnectError'));
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
        window.open(data.auth_url);

      } else {
        throw new Error('Не получен URL авторизации');
      }
      
    } catch (error) {
      console.error('Ошибка при запуске авторизации:', error);
      toast.error(t('amocrm.authError'));
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
      toast.error(t('amocrm.selectPipelineRequired'));
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
          {t('amocrm.title')}
          {isConfigured && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              {t('amocrm.configured')}
            </Badge>
          )}
          {isAuthorized && tokenExpired && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              {t('amocrm.needsReconnection')}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isConfigured ? 
            t('amocrm.descriptionConfigured') :
            t('amocrm.description')
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
                        {settings.account_name ? `${t('amocrm.connectedTo')} ${settings.account_name}` : t('amocrm.integrationActive')}
                      </h4>
                      <p className="text-sm text-green-700">
                        {t('amocrm.account')} {settings.subdomain}.amocrm.ru
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{t('amocrm.pipeline')}</span>
                      <span className="font-medium">{settings.pipeline_name || `ID: ${settings.pipeline_id}`}</span>
                    </div>
                    {settings.status_name && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">{t('amocrm.status')}</span>
                        <span className="font-medium">{settings.status_name}</span>
                      </div>
                    )}
                    {settings.user_name && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">{t('amocrm.responsible')}</span>
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
                    {t('amocrm.changeSettings')}
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
                    {t('amocrm.reconnect')}
                  </Button>
                  
                  <Button 
                    onClick={handleDisconnect}
                    variant="destructive"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {t('amocrm.disconnect')}
                  </Button>
                </div>
              </>
            ) : (
              // Edit configuration form
              <>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="h-5 w-5 text-amber-600" />
                    <h4 className="font-medium text-amber-900">{t('amocrm.editingSettings')}</h4>
                  </div>
                  <p className="text-sm text-amber-700">
                    {t('amocrm.editingSettingsDesc')}
                  </p>
                </div>

                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    <span>{t('amocrm.loadingData')}</span>
                  </div>
                ) : amocrmData ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="pipeline-select">{t('amocrm.pipelineRequired')}</Label>
                      <Select 
                        onValueChange={handlePipelineChange}
                        value={selectedPipelineId?.toString() || ''}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('amocrm.selectPipeline')} />
                        </SelectTrigger>
                        <SelectContent>
                          {amocrmData.pipelines
                            .filter(pipeline => !pipeline.is_archive)
                            .map(pipeline => (
                              <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                                {pipeline.name} {pipeline.is_main && `(${t('amocrm.main')})`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedPipelineId && (
                      <div>
                        <Label htmlFor="status-select">{t('amocrm.statusOptional')}</Label>
                        <Select 
                          onValueChange={(value) => setSelectedStatusId(value === 'none' ? null : parseInt(value))}
                          value={selectedStatusId?.toString() || 'none'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('amocrm.selectStatus')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('amocrm.notSelected')}</SelectItem>
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
                      <Label htmlFor="user-select">{t('amocrm.responsibleOptional')}</Label>
                      <Select 
                        onValueChange={(value) => setSelectedUserId(value === 'none' ? null : parseInt(value))}
                        value={selectedUserId?.toString() || 'none'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('amocrm.selectResponsible')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('amocrm.notSelected')}</SelectItem>
                          {amocrmData.users.map(user => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name} {user.is_admin && `(${t('amocrm.admin')})`}
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
                        {t('amocrm.saveChanges')}
                      </Button>
                      
                      <Button 
                        onClick={handleCancelEdit}
                        variant="outline"
                      >
                        {t('amocrm.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('amocrm.dataLoadError')}
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
                <h4 className="font-medium text-blue-900">{t('amocrm.configurationTitle')}</h4>
              </div>
              <p className="text-sm text-blue-700">
                {t('amocrm.configurationDesc')}
              </p>
            </div>

            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>{t('amocrm.loadingData')}</span>
              </div>
            ) : amocrmData ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pipeline-select">{t('amocrm.pipelineRequired')}</Label>
                  <Select onValueChange={handlePipelineChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('amocrm.selectPipeline')} />
                    </SelectTrigger>
                    <SelectContent>
                      {amocrmData.pipelines
                        .filter(pipeline => !pipeline.is_archive)
                        .map(pipeline => (
                          <SelectItem key={pipeline.id} value={pipeline.id.toString()}>
                            {pipeline.name} {pipeline.is_main && `(${t('amocrm.main')})`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPipelineId && (
                  <div>
                    <Label htmlFor="status-select">{t('amocrm.statusOptional')}</Label>
                    <Select onValueChange={(value) => setSelectedStatusId(value === 'none' ? null : parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('amocrm.selectStatus')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('amocrm.notSelected')}</SelectItem>
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
                  <Label htmlFor="user-select">{t('amocrm.responsibleOptional')}</Label>
                  <Select onValueChange={(value) => setSelectedUserId(value === 'none' ? null : parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('amocrm.selectResponsible')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('amocrm.notSelected')}</SelectItem>
                      {amocrmData.users.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} {user.is_admin && `(${t('amocrm.admin')})`}
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
                    {t('amocrm.saveSettings')}
                  </Button>
                  
                  <Button 
                    onClick={handleDisconnect}
                    variant="outline"
                  >
                    {t('amocrm.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('amocrm.dataLoadError')}
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
              {authorizing ? t('amocrm.connecting') : t('amocrm.connectAmoCRM')}
            </Button>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">{t('amocrm.howItWorks')}</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>{t('amocrm.howItWorksStep1')}</li>
                <li>{t('amocrm.howItWorksStep2')}</li>
                <li>{t('amocrm.howItWorksStep3')}</li>
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
