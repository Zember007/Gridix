/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_USERTOUR_TOKEN?: string;
  readonly VITE_USERTOUR_PARTNERS_CONTENT_ID?: string;
  readonly VITE_USERTOUR_ADMIN_CHECKLIST_CONTENT_ID?: string;
  readonly VITE_USERTOUR_PROJECT_CHECKLIST_CONTENT_ID?: string;
  readonly VITE_USERTOUR_DEV_TOUR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly glob?: <T = Record<string, unknown>>(
    pattern: string,
    options?: { eager?: boolean }
  ) => Record<string, T | (() => Promise<T>)>;
}

declare module "usertour.js";
declare module "browser-image-compression";
