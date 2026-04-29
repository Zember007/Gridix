import React from "react";
import { Crown, CheckCircle } from "lucide-react";
import { Button } from "@gridix/ui";
import { SubscriptionPlan } from "@/entities/subscription/queries/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAdminPricingContentBySlug } from "@/entities/subscription/model/adminPricingContent";

interface PricingPlansProps {
  plans: SubscriptionPlan[];
  selectedDuration: number;
  onSelectPlan: (planId: string) => void;
  onOpenCheckout: (planId: string) => void;
  expiredProjectsCount: number;
}

export const PricingPlans: React.FC<PricingPlansProps> = ({
  plans,
  selectedDuration,
  onSelectPlan,
  onOpenCheckout,
  expiredProjectsCount,
}) => {
  const { t } = useLanguage();

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-6 lg:grid-cols-2">
      {plans.map((plan) => {
        const pricing =
          plan.pricing?.find((p) => p.durationMonths === selectedDuration) ||
          plan.pricing?.[0];
        const isPro = plan.slug === "pro";
        const planContent = getAdminPricingContentBySlug(plan.slug);

        // Calculate savings properly - round to 2 decimal places
        const savings = pricing?.savings
          ? Math.round(pricing.savings * 100) / 100
          : 0;

        return (
          <div
            key={plan.id}
            className={`relative flex flex-col overflow-hidden rounded-3xl transition-all duration-300 ${
              isPro
                ? "bg-slate-900 text-white shadow-2xl ring-1 ring-slate-900"
                : "border border-border bg-background text-foreground shadow-lg"
            }`}
          >
            {isPro && (
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
            )}

            <div className="flex flex-1 flex-col p-6 md:p-8">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3
                    className={`flex items-center gap-2 text-2xl font-black uppercase tracking-wide ${
                      isPro ? "text-white" : "text-foreground"
                    }`}
                  >
                    {plan.name}
                    {isPro && (
                      <Crown className="h-5 w-5 fill-amber-400 text-amber-400" />
                    )}
                  </h3>
                  <p
                    className={`mt-2 text-sm ${
                      isPro ? "text-slate-400" : "text-muted-foreground"
                    }`}
                  >
                    {t(planContent.descriptionKey)}
                  </p>
                </div>
              </div>

              {pricing && (
                <div className="mb-8">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black tracking-tight md:text-5xl">
                      ${pricing.monthlyPrice}
                    </span>
                    <div className="mb-1.5 flex flex-col">
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          isPro ? "text-slate-400" : "text-muted-foreground"
                        }`}
                      >
                        {t("admin.subscriptionPage.pricing.usdPerMonth")}
                      </span>
                      <span
                        className={`text-xs ${
                          isPro ? "text-slate-300" : "text-muted-foreground"
                        }`}
                      >
                        {t("admin.subscriptionPage.pricing.perProject")}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`mt-4 rounded-xl p-3 ${
                      isPro ? "bg-slate-800" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-semibold uppercase ${
                        isPro ? "text-slate-400" : "text-muted-foreground"
                      }`}
                    >
                      {t("admin.subscriptionPage.pricing.billedEvery")}{" "}
                      {pricing.durationMonths}{" "}
                      {pricing.durationMonths > 1
                        ? t("admin.subscriptionPage.pricing.monthsShortPlural")
                        : t("admin.subscriptionPage.pricing.monthsShort")}
                    </span>
                    <div
                      className={`text-lg font-semibold ${
                        isPro ? "text-white" : "text-foreground"
                      }`}
                    >
                      ${Math.round(pricing.totalPrice)}
                      {pricing.discountPercentage > 0 && savings > 0 && (
                        <span className="ml-2 text-xs font-medium text-green-500">
                          −{pricing.discountPercentage}% (
                          {t("admin.subscriptionPage.pricing.savings")} $
                          {Math.round(savings)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <ul className="mb-6 flex-1 space-y-3">
                {planContent.featureKeys.map((featureKey) => (
                  <li
                    key={featureKey}
                    className="flex items-start gap-3 text-left text-sm"
                  >
                    <div
                      className={`mt-0.5 shrink-0 rounded-full p-0.5 ${
                        isPro
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <CheckCircle className="h-3 w-3" />
                    </div>
                    <span
                      className={isPro ? "text-slate-100" : "text-foreground"}
                    >
                      {t(featureKey)}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className={`mt-auto w-full ${
                  isPro
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
                onClick={() => {
                  onSelectPlan(plan.id);
                  onOpenCheckout(plan.id);
                }}
              >
                {t("admin.subscriptionPage.pricing.choosePlan", {
                  name: plan.name,
                })}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
