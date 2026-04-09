/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Повторный запуск Driver.js-туров без once (см. `isDriverDevMode` в `@gridix/utils`). */
  readonly VITE_DRIVER_DEV_TOUR?: string;
  readonly VITE_PARTNERS_APP_URL?: string;
  readonly VITE_AGENT_CABINET_URL?: string;
  readonly VITE_STRIPE_ENABLED?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
