declare const BX24: {
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
    callMethod: (
      method: string,
      params?: Record<string, any>,
      callback?: (result: any) => void
    ) => void;
    // Добавь другие методы, которые планируешь использовать
    [key: string]: any;
  };