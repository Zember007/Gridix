/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PARTNERS_APP_URL?: string;
  readonly VITE_AGENT_CABINET_URL?: string;
  readonly VITE_USERTOUR_TOKEN?: string;
  readonly VITE_USERTOUR_ADMIN_ONBOARDING_CONTENT_ID?: string;
  readonly VITE_USERTOUR_PROJECT_CREATION_CONTENT_ID?: string;
  readonly VITE_USERTOUR_PROJECT_EDITOR_CONTENT_ID?: string;
  readonly VITE_USERTOUR_PARTNERS_CONTENT_ID?: string;
  readonly VITE_USERTOUR_DEV_TOUR?: string;

  readonly VITE_USERTOUR_ADMIN_CHECKLIST_CONTENT_ID?: string;
  readonly VITE_USERTOUR_PROJECT_CHECKLIST_CONTENT_ID?: string;
  readonly VITE_STRIPE_ENABLED?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
