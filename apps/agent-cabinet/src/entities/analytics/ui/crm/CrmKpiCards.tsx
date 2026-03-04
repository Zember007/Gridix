import { Calendar, TrendingUp, Users } from "lucide-react";
import type { AnalyticsCrmData } from "../../model/types";
import { CrmMetricCard } from "./CrmMetricCard";

interface Props {
  leadsCount: AnalyticsCrmData["leadsCount"];
  conversionRate: AnalyticsCrmData["conversionRate"];
  sourcesCount: number;
  t: (key: string) => string;
}

export function CrmKpiCards({
  leadsCount,
  conversionRate,
  sourcesCount,
  t,
}: Props) {
  const cards = [
    {
      key: "leads",
      icon: <Users size={18} />,
      title: t("common.analytics.crm.totalLeads"),
      value: String(leadsCount),
      iconContainerClassName: "bg-blue-50 text-blue-600",
    },
    {
      key: "conversion",
      icon: <TrendingUp size={18} />,
      title: t("common.analytics.crm.conversion"),
      value: `${conversionRate.toFixed(1)}%`,
      iconContainerClassName: "bg-emerald-50 text-emerald-600",
    },
    {
      key: "sources",
      icon: <Calendar size={18} />,
      title: t("common.analytics.crm.sources"),
      value: String(sourcesCount),
      iconContainerClassName: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {cards.map((card) => (
        <CrmMetricCard
          key={card.key}
          icon={card.icon}
          title={card.title}
          value={card.value}
          iconContainerClassName={card.iconContainerClassName}
        />
      ))}
    </div>
  );
}
