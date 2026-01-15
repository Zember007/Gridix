import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/shared/api/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import Loader from '@/shared/ui/loader';
import { toast } from 'sonner';

export default function BitrixInstallPage() {
  const [bxReady, setBxReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [claimed, setClaimed] = useState(false);

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
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [domain, memberId]);

  const claimInstallByToken = async () => {
    const trimmed = token.trim();
    if (!trimmed) return;
    if (!domain || !memberId) {
      toast.error('Нет параметров установки (domain/member_id)');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('bitrix-app', {
        body: { action: 'claim_install', domain, member_id: memberId },
        headers: {
          Authorization: `Bearer ${trimmed}`,
        },
      });
      if (error) throw error;
      setClaimed(true);
      toast.success('Bitrix подключен к аккаунту Gridix');
    } catch (e) {
      console.error(e);
      toast.error('Не удалось подключить Bitrix: проверьте токен');
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
            <CardTitle className="text-base">Подключение к аккаунту Gridix (токен)</CardTitle>
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
                  Вставьте токен вашего аккаунта Gridix (JWT). Он используется один раз, чтобы привязать установку Bitrix
                  к вашему пользователю.
                </div>
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  type="password"
                />
                <Button onClick={claimInstallByToken} className="w-full" disabled={!domain || !memberId}>
                  Привязать установку Bitrix к аккаунту
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}