import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/shared/api/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import Loader from '@/shared/ui/loader';
import { toast } from 'sonner';

function getPublicAppOrigin(): string {
  // In local dev, Supabase magic-link redirects often end up on localhost.
  // Force a public origin so the user lands back on the real app and can "claim" the install.
  if (!import.meta.env.PROD) return 'https://app.gridix.live';
  return window.location.origin;
}

export default function BitrixInstallPage() {
  const [bxReady, setBxReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

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

        // Get current Gridix session
        const { data } = await supabase.auth.getUser();
        const user = data?.user ?? null;
        setSessionEmail(user?.email ?? null);

        // If logged in and we have install params -> claim pending install
        if (user && domain && memberId) {
          const { error } = await supabase.functions.invoke('bitrix-app', {
            body: { action: 'claim_install', domain, member_id: memberId },
          });
          if (error) throw error;
          toast.success('Bitrix подключен к аккаунту Gridix');
        }
      } catch (e) {
        console.error(e);
        // don't spam: only show toast when we actually have params
        if (domain && memberId) toast.error('Не удалось завершить подключение Bitrix');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [domain, memberId]);

  const sendMagicLink = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    try {
      setLoading(true);
      const redirectTo = `${getPublicAppOrigin()}/embed/connect/bitrix24${window.location.search}`;
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          // after login user can return to this page to claim the install
          emailRedirectTo: redirectTo,
        },
      });
      if (error) throw error;
      toast.success('Ссылка для входа отправлена на email. Откройте её и вернитесь сюда.');
    } catch (e) {
      console.error(e);
      toast.error('Не удалось отправить ссылку для входа');
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
            <CardTitle className="text-base">Вход в Gridix (email)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="py-6">
                <Loader size="md" className="mx-auto" />
              </div>
            ) : sessionEmail ? (
              <div className="space-y-3">
                <div className="text-sm">
                  Вы вошли как: <span className="font-medium">{sessionEmail}</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => (window.location.href = '/embed/bitrix/projects')}
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
                <div className="text-sm text-muted-foreground">
                  Введите email вашего аккаунта Gridix — мы отправим magic-link для входа, затем автоматически привяжем
                  установку Bitrix к аккаунту.
                </div>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  type="email"
                />
                <Button onClick={sendMagicLink} className="w-full">
                  Отправить ссылку для входа
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}