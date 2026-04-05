import type { DriveStep, Side } from "@gridix/utils/integrations";
import {
  GRIDIX_DRIVER_DEFAULT_STAGE_RADIUS,
  GRIDIX_DRIVER_STAGE_RADIUS_MAX,
  createGridixDriver,
  hasDriverTourCompletedOnce,
  markDriverTourCompletedOnce,
  withOnboardingUiBlocked,
} from "@gridix/utils/integrations";

export const ADMIN_MAIN_DRIVER_TOUR_ID = "admin_main";

type Translate = (key: string) => string;

function nextAnimationFrame(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) =>
    window.requestAnimationFrame(() => resolve()),
  );
}

function filterStepsWithDomTargets(steps: DriveStep[]): DriveStep[] {
  return steps.filter((step) => {
    const el = step.element;
    if (typeof el === "string") return !!document.querySelector(el);
    return true;
  });
}

function buildAdminMainSteps(t: Translate): DriveStep[] {
  const step = (
    selector: string,
    titleKey: string,
    descKey: string,
    side: Side,
  ): DriveStep => ({
    element: selector,
    popover: {
      title: t(`driverOnboarding.adminMain.${titleKey}`),
      description: t(`driverOnboarding.adminMain.${descKey}`),
      side,
    },
  });

  const steps: DriveStep[] = [
    step(".sidebar_usertour", "step1Title", "step1Description", "right"),
    step(".projects_usertour", "step2Title", "step2Description", "right"),
    step(".projects_list_usertour", "step3Title", "step3Description", "bottom"),
  ];

  if (document.querySelector(".leads_usertour")) {
    steps.push(
      step(".leads_usertour", "step4Title", "step4Description", "right"),
    );
  }

  steps.push(
    step(".widgets_usertour", "step5Title", "step5Description", "right"),
    step(".partners_usertour", "step6Title", "step6Description", "right"),
    {
      ...step(".support_usertour", "step7Title", "step7Description", "left"),
      onHighlightStarted: (_el, _s, { driver: d }) => {
        d.setConfig({
          ...d.getConfig(),
          stageRadius: GRIDIX_DRIVER_STAGE_RADIUS_MAX,
        });
        d.refresh();
      },
      onDeselected: (_el, _s, { driver: d }) => {
        d.setConfig({
          ...d.getConfig(),
          stageRadius: GRIDIX_DRIVER_DEFAULT_STAGE_RADIUS,
        });
        d.refresh();
      },
    },
    step(
      ".create_project_usertour",
      "step8Title",
      "step8Description",
      "bottom",
    ),
  );

  return steps;
}

/**
 * Админский welcome-тур (дашборд): Driver.js вместо Usertour admin main flow.
 * Once-per-user: `markDriverTourCompletedOnce` + dev-режим через `isDriverDevMode` в utils.
 */
export async function startAdminMainDriverTour(params: {
  userId: string;
  t: Translate;
}): Promise<void> {
  const { userId, t } = params;
  if (typeof window === "undefined") return;
  if (!userId) return;
  if (hasDriverTourCompletedOnce(userId, ADMIN_MAIN_DRIVER_TOUR_ID)) return;

  const steps = buildAdminMainSteps(t);
  const readySteps = filterStepsWithDomTargets(steps);
  if (!readySteps.length) return;

  await withOnboardingUiBlocked(async () => {
    const driver = createGridixDriver({
      showProgress: true,
      nextBtnText: t("driverOnboarding.buttons.next"),
      prevBtnText: t("driverOnboarding.buttons.previous"),
      doneBtnText: t("driverOnboarding.buttons.done"),
      showButtons: ["next", "previous", "close"],
      disableActiveInteraction: true,
      onDestroyed: () => {
        markDriverTourCompletedOnce(userId, ADMIN_MAIN_DRIVER_TOUR_ID);
      },
    });

    try {
      driver.setSteps(readySteps);
      driver.drive(0);
      await nextAnimationFrame();
    } catch (error) {
      console.warn("Admin main driver tour: drive failed", error);
    }
  });
}
