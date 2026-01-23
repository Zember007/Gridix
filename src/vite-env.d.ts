/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USERTOUR_TOKEN?: string;
  readonly VITE_USERTOUR_ADMIN_ONBOARDING_CONTENT_ID?: string;
  readonly VITE_USERTOUR_PROJECT_CREATION_CONTENT_ID?: string;
  readonly VITE_USERTOUR_PROJECT_EDITOR_CONTENT_ID?: string;
  readonly VITE_USERTOUR_PARTNERS_CONTENT_ID?: string;
  readonly VITE_USERTOUR_DEV_TOUR?: string;

  readonly VITE_USERTOUR_ADMIN_CHECKLIST_CONTENT_ID?: string;
  readonly VITE_USERTOUR_PROJECT_CHECKLIST_CONTENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
