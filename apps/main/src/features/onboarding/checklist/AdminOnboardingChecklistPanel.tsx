import { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  Button,
  CardContent,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { RotateCcw, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { EffectiveOwnerId } from "./onboardingDerivedQueries";
import { OnboardingChecklistFloatingShell } from "./OnboardingChecklistFloatingShell";
import { useAdminOnboardingDerivedProgress } from "./useAdminOnboardingDerivedProgress";
import { OnboardingChecklistStepAccordionItem } from "./OnboardingChecklistStepAccordionItem";
import { useChecklistOpenSignal } from "./useChecklistPanelOpenRequest";

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
  const [accordionValue, setAccordionValue] = useState<string[]>([]);
  const prevIsOpenRef = useRef(isOpen);

  const { derived } = useAdminOnboardingDerivedProgress({
    effectiveOwnerId,
    panelExpanded: isOpen,
    openSignal,
  });

  useEffect(() => {
    if (openSignal > 0) setIsOpen(true);
  }, [openSignal]);

  const items = useMemo(
    () => [
      {
        id: "project",
        isDone: () => derived.projectCreated,
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
        isDone: () => derived.billingTouched,
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
        isDone: () => derived.crmConnected,
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

  useEffect(() => {
    const wasOpen = prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;
    if (!isOpen || wasOpen) return;
    const firstPending = items.find((item) => !item.isDone())?.id;
    setAccordionValue(firstPending ? [firstPending] : []);
  }, [isOpen, items]);

  const doneCount = useMemo(
    () => items.filter((i) => i.isDone()).length,
    [items],
  );

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
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-3 pb-2 pt-3">
        <div>
          <CardTitle className="mb-0 text-sm font-semibold leading-tight">
            {t("onboardingChecklist.admin.title")}
          </CardTitle>
          <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
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
          className="h-7 w-7 shrink-0"
          onClick={() => setIsOpen(false)}
          aria-label={t("onboardingChecklist.close")}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3 pt-0">
        <Accordion
          type="multiple"
          className="space-y-2"
          value={accordionValue}
          onValueChange={setAccordionValue}
        >
          {items.map((item) => {
            const done = item.isDone();
            return (
              <OnboardingChecklistStepAccordionItem
                key={item.id}
                value={item.id}
                done={done}
                title={item.title}
                description={item.description}
                actionLabel={item.actionLabel}
                onAction={done ? undefined : item.onGo}
              />
            );
          })}
        </Accordion>
        {onReplayInteractiveOnboarding ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-full justify-center gap-1.5 text-xs text-muted-foreground"
            onClick={() => void handleReplayInteractiveOnboarding()}
            disabled={replayBusy}
            aria-busy={replayBusy}
          >
            <RotateCcw className="h-3 w-3 shrink-0" />
            {t("onboardingChecklist.retakeTraining")}
          </Button>
        ) : null}
        {allDone ? (
          <p className="text-center text-[11px] leading-tight text-muted-foreground">
            {t("onboardingChecklist.allDone")}
          </p>
        ) : null}
      </CardContent>
    </OnboardingChecklistFloatingShell>
  );
}
