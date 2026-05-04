import React, { useState } from "react";
import { Crown, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@gridix/ui";
import { cn } from "@gridix/utils/lib";
import { SubscriptionPlan } from "@/entities/subscription/queries/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAdminPricingContentBySlug } from "@/entities/subscription/model/adminPricingContent";

const VISIBLE_FEATURE_ROWS = 4;

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
  const [expandedPlanIds, setExpandedPlanIds] = useState<
    Record<string, boolean>
  >({});

  return (
    <div className="grid w-full grid-cols-1 items-start gap-8 py-2 lg:grid-cols-2 lg:gap-10">
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

        const featureKeys = planContent.featureKeys;
        const isExpanded = Boolean(expandedPlanIds[plan.id]);
        const hasExpandToggle = featureKeys.length > VISIBLE_FEATURE_ROWS;
        const headFeatureKeys = featureKeys.slice(0, VISIBLE_FEATURE_ROWS);
        const extraFeatureKeys = hasExpandToggle
          ? featureKeys.slice(VISIBLE_FEATURE_ROWS)
          : [];
        const extraRegionId = `pricing-plan-features-extra-${plan.id}`;

        return (
          <div
            key={plan.id}
            className={`relative flex -translate-y-1 flex-col overflow-hidden rounded-3xl transition-transform duration-300 ease-out motion-reduce:transition-none [&:has([data-pricing-cta]:hover)]:scale-[1.025] motion-reduce:[&:has([data-pricing-cta]:hover)]:scale-100 ${
              isPro
                ? "bg-slate-900 text-white shadow-[0_28px_55px_-12px_rgba(0,0,0,0.55),0_14px_28px_-12px_rgba(0,0,0,0.35)] ring-1 ring-white/10"
                : "border border-border/70 bg-background text-foreground shadow-[0_28px_55px_-12px_rgba(15,23,42,0.16),0_14px_28px_-12px_rgba(15,23,42,0.1)]"
            }`}
          >
            <div className="flex flex-col p-6 md:p-8">
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
                    className={`mt-2 line-clamp-2 min-h-10 text-sm leading-5 ${
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

              <div className="mb-6 flex flex-col">
                <ul className="space-y-3">
                  {headFeatureKeys.map((featureKey) => (
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

                {extraFeatureKeys.length > 0 ? (
                  <div
                    id={extraRegionId}
                    className={cn(
                      "ease-[cubic-bezier(0.23,1,0.32,1)] grid overflow-hidden transition-[grid-template-rows] duration-200 motion-reduce:transition-none",
                      isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <ul className="space-y-3 pt-3">
                        {extraFeatureKeys.map((featureKey) => (
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
                              className={
                                isPro ? "text-slate-100" : "text-foreground"
                              }
                            >
                              {t(featureKey)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}

                {hasExpandToggle ? (
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={extraRegionId}
                    className={cn(
                      "mt-3 inline-flex items-center gap-1 self-start rounded-md text-sm font-medium outline-none ring-offset-background",
                      "transition-[transform,color,background-color] duration-150 ease-out motion-reduce:transition-none",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "active:scale-[0.97] motion-reduce:active:scale-100",
                      isPro
                        ? "text-slate-400 hover:text-white"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() =>
                      setExpandedPlanIds((prev) => ({
                        ...prev,
                        [plan.id]: !prev[plan.id],
                      }))
                    }
                  >
                    {isExpanded
                      ? t("admin.subscriptionPage.pricing.showLessFeatures")
                      : t("admin.subscriptionPage.pricing.showMoreFeatures")}
                    {isExpanded ? (
                      <ChevronUp
                        className="ease-[cubic-bezier(0.23,1,0.32,1)] h-4 w-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none"
                        aria-hidden
                      />
                    ) : (
                      <ChevronDown
                        className="ease-[cubic-bezier(0.23,1,0.32,1)] h-4 w-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none"
                        aria-hidden
                      />
                    )}
                  </button>
                ) : null}
              </div>

              <Button
                data-pricing-cta
                className={`w-full ${
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
