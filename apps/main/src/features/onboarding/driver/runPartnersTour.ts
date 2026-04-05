import type { DriveStep, Driver, Side } from "@gridix/utils/integrations";
import {
  GRIDIX_DRIVER_STAGE_RADIUS_MAX,
  createGridixDriver,
  hasDriverTourCompletedOnce,
  markDriverTourCompletedOnce,
  queryFirstVisibleElement,
  waitForSelectors,
  withOnboardingUiBlocked,
} from "@gridix/utils/integrations";

/** Дефолтный `stageRadius` в driver.js (как в admin main tour). */
const DRIVER_JS_DEFAULT_STAGE_RADIUS = 6;

export const PARTNERS_DRIVER_TOUR_ID = "partners";

type Translate = (key: string) => string;

let activePartnersDriver: Driver | null = null;
let skipMarkPartnersOnceOnDestroy = false;

function nextAnimationFrame(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) =>
    window.requestAnimationFrame(() => resolve()),
  );
}

function doubleRaf(): Promise<void> {
  return nextAnimationFrame().then(() => nextAnimationFrame());
}

function detectPartnersUiMode(): "partner" | "nonpartner" | null {
  if (typeof document === "undefined") return null;
  if (document.querySelector(".partners_overview_tab_usertour")) {
    return "partner";
  }
  if (document.querySelector(".partners_become_usertour")) {
    return "nonpartner";
  }
  return null;
}

async function waitForPartnerProgramShell(
  opts: {
    timeoutMs?: number;
    intervalMs?: number;
    debugLabel?: string;
  } = {},
): Promise<"partner" | "nonpartner" | null> {
  const timeoutMs =
    typeof opts.timeoutMs === "number" ? opts.timeoutMs : 10_000;
  const intervalMs =
    typeof opts.intervalMs === "number" ? opts.intervalMs : 100;
  const start = Date.now();

  if (typeof window === "undefined") return null;

  return await new Promise((resolve) => {
    const tryResolve = (): void => {
      const mode = detectPartnersUiMode();
      if (mode) {
        resolve(mode);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        if (opts.debugLabel) {
          console.warn(
            `[waitForPartnerProgramShell:${opts.debugLabel}] timed out`,
          );
        }
        resolve(null);
        return;
      }
      window.setTimeout(tryResolve, intervalMs);
    };

    tryResolve();
  });
}

function filterStepsWithDomTargets(steps: DriveStep[]): DriveStep[] {
  return steps.filter((step) => {
    const el = step.element;
    if (typeof el === "string") return !!document.querySelector(el);
    return true;
  });
}

function buildNonPartnerSteps(t: Translate): DriveStep[] {
  const mk = (
    selector: string,
    titleKey: string,
    descKey: string,
    side: Side,
    extraPopover?: Partial<DriveStep["popover"]>,
  ): DriveStep => ({
    element: selector,
    popover: {
      title: t(`driverOnboarding.partners.${titleKey}`),
      description: t(`driverOnboarding.partners.${descKey}`),
      side,
      ...extraPopover,
    },
  });

  return [
    mk(
      ".partners_program_intro_usertour",
      "nonPartnerIntroTitle",
      "nonPartnerIntroDescription",
      "bottom",
    ),
    mk(
      ".partners_become_usertour",
      "nonPartnerBecomeTitle",
      "nonPartnerBecomeDescription",
      "top",
    ),
  ];
}

