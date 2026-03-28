import type { DriveStep, Driver, Side } from "@gridix/utils/integrations";
import {
  createGridixDriver,
  hasDriverTourCompletedOnce,
  markDriverTourCompletedOnce,
  waitForSelectors,
  withOnboardingUiBlocked,
} from "@gridix/utils/integrations";

export const PROJECT_CREATION_DRIVER_TOUR_ID = "project_creation";

type Translate = (key: string) => string;

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
  const step = (
    selector: string,
    titleKey: string,
    descKey: string,
    side: Side,
    extraPopover?: Partial<DriveStep["popover"]>,
  ): DriveStep => ({
    element: selector,
    popover: {
      title: t(`driverOnboarding.projectCreation.${titleKey}`),
      description: t(`driverOnboarding.projectCreation.${descKey}`),
      side,
      ...extraPopover,
    },
  });

  return [
    step(
      ".project_creation_modal_usertour",
      "phase1Step1Title",
      "phase1Step1Description",
      "bottom",
    ),
    step(
      ".project_import_excel_usertour",
      "phase1Step2Title",
      "phase1Step2Description",
      "bottom",
    ),
    step(
      ".project_import_demo_usertour",
      "phase1Step3Title",
      "phase1Step3Description",
      "bottom",
    ),
    step(
      ".project_import_upload_usertour",
      "phase1Step4Title",
      "phase1Step4Description",
      "bottom",
      {
        onNextClick: (_el, _s, { driver }) => {
          onAwaitMapperThenContinue(driver);
        },
      },
    ),
  ];
}

function buildPhase2Steps(t: Translate): DriveStep[] {
  const step = (
    selector: string,
    titleKey: string,
    descKey: string,
    side: Side,
    extraPopover?: Partial<DriveStep["popover"]>,
  ): DriveStep => ({
    element: selector,
    popover: {
      title: t(`driverOnboarding.projectCreation.${titleKey}`),
      description: t(`driverOnboarding.projectCreation.${descKey}`),
      side,
      ...extraPopover,
    },
  });

  return [
    step(
      ".excel_project_type_usertour",
      "phase2ProjectTypeTitle",
      "phase2ProjectTypeDescription",
      "bottom",
      {
        onNextClick: (_el, _s, { driver }) => {
          selectBuildingProjectTypeAndAdvance(driver);
        },
      },
    ),
    step(
      ".excel_mapping_required_usertour",
      "phase2MappingOverviewTitle",
      "phase2MappingOverviewDescription",
      "top",
    ),
    step(
      ".excel_mapping_apartmentNumber_usertour",
      "phase2MapApartmentTitle",
      "phase2MapApartmentDescription",
      "bottom",
    ),
    step(
      ".excel_mapping_floor_usertour",
      "phase2MapFloorTitle",
      "phase2MapFloorDescription",
      "bottom",
    ),
    step(
      ".excel_mapping_rooms_usertour",
      "phase2MapRoomsTitle",
      "phase2MapRoomsDescription",
      "bottom",
    ),
    step(
      ".excel_mapping_area_usertour",
      "phase2MapAreaTitle",
      "phase2MapAreaDescription",
      "bottom",
    ),
    step(
      ".excel_mapping_price_usertour",
      "phase2MapPriceTitle",
      "phase2MapPriceDescription",
      "bottom",
    ),
    step(
      ".excel_mapping_status_usertour",
      "phase2MapStatusTitle",
      "phase2MapStatusDescription",
      "bottom",
    ),
    step(
      ".excel_validation_usertour",
      "phase2ValidationTitle",
      "phase2ValidationDescription",
      "top",
    ),
    step(
      ".excel_create_project_usertour",
      "phase2CreateTitle",
      "phase2CreateDescription",
      "top",
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
