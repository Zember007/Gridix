import React from "react";
import { Button } from "@gridix/ui";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  CreditCard,
  XCircle,
  RotateCcw,
  PauseCircle,
} from "lucide-react";
import { ProjectSubscription } from "@/entities/subscription/queries/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProjectSubscriptionsListProps {
  projects: ProjectSubscription[];
  onOpenInvoice: (projectId: string, currentPlanId?: string | null) => void;
  onCancelProject?: (projectId: string) => void;
  onResumeProject?: (projectId: string) => void;
}

interface PlanGroup {
  planName: string;
  planSlug: string | null;
  projects: ProjectSubscription[];
}

function pickPrimarySubscription(project: ProjectSubscription) {
  const subscriptions = project.user_subscriptions ?? [];
  if (subscriptions.length === 0) return undefined;

  const now = Date.now();
  const statusRank: Record<string, number> = {
    active: 4,
    trialing: 3,
    pending_payment: 2,
    pending: 2,
    expired: 1,
    cancelled: 0,
  };

  return [...subscriptions].sort((a, b) => {
    const aActiveByDate = a.current_period_end
      ? new Date(a.current_period_end).getTime() > now
      : false;
    const bActiveByDate = b.current_period_end
      ? new Date(b.current_period_end).getTime() > now
      : false;
    if (aActiveByDate !== bActiveByDate) return aActiveByDate ? -1 : 1;

    const aStatus = statusRank[a.status] ?? 0;
    const bStatus = statusRank[b.status] ?? 0;
    if (aStatus !== bStatus) return bStatus - aStatus;

    const aPeriodEnd = a.current_period_end
      ? new Date(a.current_period_end).getTime()
      : 0;
    const bPeriodEnd = b.current_period_end
      ? new Date(b.current_period_end).getTime()
      : 0;
    if (aPeriodEnd !== bPeriodEnd) return bPeriodEnd - aPeriodEnd;

    const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bCreated - aCreated;
  })[0];
}

function groupByPlan(
  projects: ProjectSubscription[],
  noActivePlanLabel: string,
): PlanGroup[] {
  const map = new Map<string, PlanGroup>();

  for (const p of projects) {
    const planName =
      p.user_subscriptions?.[0]?.subscription_plans?.name ?? null;
    const planSlug =
      p.user_subscriptions?.[0]?.subscription_plans?.slug ?? null;
    const key = planName ?? "__no_plan__";
    const displayName = planName ?? noActivePlanLabel;

    if (!map.has(key)) {
      map.set(key, { planName: displayName, planSlug, projects: [] });
    }
    map.get(key)!.projects.push(p);
  }

  return [...map.values()].sort((a, b) => {
    if (a.planSlug === null) return 1;
    if (b.planSlug === null) return -1;
    return 0;
  });
}

export const ProjectSubscriptionsList: React.FC<
  ProjectSubscriptionsListProps
