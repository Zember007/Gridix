import { Switch } from "@gridix/ui";

type NotificationEventCardProps = {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function NotificationEventCard(props: NotificationEventCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <div className="font-medium">{props.title}</div>
        <div className="text-sm text-muted-foreground">{props.description}</div>
      </div>
      <Switch checked={props.checked} onCheckedChange={props.onCheckedChange} />
    </div>
  );
}
