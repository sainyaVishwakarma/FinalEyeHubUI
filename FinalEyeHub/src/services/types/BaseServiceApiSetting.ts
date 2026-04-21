export interface BaseServiceSetting {
  api: {
    baseUrl: string;
    version: string;
  };
}

export const requestTimeOut: number = 1000 * 60 * 4;