> = ({ projects, onOpenInvoice, onCancelProject, onResumeProject }) => {
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

  const noActivePlanLabel =
    t("admin.subscriptionPage.projects.noPlan") || "No active plan";
  const planGroups = groupByPlan(projects, noActivePlanLabel);

  return (
    <div className="flex flex-col gap-6">
      {planGroups.map((group) => (
        <div
          key={group.planSlug ?? "__no_plan__"}
          className="flex flex-col gap-3"
        >
          {/* Plan group header */}
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              {group.planName}
            </h4>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {group.projects.length}
            </span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Project cards in group */}
          <div className="flex flex-col gap-3">
            {group.projects.map((project) => {
              const sub = pickPrimarySubscription(project);
              const hasPaidAccess = sub?.current_period_end
                ? new Date(sub.current_period_end) > new Date()
                : sub?.status === "active";
              const isCancelledAtPeriodEnd =
                Boolean(sub?.cancel_at_period_end) && hasPaidAccess;
              const isActive =
                Boolean(sub) &&
                (sub?.status === "active" ||
                  sub?.status === "trialing" ||
                  isCancelledAtPeriodEnd);
              const isExpired =
                sub?.status === "expired" ||
                Boolean(
                  sub?.current_period_end &&
                  new Date(sub.current_period_end) <= new Date(),
                );
              const isCardPayment = sub?.payment_method === "card";
              const paymentMethod = sub?.payment_method ?? "invoice";
              const expiresAt = (() => {
                if (sub?.current_period_end) return sub.current_period_end;
                if (project.subscription_expires_at)
                  return project.subscription_expires_at;
                if (sub?.current_period_start && sub?.duration_months) {
                  const start = new Date(sub.current_period_start);
                  start.setMonth(start.getMonth() + sub.duration_months);
                  return start.toISOString();
                }
                return null;
              })();
              const isEnded = expiresAt
                ? new Date(expiresAt) <= new Date()
                : isExpired;
              const canExtendInvoice = paymentMethod === "invoice" && isEnded;

              const daysLeft =
                isActive && expiresAt
                  ? Math.ceil(
                      (new Date(expiresAt).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : 0;
              const isUrgent = daysLeft > 0 && daysLeft <= 5;

              // Determine expiration date label
              const dateLabel = (() => {
                if (!expiresAt)
                  return (
                    t("admin.subscriptionPage.projects.expiresAt") || "Expires"
                  );
                if (isCancelledAtPeriodEnd) {
                  return (
                    t("admin.subscriptionPage.projects.accessUntilLabel") ||
                    "Access until:"
                  );
                }
                if (isActive && !isExpired) {
                  return (
                    t("admin.subscriptionPage.projects.accessUntilLabel") ||
                    "Access until:"
                  );
                }
                return (
                  t("admin.subscriptionPage.projects.expiresLabel") ||
                  "Expired:"
                );
              })();

              return (
                <div
                  key={project.id}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col gap-5 p-4 md:flex-row md:items-center md:p-5">
                    <div className="flex min-w-[250px] items-center gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold uppercase ${
                          isActive
                            ? "bg-primary text-primary-foreground"
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
                      {/* Date */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {dateLabel}
                        </span>
                        {expiresAt ? (
                          <div className="mt-0.5">
                            <div
                              className={`text-sm font-medium ${
                                isUrgent && isActive
                                  ? "text-red-600"
                                  : isCancelledAtPeriodEnd
                                    ? "text-orange-600"
                                    : !isCardPayment && isActive
                                      ? "text-blue-700"
                                      : "text-slate-700"
                              }`}
                            >
                              {new Date(expiresAt).toLocaleDateString("ru-RU")}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-0.5 text-sm text-slate-300">—</div>
                        )}
                      </div>

                      {/* Status badges */}
                      <div className="flex flex-col items-start gap-1 sm:justify-start">
                        {isCancelledAtPeriodEnd ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700">
                            <PauseCircle size={14} />{" "}
                            {t(
                              "admin.subscriptionPage.projects.status.cancelAtPeriodEnd",
                            ) || "Auto-renewal disabled"}
                          </span>
                        ) : isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                            <CheckCircle2 size={14} />{" "}
                            {t("admin.subscriptionPage.projects.status.active")}
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                            <AlertTriangle size={14} />{" "}
                            {t(
                              "admin.subscriptionPage.projects.status.expired",
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                            {t(
                              "admin.subscriptionPage.projects.status.inactive",
                            )}
                          </span>
                        )}
                        {isActive &&
                          isCardPayment &&
                          !isCancelledAtPeriodEnd && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                              <CreditCard size={10} /> Stripe
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 md:justify-end md:pt-0">
                      {/* Cancel button: only for active (non-cancelled) card subscriptions */}
                      {isActive &&
                        isCardPayment &&
                        !isCancelledAtPeriodEnd &&
                        onCancelProject && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2.5 text-xs font-bold text-red-500 transition-all hover:border-red-400 hover:text-red-700"
                            onClick={() => {
                              if (
                                window.confirm(
                                  t(
                                    "admin.subscriptionPage.projects.confirmCancel",
                                  ) ||
                                    "Cancel subscription for this project? Access continues until end of paid period.",
                                )
                              ) {
                                onCancelProject(project.id);
                              }
                            }}
                          >
                            <XCircle size={14} />
                            {t(
                              "admin.subscriptionPage.projects.buttons.cancel",
                            ) || "Cancel"}
                          </Button>
                        )}

                      {/* Resume button: for cancelled-at-period-end subscriptions */}
                      {isCancelledAtPeriodEnd &&
                        isCardPayment &&
                        onResumeProject && (
                          <Button
                            type="button"
                            size="sm"
                            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-green-700"
                            onClick={() => onResumeProject(project.id)}
                          >
                            <RotateCcw size={14} />
                            {t(
                              "admin.subscriptionPage.projects.buttons.resume",
                            ) || "Resume"}
                          </Button>
                        )}

                      {/* Change plan button: active non-cancelled card */}
                      {isActive && isCardPayment && !isCancelledAtPeriodEnd && (
                        <Button
                          type="button"
                          size="sm"
                          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-700"
                          onClick={() =>
                            onOpenInvoice(project.id, sub?.plan_id)
                          }
                        >
                          <ArrowRight size={14} />
                          {t(
                            "admin.subscriptionPage.projects.buttons.changePlan",
                          )}
                        </Button>
                      )}

                      {canExtendInvoice ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-blue-300 hover:bg-slate-50 hover:text-blue-600 md:w-auto"
                          onClick={() =>
                            onOpenInvoice(project.id, sub?.plan_id)
                          }
                        >
                          {t("admin.subscriptionPage.projects.buttons.extend")}{" "}
                          <ArrowRight size={16} className="opacity-50" />
                        </Button>
                      ) : !isActive ? (
                        <Button
                          type="button"
                          size="sm"
                          className="flex transform items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg md:w-auto"
                          onClick={() =>
                            onOpenInvoice(project.id, sub?.plan_id)
                          }
                        >
                          <Plus size={18} />{" "}
                          {t(
                            "admin.subscriptionPage.projects.buttons.activate",
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {isActive && daysLeft > 0 && daysLeft < 30 && (
                    <div className="h-1 w-full bg-slate-100">
                      <div
                        className={`h-full ${isUrgent ? "bg-red-500" : isCancelledAtPeriodEnd ? "bg-orange-400" : "bg-green-500"}`}
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
        </div>
      ))}
    </div>
  );
};
