import type {
  DriveStep,
  Driver,
  DriverHook,
  Side,
} from "@gridix/utils/integrations";
import {
  createGridixDriver,
  hasDriverTourCompletedOnce,
  markDriverTourCompletedOnce,
  waitForSelectors,
  withOnboardingUiBlocked,
} from "@gridix/utils/integrations";

export const PROJECT_CREATION_DRIVER_TOUR_ID = "project_creation";

type Translate = (key: string) => string;

type TourPopoverButtons = NonNullable<
  NonNullable<DriveStep["popover"]>["showButtons"]
>;

const PHASE1_NAV_BUTTONS: TourPopoverButtons = ["next", "previous"];
/** Шаги «клик по подсветке»: только Назад и закрытие тура (без «Далее»). */
const CLICK_ADVANCE_STEP_BUTTONS: TourPopoverButtons = ["previous", "close"];

let activeProjectCreationDriver: Driver | null = null;

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

function chainHighlighted(...hooks: (DriverHook | undefined)[]): DriverHook {
  const list = hooks.filter(Boolean) as DriverHook[];
  return (element, step, opts) => {
    for (const fn of list) fn(element, step, opts);
  };
}

/**
 * Переход на следующий шаг только после клика по подсвеченному элементу.
 * `once` + отложенный вызов, чтобы нативное действие кнопки/input успело выполниться.
 */
function clickToAdvanceOnHighlight(
  onAdvance: (driver: Driver) => void,
): Pick<DriveStep, "onHighlighted" | "onDeselected"> {
  let detach: (() => void) | undefined;

  return {
    onHighlighted: (element, _step, { driver }) => {
      detach?.();
      detach = undefined;
      if (!element || !(element instanceof HTMLElement)) return;

      const handler = () => {
        window.setTimeout(() => onAdvance(driver), 0);
      };
      element.addEventListener("click", handler, { once: true });
      detach = () => element.removeEventListener("click", handler);
    },
    onDeselected: () => {
      detach?.();
      detach = undefined;
    },
  };
}

function selectBuildingProjectTypeAndAdvance(driver: Driver): void {
  const trigger = document.querySelector<HTMLElement>(
    ".excel_project_type_usertour",
  );
  trigger?.click();
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(".excel_project_type_building_usertour")
        ?.click();
      driver.moveNext();
    });
  });
}

function buildPhase1Steps(
  t: Translate,
  onAwaitMapperThenContinue: (driver: Driver) => void,
): DriveStep[] {
  const navOnlyPopover = {
    showButtons: PHASE1_NAV_BUTTONS,
  };

  const openClosePopover = {
    showButtons: CLICK_ADVANCE_STEP_BUTTONS,
  };

  /** Driver.js `setConfig` заменяет конфиг целиком; без spread теряется `steps` → «No steps to drive through». */
  const phase1AllowCloseHook: DriverHook = (_el, _s, { driver }) => {
    driver.setConfig({ ...driver.getConfig(), allowClose: false });
  };

  const phase1OpenHook: DriverHook = (_el, _s, { driver }) => {
    driver.setConfig({ ...driver.getConfig(), allowClose: true });
  };

  return [
    {
      element: ".project_creation_modal_usertour",
      disableActiveInteraction: true,
      onHighlighted: chainHighlighted(phase1AllowCloseHook),
      popover: {
        title: t("driverOnboarding.projectCreation.phase1Step1Title"),
        description: t(
          "driverOnboarding.projectCreation.phase1Step1Description",
        ),
        side: "bottom" as Side,
        ...navOnlyPopover,
      },
    },
    {
      element: ".project_import_excel_usertour",
      disableActiveInteraction: true,
      onHighlighted: chainHighlighted(phase1AllowCloseHook),
      popover: {
        title: t("driverOnboarding.projectCreation.phase1Step2Title"),
        description: t(
          "driverOnboarding.projectCreation.phase1Step2Description",
        ),
        side: "bottom" as Side,
        ...navOnlyPopover,
      },
    },
    (() => {
      const clickAdvance = clickToAdvanceOnHighlight((d) => d.moveNext());
      return {
        element: ".project_import_demo_usertour",
        onHighlighted: chainHighlighted(
          phase1OpenHook,
          clickAdvance.onHighlighted,
        ),
        onDeselected: clickAdvance.onDeselected,
        popover: {
          title: t("driverOnboarding.projectCreation.phase1Step3Title"),
          description: t(
            "driverOnboarding.projectCreation.phase1Step3Description",
          ),
          side: "bottom" as Side,
          ...openClosePopover,
        },
      } satisfies DriveStep;
    })(),
    (() => {
      const clickAdvance = clickToAdvanceOnHighlight(onAwaitMapperThenContinue);
      return {
        element: ".project_import_upload_usertour",
        onHighlighted: chainHighlighted(
          phase1OpenHook,
          clickAdvance.onHighlighted,
        ),
        onDeselected: clickAdvance.onDeselected,
        popover: {
          title: t("driverOnboarding.projectCreation.phase1Step4Title"),
          description: t(
            "driverOnboarding.projectCreation.phase1Step4Description",
          ),
          side: "bottom" as Side,
          ...openClosePopover,
        },
      } satisfies DriveStep;
    })(),
  ];
}

