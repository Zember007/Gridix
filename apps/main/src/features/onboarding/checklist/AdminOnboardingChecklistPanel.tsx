import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@gridix/ui";
import { isOnboardingMilestoneCompleted } from "@gridix/utils/integrations";
import { Check, ListChecks, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ONBOARDING_MILESTONE } from "./milestoneKeys";
import { useChecklistOpenSignal } from "./useChecklistPanelOpenRequest";
import { useOnboardingMilestoneSync } from "./useOnboardingMilestoneSync";

type AdminOnboardingChecklistPanelProps = {
  onNavigateTab: (tab: string) => void;
  onOpenCreateProject: () => void;
};

export function AdminOnboardingChecklistPanel({
  onNavigateTab,
  onOpenCreateProject,
}: AdminOnboardingChecklistPanelProps) {
  const { t } = useLanguage();
  const milestoneVersion = useOnboardingMilestoneSync();
  const openSignal = useChecklistOpenSignal({ scope: "admin" });

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (openSignal > 0) setExpanded(true);
  }, [openSignal]);

  const items = useMemo(
    () => [
      {
        id: "project",
        isDone: () =>
          isOnboardingMilestoneCompleted(ONBOARDING_MILESTONE.projectCreated),
        title: t("onboardingChecklist.admin.createProject.title"),
        description: t("onboardingChecklist.admin.createProject.description"),
        actionLabel: t("onboardingChecklist.go"),
        onGo: () => {
          onOpenCreateProject();
          setExpanded(false);
        },
      },
      {
        id: "billing",
        isDone: () =>
          isOnboardingMilestoneCompleted(
            ONBOARDING_MILESTONE.billingInvoiceRequested,
          ) ||
          isOnboardingMilestoneCompleted(
            ONBOARDING_MILESTONE.billingCheckoutStarted,
          ) ||
          isOnboardingMilestoneCompleted(
            ONBOARDING_MILESTONE.billingPlanChanged,
          ),
        title: t("onboardingChecklist.admin.billing.title"),
        description: t("onboardingChecklist.admin.billing.description"),
        actionLabel: t("onboardingChecklist.go"),
        onGo: () => {
          onNavigateTab("subscription");
          setExpanded(false);
        },
      },
      {
        id: "crm",
        isDone: () =>
          isOnboardingMilestoneCompleted(ONBOARDING_MILESTONE.crmConnected),
        title: t("onboardingChecklist.admin.crm.title"),
        description: t("onboardingChecklist.admin.crm.description"),
        actionLabel: t("onboardingChecklist.go"),
        onGo: () => {
          onNavigateTab("integrations");
          setExpanded(false);
        },
      },
    ],
    [onNavigateTab, onOpenCreateProject, t],
  );

  const doneCount = useMemo(() => {
    void milestoneVersion;
    return items.filter((i) => i.isDone()).length;
  }, [items, milestoneVersion]);

  const total = items.length;
  const allDone = doneCount === total;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col items-end gap-2">
      {expanded && (
        <Card className="w-[min(100vw-2rem,22rem)] border shadow-lg">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">
                {t("onboardingChecklist.admin.title")}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("onboardingChecklist.progress", {
                  done: doneCount,
                  total,
                })}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setExpanded(false)}
              aria-label={t("onboardingChecklist.close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {items.map((item) => {
              const done = item.isDone();
              return (
                <div
                  key={item.id}
                  className="flex gap-2 rounded-md border border-border/60 bg-muted/30 p-3"
                >
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30 bg-background"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {item.description}
                    </p>
                    {!done ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-2 h-8"
                        onClick={item.onGo}
                      >
                        {item.actionLabel}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {allDone ? (
              <p className="text-center text-xs text-muted-foreground">
                {t("onboardingChecklist.allDone")}
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Button
        type="button"
        size="lg"
        variant={allDone ? "outline" : "default"}
        className="h-12 rounded-full shadow-md"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <ListChecks className="mr-2 h-5 w-5" />
        {t("onboardingChecklist.fabLabel")}
        {!allDone ? (
          <span className="ml-2 rounded-full bg-background/25 px-2 py-0.5 text-xs font-semibold">
            {doneCount}/{total}
          </span>
        ) : null}
      </Button>
    </div>
  );
}
