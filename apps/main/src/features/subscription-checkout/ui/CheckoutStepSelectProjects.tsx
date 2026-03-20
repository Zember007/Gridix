import React from "react";
import { Crown, CheckCircle2, Briefcase } from "lucide-react";
import {
  ProjectSubscription,
  SubscriptionPlan,
} from "@/entities/subscription/queries/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  plans: SubscriptionPlan[];
  selectedPlanId: string;
  selectedDuration: number;
  planChangeProjectId?: string | null;
  onPlanChange: (planId: string) => void;
  projects: ProjectSubscription[];
  selectedProjectIds: string[];
  currentPricing?: SubscriptionPlan["pricing"][number];
  onToggleProject: (projectId: string) => void;
};

export const CheckoutStepSelectProjects: React.FC<Props> = ({
  plans,
  selectedPlanId,
  selectedDuration,
  planChangeProjectId,
  onPlanChange,
  projects,
  selectedProjectIds,
  currentPricing,
  onToggleProject,
}) => {
  const { t } = useLanguage();
  const now = Date.now();

  const isProjectSelectable = (project: ProjectSubscription): boolean => {
    if (planChangeProjectId) {
      return project.id === planChangeProjectId;
    }
    const sub = project.user_subscriptions?.[0];
    if (!sub) return true;

    const periodEnd = sub.current_period_end
      ? new Date(sub.current_period_end).getTime()
      : null;
    const hasActivePaidPeriod = periodEnd !== null && periodEnd > now;

    if (sub.status === "pending_payment") {
      return false;
    }

    if (
      ["active", "trialing"].includes(sub.status) &&
      (periodEnd === null || hasActivePaidPeriod)
    ) {
      return false;
    }

    return true;
  };

  return (
    <div className="space-y-8 duration-300 animate-in slide-in-from-right-4">
      <div>
        <h4 className="mb-3 text-sm font-bold text-slate-900">
          {t("admin.subscriptionPage.checkout.selectPlan")}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {plans.map((p) => {
            const isSelected = p.id === selectedPlanId;
            const planPricing =
              p.pricing?.find((pr) => pr.durationMonths === selectedDuration) ||
              p.pricing?.[0];
            return (
              <button
                key={p.id}
                onClick={() => onPlanChange(p.id)}
                className={`group relative rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div
                    className={`text-sm font-bold uppercase ${
                      isSelected ? "text-blue-700" : "text-slate-800"
                    }`}
                  >
                    {p.name}
                  </div>
                  {p.slug === "pro" && (
                    <Crown
                      size={16}
                      className="fill-amber-400 text-amber-400"
                    />
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  <span className="text-base font-bold text-slate-900">
                    ${planPricing?.monthlyPrice || p.base_price}
                  </span>{" "}
                  / мес
                </div>
                {isSelected && (
                  <div className="absolute -right-2 -top-2 rounded-full bg-blue-500 p-1 text-white">
                    <CheckCircle2 size={12} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">
            {t("admin.subscriptionPage.checkout.selectProjects")}
          </h4>
          <span className="text-xs text-slate-500">
            {t("admin.subscriptionPage.checkout.projectsSelected", {
              count: selectedProjectIds.length,
            })}
          </span>
        </div>

        <div className="mb-3 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
          <Briefcase size={18} className="mt-0.5 text-blue-600" />
          <p className="text-xs leading-relaxed text-blue-700">
            {t("admin.subscriptionPage.checkout.projectsHint")}
          </p>
        </div>
        {planChangeProjectId && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            {t("admin.subscriptionPage.checkout.planChangeSingleProject")}
          </div>
        )}

        <div className="custom-scrollbar max-h-60 space-y-2 overflow-y-auto pr-2">
          {projects.map((project) =>
            (() => {
              const selectable = isProjectSelectable(project);
              const selectedPlan =
                plans.find((plan) => plan.id === selectedPlanId) || plans[0];
              const fallbackMonthlyPrice = selectedPlan
                ? Number.parseFloat(String(selectedPlan.base_price))
                : 0;
              const fallbackTotal = Number.isFinite(fallbackMonthlyPrice)
                ? fallbackMonthlyPrice * selectedDuration
                : 0;
              const projectPrice =
                currentPricing?.totalPrice !== undefined
                  ? currentPricing.totalPrice
                  : fallbackTotal;

              return (
                <div
                  key={project.id}
                  onClick={() => {
                    if (!selectable) return;
                    onToggleProject(project.id);
                  }}
                  className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                    selectable
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-60"
                  } ${
                    selectedProjectIds.includes(project.id)
                      ? "border-blue-500 bg-blue-50/30"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                        selectedProjectIds.includes(project.id)
                          ? "border-blue-600 bg-blue-600"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {selectedProjectIds.includes(project.id) && (
                        <CheckCircle2 size={14} className="text-white" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">
                        {project.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {project.user_profiles?.company_name ||
                          project.user_profiles?.full_name ||
                          project.user_profiles?.email ||
                          project.user_id.substring(0, 8)}
                      </div>
                      {!selectable && (
                        <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          {t("admin.subscriptionPage.projects.status.active")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {projectPrice > 0 ? `$${projectPrice}` : "—"}
                  </div>
                </div>
              );
            })(),
          )}
          {projects.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              {t("admin.subscriptionPage.checkout.noProjects")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
