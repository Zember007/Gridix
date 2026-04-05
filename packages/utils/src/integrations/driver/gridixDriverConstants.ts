/** Класс на popover для кастомных стилей в приложении (z-index в базовом CSS driver.js уже очень высокий). */
export const GRIDIX_DRIVER_POPOVER_CLASS = "gridix-driver-popover";

/**
 * Driver.js ограничивает радиус: `min(stageRadius, stageWidth/2, stageHeight/2)`.
 * Для круга (FAB) на шаге задавайте этот предел + `refresh()`.
 */
export const GRIDIX_DRIVER_STAGE_RADIUS_MAX = 9999;

/** Скругление выреза под типичный админский UI (`rounded-lg` = 8px). */
export const GRIDIX_DRIVER_DEFAULT_STAGE_RADIUS = 8;
