import { OrderHistory } from "@/entities/subscription/ui";
import type { ComponentProps } from "react";

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
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <OrderHistory orders={orders} projects={projects} />
    </section>
  );
};
