import type { Config, Driver } from "driver.js";
import { driver as driverFactory } from "driver.js";

import "driver.js/dist/driver.css";
import "./gridix-driver-overrides.css";

import {
  GRIDIX_DRIVER_DEFAULT_STAGE_RADIUS,
  GRIDIX_DRIVER_POPOVER_CLASS,
} from "./gridixDriverConstants";
import { startGridixDriverSpotlightObserver } from "./gridixDriverSpotlight";

export {
  GRIDIX_DRIVER_DEFAULT_STAGE_RADIUS,
  GRIDIX_DRIVER_POPOVER_CLASS,
  GRIDIX_DRIVER_STAGE_RADIUS_MAX,
} from "./gridixDriverConstants";

/**
 * Базовые опции Driver.js для админки Gridix.
 * Дополняются и переопределяются через `createGridixDriver(options)`.
 */
export function getGridixDriverDefaults(): Partial<Config> {
  return {
    popoverClass: GRIDIX_DRIVER_POPOVER_CLASS,
    allowClose: true,
    overlayClickBehavior: () => {},
    smoothScroll: true,
    stageRadius: GRIDIX_DRIVER_DEFAULT_STAGE_RADIUS,
    /** Отступ выреза: border 2px + outline 4px + воздух. */
    stagePadding: -1,
    /** Расстояние от подсвеченного элемента до поповера (дефолт driver.js — 10). */
    popoverOffset: 20,
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
 * Автоматически запускает MutationObserver для белого бордера на подсвеченном элементе.
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

  startGridixDriverSpotlightObserver();

  return driverFactory(merged);
}

export type { Config, DriveStep, Driver, DriverHook, Side } from "driver.js";
