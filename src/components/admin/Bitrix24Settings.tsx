import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import Loader from '@/shared/ui/loader';
import { supabase } from '@/shared/api/supabase';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

interface Bitrix24SettingsProps {
  projectId: string;
}

type CRMConnection = {
  id: string;
  crm_type: string;
  subdomain: string;
  base_domain: string | null;
  token_expires_at: string | null;
};

type ProjectBitrixSettings = {
  id?: string;
  project_id: string;
  crm_connection_id?: string;
  category_id: number | null;
  stage_id: string | null;
  assigned_by_id: number | null;
};

type BitrixCategory = { id: number; name: string; sort?: number };
type BitrixStage = { stageId: string; name: string; sort?: number; color?: string };

export default function Bitrix24Settings({ projectId }: Bitrix24SettingsProps) {
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<CRMConnection | null>(null);
  const [projectSettings, setProjectSettings] = useState<ProjectBitrixSettings | null>(null);
  const [busy, setBusy] = useState(false);

  const [categories, setCategories] = useState<BitrixCategory[]>([]);
  const [stages, setStages] = useState<BitrixStage[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const syncTimeoutRef = useRef<number | null>(null);

  const fetchState = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('bitrix-app', {
        body: { action: 'bitrix_get_state', project_id: projectId },
      });
      if (error) throw error;

      const nextConn = ((data as any)?.connection ?? null) as CRMConnection | null;
      const nextPs = ((data as any)?.project_settings ?? null) as ProjectBitrixSettings | null;
      const nextCats = ((data as any)?.categories ?? []) as BitrixCategory[];
      const nextStages = ((data as any)?.stages ?? []) as BitrixStage[];
      const nextSelected = (data as any)?.selected_category_id;

      setConnection(nextConn);
      setProjectSettings(nextPs);
      setCategories(Array.isArray(nextCats) ? nextCats : []);
      setStages(Array.isArray(nextStages) ? nextStages : []);
      setSelectedCategoryId(typeof nextSelected === 'number' ? nextSelected : (nextPs?.category_id ?? null));
    } catch (e) {
      console.error(e);
      toast.error('Не удалось загрузить настройки Bitrix24');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchState();
  }, [fetchState]);

  const canConfigure = useMemo(() => !!connection && !!projectSettings, [connection, projectSettings]);

  const attachToProject = async () => {
    if (!connection) return;
    try {
      setBusy(true);
      const { data, error } = await supabase.functions.invoke('bitrix-app', {
        body: { action: 'bitrix_attach_project', project_id: projectId },
      });
      if (error) throw error;
      if (!(data as any)?.success) throw new Error('Attach failed');
      toast.success('Bitrix24 подключен к проекту');
      await fetchState();
    } catch (e) {
      console.error(e);
      toast.error('Не удалось подключить Bitrix24 к проекту');
    } finally {
      setBusy(false);
    }
  };

  const syncFunnel = async (categoryId: number) => {
    if (!connection || !projectSettings) return;
    try {
      setSyncing(true);
      const { data, error } = await supabase.functions.invoke('bitrix-app', {
        body: { action: 'bitrix_sync_funnel', project_id: projectId, category_id: categoryId },
      });
      if (error) throw error;
      if (!(data as any)?.success) throw new Error('Bitrix sync failed');
      const ss = ((data as any)?.stages ?? []) as BitrixStage[];
      setStages(Array.isArray(ss) ? ss : []);

      const psPatch = ((data as any)?.project_settings ?? null) as Partial<ProjectBitrixSettings> | null;
      if (psPatch) {
        setProjectSettings((prev) => {
          const base: ProjectBitrixSettings = prev ?? {
            project_id: projectId,
            crm_connection_id: connection.id,
            category_id: null,
            stage_id: null,
            assigned_by_id: null,
          };
          return { ...base, ...psPatch };
        });
      }
      toast.success('Воронка Bitrix синхронизирована и создана в GridixCRM');
    } catch (e) {
      console.error(e);
      toast.error('Не удалось синхронизировать воронку Bitrix');
    } finally {
      setSyncing(false);
    }
  };

  const detachFromProject = async () => {
    try {
      setBusy(true);
      const { data, error } = await supabase.functions.invoke('bitrix-app', {
        body: { action: 'bitrix_detach_project', project_id: projectId },
      });
      if (error) throw error;
      if (!(data as any)?.success) throw new Error('Detach failed');
      toast.success('Bitrix24 отключен от проекта');
      await fetchState();
    } catch (e) {
      console.error(e);
      toast.error('Не удалось отключить Bitrix24 от проекта');
    } finally {
      setBusy(false);
    }
  };

  const tokenExpired =
    connection?.token_expires_at ? new Date(connection.token_expires_at) < new Date() : false;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Bitrix24</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading ? (
          <div className="py-6">
            <Loader size="md" className="mx-auto" />
          </div>
        ) : (
          <>
            <div className="text-muted-foreground">
              Если у вас еще нет аккаунта в Битрикс24, то создайте его.
              <br />
              Если у вас уже есть аккаунт в Битрикс24, перейдите на страницу приложения Gridix и установите его.
              <br />
              После установки авторизуйтесь с данными вашего аккаунта в Битрикс24 и завершите установку.
            </div>

            {connection && (
              <>
                <div className="text-muted-foreground">
                  Подключено: <span className="font-mono">{connection.base_domain ?? connection.subdomain}</span>
                </div>
                {tokenExpired && (
                  <div className="text-xs text-red-600">
                    Токен Bitrix24 истёк. Переустановите приложение в Bitrix24, чтобы обновить токены.
                  </div>
                )}

                {projectSettings ? (
                  <div className="space-y-2">
                    <div className="rounded-md border p-2">
                      <div className="font-medium">Проект подключен</div>
                      <div className="text-muted-foreground">
                        crm_connection_id: <span className="font-mono">{projectSettings.crm_connection_id}</span>
                      </div>
                    </div>

                    <div className="rounded-md border p-3 space-y-2">
                      <div className="font-medium">Воронка Bitrix → GridixCRM</div>
                      <div className="text-xs text-muted-foreground">
                        Выберите воронку (направление сделок) в Bitrix. После подключения мы создадим локальную воронку в GridixCRM со всеми статусами,
                        настроим маппинг стадий и туда будут падать лиды/синхронизироваться статусы.
                      </div>

                      <Select
                        value={typeof selectedCategoryId === 'number' ? String(selectedCategoryId) : ''}
                        onValueChange={(v) => {
                          const next = v ? Number(v) : null;
                          setSelectedCategoryId(next);
                          setStages([]);
                          if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
                          if (typeof next === 'number') {
                            // Auto-sync on funnel change (no separate button)
                            syncTimeoutRef.current = window.setTimeout(() => void syncFunnel(next), 250);
                          }
                        }}
                        disabled={busy || syncing || tokenExpired}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите воронку Bitrix24" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name} (ID: {c.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {stages.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Статусов: {stages.length}. Первый статус будет установлен как стартовый для новых сделок из Gridix.
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        {syncing ? 'Синхронизация…' : 'Синхронизация выполняется автоматически при смене воронки.'}
                      </div>
                    </div>

                    <Button variant="outline" onClick={detachFromProject} disabled={busy}>
                      Отключить от проекта
                    </Button>
                  </div>
                ) : (
                  <Button onClick={attachToProject} disabled={busy || tokenExpired}>
                    Подключить Bitrix24 к этому проекту
                  </Button>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

