import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { AuthForm } from "@/components/Auth/AuthForm";
import ResetPasswordForm from "@/components/Auth/ResetPasswordForm";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageNavigation } from "@gridix/utils/react";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@gridix/utils/api";
import { FullPageLoaderView } from "@/shared/ui/LoaderView";

const AuthPage = () => {
  const { navigate } = useLanguageNavigation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();

  const redirectTo = searchParams.get("redirect") || "/admin";
  const mode = searchParams.get("mode");
  const [isRecovery, setIsRecovery] = useState<boolean>(false);
  const linkingAmoRef = useRef(false);
  const linkingBitrixRef = useRef(false);

  // Определяем режим на основе URL
  const isSignup = location.pathname.includes("/signup");
  const isSignin = location.pathname.includes("/signin");

  const hashIndicatesRecovery = useMemo(() => {
    if (typeof window === "undefined") return false;
    const hash = window.location.hash || "";
    return /type=recovery/.test(hash);
  }, []);

  useEffect(() => {
    if (mode === "recovery" || hashIndicatesRecovery) {
      setIsRecovery(true);
    }
  }, [mode, hashIndicatesRecovery]);

  // Capture Bitrix24 install params (Amo-style flow): we may arrive to /auth/* from Bitrix without SSO.
  // Store them so after successful auth we can bind the installation to the Gridix account.
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const urlParams = new URLSearchParams(window.location.search);

      const bitrixInstall = urlParams.get("bitrix_install") === "1";
      const domain =
        urlParams.get("bitrix_domain") ??
        urlParams.get("domain") ??
        urlParams.get("DOMAIN");
      const memberId =
        urlParams.get("bitrix_member_id") ??
        urlParams.get("member_id") ??
        urlParams.get("MEMBER_ID");

      if ((bitrixInstall || domain || memberId) && domain && memberId) {
        const payload = {
          bitrix_install: bitrixInstall ? "1" : "0",
          bitrix_domain: domain,
          bitrix_member_id: memberId,
          captured_at: new Date().toISOString(),
        };
        localStorage.setItem("pending_bitrix_install", JSON.stringify(payload));
      }
    } catch (e) {
      console.error("Failed to capture Bitrix install params:", e);
    }
  }, []);

  // При заходе на любую страницу auth с ?ref=: сохраняем pending_referral (на signup),
  // и всегда учитываем клик (Link clicks) в аналитике партнёра.
  useEffect(() => {
    const run = async () => {
      try {
        const path = window.location.pathname;
        const isAuthPath = path.includes("/auth");
        const isSignupPath = path.endsWith("/auth/signup");
        const urlParams = new URLSearchParams(window.location.search);
        const partnerCode = urlParams.get("ref");

        if (isSignupPath) {
          // Если пришли из amoCRM (без SSO) — сохраняем параметры
          const amoInstall = urlParams.get("amo_install") === "1";
          const amoAccountId = urlParams.get("amo_account_id");
          const amoUserId = urlParams.get("amo_user_id");
          const amoSubdomain = urlParams.get("amo_subdomain");
          if (amoInstall || amoAccountId || amoUserId || amoSubdomain) {
            const amoPayload = {
              amo_install: amoInstall ? "1" : "0",
              amo_account_id: amoAccountId,
              amo_user_id: amoUserId,
              amo_subdomain: amoSubdomain,
              captured_at: new Date().toISOString(),
            };
            localStorage.setItem(
              "pending_amocrm_install",
              JSON.stringify(amoPayload),
            );
          }
        }

        if (partnerCode && isAuthPath) {
          const rawUtmSource = urlParams.get("utm_source");
          const utmMedium = urlParams.get("utm_medium");
          const utmCampaign = urlParams.get("utm_campaign");
          const utmSource =
            rawUtmSource && rawUtmSource.trim().length > 0
              ? rawUtmSource.trim()
              : "direct";

          if (isSignupPath) {
            const referralData = {
              partnerCode,
              invitationCode: urlParams.get("invite"),
              invitationType: urlParams.get("type"),
              utmSource,
              utmMedium: utmMedium || null,
              utmCampaign: utmCampaign || null,
              timestamp: Date.now(),
            };
            localStorage.setItem(
              "pending_referral",
              JSON.stringify(referralData),
            );
          }

          // Link clicks: учитываем клик при любом заходе с ref= (без авторизации)
          try {
            await supabase.functions.invoke("partner-program", {
              body: {
                action: "track_click",
                partner_code: partnerCode,
                utm_source: utmSource,
                utm_medium: utmMedium,
                utm_campaign: utmCampaign,
              },
            });
          } catch (clickErr) {
            console.error("Error logging referral click:", clickErr);
          }
        }
      } catch (error) {
        console.error("Error saving pending referral / track click:", error);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && !loading && !roleLoading && !isRecovery) {
      const run = async () => {
        // 1) Если пришли из amoCRM (виджет без SSO) — пробуем "связать аккаунты" без токенов:
        // создаём/обновляем запись в crm_connections с crm_type=amocrm и subdomain.
        // Это нужно для того, чтобы следующий заход из amoCRM смог получить SSO через sso-login.
        try {
          if (!linkingAmoRef.current) {
            linkingAmoRef.current = true;
            const raw = localStorage.getItem("pending_amocrm_install");
            if (raw) {
              const parsed = JSON.parse(raw) as {
                amo_install?: string;
                amo_subdomain?: string | null;
                amo_account_id?: string | null;
                amo_user_id?: string | null;
              };

              const subdomain = parsed?.amo_subdomain ?? null;
              if (
                subdomain &&
                typeof subdomain === "string" &&
                subdomain.trim().length > 0
              ) {
                // Проверяем существующую связь пользователя с amoCRM
                const { data: existing } = await supabase
                  .from("crm_connections")
                  .select("id, subdomain")
                  .eq("crm_type", "amocrm")
                  .eq("user_id", user.id)
                  .maybeSingle();

                // Создаём/обновляем связь (токены остаются null — OAuth для интеграции настраивается позже через AmoCRMSettings)
                if (!existing || existing.subdomain !== subdomain) {
                  await supabase.from("crm_connections").upsert(
                    {
                      user_id: user.id,
                      crm_type: "amocrm",
                      subdomain: subdomain,
                    },
                    { onConflict: "user_id,crm_type" },
                  );
                }

                // После успешной привязки очищаем pending, чтобы не повторять каждый логин
                localStorage.removeItem("pending_amocrm_install");
              }
            }
          }
        } catch (e) {
          console.error("Failed to link amoCRM install after auth:", e);
          // Не блокируем вход/редирект, даже если привязка не удалась (например, из-за RLS)
        }

        // 1.1) If we came from Bitrix install/connect flow (no SSO) — bind pending install to this user.
        try {
          if (!linkingBitrixRef.current) {
            linkingBitrixRef.current = true;
            const raw = localStorage.getItem("pending_bitrix_install");
            if (raw) {
              const parsed = JSON.parse(raw) as {
                bitrix_install?: string;
                bitrix_domain?: string | null;
                bitrix_member_id?: string | null;
              };

              const domain = String(parsed?.bitrix_domain ?? "").trim();
              const memberId = String(parsed?.bitrix_member_id ?? "").trim();

              if (domain && memberId) {
                // claim_install is authenticated and binds bitrix_pending_installs -> crm_connections(user_id,crm_type=bitrix24)
                const { error } = await supabase.functions.invoke(
                  "bitrix-app",
                  {
                    body: {
                      action: "claim_install",
                      domain,
                      member_id: memberId,
                    },
                  },
                );
                if (!error) {
                  localStorage.removeItem("pending_bitrix_install");
                }
              }
            }
          }
        } catch (e) {
          console.error("Failed to claim Bitrix install after auth:", e);
          // Do not block redirect
        }

        // 2) Редирект после авторизации
        // Поддерживаем внутренние embed-страницы без языкового префикса (например, /embed/connect/bitrix24)
        // и обычные языковые роуты (/ru/*, /en/*, /ka/*, /ar/*).
        if (redirectTo && redirectTo.startsWith("/")) {
          if (
            redirectTo.match(/^\/(ru|en|ka|ar)\//) ||
            redirectTo.startsWith("/embed/")
          ) {
            window.location.href = redirectTo;
            return;
          }
        }

        // Фоллбек: все пользователи попадают в /admin (роль определит контекст)
        navigate("/admin");
      };

      void run();
    }
  }, [user, loading, roleLoading, navigate, redirectTo, isRecovery, userRole]);

  if (loading || roleLoading) {
    return <FullPageLoaderView />;
  }

  if (user && !isRecovery) {
    return null; // Пользователь уже вошел, происходит перенаправление
  }

  return isRecovery ? (
    <ResetPasswordForm
      onSuccess={() => {
        if (typeof window !== "undefined") {
          window.location.hash = "";
        }
        navigate("/auth");
      }}
    />
  ) : (
    <AuthForm
      redirectTo={redirectTo}
      defaultMode={isSignup ? "signup" : isSignin ? "signin" : undefined}
      onSuccess={() => {
        if (redirectTo && redirectTo.startsWith("/")) {
          if (
            redirectTo.match(/^\/(ru|en|ka|ar)\//) ||
            redirectTo.startsWith("/embed/")
          ) {
            window.location.href = redirectTo;
            return;
          }
        }
        navigate("/admin");
      }}
    />
  );
};

export default AuthPage;
