/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USERTOUR_TOKEN?: string;
  readonly VITE_USERTOUR_ADMIN_ONBOARDING_CONTENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
