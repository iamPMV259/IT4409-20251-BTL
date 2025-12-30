/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HOST: string;
  readonly VITE_PORT: string;
  readonly VITE_BASE_ENDPOINT: string;
  readonly VITE_WS_PROTOCOL: string;
  readonly VITE_HTTP_PROTOCOL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
