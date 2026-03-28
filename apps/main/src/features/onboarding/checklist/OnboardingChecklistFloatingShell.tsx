import { type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button, Card } from "@gridix/ui";
import { ADMIN_THEME } from "@gridix/utils/lib";
import { ListChecks } from "lucide-react";

const MotionCard = motion(Card);

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
  const cardDuration = reduceMotion ? 0.01 : 0.22;

  const collapsedAriaLabel =
    ariaLabelFab ?? (allDone ? fabLabel : `${fabLabel}, ${doneCount}/${total}`);

  const fabBaseStyle: CSSProperties =
    isOpen && allDone
      ? {
          backgroundColor: ADMIN_THEME.background,
          color: ADMIN_THEME.textPrimary,
          borderColor: ADMIN_THEME.border,
        }
      : {
          backgroundColor: ADMIN_THEME.primary,
          color: ADMIN_THEME.textOnPrimary,
          borderColor: ADMIN_THEME.primary,
        };

  const fabHoverStyle: CSSProperties =
    isOpen && allDone
      ? {
          backgroundColor: ADMIN_THEME.backgroundHover,
          color: ADMIN_THEME.textPrimary,
          borderColor: ADMIN_THEME.border,
        }
      : {
          backgroundColor: ADMIN_THEME.primaryHover,
          color: ADMIN_THEME.textOnPrimary,
          borderColor: ADMIN_THEME.primaryHover,
        };

  const applyFabPointerStyle = (
    el: HTMLButtonElement,
    mode: "base" | "hover",
  ) => {
    const s = mode === "hover" ? fabHoverStyle : fabBaseStyle;
    el.style.backgroundColor = String(s.backgroundColor ?? "");
    el.style.color = String(s.color ?? "");
    el.style.borderColor = String(s.borderColor ?? "");
    el.style.transform =
      mode === "hover" && !reduceMotion ? "scale(1.05)" : "scale(1)";
  };

  return (
    <div
      className={
        containerClassName ??
        "fixed bottom-16 right-2 z-[100] flex max-w-sm flex-col items-end gap-2 lg:bottom-20 lg:right-6"
      }
    >
      <AnimatePresence initial={false}>
        {isOpen ? (
          <MotionCard
            key="onboarding-checklist-card"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: cardDuration, ease: "easeOut" }}
            className="w-[min(100vw-2rem,22rem)] border shadow-lg"
          >
            {children}
          </MotionCard>
        ) : null}
      </AnimatePresence>

      <Button
        type="button"
        size={isOpen ? "default" : "icon"}
        variant={isOpen && allDone ? "outline" : "default"}
        aria-expanded={isOpen}
        aria-label={isOpen ? undefined : collapsedAriaLabel}
        onClick={() => onOpenChange(!isOpen)}
        onMouseEnter={(e) => applyFabPointerStyle(e.currentTarget, "hover")}
        onMouseLeave={(e) => applyFabPointerStyle(e.currentTarget, "base")}
        className={
          isOpen
            ? "h-12 rounded-full px-4 shadow-lg transition-all duration-200 hover:shadow-xl"
            : "h-12 w-12 shrink-0 justify-center rounded-full p-0 shadow-lg transition-all duration-200 hover:shadow-xl"
        }
        style={fabBaseStyle}
      >
        <ListChecks
          className={isOpen ? "mr-2 h-5 w-5 shrink-0" : "h-5 w-5 shrink-0"}
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
      </Button>
    </div>
  );
}
