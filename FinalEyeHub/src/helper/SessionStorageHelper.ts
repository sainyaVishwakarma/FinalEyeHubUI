enum SessionStorageKeys {
  IMPERSONATEDUSER = 'impersonatedUserInfo',
}

const getImpersonatedUserInfo = () => {
  return JSON.parse(sessionStorage.getItem(SessionStorageKeys.IMPERSONATEDUSER) || '{}');
};

const setImpersonatedUserInfo = (user: any): void => {
  sessionStorage.setItem(SessionStorageKeys.IMPERSONATEDUSER, JSON.stringify(user));
};

const clearImpersonatedUserInfo = (): void => {
  sessionStorage.removeItem(SessionStorageKeys.IMPERSONATEDUSER);
};

export { getImpersonatedUserInfo, setImpersonatedUserInfo, clearImpersonatedUserInfo };
