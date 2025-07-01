
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Link, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SyncStatus {
  id: string;
  project_id: string;
  excel_url: string;
  sync_interval: number;
  is_active: boolean;
  last_sync: string | null;
  next_sync: string | null;
  status: 'active' | 'error' | 'paused';
  error_message?: string;
}

interface ProjectSyncManagerProps {
  projectId: string;
}

const ProjectSyncManager = ({ projectId }: ProjectSyncManagerProps) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadSyncStatus();
  }, [projectId]);

  const loadSyncStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('project_sync_settings')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      setSyncStatus(data);
    } catch (error) {
      console.error('Ошибка загрузки настроек синхронизации:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSync = async (active: boolean) => {
    if (!syncStatus) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('project_sync_settings')
        .update({ 
          is_active: active,
          status: active ? 'active' : 'paused'
        })
        .eq('id', syncStatus.id);

      if (error) throw error;

      setSyncStatus(prev => prev ? { 
        ...prev, 
        is_active: active, 
        status: active ? 'active' : 'paused' 
      } : null);

      toast.success(active ? 'Синхронизация включена' : 'Синхронизация приостановлена');
    } catch (error) {
      console.error('Ошибка обновления синхронизации:', error);
      toast.error('Ошибка при изменении настроек синхронизации');
    } finally {
      setIsUpdating(false);
    }
  };

  const manualSync = async () => {
    if (!syncStatus) return;

    setIsUpdating(true);
    try {
      // Вызываем edge function для синхронизации
      const { error } = await supabase.functions.invoke('sync-project-data', {
        body: { projectId, syncId: syncStatus.id }
      });

      if (error) throw error;

      toast.success('Синхронизация запущена');
      // Обновляем статус через несколько секунд
      setTimeout(loadSyncStatus, 3000);
    } catch (error) {
      console.error('Ошибка ручной синхронизации:', error);
      toast.error('Ошибка при запуске синхронизации');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Активна';
      case 'error':
        return 'Ошибка';
      case 'paused':
        return 'Приостановлена';
      default:
        return 'Неизвестно';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Никогда';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const getIntervalText = (seconds: number) => {
    if (seconds < 60) return `${seconds} сек`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин`;
    return `${Math.floor(seconds / 3600)} ч`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-real-estate-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!syncStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-real-estate-600" />
            Синхронизация с Excel
          </CardTitle>
          <CardDescription>
            Для этого проекта не настроена автоматическая синхронизация
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-real-estate-600">
            Создайте проект с импортом по ссылке для настройки автоматической синхронизации
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5 text-real-estate-600" />
          Синхронизация с Excel
        </CardTitle>
        <CardDescription>
          Управление автоматической синхронизацией данных
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(syncStatus.status)}
            <span className="font-medium">Статус: {getStatusText(syncStatus.status)}</span>
          </div>
          <Badge variant={syncStatus.is_active ? 'default' : 'secondary'}>
            {syncStatus.is_active ? 'Активна' : 'Приостановлена'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-real-estate-900">Ссылка на Excel:</p>
            <p className="text-real-estate-600 break-all">{syncStatus.excel_url}</p>
          </div>
          <div>
            <p className="font-medium text-real-estate-900">Интервал:</p>
            <p className="text-real-estate-600">{getIntervalText(syncStatus.sync_interval)}</p>
          </div>
          <div>
            <p className="font-medium text-real-estate-900">Последняя синхронизация:</p>
            <p className="text-real-estate-600">{formatDate(syncStatus.last_sync)}</p>
          </div>
          <div>
            <p className="font-medium text-real-estate-900">Следующая синхронизация:</p>
            <p className="text-real-estate-600">{formatDate(syncStatus.next_sync)}</p>
          </div>
        </div>

        {syncStatus.error_message && (
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Ошибка:</strong> {syncStatus.error_message}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Switch
              checked={syncStatus.is_active}
              onCheckedChange={toggleSync}
              disabled={isUpdating}
            />
            <span className="text-sm">Автоматическая синхронизация</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={manualSync}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Синхронизировать сейчас
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectSyncManager;