function buildPhase2Steps(t: Translate): DriveStep[] {
  const popoverBase = {
    showButtons: CLICK_ADVANCE_STEP_BUTTONS,
  };

  const withClickAdvance = (
    selector: string,
    titleKey: string,
    descKey: string,
    side: Side,
    advance: (driver: Driver) => void,
  ): DriveStep => {
    const { onHighlighted, onDeselected } = clickToAdvanceOnHighlight(advance);
    return {
      element: selector,
      onHighlighted,
      onDeselected,
      popover: {
        title: t(`driverOnboarding.projectCreation.${titleKey}`),
        description: t(`driverOnboarding.projectCreation.${descKey}`),
        side,
        ...popoverBase,
      },
    };
  };

  return [
    withClickAdvance(
      ".excel_project_type_usertour",
      "phase2ProjectTypeTitle",
      "phase2ProjectTypeDescription",
      "bottom",
      selectBuildingProjectTypeAndAdvance,
    ),
    withClickAdvance(
      ".excel_mapping_required_usertour",
      "phase2MappingOverviewTitle",
      "phase2MappingOverviewDescription",
      "top",
      (d) => d.moveNext(),
    ),
    withClickAdvance(
      ".excel_mapping_apartmentNumber_usertour",
      "phase2MapApartmentTitle",
      "phase2MapApartmentDescription",
      "bottom",
      (d) => d.moveNext(),
    ),
    withClickAdvance(
      ".excel_mapping_floor_usertour",
      "phase2MapFloorTitle",
      "phase2MapFloorDescription",
      "bottom",
      (d) => d.moveNext(),
    ),
    withClickAdvance(
      ".excel_mapping_rooms_usertour",
      "phase2MapRoomsTitle",
      "phase2MapRoomsDescription",
      "bottom",
      (d) => d.moveNext(),
    ),
    withClickAdvance(
      ".excel_mapping_area_usertour",
      "phase2MapAreaTitle",
      "phase2MapAreaDescription",
      "bottom",
      (d) => d.moveNext(),
    ),
    withClickAdvance(
      ".excel_mapping_price_usertour",
      "phase2MapPriceTitle",
      "phase2MapPriceDescription",
      "bottom",
      (d) => d.moveNext(),
    ),
    withClickAdvance(
      ".excel_mapping_status_usertour",
      "phase2MapStatusTitle",
      "phase2MapStatusDescription",
      "bottom",
      (d) => d.moveNext(),
    ),
    withClickAdvance(
      ".excel_validation_usertour",
      "phase2ValidationTitle",
      "phase2ValidationDescription",
      "top",
      (d) => d.moveNext(),
    ),
    withClickAdvance(
      ".excel_create_project_usertour",
      "phase2CreateTitle",
      "phase2CreateDescription",
      "top",
      (d) => d.moveNext(),
    ),
  ];
}

function destroyActiveInstance(): void {
  if (!activeProjectCreationDriver) return;
  const instance = activeProjectCreationDriver;
  try {
    instance.destroy();
  } catch {
    // ignore
  } finally {
    if (activeProjectCreationDriver === instance) {
      activeProjectCreationDriver = null;
    }
  }
}

/**
 * Снимает активный Driver тура создания проекта (закрытие модалки, размонтирование).
 * Записывает once-флаг — тур больше не показывается при повторном открытии модалки.
 */
export function destroyProjectCreationDriverTour(): void {
  destroyActiveInstance();
}

