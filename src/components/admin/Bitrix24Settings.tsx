import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import Loader from '@/shared/ui/loader';
import { supabase } from '@/shared/api/supabase';
import { Input } from '@/shared/ui/input';
import { toast } from 'sonner';

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
  id: string;
  project_id: string;
  crm_connection_id: string;
  category_id: number | null;
  stage_id: string | null;
  assigned_by_id: number | null;
};

export default function Bitrix24Settings({ projectId }: Bitrix24SettingsProps) {
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<CRMConnection | null>(null);
  const [projectSettings, setProjectSettings] = useState<ProjectBitrixSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [domainInput, setDomainInput] = useState('');

  const fetchState = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      const user = data?.user ?? null;
      if (!user) {
        setConnection(null);
        setProjectSettings(null);
        return;
      }

      const { data: conn, error: connErr } = await supabase
        .from('crm_connections')
        .select('id, crm_type, subdomain, base_domain, token_expires_at')
        .eq('user_id', user.id)
        .eq('crm_type', 'bitrix24')
        .maybeSingle();
      if (connErr) throw connErr;
      const nextConn = (conn ?? null) as unknown as CRMConnection | null;
      setConnection(nextConn);
      setDomainInput(nextConn?.base_domain ?? nextConn?.subdomain ?? '');

      const { data: ps, error: psErr } = await supabase
        .from('project_bitrix_settings')
        .select('id, project_id, crm_connection_id, category_id, stage_id, assigned_by_id')
        .eq('project_id', projectId)
        .maybeSingle();
      if (psErr) throw psErr;
      setProjectSettings((ps ?? null) as unknown as ProjectBitrixSettings | null);
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

  const attachToProject = async () => {
    if (!connection) return;
    try {
      setBusy(true);
      const { error } = await supabase.from('project_bitrix_settings').upsert({
        project_id: projectId,
        crm_connection_id: connection.id,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Bitrix24 подключен к проекту');
      await fetchState();
    } catch (e) {
      console.error(e);
      toast.error('Не удалось подключить Bitrix24 к проекту');
    } finally {
      setBusy(false);
    }
  };

  const saveConnection = async () => {
    const raw = domainInput.trim();
    if (!raw) return toast.error('Укажите поддомен/домен Bitrix24');
    try {
      setBusy(true);
      const { data } = await supabase.auth.getUser();
      const user = data?.user ?? null;
      if (!user) {
        toast.error('Нужно войти в Gridix');
        return;
      }

      const normalized = raw.replace(/^https?:\/\//, '').replace(/\/+$/, '');
      const subdomain = normalized.split('.')[0] ?? normalized;

      const { error } = await supabase
        .from('crm_connections')
        .upsert(
          {
            user_id: user.id,
            crm_type: 'bitrix24',
            subdomain,
            base_domain: normalized,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,crm_type' }
        );
      if (error) throw error;

      toast.success('Bitrix24: поддомен сохранён');
      await fetchState();
    } catch (e) {
      console.error(e);
      toast.error('Не удалось сохранить поддомен Bitrix24');
    } finally {
      setBusy(false);
    }
  };

  const detachFromProject = async () => {
    try {
      setBusy(true);
      const { error } = await supabase.from('project_bitrix_settings').delete().eq('project_id', projectId);
      if (error) throw error;
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
            <div className="space-y-2">
              <div className="text-muted-foreground">
                Укажите поддомен/домен портала Bitrix24. По нему виджет будет находить ваш `user_id` и делать SSO
                автоматически (как в amoCRM).
              </div>
              <Input
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="mycompany.bitrix24.ru или mycompany"
              />
              <div className="flex gap-2">
                <Button onClick={saveConnection} disabled={busy}>
                  Сохранить
                </Button>
                {connection && (
                  <Button variant="outline" onClick={fetchState} disabled={busy}>
                    Обновить
                  </Button>
                )}
              </div>

              {connection && (
                <>
                  <div className="text-muted-foreground">
                    Текущее: <span className="font-mono">{connection.base_domain ?? connection.subdomain}</span>
                  </div>
                  {tokenExpired && (
                    <div className="text-xs text-red-600">
                      Токен Bitrix24 истёк. Переустановите приложение в Bitrix24 (чтобы `bitrix-install` обновил токены).
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
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

