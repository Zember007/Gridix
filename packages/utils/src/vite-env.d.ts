/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_MAIN_APP_URL?: string;
  readonly VITE_SUPERADMIN_APP_URL?: string;
  /** Повторный запуск Driver.js-туров без once (см. `isDriverDevMode`). */
  readonly VITE_DRIVER_DEV_TOUR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly glob?: <T = Record<string, unknown>>(
    pattern: string,
    options?: { eager?: boolean },
  ) => Record<string, T | (() => Promise<T>)>;
}

declare module "browser-image-compression";
declare module "driver.js/dist/driver.css";
