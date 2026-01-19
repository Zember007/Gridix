import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/shared/api/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import Loader from '@/shared/ui/loader';
import { toast } from 'sonner';
import type { Language } from '@/shared/lib/language-utils';
import { LANGUAGE_CONFIG } from '@/shared/lib/language-utils';

export default function BitrixInstallPage() {
  const [bxReady, setBxReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [claimed, setClaimed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const qp = useMemo(() => new URLSearchParams(window.location.search), []);
  const domain = qp.get('domain') ?? '';
  const memberId = qp.get('member_id') ?? '';

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);

        // Init BX24 if available (inside Bitrix iframe)
        if (typeof BX24 !== 'undefined') {
          BX24.init(() => {
            setBxReady(true);
            try {
              BX24.resizeWindow?.(900, 650);
            } catch {
              // ignore
            }
          });
        }

        // Load current user (if already logged in)
        const { data } = await supabase.auth.getUser();
        const user = data?.user ?? null;
        setUserEmail(user?.email ?? null);

        // If logged in and have install params -> auto-claim
        if (user && domain && memberId) {
          const { error } = await supabase.functions.invoke('bitrix-app', {
            body: { action: 'claim_install', domain, member_id: memberId },
          });
          if (!error) setClaimed(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [domain, memberId]);

  const detectEmbedLanguage = (): Language => {
    const langParam = qp.get('lang');
    if (langParam && (langParam as Language) in LANGUAGE_CONFIG) return langParam as Language;

    const saved = localStorage.getItem('embed-language');
    if (saved && (saved as Language) in LANGUAGE_CONFIG) return saved as Language;

    return 'ru';
  };

  const buildAuthUrl = () => {
    const lang = detectEmbedLanguage();
    // Auth routes live under /:lang/*
    const redirect = `/embed/connect/bitrix24?domain=${encodeURIComponent(domain)}&member_id=${encodeURIComponent(memberId)}`;
    const sp = new URLSearchParams();
    sp.set('redirect', redirect);
    sp.set('bitrix_install', '1');
    sp.set('bitrix_domain', domain);
    sp.set('bitrix_member_id', memberId);
    return `/${lang}/auth?${sp.toString()}`;
  };

  const claimInstall = async () => {
    if (!domain || !memberId) {
      toast.error('Нет параметров установки (domain/member_id)');
      return;
    }
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      toast.error('Сначала войдите в Gridix, чтобы привязать установку');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('bitrix-app', {
        body: { action: 'claim_install', domain, member_id: memberId },
      });
      if (error) throw error;
      setClaimed(true);
      toast.success('Bitrix подключен к аккаунту Gridix');
    } catch (e) {
      console.error(e);
      toast.error('Не удалось подключить Bitrix: попробуйте переустановить приложение или проверить параметры установки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 flex items-start justify-center">
      <div className="w-full max-w-lg space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gridix • Подключение Bitrix24</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="text-muted-foreground">
              BX24: {bxReady ? 'инициализирован' : 'не обнаружен (вне Bitrix iframe)'}
            </div>
            <div className="text-muted-foreground">
              Gridix: {userEmail ? `вход выполнен (${userEmail})` : 'не выполнен (нужно войти)'}
            </div>
            {domain && memberId ? (
              <div className="rounded-md border p-2">
                <div className="font-medium">Параметры установки</div>
                <div className="text-muted-foreground">
                  domain: <span className="font-mono">{domain}</span>
                </div>
                <div className="text-muted-foreground">
                  member_id: <span className="font-mono">{memberId}</span>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">
                Эта страница используется как точка входа для установки/подключения Bitrix24.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Привязка установки к аккаунту Gridix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="py-6">
                <Loader size="md" className="mx-auto" />
              </div>
            ) : claimed ? (
              <div className="space-y-3">
                <div className="text-sm">Готово. Интеграция привязана к вашему аккаунту.</div>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => (window.location.href = '/embed/bitrix')}
                    className="w-full"
                  >
                    Открыть проекты
                  </Button>
                  <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                    Проверить подключение
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {!userEmail ? (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Чтобы привязать установку Bitrix к вашему аккаунту, войдите или зарегистрируйтесь в Gridix в этом окне.
                    </div>
                    <Button
                      onClick={() => (window.location.href = buildAuthUrl())}
                      className="w-full"
                      disabled={!domain || !memberId}
                    >
                      Войти в Gridix
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Нажмите кнопку ниже — мы привяжем текущую установку Bitrix (domain/member_id) к вашему аккаунту Gridix.
                    </div>
                    <Button onClick={claimInstall} className="w-full" disabled={!domain || !memberId}>
                      Привязать установку Bitrix к аккаунту
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}