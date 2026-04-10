import type { DriveStep, Side } from "@gridix/utils/integrations";
import {
  createGridixDriver,
  hasDriverTourCompletedOnce,
  markDriverTourCompletedOnce,
  waitForSelectors,
  withOnboardingUiBlocked,
} from "@gridix/utils/integrations";

export const PROJECT_EDITOR_DRIVER_TOUR_ID = "project_editor";

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

/**
 * Шаги по USERTOUR_CONTENT_PLAN_RU / матрице селекторов.
 * Пункт «Интеграции» в редакторе отсутствует в DOM — не включаем.
 * `.floorplan_usertour` только для типа «здание» — отфильтруется, если таба нет.
 */
function buildProjectEditorSteps(t: Translate): DriveStep[] {
  const step = (
    selector: string,
    titleKey: string,
    descKey: string,
    side: Side,
  ): DriveStep => ({
    element: selector,
    popover: {
      title: t(`driverOnboarding.projectEditor.${titleKey}`),
      description: t(`driverOnboarding.projectEditor.${descKey}`),
      side,
    },
  });

  return [
    step(".sidebar_usertour", "step1Title", "step1Description", "right"),
    step(".general_usertour", "step2Title", "step2Description", "right"),
    step(".apartments_usertour", "step3Title", "step3Description", "right"),
    step(".floorplan_usertour", "step4Title", "step4Description", "right"),
    step(".photos_usertour", "step5Title", "step5Description", "right"),
    step(".fields_usertour", "step6Title", "step6Description", "right"),
    step(".domains_usertour", "step7Title", "step7Description", "right"),
    step(".project_save_usertour", "step8Title", "step8Description", "bottom"),
  ];
}

/**
 * Тур редактора проекта (первый заход в существующий проект): Driver.js вместо Usertour.
 */
export async function startProjectEditorDriverTour(params: {
  userId: string;
  t: Translate;
}): Promise<void> {
  const { userId, t } = params;
  if (typeof window === "undefined") return;
  if (!userId) return;
  if (hasDriverTourCompletedOnce(userId, PROJECT_EDITOR_DRIVER_TOUR_ID)) return;

  const anchorsReady = await waitForSelectors(
    [".sidebar_usertour", ".general_usertour", ".project_save_usertour"],
    {
      timeoutMs: 12_000,
      intervalMs: 100,
      debugLabel: "project_editor_onboarding",
    },
  );
  if (!anchorsReady) return;

  const steps = buildProjectEditorSteps(t);
  const readySteps = filterStepsWithDomTargets(steps);
  if (!readySteps.length) return;

  await withOnboardingUiBlocked(async () => {
    const driver = createGridixDriver({
      showProgress: true,
      nextBtnText: t("driverOnboarding.buttons.next"),
      prevBtnText: t("driverOnboarding.buttons.previous"),
      doneBtnText: t("driverOnboarding.buttons.done"),
      showButtons: ["next", "previous", "close"],
      onDestroyed: () => {
        markDriverTourCompletedOnce(userId, PROJECT_EDITOR_DRIVER_TOUR_ID);
      },
    });

    try {
      driver.setSteps(readySteps);
      driver.drive(0);
      await nextAnimationFrame();
    } catch (error) {
      console.warn("Project editor driver tour: drive failed", error);
    }
  });
}
