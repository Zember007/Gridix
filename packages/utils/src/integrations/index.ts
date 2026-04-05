/**
 * Реэкспорт driver: константы — из `./driver/gridixDriverConstants` (без side-effect
 * импортов driver.css), фабрика — из `./driver/gridixDriver`. Так Vite в dev не ломает
 * named export при цепочке баррелей и ленивом импорте туров.
 */
export {
  GRIDIX_DRIVER_DEFAULT_STAGE_RADIUS,
  GRIDIX_DRIVER_POPOVER_CLASS,
  GRIDIX_DRIVER_STAGE_RADIUS_MAX,
} from "./driver/gridixDriverConstants";
export {
  createGridixDriver,
  getGridixDriverDefaults,
} from "./driver/gridixDriver";
export type {
  Config,
  DriveStep,
  Driver,
  DriverHook,
  Side,
} from "./driver/gridixDriver";
export * from "./driver/devMode";
export * from "./driver/onceStorage";

export * from "./onboardingMilestones";
export * from "./onboardingUiBlock";
export * from "./OnboardingBlockingGate";
export * from "./queryFirstVisibleElement";
export * from "./waitForSelectors";
