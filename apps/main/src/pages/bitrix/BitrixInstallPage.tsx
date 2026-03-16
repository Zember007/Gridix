import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      if (ok) toast.success(t("bitrix.install.toast.connected"));
    })();
  }, [status, user, claimInstall, t]);

  // BX24.installFinish() — завершаем установку в Bitrix сразу после отображения claimed
  useEffect(() => {
    if (status !== "claimed") return;
    try {
      if (typeof BX24 === "undefined" || !BX24?.installFinish) return;
      const finish = () => {
        try {
          BX24.installFinish!();
        } catch {
          // ignore
        }
      };
      if (bxReadyRef.current) {
        finish();
      } else {
        BX24.init(() => {
          bxReadyRef.current = true;
          finish();
        });
      }
    } catch {
      // ignore
    }
  }, [status]);

  const handleClaim = async () => {
    if (!domain || !memberId) {
      toast.error(t("bitrix.install.toast.missingInstallParams"));
      return;
    }
    if (!user) {
      toast.error(t("bitrix.install.toast.loginFirst"));
      return;
    }
    const ok = await claimInstall();
    if (ok) toast.success(t("bitrix.install.toast.connected"));
    else toast.error(error ?? t("bitrix.install.toast.claimFailed"));
  };

  const handleLogin = () => {
    window.location.href = buildAuthUrl();
  };

  const loading = status === "loading";
  const claimed = status === "claimed";
  const needsInstall = status === "needs_install";

  return (
    <div className="flex min-h-screen items-start justify-center bg-white p-4">
      <div className="w-full max-w-lg space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {t("bitrix.install.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {domain && memberId ? (
              <div className="rounded-md border p-2">
                <div className="font-medium">
                  {t("bitrix.install.paramsTitle")}
                </div>
                <div className="text-muted-foreground">
                  domain: <span className="font-mono">{domain}</span>
                </div>
                <div className="text-muted-foreground">
                  member_id: <span className="font-mono">{memberId}</span>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">
                {t("bitrix.install.entrypointDescription")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {t("bitrix.install.bindTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-[120px] space-y-3">
            {claimed ? (
              <div className="space-y-3">
                <div className="text-sm font-medium text-green-600">
                  {t("bitrix.install.claimedSuccess")}
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader size="md" />
              </div>
            ) : needsInstall ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {t("bitrix.install.needsInstallPrimary")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("bitrix.install.needsInstallSecondary")}
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
                      {t("bitrix.install.loginHint")}
                    </div>
                    <Button
                      onClick={handleLogin}
                      className="w-full"
                      disabled={!domain || !memberId}
                    >
                      {t("bitrix.install.loginButton")}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground">
                      {t("bitrix.install.claimHint", {
                        email: user.email ?? "",
                      })}
                    </div>
                    <Button
                      onClick={handleClaim}
                      className="w-full"
                      disabled={!domain || !memberId}
                    >
                      {t("bitrix.install.claimButton")}
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
