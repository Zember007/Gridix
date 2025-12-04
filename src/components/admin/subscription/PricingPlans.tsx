import React from 'react';
import { Crown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubscriptionPlan } from '@/hooks/useSubscription';
import { useLanguage } from '@/contexts/LanguageContext';

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start max-w-5xl mx-auto">
      {plans.map((plan) => {
        const pricing =
          plan.pricing?.find((p) => p.durationMonths === selectedDuration) ||
          plan.pricing?.[0];
        const isPro = plan.slug === 'pro';

        // Calculate savings properly - round to 2 decimal places
        const savings = pricing?.savings 
          ? Math.round(pricing.savings * 100) / 100 
          : 0;

        return (
          <div
            key={plan.id}
            className={`relative rounded-3xl transition-all duration-300 flex flex-col overflow-hidden ${
              isPro
                ? 'bg-slate-900 text-white shadow-2xl ring-1 ring-slate-900'
                : 'bg-background text-foreground border border-border shadow-lg'
            }`}
          >
            {isPro && (
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
            )}

            <div className="p-6 md:p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3
                    className={`text-2xl font-black uppercase tracking-wide flex items-center gap-2 ${
                      isPro ? 'text-white' : 'text-foreground'
                    }`}
                  >
                    {plan.name}
                    {isPro && (
                      <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
                    )}
                  </h3>
                  <p
                    className={`text-sm mt-2 ${
                      isPro ? 'text-slate-400' : 'text-muted-foreground'
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>
              </div>

              {pricing && (
                <div className="mb-8">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl md:text-5xl font-black tracking-tight">
                      ${pricing.monthlyPrice}
                    </span>
                    <div className="flex flex-col mb-1.5">
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          isPro ? 'text-slate-400' : 'text-muted-foreground'
                        }`}
                      >
                        {t('admin.subscriptionPage.pricing.usdPerMonth')}
                      </span>
                      <span
                        className={`text-xs ${
                          isPro ? 'text-slate-300' : 'text-muted-foreground'
                        }`}
                      >
                        {t('admin.subscriptionPage.pricing.perProject')}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`mt-4 p-3 rounded-xl ${
                      isPro ? 'bg-slate-800' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-semibold uppercase ${
                        isPro ? 'text-slate-400' : 'text-muted-foreground'
                      }`}
                    >
                      {t('admin.subscriptionPage.pricing.billedEvery')}{' '}
                      {pricing.durationMonths}{' '}
                      {pricing.durationMonths > 1
                        ? t('admin.subscriptionPage.pricing.monthsShortPlural')
                        : t('admin.subscriptionPage.pricing.monthsShort')}
                    </span>
                    <div
                      className={`text-lg font-semibold ${
                        isPro ? 'text-white' : 'text-foreground'
                      }`}
                    >
                      ${Math.round(pricing.totalPrice)}
                      {pricing.discountPercentage > 0 && savings > 0 && (
                        <span className="ml-2 text-xs text-green-500 font-medium">
                          −{pricing.discountPercentage}% (
                          {t('admin.subscriptionPage.pricing.savings')}{' '}
                          ${Math.round(savings)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-left"
                  >
                    <div
                      className={`mt-0.5 p-0.5 rounded-full shrink-0 ${
                        isPro
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      <CheckCircle className="w-3 h-3" />
                    </div>
                    <span className={isPro ? 'text-slate-100' : 'text-foreground'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full mt-auto ${
                  isPro
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
                onClick={() => {
                  onSelectPlan(plan.id);
                  onOpenCheckout(plan.id);
                }}
              >
                {t('admin.subscriptionPage.pricing.choosePlan', {
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

