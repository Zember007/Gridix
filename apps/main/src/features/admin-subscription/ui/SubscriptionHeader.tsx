import { Button, PageHeader } from "@gridix/ui";
import { CreditCard, RefreshCw } from "lucide-react";

type SubscriptionHeaderProps = {
  title: string;
  refreshLabel: string;
  onRefresh: () => void;
  changePaymentMethodLabel?: string;
  onChangePaymentMethod?: () => void;
};

export const SubscriptionHeader = ({
  title,
  refreshLabel,
  onRefresh,
  changePaymentMethodLabel,
  onChangePaymentMethod,
}: SubscriptionHeaderProps) => {
  return (
    <PageHeader
      title={title}
      actions={
        <>
          {onChangePaymentMethod && changePaymentMethodLabel ? (
            <Button variant="outline" size="sm" onClick={onChangePaymentMethod}>
              <CreditCard className="mr-2 h-4 w-4" />
              {changePaymentMethodLabel}
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {refreshLabel}
          </Button>
        </>
      }
    />
  );
};
