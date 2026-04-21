import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { BaseServiceSetting } from '../types/BaseServiceApiSetting';
import axios from 'axios';
// import { useAuthStore } from '@/stores/authModule';
import { setupAxiosInterceptors } from '@/services/axios';
import { authorizationService } from '@/services/auth';
import type IDomain from '../types/Domain';
import { revokeAccessToken } from '@/helper/LocalStorageHelper';
import { requestTimeOut } from '../types/BaseServiceApiSetting';

import Logger from '@/services/logger';
import { LogType } from '@/types/LogType';
const logger: Logger = Logger.getInstance();
const RESOURCE_SERVICE_SETTINGS = {
  api: {
    baseUrl: `${import.meta.env.VITE_PDFANNOTATOR_API_HOST}/pdfannotator/api`,
    version: '1',
  },
};

export const onResponse = (response: AxiosResponse): AxiosResponse => {
  //TODO customize it for logging
  return response;
};

export const onRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  // const authStore = useAuthStore();
  // const accessToken = authStore.access_token;
  const updatedConfig: InternalAxiosRequestConfig = { ...config };

  // if (updatedConfig.headers) {
  //   updatedConfig.headers.Authorization = `Bearer ${accessToken}`;
  // }

  return updatedConfig;
};

export const onErrorResponse = (error: AxiosError | Error): Promise<AxiosError> => {
  if (axios.isAxiosError(error)) {
    const { status } = (error.response as AxiosResponse) ?? {};

    switch (status) {
      case 401: {
        // "Login required"
        authorizationService.logout();
        revokeAccessToken();
        break;
      }
      case 403: {
        // "Permission denied"
        break;
      }
      case 404: {
        // "Invalid request"
        break;
      }
      case 500: {
        // "Server error"
        break;
      }
      default: {
        // "Unknown error occurred"
        break;
      }
    }
  } else {
    logger.log(`[API] | Error ${error.message}`, LogType.ERROR);
  }

  return Promise.reject(error);
};

export class BaseResourceService implements IDomain {
  public readonly settings: BaseServiceSetting;
  private readonly requestTimeOut: number = 0;
  client: AxiosInstance;
  domain: string;
  logger: Logger;

  constructor(_domain: string) {
    this.settings = RESOURCE_SERVICE_SETTINGS;
    this.domain = _domain;
    this.requestTimeOut = requestTimeOut;
    this.client = setupAxiosInterceptors(this.getInstance());
    this.logger = Logger.getInstance();
  }

  private getInstance = (): AxiosInstance => {
    return axios.create({
      baseURL: `${this.settings.api.baseUrl}/${this.domain}`,
      timeout: this.requestTimeOut,
      params: {
        'api-version': this.settings.api.version,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };
}