function buildPartnerSteps(t: Translate): DriveStep[] {
  const mk = (
    selector: string,
    titleKey: string,
    descKey: string,
    side: Side,
    extraPopover?: Partial<DriveStep["popover"]>,
  ): DriveStep => ({
    element: selector,
    popover: {
      title: t(`driverOnboarding.partners.${titleKey}`),
      description: t(`driverOnboarding.partners.${descKey}`),
      side,
      ...extraPopover,
    },
  });

  const mkTab = (
    selector: string,
    titleKey: string,
    descKey: string,
    side: Side,
    extraPopover?: Partial<DriveStep["popover"]>,
  ): DriveStep => ({
    element: (): Element =>
      queryFirstVisibleElement(selector) ??
      document.querySelector(selector) ??
      document.documentElement,
    popover: {
      title: t(`driverOnboarding.partners.${titleKey}`),
      description: t(`driverOnboarding.partners.${descKey}`),
      side,
      ...extraPopover,
    },
  });

  return [
    mkTab(
      ".partners_overview_tab_usertour",
      "partnerOverviewTitle",
      "partnerOverviewDescription",
      "bottom",
      {
        onNextClick: (_element, _step, { driver }) => {
          void (async () => {
            clickPartnersTab(".partners_referrals_tab_usertour");
            await doubleRaf();
            const ready = await waitForSelectors(
              [".partners_copy_link_usertour"],
              {
                timeoutMs: 8000,
                intervalMs: 100,
                debugLabel: "partners_referrals_panel",
              },
            );
            if (!ready) {
              skipMarkPartnersOnceOnDestroy = true;
              try {
                driver.destroy();
              } catch {
                // ignore
              }
              return;
            }
            driver.moveNext();
          })();
        },
      },
    ),
    mkTab(
      ".partners_referrals_tab_usertour",
      "partnerReferralsTabTitle",
      "partnerReferralsTabDescription",
      "bottom",
    ),
    mk(
      ".partners_copy_link_usertour",
      "partnerCopyLinkTitle",
      "partnerCopyLinkDescription",
      "left",
    ),
    mk(
      ".partners_utm_toggle_usertour",
      "partnerUtmTitle",
      "partnerUtmDescription",
      "top",
      {
        onNextClick: (_element, _step, { driver }) => {
          void (async () => {
            clickPartnersTab(".partners_clients_tab_usertour");
            await doubleRaf();
            driver.moveNext();
          })();
        },
      },
    ),
    mkTab(
      ".partners_clients_tab_usertour",
      "partnerClientsTabTitle",
      "partnerClientsTabDescription",
      "bottom",
      {
        onNextClick: (_element, _step, { driver }) => {
          void (async () => {
            clickPartnersTab(".partners_account_tab_usertour");
            await doubleRaf();
            driver.moveNext();
          })();
        },
      },
    ),
    {
      ...mkTab(
        ".partners_account_tab_usertour",
        "partnerAccountTabTitle",
        "partnerAccountTabDescription",
        "left",
      ),
      onHighlightStarted: (_el, _step, { driver: d }) => {
        d.setConfig({
          ...d.getConfig(),
          stageRadius: GRIDIX_DRIVER_STAGE_RADIUS_MAX,
        });
        d.refresh();
      },
      onDeselected: (_el, _step, { driver: d }) => {
        d.setConfig({
          ...d.getConfig(),
          stageRadius: DRIVER_JS_DEFAULT_STAGE_RADIUS,
        });
        d.refresh();
      },
    },
  ];
}

function clickPartnersTab(selector: string): void {
  const el =
    queryFirstVisibleElement(selector) ??
    document.querySelector<HTMLElement>(selector);
  el?.click();
}

/**
 * Снимает активный Driver тура партнёрки (смена вкладки админки, размонтирование).
 * Не помечает тур как завершённый.
 */
export function destroyPartnersDriverTour(): void {
  if (!activePartnersDriver) return;
  const instance = activePartnersDriver;
  skipMarkPartnersOnceOnDestroy = true;
  try {
    instance.destroy();
  } catch {
    // ignore
  } finally {
    skipMarkPartnersOnceOnDestroy = false;
    if (activePartnersDriver === instance) {
      activePartnersDriver = null;
    }
  }
}

/**
 * Тур вкладки «Партнёрка» (Driver.js): экран «Стать партнёром» или полный маршрут по табам.
 */
export async function startPartnersDriverTour(params: {
  userId: string;
  t: Translate;
}): Promise<void> {
  const { userId, t } = params;
  if (typeof window === "undefined") return;
  if (!userId) return;
  if (hasDriverTourCompletedOnce(userId, PARTNERS_DRIVER_TOUR_ID)) return;

  const mode = await waitForPartnerProgramShell({
    timeoutMs: 12_000,
    intervalMs: 100,
    debugLabel: "partners_shell",
  });
  if (!mode) return;

  const rawSteps =
    mode === "partner" ? buildPartnerSteps(t) : buildNonPartnerSteps(t);
  const readySteps =
    mode === "partner" ? rawSteps : filterStepsWithDomTargets(rawSteps);
  if (!readySteps.length) return;

  await withOnboardingUiBlocked(async () => {
    const driver = createGridixDriver({
      disableActiveInteraction: false,
      showProgress: true,
      nextBtnText: t("driverOnboarding.buttons.next"),
      prevBtnText: t("driverOnboarding.buttons.previous"),
      doneBtnText: t("driverOnboarding.buttons.done"),
      showButtons: ["next", "previous", "close"],
      onDestroyed: () => {
        if (activePartnersDriver === driver) {
          activePartnersDriver = null;
        }
        if (!skipMarkPartnersOnceOnDestroy) {
          markDriverTourCompletedOnce(userId, PARTNERS_DRIVER_TOUR_ID);
        }
        skipMarkPartnersOnceOnDestroy = false;
      },
    });

    activePartnersDriver = driver;

    try {
      driver.setSteps(readySteps);
      driver.drive(0);
      await nextAnimationFrame();
    } catch (error) {
      console.warn("Partners driver tour: drive failed", error);
      if (activePartnersDriver === driver) {
        activePartnersDriver = null;
      }
    }
  });
}
