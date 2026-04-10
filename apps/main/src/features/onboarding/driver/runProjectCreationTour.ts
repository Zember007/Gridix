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

import { requestProjectCreationTourKindScreen } from "./projectCreationTourNavBridge";

export const PROJECT_CREATION_DRIVER_TOUR_ID = "project_creation";

type Translate = (key: string) => string;

type TourPopoverButtons = NonNullable<
  NonNullable<DriveStep["popover"]>["showButtons"]
>;

const PHASE1_NAV_BUTTONS: TourPopoverButtons = ["next", "previous"];
/** Шаги «клик по подсветке»: только Назад и закрытие тура (без «Далее»). */
const CLICK_ADVANCE_STEP_BUTTONS: TourPopoverButtons = ["previous", "close"];

let activeProjectCreationDriver: Driver | null = null;

/**
 * Уничтожение инстанса между шагом выбора типа и шагами импорта: не помечать тур
 * завершённым и не resolve() промиса `startProjectCreationDriverTour`.
 */
let skipMarkProjectCreationOnceOnDestroy = false;

function nextAnimationFrame(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) =>
    window.requestAnimationFrame(() => resolve()),
  );
}

/** Ждём появления хотя бы одного из селекторов в DOM. */
async function waitForAnySelector(
  selectors: string[],
  timeoutMs: number,
  intervalMs: number,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (selectors.some((s) => document.querySelector(s))) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
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

type Phase1ImportStepsOptions = {
  /** «Назад» с первого шага импорта: вернуть UI на выбор типа и перезапустить шаг kind. */
  onPrevFromFirstImport?: (driver: Driver) => void;
};

/**
 * Шаги phase 1 после экрана выбора типа проекта (или сразу для потока подпроекта):
 * бывший «обзор модалки» перенесён на карточку импорта (phase1Step1), затем детали импорта и загрузка.
 */
function buildPhase1ImportSteps(
  t: Translate,
  onAwaitMapperThenContinue: (driver: Driver) => void,
  options?: Phase1ImportStepsOptions,
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

  const firstImportPopoverExtras =
    options?.onPrevFromFirstImport != null
      ? {
          /**
           * По умолчанию Driver отключает «Назад» на шаге 0; без пустого disableButtons
           * кнопка не покажется.
           */
          disableButtons: [] as unknown as NonNullable<
            NonNullable<DriveStep["popover"]>["disableButtons"]
          >,
          onPrevClick: (
            _element: Element | undefined,
            _step: DriveStep,
            { driver }: { driver: Driver },
          ) => {
            options.onPrevFromFirstImport!(driver);
          },
        }
      : {};

  return [
    {
      element: ".project_import_excel_usertour",
      disableActiveInteraction: true,
      onHighlighted: chainHighlighted(phase1AllowCloseHook),
      popover: {
        title: t("driverOnboarding.projectCreation.phase1Step1Title"),
        description: t(
          "driverOnboarding.projectCreation.phase1Step1Description",
        ),
        side: "bottom" as Side,
        ...navOnlyPopover,
        ...firstImportPopoverExtras,
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

function buildKindStep(
  t: Translate,
  onAfterKindChoice: (driver: Driver) => void,
): DriveStep {
  const phase1AllowCloseHook: DriverHook = (_el, _s, { driver }) => {
    driver.setConfig({ ...driver.getConfig(), allowClose: false });
  };

  const phase1OpenHook: DriverHook = (_el, _s, { driver }) => {
    driver.setConfig({ ...driver.getConfig(), allowClose: true });
  };

  const clickAdvance = clickToAdvanceOnHighlight(onAfterKindChoice);

  return {
    element: ".project_creation_kind_usertour",
    disableActiveInteraction: false,
    onHighlighted: chainHighlighted(
      phase1AllowCloseHook,
      phase1OpenHook,
      clickAdvance.onHighlighted,
    ),
    onDeselected: clickAdvance.onDeselected,
    popover: {
      title: t("driverOnboarding.projectCreation.phase1KindTitle"),
      description: t("driverOnboarding.projectCreation.phase1KindDescription"),
      side: "bottom" as Side,
      showButtons: CLICK_ADVANCE_STEP_BUTTONS,
    },
  };
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

function createProjectCreationPhase1Driver(params: {
  userId: string;
  t: Translate;
  finish: () => void;
}): Driver {
  const { userId, t, finish } = params;
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
      if (!skipMarkProjectCreationOnceOnDestroy) {
        markDriverTourCompletedOnce(userId, PROJECT_CREATION_DRIVER_TOUR_ID);
        finish();
      }
    },
  });
  return driver;
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

      const kindOrImportReady = await waitForAnySelector(
        [".project_creation_kind_usertour", ".project_import_excel_usertour"],
        4000,
        50,
      );

      if (!kindOrImportReady) {
        finish();
        return;
      }

      /**
       * Вызывается из onNextClick шага 4 (последний шаг phase 1 import).
       * Сразу закрывает phase 1 через moveNext() (Driver.js сам вызовет destroy
       * на последнем шаге), затем асинхронно ждёт маппер и запускает phase 2.
       */
      const handleUploadNext = (driver: Driver) => {
        try {
          driver.moveNext();
        } catch {
          // На последнем шаге moveNext() вызывает destroy — это ожидаемо.
        }

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

      let continueAfterKindChoice: (driver: Driver) => void;

      function goBackToKindFromImport(importDriver: Driver): void {
        void (async () => {
          requestProjectCreationTourKindScreen();
          const kindVisible = await waitForSelectors(
            [".project_creation_kind_usertour"],
            {
              timeoutMs: 8000,
              intervalMs: 100,
              debugLabel: "project_tour_kind_from_import_back",
            },
          );
          if (!kindVisible) return;

          skipMarkProjectCreationOnceOnDestroy = true;
          try {
            importDriver.destroy();
          } catch {
            // ignore
          } finally {
            skipMarkProjectCreationOnceOnDestroy = false;
          }

          await nextAnimationFrame();
          await nextAnimationFrame();

          const kindStep = buildKindStep(t, (d) => continueAfterKindChoice(d));
          const newDriver = createProjectCreationPhase1Driver({
            userId,
            t,
            finish,
          });
          activeProjectCreationDriver = newDriver;
          newDriver.setSteps([kindStep]);
          newDriver.drive(0);
          await nextAnimationFrame();
        })();
      }

      continueAfterKindChoice = (driver: Driver) => {
        void (async () => {
          await nextAnimationFrame();
          await nextAnimationFrame();

          if (!document.querySelector(".project_creation_modal_usertour")) {
            try {
              driver.destroy();
            } catch {
              // onDestroyed завершит тур (генплан закрыл модалку)
            }
            return;
          }

          const importReady = await waitForSelectors(
            [".project_import_excel_usertour"],
            {
              timeoutMs: 8000,
              intervalMs: 100,
              debugLabel: "project_creation_import_after_kind",
            },
          );

          if (!importReady) {
            try {
              driver.destroy();
            } catch {
              // onDestroyed помечает прогресс
            }
            return;
          }

          const importSteps = buildPhase1ImportSteps(t, handleUploadNext, {
            onPrevFromFirstImport: goBackToKindFromImport,
          });
          const readyImport = filterStepsWithDomTargets(importSteps);
          if (!readyImport.length) {
            try {
              driver.destroy();
            } catch {
              // onDestroyed помечает прогресс
            }
            return;
          }

          try {
            /**
             * После клика по карточке узел `.project_creation_kind_usertour` размонтируется.
             * `setSteps` на том же инстансе оставляет «залипшую» подсветку/попап первого шага.
             * Новый инстанс Driver снимает оверлей корректно.
             */
            skipMarkProjectCreationOnceOnDestroy = true;
            try {
              driver.destroy();
            } catch {
              // ignore
            } finally {
              skipMarkProjectCreationOnceOnDestroy = false;
            }

            await nextAnimationFrame();
            await nextAnimationFrame();

            const importDriver = createProjectCreationPhase1Driver({
              userId,
              t,
              finish,
            });
            activeProjectCreationDriver = importDriver;
            importDriver.setSteps(readyImport);
            importDriver.drive(0);
            await nextAnimationFrame();
          } catch (error) {
            console.warn(
              "Project creation driver tour: failed to continue after kind step",
              error,
            );
            try {
              driver.destroy();
            } catch {
              // ignore
            }
          }
        })();
      };

      const hasKindStep = !!document.querySelector(
        ".project_creation_kind_usertour",
      );

      const importStepsWhenNoKind = buildPhase1ImportSteps(t, handleUploadNext);
      const readyPhase1WhenNoKind = filterStepsWithDomTargets(
        importStepsWhenNoKind,
      );

      if (!hasKindStep && !readyPhase1WhenNoKind.length) {
        finish();
        return;
      }

      destroyActiveInstance();

      const driver = createProjectCreationPhase1Driver({
        userId,
        t,
        finish,
      });

      activeProjectCreationDriver = driver;

      try {
        if (hasKindStep) {
          driver.setSteps([buildKindStep(t, continueAfterKindChoice)]);
        } else {
          driver.setSteps(readyPhase1WhenNoKind);
        }
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
