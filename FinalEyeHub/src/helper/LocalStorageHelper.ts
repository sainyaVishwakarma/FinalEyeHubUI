import { useLocalStorage } from '@vueuse/core';

const enum LocalStorageKeys {
  AccessToken = 'access_token',
}

const setAccessToken = (accessToken: string) => {
  useLocalStorage(LocalStorageKeys.AccessToken, accessToken);
};

const getAccessToken = () => {
  return localStorage.getItem(LocalStorageKeys.AccessToken);
};

const revokeAccessToken = () => {
  localStorage.removeItem(LocalStorageKeys.AccessToken);
};

export { setAccessToken, getAccessToken, revokeAccessToken };
