import type { AnalyticsFinanceData } from "../../model/types";
import { FinanceMetricsCards } from "./FinanceMetricsCards";
import { FinancePayoutsRegistry } from "./FinancePayoutsRegistry";
import { FinanceRegistryIntro } from "./FinanceRegistryIntro";

interface Props extends AnalyticsFinanceData {
  t: (key: string) => string;
}

export function FinanceView({ paid, pending, payoutCount, payouts, t }: Props) {
  return (
    <div className="min-w-0 space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
      <FinanceRegistryIntro t={t} />
      <FinanceMetricsCards
        paid={paid}
        pending={pending}
        payoutCount={payoutCount}
        t={t}
      />
      <FinancePayoutsRegistry payouts={payouts} t={t} />
    </div>
  );
}