function startPhase2Driver(params: {
  userId: string;
  t: Translate;
  finish: () => void;
}): void {
  const { userId, t, finish } = params;

  const rawSteps = buildPhase2Steps(t);
  const readySteps = filterStepsWithDomTargets(rawSteps);
  if (!readySteps.length) {
    markDriverTourCompletedOnce(userId, PROJECT_CREATION_DRIVER_TOUR_ID);
    finish();
    return;
  }

  destroyActiveInstance();

  void withOnboardingUiBlocked(async () => {
    const driver = createGridixDriver({
      allowClose: true,
      allowKeyboardControl: false,
      disableActiveInteraction: false,
      showProgress: true,
      nextBtnText: t("driverOnboarding.buttons.next"),
      prevBtnText: t("driverOnboarding.buttons.previous"),
      doneBtnText: t("driverOnboarding.buttons.done"),
      showButtons: ["next", "previous", "close"],
      onDestroyed: () => {
        if (activeProjectCreationDriver === driver) {
          activeProjectCreationDriver = null;
        }
        markDriverTourCompletedOnce(userId, PROJECT_CREATION_DRIVER_TOUR_ID);
        finish();
      },
    });

    activeProjectCreationDriver = driver;

    try {
      driver.setSteps(readySteps);
      driver.drive(0);
      await nextAnimationFrame();
    } catch (error) {
      console.warn("Project creation driver tour phase 2: drive failed", error);
      if (activeProjectCreationDriver === driver) {
        activeProjectCreationDriver = null;
      }
      markDriverTourCompletedOnce(userId, PROJECT_CREATION_DRIVER_TOUR_ID);
      finish();
    }
  }).catch(() => {
    if (activeProjectCreationDriver) {
      activeProjectCreationDriver = null;
    }
    finish();
  });
}

/**
 * Тур модалки «Создать проект» и ветки импорта Excel → маппер колонок (Driver.js).
 */
export function startProjectCreationDriverTour(params: {
  userId: string;
  t: Translate;
}): Promise<void> {
  const { userId, t } = params;

  if (typeof window === "undefined") return Promise.resolve();
  if (!userId) return Promise.resolve();
  if (hasDriverTourCompletedOnce(userId, PROJECT_CREATION_DRIVER_TOUR_ID)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    void withOnboardingUiBlocked(async () => {
      const modalReady = await waitForSelectors(
        [".project_creation_modal_usertour"],
        {
          timeoutMs: 8000,
          intervalMs: 100,
          debugLabel: "project_creation_modal",
        },
      );

      if (!modalReady) {
        finish();
        return;
      }

      /**
       * Вызывается из onNextClick шага 4 (последний шаг phase 1).
       * Сразу закрывает phase 1 через moveNext() (Driver.js сам вызовет destroy
       * на последнем шаге), затем асинхронно ждёт маппер и запускает phase 2.
       */
      const handleUploadNext = (driver: Driver) => {
        // Немедленно закрыть phase 1 — пользователь нажал «Готово».
        try {
          driver.moveNext();
        } catch {
          // На последнем шаге moveNext() вызывает destroy — это ожидаемо.
        }

        // Асинхронно ждём маппер и, если он появится, запускаем phase 2.
        void (async () => {
          const mapperReady = await waitForSelectors(
            [".excel_project_type_usertour"],
            {
              timeoutMs: 180_000,
              intervalMs: 200,
              debugLabel: "project_creation_mapper",
            },
          );

          if (!mapperReady) return;
          if (!document.querySelector(".project_creation_modal_usertour"))
            return;

          startPhase2Driver({ userId, t, finish });
        })();
      };

      const phase1Steps = buildPhase1Steps(t, handleUploadNext);
      const readyPhase1 = filterStepsWithDomTargets(phase1Steps);
      if (!readyPhase1.length) {
        finish();
        return;
      }

      destroyActiveInstance();

      const driver = createGridixDriver({
        allowClose: false,
        allowKeyboardControl: false,
        disableActiveInteraction: false,
        showProgress: true,
        nextBtnText: t("driverOnboarding.buttons.next"),
        prevBtnText: t("driverOnboarding.buttons.previous"),
        doneBtnText: t("driverOnboarding.buttons.done"),
        showButtons: ["next", "previous", "close"],
        onDestroyed: () => {
          if (activeProjectCreationDriver === driver) {
            activeProjectCreationDriver = null;
          }
          markDriverTourCompletedOnce(userId, PROJECT_CREATION_DRIVER_TOUR_ID);
          finish();
        },
      });

      activeProjectCreationDriver = driver;

      try {
        driver.setSteps(readyPhase1);
        driver.drive(0);
        await nextAnimationFrame();
      } catch (error) {
        console.warn(
          "Project creation driver tour phase 1: drive failed",
          error,
        );
        if (activeProjectCreationDriver === driver) {
          activeProjectCreationDriver = null;
        }
        markDriverTourCompletedOnce(userId, PROJECT_CREATION_DRIVER_TOUR_ID);
        finish();
      }
    }).catch(() => {
      if (activeProjectCreationDriver) {
        activeProjectCreationDriver = null;
      }
      finish();
    });
  });
}
