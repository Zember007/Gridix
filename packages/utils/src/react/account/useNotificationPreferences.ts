import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../api/supabase";
import { useLanguage } from "../language/LanguageContext";

const TELEGRAM_BOT_USERNAME = "gridix_bot";

export interface NotificationPreferencesForm {
  user_id: string;
  channel_email: boolean;
  channel_push: boolean;
  channel_telegram: boolean;
  telegram_username: string | null;
  telegram_verified: boolean;
  telegram_last_checked_at: string | null;
  telegram_last_error: string | null;
  notify_new_lead: boolean;
  notify_task_due: boolean;
  notify_payment_received: boolean;
  notify_system_update: boolean;
}

export interface UseNotificationPreferencesOptions {
  userId: string | undefined;
}

export function useNotificationPreferences({
  userId,
}: UseNotificationPreferencesOptions) {
  const { t } = useLanguage();

  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferencesForm>({
      user_id: userId || "",
      channel_email: true,
      channel_push: false,
      channel_telegram: false,
      telegram_username: null,
      telegram_verified: false,
      telegram_last_checked_at: null,
      telegram_last_error: null,
      notify_new_lead: true,
      notify_task_due: true,
      notify_payment_received: true,
      notify_system_update: false,
    });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_notification_preferences")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error loading notification preferences:", error);
        }

        if (!data) {
          setNotificationPreferences((prev) => ({
            ...prev,
            user_id: userId,
          }));
          return;
        }

        setNotificationPreferences({
          user_id: userId,
          channel_email: data.channel_email,
          channel_push: data.channel_push,
          channel_telegram: data.channel_telegram,
          telegram_username: data.telegram_username,
          telegram_verified: data.telegram_verified,
          telegram_last_checked_at: data.telegram_last_checked_at,
          telegram_last_error: data.telegram_last_error,
          notify_new_lead: data.notify_new_lead,
          notify_task_due: data.notify_task_due,
          notify_payment_received: data.notify_payment_received,
          notify_system_update: data.notify_system_update,
        });
      } catch (e) {
        console.error("Error in loadNotificationPrefs:", e);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [userId]);

  const handlePreferenceChange = useCallback(
    (
      field: keyof Omit<NotificationPreferencesForm, "user_id">,
      value: boolean | string | null,
    ) => {
      setNotificationPreferences((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleTelegramUsernameChange = useCallback((value: string) => {
    const next = value.startsWith("@") ? value : `@${value.replace(/^@+/, "")}`;
    setNotificationPreferences((prev) => ({
      ...prev,
      telegram_username: next === "@" ? null : next,
    }));
  }, []);

  const verifyTelegramOnBlur = useCallback(async () => {
    const username = notificationPreferences.telegram_username?.trim() ?? "";
    if (!notificationPreferences.channel_telegram || !username) return;

    const normalized = username.startsWith("@") ? username : `@${username}`;
    if (normalized !== username) {
      setNotificationPreferences((prev) => ({
        ...prev,
        telegram_username: normalized,
      }));
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "developer-settings",
        {
          body: {
            action: "telegram_verify_username",
            username: normalized,
          },
        },
      );
      if (error) throw error;

      const ok = !!(data as { ok?: unknown })?.ok;
      const nowIso = new Date().toISOString();

      setNotificationPreferences((prev) => ({
        ...prev,
        telegram_verified: ok,
        telegram_last_checked_at: nowIso,
        telegram_last_error: ok ? null : JSON.stringify(data ?? null),
      }));

      return { ok };
    } catch (e) {
      console.error("Failed to verify telegram username", e);
      setNotificationPreferences((prev) => ({
        ...prev,
        telegram_verified: false,
        telegram_last_checked_at: new Date().toISOString(),
        telegram_last_error: e instanceof Error ? e.message : "unknown",
      }));
      return { ok: false, error: true };
    }
  }, [
    notificationPreferences.channel_telegram,
    notificationPreferences.telegram_username,
  ]);

  const saveNotificationPreferences = useCallback(async () => {
    if (!userId) return;

    const notifData = {
      ...notificationPreferences,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await supabase
      .from("user_notification_preferences")
      .upsert(notifData, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      console.error("Supabase notification preferences error:", error);
      throw error;
    }

    if (result) {
      setNotificationPreferences({
        user_id: userId,
        channel_email: result.channel_email,
        channel_push: result.channel_push,
        channel_telegram: result.channel_telegram,
        telegram_username: result.telegram_username,
        telegram_verified: result.telegram_verified,
        telegram_last_checked_at: result.telegram_last_checked_at,
        telegram_last_error: result.telegram_last_error,
        notify_new_lead: result.notify_new_lead,
        notify_task_due: result.notify_task_due,
        notify_payment_received: result.notify_payment_received,
        notify_system_update: result.notify_system_update,
      });
    }
  }, [userId, notificationPreferences]);

  return {
    notificationPreferences,
    loading,
    handlePreferenceChange,
    handleTelegramUsernameChange,
    verifyTelegramOnBlur,
    saveNotificationPreferences,
    TELEGRAM_BOT_USERNAME,
    t,
  };
}
