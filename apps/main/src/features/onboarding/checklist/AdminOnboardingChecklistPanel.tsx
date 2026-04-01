import { useEffect, useMemo, useState } from "react";
import { Button, CardContent, CardHeader, CardTitle } from "@gridix/ui";
import { isOnboardingMilestoneCompleted } from "@gridix/utils/integrations";
import { Check, RotateCcw, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { EffectiveOwnerId } from "./onboardingDerivedQueries";
import { ONBOARDING_MILESTONE } from "./milestoneKeys";
import { OnboardingChecklistFloatingShell } from "./OnboardingChecklistFloatingShell";
import { useAdminOnboardingDerivedProgress } from "./useAdminOnboardingDerivedProgress";
import { useChecklistOpenSignal } from "./useChecklistPanelOpenRequest";
import { useOnboardingMilestoneSync } from "./useOnboardingMilestoneSync";

type AdminOnboardingChecklistPanelProps = {
  effectiveOwnerId: EffectiveOwnerId | null | undefined;
  onNavigateTab: (tab: string) => void;
  onOpenCreateProject: () => void;
  onReplayInteractiveOnboarding?: () => void | Promise<void>;
};

export function AdminOnboardingChecklistPanel({
  effectiveOwnerId,
  onNavigateTab,
  onOpenCreateProject,
  onReplayInteractiveOnboarding,
}: AdminOnboardingChecklistPanelProps) {
  const { t } = useLanguage();
  const openSignal = useChecklistOpenSignal({ scope: "admin" });

  const [isOpen, setIsOpen] = useState(false);
  const [replayBusy, setReplayBusy] = useState(false);

  const { derived, revision } = useAdminOnboardingDerivedProgress({
    effectiveOwnerId,
    panelExpanded: isOpen,
    openSignal,
  });

  const milestoneVersion = useOnboardingMilestoneSync({
    derivedRevision: revision,
  });

  useEffect(() => {
    if (openSignal > 0) setIsOpen(true);
  }, [openSignal]);

  const items = useMemo(
    () => [
      {
        id: "project",
        isDone: () =>
          derived.projectCreated ||
          isOnboardingMilestoneCompleted(ONBOARDING_MILESTONE.projectCreated),
        title: t("onboardingChecklist.admin.createProject.title"),
        description: t("onboardingChecklist.admin.createProject.description"),
        actionLabel: t("onboardingChecklist.go"),
        onGo: () => {
          onOpenCreateProject();
          setIsOpen(false);
        },
      },
      {
        id: "billing",
        isDone: () =>
          derived.billingTouched ||
          (!derived.billingQuerySucceeded &&
            (isOnboardingMilestoneCompleted(
              ONBOARDING_MILESTONE.billingInvoiceRequested,
            ) ||
              isOnboardingMilestoneCompleted(
                ONBOARDING_MILESTONE.billingCheckoutStarted,
              ) ||
              isOnboardingMilestoneCompleted(
                ONBOARDING_MILESTONE.billingPlanChanged,
              ))),
        title: t("onboardingChecklist.admin.billing.title"),
        description: t("onboardingChecklist.admin.billing.description"),
        actionLabel: t("onboardingChecklist.go"),
        onGo: () => {
          onNavigateTab("subscription");
          setIsOpen(false);
        },
      },
      {
        id: "crm",
        isDone: () =>
          derived.crmConnected ||
          (!derived.crmQuerySucceeded &&
            isOnboardingMilestoneCompleted(ONBOARDING_MILESTONE.crmConnected)),
        title: t("onboardingChecklist.admin.crm.title"),
        description: t("onboardingChecklist.admin.crm.description"),
        actionLabel: t("onboardingChecklist.go"),
        onGo: () => {
          onNavigateTab("integrations");
          setIsOpen(false);
        },
      },
    ],
    [derived, onNavigateTab, onOpenCreateProject, t],
  );

  const doneCount = useMemo(() => {
    void milestoneVersion;
    return items.filter((i) => i.isDone()).length;
  }, [items, milestoneVersion]);

  const total = items.length;
  const allDone = doneCount === total;

  const handleReplayInteractiveOnboarding = async () => {
    if (!onReplayInteractiveOnboarding || replayBusy) return;
    setReplayBusy(true);
    try {
      await onReplayInteractiveOnboarding();
    } finally {
      setReplayBusy(false);
    }
  };

  return (
    <OnboardingChecklistFloatingShell
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      allDone={allDone}
      doneCount={doneCount}
      total={total}
      fabLabel={t("onboardingChecklist.fabLabel")}
    >
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
          onClick={() => setIsOpen(false)}
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
                <p className="text-sm font-medium leading-snug">{item.title}</p>
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
        {onReplayInteractiveOnboarding ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-center gap-2 text-muted-foreground"
            onClick={() => void handleReplayInteractiveOnboarding()}
            disabled={replayBusy}
            aria-busy={replayBusy}
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
            {t("onboardingChecklist.replayInteractiveOnboarding")}
          </Button>
        ) : null}
        {allDone ? (
          <p className="text-center text-xs text-muted-foreground">
            {t("onboardingChecklist.allDone")}
          </p>
        ) : null}
      </CardContent>
    </OnboardingChecklistFloatingShell>
  );
}
