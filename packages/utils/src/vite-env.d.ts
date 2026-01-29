/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_API_URL?: string;
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
