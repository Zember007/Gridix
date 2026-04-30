import { Skeleton } from "@gridix/ui";

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
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-56" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 bg-card p-4"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-full max-w-md" />
              </div>
              <Skeleton className="h-6 w-11 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-100 p-4">
                <Skeleton className="mb-2 h-4 w-40" />
                <Skeleton className="h-3 w-full max-w-xs" />
                <div className="mt-4 flex justify-end">
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
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
