import type { Config, Driver } from "driver.js";
import { driver as driverFactory } from "driver.js";

import "driver.js/dist/driver.css";
import "./gridix-driver-overrides.css";

/** Класс на popover для кастомных стилей в приложении (z-index в базовом CSS driver.js уже очень высокий). */
export const GRIDIX_DRIVER_POPOVER_CLASS = "gridix-driver-popover";

/**
 * Driver.js ограничивает радиус: `min(stageRadius, stageWidth/2, stageHeight/2)`.
 * Передавайте в `setConfig` только на шагах с круглой целью (например FAB), иначе оставляйте дефолт driver.js (5).
 */
export const GRIDIX_DRIVER_STAGE_RADIUS_MAX = 9999;

/**
 * Базовые опции Driver.js для админки Gridix.
 * Дополняются и переопределяются через `createGridixDriver(options)`.
 */
export function getGridixDriverDefaults(): Partial<Config> {
  return {
    popoverClass: GRIDIX_DRIVER_POPOVER_CLASS,
    allowClose: true,
    /** Клик по затемнению не закрывает тур (только кнопка «Закрыть» / программный destroy). */
    overlayClickBehavior: () => {},
    smoothScroll: true,
    /**
     * По умолчанию в driver.js — 10px: вырез шире элемента, справа от фиксированного
     * сайдбара остаётся полоска фона контента (белая). 0 — вырез по границе target.
     */
    stagePadding: -1,
  };
}

function mergePopoverClass(base?: string, extra?: string): string | undefined {
  const parts = [base, extra].filter(
    (s): s is string => typeof s === "string" && s.trim().length > 0,
  );
  if (parts.length === 0) return undefined;
  return parts.join(" ");
}

/**
 * Фабрика инстанса Driver.js с импортом стилей и дефолтами Gridix.
 */
export function createGridixDriver(options?: Config): Driver {
  const defaults = getGridixDriverDefaults();
  const { popoverClass: userPopoverClass, ...rest } = options ?? {};
  const merged: Config = {
    ...defaults,
    ...rest,
    popoverClass:
      mergePopoverClass(defaults.popoverClass, userPopoverClass) ??
      GRIDIX_DRIVER_POPOVER_CLASS,
  };
  return driverFactory(merged);
}

export type { Config, DriveStep, Driver, DriverHook, Side } from "driver.js";
