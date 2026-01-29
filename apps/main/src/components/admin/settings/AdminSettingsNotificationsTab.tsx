import { Input, Label, Switch } from "@gridix/ui";
import { Spinner } from "@/shared/ui/Spinner";

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

export function AdminSettingsNotificationsTab(props: AdminSettingsNotificationsTabProps) {
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
        <div className="text-sm font-semibold text-muted-foreground">{props.t("adminSettings.notificationChannels")}</div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <div className="font-medium">{props.t("adminSettings.channelEmail")}</div>
            <div className="text-sm text-muted-foreground">{props.t("adminSettings.channelEmailHint", { email: props.userEmail })}</div>
          </div>
          <Switch checked={props.channelEmail} onCheckedChange={(checked) => props.onToggle("channel_email", checked)} />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <div className="font-medium">{props.t("adminSettings.channelPush")}</div>
            <div className="text-sm text-muted-foreground">{props.t("adminSettings.channelPushHint")}</div>
          </div>
          <Switch checked={props.channelPush} onCheckedChange={(checked) => props.onToggle("channel_push", checked)} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-muted-foreground">{props.t("adminSettings.notificationIntegrations")}</div>
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{props.t("adminSettings.telegram")}</div>
              <div className="text-sm text-muted-foreground">{props.t("adminSettings.telegramHint")}</div>
            </div>
            <Switch checked={props.channelTelegram} onCheckedChange={(checked) => props.onToggle("channel_telegram", checked)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="telegram_username">{props.t("adminSettings.telegramUsername")}</Label>
              <Input
                id="telegram_username"
                disabled={!props.channelTelegram}
                value={props.telegramUsername}
                onChange={(e) => props.onTelegramUsernameChange(e.target.value)}
                onBlur={props.onTelegramUsernameBlur}
                placeholder="@username"
              />
              {props.channelTelegram && props.telegramUsername && (
                <div className={`text-xs ${props.telegramVerified ? "text-green-600" : "text-amber-600"}`}>
                  {props.telegramVerified ? "OK" : props.t("adminSettings.telegramNeedsStart")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-muted-foreground">{props.t("adminSettings.notificationEvents")}</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div className="font-medium">{props.t("adminSettings.eventNewLead")}</div>
              <div className="text-sm text-muted-foreground">{props.t("adminSettings.eventNewLeadDesc")}</div>
            </div>
            <Switch checked={props.notifyNewLead} onCheckedChange={(checked) => props.onToggle("notify_new_lead", checked)} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div className="font-medium">{props.t("adminSettings.eventTaskDue")}</div>
              <div className="text-sm text-muted-foreground">{props.t("adminSettings.eventTaskDueDesc")}</div>
            </div>
            <Switch checked={props.notifyTaskDue} onCheckedChange={(checked) => props.onToggle("notify_task_due", checked)} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div className="font-medium">{props.t("adminSettings.eventPaymentReceived")}</div>
              <div className="text-sm text-muted-foreground">{props.t("adminSettings.eventPaymentReceivedDesc")}</div>
            </div>
            <Switch checked={props.notifyPaymentReceived} onCheckedChange={(checked) => props.onToggle("notify_payment_received", checked)} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <div className="font-medium">{props.t("adminSettings.eventSystemUpdate")}</div>
              <div className="text-sm text-muted-foreground">{props.t("adminSettings.eventSystemUpdateDesc")}</div>
            </div>
            <Switch checked={props.notifySystemUpdate} onCheckedChange={(checked) => props.onToggle("notify_system_update", checked)} />
          </div>
        </div>
      </div>
    </div>
  );
}

