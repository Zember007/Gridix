import { type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button, Card } from "@gridix/ui";
import { ListChecks } from "lucide-react";

const MotionCard = motion(Card);
const MotionButton = motion(Button);

export type OnboardingChecklistFloatingShellProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  allDone: boolean;
  doneCount: number;
  total: number;
  fabLabel: string;
  /** Accessible name when FAB is collapsed (icon-only). Defaults from fabLabel + progress. */
  ariaLabelFab?: string;
  children: ReactNode;
  /** Merged onto the fixed outer wrapper (e.g. project pointer-events pattern). */
  containerClassName?: string;
};

function fabShiftX(): number {
  if (typeof document === "undefined") return 40;
  return document.documentElement.dir === "rtl" ? -40 : 40;
}

export function OnboardingChecklistFloatingShell({
  isOpen,
  onOpenChange,
  allDone,
  doneCount,
  total,
  fabLabel,
  ariaLabelFab,
  children,
  containerClassName,
}: OnboardingChecklistFloatingShellProps) {
  const reduceMotion = useReducedMotion();
  const shiftX = fabShiftX();
  const duration = reduceMotion ? 0.01 : 0.28;
  const cardDuration = reduceMotion ? 0.01 : 0.28;

  const collapsedAriaLabel =
    ariaLabelFab ?? (allDone ? fabLabel : `${fabLabel}, ${doneCount}/${total}`);

  const fabTransition = {
    duration,
    ease: "easeOut" as const,
    scale: { from: reduceMotion ? 1 : 0.8 },
  };

  return (
    <div
      className={
        containerClassName ??
        "fixed bottom-16 right-4 z-[100] flex max-w-sm flex-col items-end gap-2 lg:bottom-20"
      }
    >
      <AnimatePresence initial={false}>
        {isOpen ? (
          <MotionCard
            key="onboarding-checklist-card"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: cardDuration, ease: "easeOut" }}
            className="w-[min(100vw-2rem,22rem)] border shadow-lg"
          >
            {children}
          </MotionCard>
        ) : null}
      </AnimatePresence>

      <MotionButton
        type="button"
        size="lg"
        variant={allDone ? "outline" : "default"}
        aria-expanded={isOpen}
        aria-label={isOpen ? undefined : collapsedAriaLabel}
        onClick={() => onOpenChange(!isOpen)}
        initial={false}
        animate={isOpen ? { x: 0, scale: 1 } : { x: shiftX, scale: 1 }}
        transition={fabTransition}
        className={
          isOpen
            ? "h-12 rounded-full shadow-md"
            : "h-12 w-12 shrink-0 justify-center rounded-full p-0 shadow-md"
        }
      >
        <ListChecks
          className={isOpen ? "mr-2 h-5 w-5" : "h-5 w-5"}
          aria-hidden
        />
        {isOpen ? (
          <>
            {fabLabel}
            {!allDone ? (
              <span className="ml-2 rounded-full bg-background/25 px-2 py-0.5 text-xs font-semibold">
                {doneCount}/{total}
              </span>
            ) : null}
          </>
        ) : null}
      </MotionButton>
    </div>
  );
}
