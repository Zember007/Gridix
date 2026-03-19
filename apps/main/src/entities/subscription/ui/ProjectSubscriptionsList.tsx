import React from "react";
import { Button } from "@gridix/ui";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Settings,
  CreditCard,
} from "lucide-react";
import { ProjectSubscription } from "@/entities/subscription/queries/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProjectSubscriptionsListProps {
  projects: ProjectSubscription[];
  onOpenInvoice: (projectId: string, currentPlanId?: string | null) => void;
  onManageSubscription?: () => void;
}

export const ProjectSubscriptionsList: React.FC<
  ProjectSubscriptionsListProps
> = ({ projects, onOpenInvoice, onManageSubscription }) => {
  const { t } = useLanguage();

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Building2 size={24} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-700">
          {t("admin.subscriptionPage.projects.emptyTitle")}
        </h3>
        <p className="mx-auto mb-4 mt-1 max-w-md text-sm text-slate-500">
          {t("admin.subscriptionPage.projects.emptyDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {projects.map((project) => {
        const sub = project.user_subscriptions?.[0];
        const isActive = sub?.status === "active";
        const isExpired = sub?.status === "expired";
        const isCardPayment = sub?.payment_method === "card";
        const paymentMethod = sub?.payment_method ?? "invoice";
        const expiresAt =
          sub?.current_period_end ?? project.subscription_expires_at;
        const isEnded = expiresAt
          ? new Date(expiresAt) <= new Date()
          : isExpired;
        const canExtendInvoice = paymentMethod === "invoice" && isEnded;

        const daysLeft = isActive
          ? Math.ceil(
              (new Date(sub.current_period_end || "").getTime() -
                new Date().getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;
        const isUrgent = daysLeft > 0 && daysLeft <= 5;

        return (
          <div
            key={project.id}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center">
              <div className="flex min-w-[250px] items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold uppercase ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {project.name.substring(0, 2)}
                </div>
                <div>
                  <h3 className="max-w-[200px] truncate font-bold text-slate-900">
                    {project.name}
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <Building2 size={10} />{" "}
                    {project.user_profiles?.company_name ||
                      project.user_profiles?.full_name ||
                      project.user_profiles?.email ||
                      project.user_id.substring(0, 8)}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 gap-4 border-t border-slate-100 pt-4 max-lg:flex-col max-lg:gap-1 max-md:flex-row max-md:gap-4 md:border-l md:border-t-0 md:pl-6 md:pt-0 lg:gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t("admin.subscriptionPage.projects.tariff")}
                  </span>
                  {sub?.subscription_plans ? (
                    <div className="mt-0.5 font-bold text-slate-800">
                      {sub.subscription_plans.name}
                    </div>
                  ) : (
                    <div className="mt-0.5 text-sm italic text-slate-400">
                      {t("admin.subscriptionPage.projects.notSelected")}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t("admin.subscriptionPage.projects.expiresAt")}
                  </span>
                  {sub?.current_period_end ? (
                    <div className="mt-0.5">
                      <div
                        className={`text-sm font-medium ${
                          isUrgent && isActive
                            ? "text-red-600"
                            : "text-slate-700"
                        }`}
                      >
                        {new Date(sub.current_period_end).toLocaleDateString(
                          "ru-RU",
                        )}
                      </div>
                    </div>
                  ) : project.subscription_expires_at ? (
                    <div className="mt-0.5 text-sm text-slate-700">
                      {new Date(
                        project.subscription_expires_at,
                      ).toLocaleDateString("ru-RU")}
                    </div>
                  ) : (
                    <div className="mt-0.5 text-sm text-slate-300">—</div>
                  )}
                </div>

                <div className="flex flex-col items-start gap-1 sm:justify-start">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                      <CheckCircle2 size={14} />{" "}
                      {t("admin.subscriptionPage.projects.status.active")}
                    </span>
                  ) : isExpired ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                      <AlertTriangle size={14} />{" "}
                      {t("admin.subscriptionPage.projects.status.expired")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                      {t("admin.subscriptionPage.projects.status.inactive")}
                    </span>
                  )}
                  {isActive && isCardPayment && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                      <CreditCard size={10} /> Stripe
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2 md:justify-end md:pt-0">
                {isActive && isCardPayment && onManageSubscription && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-500 transition-all hover:border-blue-300 hover:text-blue-600"
                    onClick={onManageSubscription}
                  >
                    <Settings size={14} />
                    {t("admin.subscriptionPage.projects.buttons.manage")}
                  </Button>
                )}

                {canExtendInvoice ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:bg-slate-50 hover:text-blue-600 md:w-auto"
                    onClick={() => onOpenInvoice(project.id, sub?.plan_id)}
                  >
                    {t("admin.subscriptionPage.projects.buttons.extend")}{" "}
                    <ArrowRight size={16} className="opacity-50" />
                  </Button>
                ) : !isActive ? (
                  <Button
                    type="button"
                    size="sm"
                    className="flex transform items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg md:w-auto"
                    onClick={() => onOpenInvoice(project.id, sub?.plan_id)}
                  >
                    <Plus size={18} />{" "}
                    {t("admin.subscriptionPage.projects.buttons.activate")}
                  </Button>
                ) : null}
              </div>
            </div>

            {isActive && daysLeft > 0 && daysLeft < 30 && (
              <div className="h-1 w-full bg-slate-100">
                <div
                  className={`h-full ${isUrgent ? "bg-red-500" : "bg-green-500"}`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (daysLeft / 30) * 100))}%`,
                  }}
                ></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
