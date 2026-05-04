import type { ComponentProps } from "react";
import { DurationSelector, PricingPlans } from "@/entities/subscription/ui";

type DurationOption = { value: number; label: string };

type SubscriptionPricingSectionProps = {
  title: string;
  description: string;
  durationOptions: DurationOption[];
  selectedDuration: number;
  onDurationChange: (value: number) => void;
  plans: ComponentProps<typeof PricingPlans>["plans"];
  onSelectPlan: (value: string) => void;
  onOpenCheckout: (planId: string) => void;
  expiredProjectsCount: number;
};

export const SubscriptionPricingSection = ({
  title,
  description,
  durationOptions,
  selectedDuration,
  onDurationChange,
  plans,
  onSelectPlan,
  onOpenCheckout,
  expiredProjectsCount,
}: SubscriptionPricingSectionProps) => {
  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <DurationSelector
        selectedDuration={selectedDuration}
        onDurationChange={onDurationChange}
        options={durationOptions}
      />

      <PricingPlans
        plans={plans}
        selectedDuration={selectedDuration}
        onSelectPlan={onSelectPlan}
        onOpenCheckout={onOpenCheckout}
        expiredProjectsCount={expiredProjectsCount}
      />
    </section>
  );
};
