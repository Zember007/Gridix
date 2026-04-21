import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { toast } from "sonner";
import { useNotificationPreferences } from "./useNotificationPreferences";
import {
  NotificationSettingsUI,
  type NotificationSettingsUIProps,
} from "./NotificationSettingsUI";

export interface GlobalNotificationSettingsSectionProps {
  userId: string | undefined;
  userEmail: string;
  /** When provided, the parent can read notification data for external save. */
  onReady?: (api: ReturnType<typeof useNotificationPreferences>) => void;
}

export function GlobalNotificationSettingsSection({
  userId,
  userEmail,
  onReady,
}: GlobalNotificationSettingsSectionProps) {
  const api = useNotificationPreferences({ userId });
  const {
    notificationPreferences,
    loading,
    handlePreferenceChange,
    handleTelegramUsernameChange,
    verifyTelegramOnBlur,
    t,
  } = api;

  React.useEffect(() => {
    onReady?.(api);
  }, [api, onReady]);

  const onTelegramBlur = async () => {
    const result = await verifyTelegramOnBlur();
    if (result && !result.ok && !("error" in result && result.error)) {
      toast.error(t("adminSettings.telegramNeedsStart"), {
        description: t("adminSettings.telegramNeedsStartDesc", {
          bot: `@gridix_bot`,
        }),
      });
    }
    if (result && "error" in result && result.error) {
      toast.error(t("adminSettings.telegramVerifyError"));
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle>{t("adminSettings.notificationPreferences")}</CardTitle>
        <CardDescription>
          {t("adminSettings.notificationPreferencesDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <NotificationSettingsUI
          loading={loading}
          channelEmail={notificationPreferences.channel_email}
          channelPush={notificationPreferences.channel_push}
          channelTelegram={notificationPreferences.channel_telegram}
          telegramUsername={notificationPreferences.telegram_username || ""}
          telegramVerified={notificationPreferences.telegram_verified}
          notifyNewLead={notificationPreferences.notify_new_lead}
          notifyTaskDue={notificationPreferences.notify_task_due}
          notifyPaymentReceived={
            notificationPreferences.notify_payment_received
          }
          notifySystemUpdate={notificationPreferences.notify_system_update}
          userEmail={userEmail}
          onToggle={(field, checked) =>
            handlePreferenceChange(
              field as keyof Omit<typeof notificationPreferences, "user_id">,
              checked,
            )
          }
          onTelegramUsernameChange={handleTelegramUsernameChange}
          onTelegramUsernameBlur={onTelegramBlur}
          t={t as NotificationSettingsUIProps["t"]}
        />
      </CardContent>
    </Card>
  );
}
