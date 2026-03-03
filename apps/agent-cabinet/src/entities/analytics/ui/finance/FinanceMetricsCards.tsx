import type { AnalyticsFinanceData } from "../../model/types";
import { FinanceMetricCard } from "./FinanceMetricCard";

interface Props {
  paid: AnalyticsFinanceData["paid"];
  pending: AnalyticsFinanceData["pending"];
  payoutCount: AnalyticsFinanceData["payoutCount"];
  t: (key: string) => string;
}

export function FinanceMetricsCards({ paid, pending, payoutCount, t }: Props) {
  const total = paid + pending;
  const cards = [
    {
      key: "pipeline",
      title: t("common.analytics.finance.pipeline"),
      value: `$${pending.toLocaleString()}`,
      subtitle: `${payoutCount} ${t("common.analytics.finance.dealsInWork")}`,
      badgeText: t("common.analytics.finance.inProgress"),
      badgeClassName: "bg-amber-50 text-amber-600",
    },
    {
      key: "received",
      title: t("common.analytics.finance.received"),
      value: `$${paid.toLocaleString()}`,
      subtitle: t("common.analytics.finance.successDeals"),
      valueClassName: "text-green-600",
      badgeText: t("common.analytics.finance.success"),
      badgeClassName: "bg-green-50 text-green-600",
    },
    {
      key: "total",
      title: t("common.analytics.finance.total"),
      value: `$${total.toLocaleString()}`,
      subtitle: t("common.analytics.finance.allTime"),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <FinanceMetricCard
          key={card.key}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          valueClassName={card.valueClassName}
          badgeText={card.badgeText}
          badgeClassName={card.badgeClassName}
        />
      ))}
    </div>
  );
}
