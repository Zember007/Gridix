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
  const [emailInput, setEmailInput] = useState('');
  const [claimTokenInput, setClaimTokenInput] = useState('');
  const [pendingToken, setPendingToken] = useState<string | null>(null);

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
      setEmailInput(user.email ?? '');

      const { data: conn, error: connErr } = await supabase
        .from('crm_connections')
        .select('id, crm_type, subdomain, base_domain, token_expires_at')
        .eq('user_id', user.id)
        .eq('crm_type', 'bitrix24')
        .maybeSingle();
      if (connErr) throw connErr;
      const nextConn = (conn ?? null) as unknown as CRMConnection | null;
      setConnection(nextConn);
      setDomainInput((prev) => prev || nextConn?.base_domain || nextConn?.subdomain || '');

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

  const normalizeDomain = (raw: string) => raw.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');

  const buildPortalDomain = (raw: string) => {
    const normalized = normalizeDomain(raw);
    if (!normalized) return '';
    // Allow user to type just subdomain
    if (!normalized.includes('.')) return `${normalized}.bitrix24.ru`;
    return normalized;
  };

  const openMarketplace = async () => {
    const domain = buildPortalDomain(domainInput);
    if (!domain) return toast.error('Укажите поддомен/домен Bitrix24');

    const tpl = (import.meta as any)?.env?.VITE_BITRIX_MARKET_APP_URL_TEMPLATE as string | undefined;
    if (!tpl || !tpl.includes('{domain}')) {
      toast.error('Не настроена ссылка на Marketplace приложения (VITE_BITRIX_MARKET_APP_URL_TEMPLATE).');
      // Fallback: at least open Marketplace root so user can find the app manually.
      window.open(`https://${domain}/marketplace/`, '_blank', 'noopener,noreferrer');
      return;
    }

    const url = tpl.replace('{domain}', domain);

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const checkPendingToken = async () => {
    const domain = buildPortalDomain(domainInput);
    if (!domain) return toast.error('Укажите поддомен/домен Bitrix24');
    try {
      setBusy(true);
      const { data, error } = await supabase.functions.invoke('bitrix-app', {
        body: { action: 'get_pending_install', project_id: projectId, domain },
      });
      if (error) throw error;
      const token = (data as any)?.pending?.claim_token ?? null;
      setPendingToken(token);
      if (token) toast.success('Установка найдена — токен готов');
      else toast.message('Пока нет данных об установке. Установите приложение в Bitrix и повторите.');
    } catch (e) {
      console.error(e);
      toast.error('Не удалось проверить установку Bitrix');
    } finally {
      setBusy(false);
    }
  };

  const claimByToken = async () => {
    const domain = buildPortalDomain(domainInput);
    if (!domain) return toast.error('Укажите поддомен/домен Bitrix24');
    const email = emailInput.trim();
    const token = claimTokenInput.trim() || pendingToken || '';
    if (!email) return toast.error('Укажите email');
    if (!token) return toast.error('Укажите token');
    try {
      setBusy(true);
      const { data, error } = await supabase.functions.invoke('bitrix-app', {
        body: { action: 'claim_install_by_token', project_id: projectId, email, token },
      });
      if (error) throw error;
      if ((data as any)?.success) {
        toast.success('Bitrix24 привязан и подключен к проекту');
        setClaimTokenInput('');
        setPendingToken(null);
        await fetchState();
      } else {
        toast.error('Не удалось привязать token');
      }
    } catch (e) {
      console.error(e);
      toast.error('Не удалось привязать Bitrix: проверьте email/token');
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
                1) Укажите поддомен/домен портала Bitrix24 и нажмите “Подключить” — откроется Marketplace с приложением.
                <br />
                2) После установки получите Token (показывается в Bitrix при установке) и введите Email + Token для
                привязки к проекту.
              </div>
              <Input
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="mycompany.bitrix24.ru или mycompany"
              />
              <div className="flex gap-2">
                <Button onClick={openMarketplace} disabled={busy}>
                  Подключить (Marketplace)
                </Button>
                <Button variant="outline" onClick={checkPendingToken} disabled={busy}>
                  Проверить установку
                </Button>
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

              {!connection && (
                <div className="rounded-md border p-3 space-y-2">
                  <div className="font-medium">Привязка после установки (Email + Token)</div>
                  <div className="text-muted-foreground text-xs">
                    Token появляется при установке приложения в Bitrix. Можно также нажать “Проверить установку” — токен
                    подтянется автоматически, если установка уже дошла до сервера.
                  </div>
                  <Input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="email@domain.com" />
                  <Input
                    value={claimTokenInput}
                    onChange={(e) => setClaimTokenInput(e.target.value)}
                    placeholder={pendingToken ? `Token найден: ${pendingToken}` : 'GRIDIX-XXXXXXXXXXXX'}
                  />
                  {pendingToken && (
                    <div className="text-muted-foreground text-xs">
                      Token найден: <span className="font-mono">{pendingToken}</span>
                    </div>
                  )}
                  <Button onClick={claimByToken} disabled={busy}>
                    Привязать Bitrix к проекту
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

