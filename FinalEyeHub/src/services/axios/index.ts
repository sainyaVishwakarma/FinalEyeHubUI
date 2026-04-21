import type { AxiosInstance } from 'axios';
import { onErrorResponse, onRequest, onResponse } from './BaseResourceService';

export const setupAxiosInterceptors = (instance: AxiosInstance): AxiosInstance => {
  instance.interceptors.request.use(onRequest, onErrorResponse);
  instance.interceptors.response.use(onResponse, onErrorResponse);

  return instance;
};
