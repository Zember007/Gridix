import { Button } from "@gridix/ui";
import { RefreshCw } from "lucide-react";

type SubscriptionHeaderProps = {
  title: string;
  refreshLabel: string;
  onRefresh: () => void;
};

export const SubscriptionHeader = ({
  title,
  refreshLabel,
  onRefresh,
}: SubscriptionHeaderProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCw className="mr-2 h-4 w-4" />
        {refreshLabel}
      </Button>
    </div>
  );
};
