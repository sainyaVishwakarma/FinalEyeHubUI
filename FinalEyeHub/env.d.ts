/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OIDC_REDIRECT_URI: string;
  readonly VITE_OIDC_AUTHORITY: string;
  readonly VITE_OIDC_CLIENT_ID: string;
  readonly VITE_API_HOST: string;
  /**
   * File download base (app appends `?downloadId=...`). If unset, uses
   * `VITE_API_HOST` + `/OnlyOffice/downloadfile`.
   */
  readonly VITE_ONLYOFFICE_DOWNLOAD_URL?: string;
  /** ONLYOFFICE Document Server base URL. */
  readonly VITE_ONLYOFFICESERVER: string;
  /** Secret for signing ONLYOFFICE JWT; omit or leave empty if your Document Server allows unsigned configs. */
  readonly VITE_ONLYOFFICE_JWT_SECRET?: string;
  /** Optional alternate env name for the ONLYOFFICE JWT secret. */
  readonly VITE_REEFEXHIBIT_ONLYOFFICESERVER_SECERET?: string;
  readonly VITE_PRIVACY_POLICY_URL?: string;
  readonly VITE_USER_GUIDE_URL?: string;
  readonly VITE_MATOMO_CLIENT_SITEURL?: string;
  readonly VITE_MATOMO_CLIENT_SITEID?: string;
  readonly VITE_DEBUG_MODE?: string;
  readonly VITE_ONLYOFFICE_VIEWER_USER_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
