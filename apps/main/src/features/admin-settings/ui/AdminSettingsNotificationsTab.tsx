import { Spinner } from "@/shared/ui/Spinner";

import { NotificationChannelCard } from "./notifications/NotificationChannelCard";
import { NotificationEventCard } from "./notifications/NotificationEventCard";

export type AdminSettingsNotificationsTabProps = {
  loading: boolean;

  channelEmail: boolean;
  channelPush: boolean;
  channelTelegram: boolean;
  telegramUsername: string;
  telegramVerified: boolean;

  notifyNewLead: boolean;
  notifyTaskDue: boolean;
  notifyPaymentReceived: boolean;
  notifySystemUpdate: boolean;

  userEmail: string;

  onToggle: (field: string, checked: boolean) => void;
  onTelegramUsernameChange: (value: string) => void;
  onTelegramUsernameBlur: () => void;

  t: (key: string, vars?: Record<string, unknown>) => string;
};

export function AdminSettingsNotificationsTab(
  props: AdminSettingsNotificationsTabProps,
) {
  if (props.loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="text-sm font-semibold text-muted-foreground">
          {props.t("adminSettings.notificationChannels")}
        </div>

        <NotificationChannelCard
          title={props.t("adminSettings.channelEmail")}
          description={props.t("adminSettings.channelEmailHint", {
            email: props.userEmail,
          })}
          checked={props.channelEmail}
          onCheckedChange={(checked) =>
            props.onToggle("channel_email", checked)
          }
        />

        <NotificationChannelCard
          title={props.t("adminSettings.channelPush")}
          description={props.t("adminSettings.channelPushHint")}
          checked={props.channelPush}
          onCheckedChange={(checked) => props.onToggle("channel_push", checked)}
        />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-muted-foreground">
          {props.t("adminSettings.notificationEvents")}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NotificationEventCard
            title={props.t("adminSettings.eventNewLead")}
            description={props.t("adminSettings.eventNewLeadDesc")}
            checked={props.notifyNewLead}
            onCheckedChange={(checked) =>
              props.onToggle("notify_new_lead", checked)
            }
          />

          <NotificationEventCard
            title={props.t("adminSettings.eventTaskDue")}
            description={props.t("adminSettings.eventTaskDueDesc")}
            checked={props.notifyTaskDue}
            onCheckedChange={(checked) =>
              props.onToggle("notify_task_due", checked)
            }
          />

          <NotificationEventCard
            title={props.t("adminSettings.eventPaymentReceived")}
            description={props.t("adminSettings.eventPaymentReceivedDesc")}
            checked={props.notifyPaymentReceived}
            onCheckedChange={(checked) =>
              props.onToggle("notify_payment_received", checked)
            }
          />

          <NotificationEventCard
            title={props.t("adminSettings.eventSystemUpdate")}
            description={props.t("adminSettings.eventSystemUpdateDesc")}
            checked={props.notifySystemUpdate}
            onCheckedChange={(checked) =>
              props.onToggle("notify_system_update", checked)
            }
          />
        </div>
      </div>
    </div>
  );
}
