import { Input, Label, Switch } from "@gridix/ui";

export interface NotificationSettingsUIProps {
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
}

export function NotificationSettingsUI(props: NotificationSettingsUIProps) {
  if (props.loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="text-muted-foreground text-sm font-semibold">
          {props.t("adminSettings.notificationChannels")}
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <div className="font-medium">
              {props.t("adminSettings.channelEmail")}
            </div>
            <div className="text-muted-foreground text-sm">
              {props.t("adminSettings.channelEmailHint", {
                email: props.userEmail,
              })}
            </div>
          </div>
          <Switch
            checked={props.channelEmail}
            onCheckedChange={(checked) =>
              props.onToggle("channel_email", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <div className="font-medium">
              {props.t("adminSettings.channelPush")}
            </div>
            <div className="text-muted-foreground text-sm">
              {props.t("adminSettings.channelPushHint")}
            </div>
          </div>
          <Switch
            checked={props.channelPush}
            onCheckedChange={(checked) =>
              props.onToggle("channel_push", checked)
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-muted-foreground text-sm font-semibold">
          {props.t("adminSettings.notificationIntegrations")}
        </div>
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                {props.t("adminSettings.telegram")}
              </div>
              <div className="text-muted-foreground text-sm">
                {props.t("adminSettings.telegramHint")}
              </div>
            </div>
            <Switch
              checked={props.channelTelegram}
              onCheckedChange={(checked) =>
                props.onToggle("channel_telegram", checked)
              }
            />
          </div>

          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="telegram_username">
                {props.t("adminSettings.telegramUsername")}
              </Label>
              <Input
                id="telegram_username"
                disabled={!props.channelTelegram}
                value={props.telegramUsername}
                onChange={(e) => props.onTelegramUsernameChange(e.target.value)}
                onBlur={props.onTelegramUsernameBlur}
                placeholder="@username"
              />
              {props.channelTelegram && props.telegramUsername && (
                <div
                  className={`text-xs ${props.telegramVerified ? "text-green-600" : "text-amber-600"}`}
                >
                  {props.telegramVerified
                    ? "OK"
                    : props.t("adminSettings.telegramNeedsStart")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-muted-foreground text-sm font-semibold">
          {props.t("adminSettings.notificationEvents")}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div className="font-medium">
                {props.t("adminSettings.eventNewLead")}
              </div>
              <div className="text-muted-foreground text-sm">
                {props.t("adminSettings.eventNewLeadDesc")}
              </div>
            </div>
            <Switch
              checked={props.notifyNewLead}
              onCheckedChange={(checked) =>
                props.onToggle("notify_new_lead", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div className="font-medium">
                {props.t("adminSettings.eventTaskDue")}
              </div>
              <div className="text-muted-foreground text-sm">
                {props.t("adminSettings.eventTaskDueDesc")}
              </div>
            </div>
            <Switch
              checked={props.notifyTaskDue}
              onCheckedChange={(checked) =>
                props.onToggle("notify_task_due", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div className="font-medium">
                {props.t("adminSettings.eventPaymentReceived")}
              </div>
              <div className="text-muted-foreground text-sm">
                {props.t("adminSettings.eventPaymentReceivedDesc")}
              </div>
            </div>
            <Switch
              checked={props.notifyPaymentReceived}
              onCheckedChange={(checked) =>
                props.onToggle("notify_payment_received", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div className="font-medium">
                {props.t("adminSettings.eventSystemUpdate")}
              </div>
              <div className="text-muted-foreground text-sm">
                {props.t("adminSettings.eventSystemUpdateDesc")}
              </div>
            </div>
            <Switch
              checked={props.notifySystemUpdate}
              onCheckedChange={(checked) =>
                props.onToggle("notify_system_update", checked)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
