import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button, Card } from "@gridix/ui";
import { ADMIN_THEME, cn } from "@gridix/utils/lib";
import { ListChecks } from "lucide-react";

const MotionCard = motion(Card);

/** Портал на body: иначе `fixed` цепляется к колонке с max-width / transform и «половина» FAB упирается в контейнер, а не в край экрана. */
const CHECKLIST_SHELL_PORTAL_ID = "gridix-onboarding-checklist-shell-root";

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
  const shellRef = useRef<HTMLDivElement>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const existing = document.getElementById(
      CHECKLIST_SHELL_PORTAL_ID,
    ) as HTMLElement | null;
    if (existing) {
      setPortalRoot(existing);
      return;
    }

    const el = document.createElement("div");
    el.id = CHECKLIST_SHELL_PORTAL_ID;
    document.body.appendChild(el);
    setPortalRoot(el);
  }, []);

  const listDelayAfterFabMs = reduceMotion ? 0 : 240;
  const cardDuration = reduceMotion ? 0.01 : 0.36;
  const cardEase = [0.4, 0, 0.2, 1] as const;
  const fabMorphMs = reduceMotion ? 0 : 400;

  /** Панель в DOM (в т.ч. на время exit). */
  const [listMounted, setListMounted] = useState(false);
  /** Раскрытая «пилюля»: при закрытии остаётся true, пока идёт exit карточки. */
  const [fabExpanded, setFabExpanded] = useState(isOpen);

  useEffect(() => {
    if (!isOpen) {
      setListMounted((mounted) => {
        if (!mounted) {
          queueMicrotask(() => setFabExpanded(false));
        }
        return false;
      });
      return;
    }
    setFabExpanded(true);
    const id = window.setTimeout(
      () => setListMounted(true),
      listDelayAfterFabMs,
    );
    return () => clearTimeout(id);
  }, [isOpen, listDelayAfterFabMs]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = shellRef.current;
      if (!root) return;
      const target = event.target;
      if (target instanceof Node && !root.contains(target)) {
        onOpenChange(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [isOpen, onOpenChange]);

  const collapsedAriaLabel =
    ariaLabelFab ?? (allDone ? fabLabel : `${fabLabel}, ${doneCount}/${total}`);

  const fabBaseStyle: CSSProperties =
    fabExpanded && allDone
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
    fabExpanded && allDone
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

  const shell = (
    <div
      ref={shellRef}
      className={
        containerClassName ??
        "fixed bottom-16 right-2 z-[100] flex max-w-sm flex-col items-end gap-2 lg:bottom-20 lg:right-6"
      }
    >
      <AnimatePresence
        initial={false}
        onExitComplete={() => {
          if (!isOpen) setFabExpanded(false);
        }}
      >
        {listMounted ? (
          <MotionCard
            key="onboarding-checklist-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: cardDuration, ease: cardEase }}
            className="w-[min(100vw-2rem,22rem)] border shadow-lg"
          >
            {children}
          </MotionCard>
        ) : null}
      </AnimatePresence>

      <span
        className={cn(
          "inline-flex",
          /* 50% ширины кнопки + тот же inset, что у `right-2` / `lg:right-6`, чтобы половина круга ушла за край viewport */
          !fabExpanded &&
            "translate-x-[calc(50%+0.5rem)] lg:translate-x-[calc(50%+1.5rem)]",
        )}
        style={
          reduceMotion
            ? undefined
            : {
                transitionProperty: "transform",
                transitionDuration: `${fabMorphMs}ms`,
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }
        }
      >
        <Button
          type="button"
          variant={fabExpanded && allDone ? "outline" : "default"}
          aria-expanded={isOpen}
          aria-label={fabExpanded ? undefined : collapsedAriaLabel}
          onClick={() => onOpenChange(!isOpen)}
          onMouseEnter={(e) => applyFabPointerStyle(e.currentTarget, "hover")}
          onMouseLeave={(e) => applyFabPointerStyle(e.currentTarget, "base")}
          className={cn(
            "inline-flex h-12 min-h-12 shrink-0 items-center gap-0 overflow-hidden rounded-full shadow-lg hover:shadow-xl",
            fabExpanded
              ? "min-w-12 max-w-[min(calc(100vw-2rem),20rem)] justify-start px-4 py-0"
              : "w-12 min-w-12 max-w-12 justify-center p-0",
          )}
          style={{
            ...fabBaseStyle,
            transitionProperty: reduceMotion
              ? undefined
              : "max-width, padding-left, padding-right",
            transitionDuration: reduceMotion ? "0ms" : `${fabMorphMs}ms`,
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <ListChecks className="h-5 w-5 shrink-0" aria-hidden />
          <span
            className={cn(
              "flex min-w-0 items-center overflow-hidden whitespace-nowrap text-sm font-medium",
              fabExpanded
                ? "ml-2 max-w-[min(calc(100vw-2rem-4rem),17rem)] opacity-100"
                : "ml-0 max-w-0 opacity-0",
            )}
            style={{
              transitionProperty: reduceMotion
                ? undefined
                : "max-width, opacity, margin-left",
              transitionDuration: reduceMotion ? "0ms" : `${fabMorphMs}ms`,
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            aria-hidden={!fabExpanded}
          >
            {fabLabel}
            {!allDone ? (
              <span className="ml-2 shrink-0 rounded-full bg-background/25 px-2 py-0.5 text-xs font-semibold">
                {doneCount}/{total}
              </span>
            ) : null}
          </span>
        </Button>
      </span>
    </div>
  );

  if (!portalRoot) return null;

  return createPortal(shell, portalRoot);
}
