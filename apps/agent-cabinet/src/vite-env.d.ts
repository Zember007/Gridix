/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAIN_APP_URL?: string;
  readonly VITE_SSO_URL?: string;
  readonly VITE_AGENT_CABINET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

