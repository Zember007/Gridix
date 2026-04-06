/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Повторный запуск Driver.js-туров без once (см. `isDriverDevMode` в `@gridix/utils`). */
  readonly VITE_DRIVER_DEV_TOUR?: string;
  readonly VITE_STRIPE_ENABLED?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
