import { useState, type ComponentProps } from "react";
import {
  OrderHistory,
  type OrderHistoryFilter,
} from "@/entities/subscription/ui";
import { useLanguage } from "@/contexts/LanguageContext";

type SubscriptionHistorySectionProps = {
  title: string;
  orders: ComponentProps<typeof OrderHistory>["orders"];
  projects: ComponentProps<typeof OrderHistory>["projects"];
};

export const SubscriptionHistorySection = ({
  title,
  orders,
  projects,
}: SubscriptionHistorySectionProps) => {
  const [filter, setFilter] = useState<OrderHistoryFilter>("all");
  const { t } = useLanguage();

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <div className="no-scrollbar flex w-full min-w-0 overflow-x-auto sm:w-auto sm:justify-end">
          <div className="inline-flex shrink-0 rounded-lg bg-slate-100 p-1">
            {(["all", "paid", "pending"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-md px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                  filter === f
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f === "all"
                  ? t("admin.subscriptionPage.history.filters.all")
                  : f === "paid"
                    ? t("admin.subscriptionPage.history.filters.paid")
                    : t("admin.subscriptionPage.history.filters.pending")}
              </button>
            ))}
          </div>
        </div>
      </div>
      <OrderHistory orders={orders} projects={projects} filter={filter} />
    </section>
  );
};
