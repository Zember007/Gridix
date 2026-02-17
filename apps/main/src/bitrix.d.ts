declare const BX24:
  | {
      init: (callback: () => void) => void;
      getAuth: () => {
        access_token: string;
        refresh_token: string;
        member_id: string;
        domain: string;
        expires_in: number;
      };
      resizeWindow: (width: number, height: number) => void;
      fitWindow: () => void;
      installFinish?: () => void;
      callMethod: (
        method: string,
        params?: Record<string, unknown>,
        callback?: (result: unknown) => void,
      ) => void;
      placement?: {
        info?: () => { options?: unknown };
      };
      [key: string]: unknown;
    }
  | undefined;
