import { useEffect, useMemo, useRef } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Loader,
} from "@gridix/ui";
import { toast } from "sonner";
import { useBitrixConnect } from "@/pages/bitrix/hooks/useBitrixConnect";

export default function BitrixInstallPage() {
  const qp = useMemo(() => new URLSearchParams(window.location.search), []);
  const domain = qp.get("domain") ?? qp.get("DOMAIN") ?? "";
  const memberId = qp.get("member_id") ?? qp.get("memberId") ?? "";

  const { status, user, error, claimInstall, buildAuthUrl } = useBitrixConnect(
    domain,
    memberId,
  );
  const claimAttemptedRef = useRef(false);
  const bxReadyRef = useRef(false);

  useEffect(() => {
    if (typeof BX24 === "undefined") return;
    try {
      BX24.init(() => {
        bxReadyRef.current = true;
        try {
          BX24.resizeWindow?.(900, 650);
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
  }, []);

  // Автоматическая привязка при первом заходе (пользователь залогинен, есть pending)
  useEffect(() => {
    if (status !== "pending" || !user || claimAttemptedRef.current) return;

    claimAttemptedRef.current = true;
    void (async () => {
      const ok = await claimInstall();
      if (ok) toast.success("Bitrix подключен к аккаунту Gridix");
    })();
  }, [status, user, claimInstall]);

  // При claimed: завершаем установку в Bitrix, через 100 ms перезагружаем страницу
  useEffect(() => {
    if (status !== "claimed") return;
    try {
      const finish = () => {
        try {
          if (typeof BX24 !== "undefined" && BX24?.installFinish) {
            BX24.installFinish!();
          }
          window.setTimeout(() => window.location.reload(), 300);
        } catch {
          // ignore
        }
      };
      if (typeof BX24 !== "undefined") {
        if (bxReadyRef.current) {
          finish();
        } else {
          BX24.init(() => {
            bxReadyRef.current = true;
            finish();
          });
        }
      } else {
        window.setTimeout(() => window.location.reload(), 100);
      }
    } catch {
      window.setTimeout(() => window.location.reload(), 100);
    }
  }, [status]);

  const handleClaim = async () => {
    if (!domain || !memberId) {
      toast.error("Нет параметров установки (domain/member_id)");
      return;
    }
    if (!user) {
      toast.error("Сначала войдите в Gridix");
      return;
    }
    const ok = await claimInstall();
    if (ok) toast.success("Bitrix подключен к аккаунту Gridix");
    else toast.error(error ?? "Не удалось привязать установку");
  };

  const handleLogin = () => {
    window.location.href = buildAuthUrl();
  };

  const loading = status === "loading";
  const claimed = status === "claimed";
  const needsInstall = status === "needs_install";
  const claiming = status === "pending" && !!user;

  return (
    <div className="flex min-h-screen items-start justify-center bg-white p-4">
      <div className="w-full max-w-lg space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Gridix • Подключение Bitrix24
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {domain && memberId ? (
              <div className="rounded-md border p-2">
                <div className="font-medium">Параметры</div>
                <div className="text-muted-foreground">
                  domain: <span className="font-mono">{domain}</span>
                </div>
                <div className="text-muted-foreground">
                  member_id: <span className="font-mono">{memberId}</span>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">
                Эта страница — точка входа для подключения Bitrix24. Перейдите
                сюда с параметрами domain и member_id.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Привязка к аккаунту Gridix
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-[120px] space-y-3">
            {claimed ? (
              <div className="space-y-3">
                <div className="text-sm font-medium text-green-600">
                  Готово. Интеграция привязана к вашему аккаунту.
                </div>
              </div>
            ) : loading || claiming ? (
              <div className="flex items-center justify-center py-6">
                <Loader size="md" />
              </div>
            ) : needsInstall ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Сначала установите приложение Gridix из маркетплейса Bitrix24.
                  После установки вы попадёте на страницу завершения.
                </div>
                <div className="text-sm text-muted-foreground">
                  Если вы уже установили — переустановите приложение или
                  обновите страницу.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}
                {!user ? (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Войдите или зарегистрируйтесь в Gridix — привязка
                      выполнится автоматически.
                    </div>
                    <Button
                      onClick={handleLogin}
                      className="w-full"
                      disabled={!domain || !memberId}
                    >
                      Войти в Gridix
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Нажмите кнопку ниже, чтобы привязать установку Bitrix к
                      аккаунту {user.email ?? ""}.
                    </div>
                    <Button
                      onClick={handleClaim}
                      className="w-full"
                      disabled={!domain || !memberId}
                    >
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
