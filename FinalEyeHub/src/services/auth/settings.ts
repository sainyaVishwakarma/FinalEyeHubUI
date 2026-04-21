import { type UserManagerSettings } from 'oidc-client-ts'

const AUTHORIZATION_SERVICE_SETTINGS: UserManagerSettings = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY || '',
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID || '',
  redirect_uri: `${import.meta.env.VITE_OIDC_REDIRECT_URI}/auth` || '',
  post_logout_redirect_uri: `${import.meta.env.VITE_OIDC_REDIRECT_URI}/logout` || '',
  silent_redirect_uri: `${import.meta.env.VITE_OIDC_REDIRECT_URI}/silent-auth` || '',
  revokeTokenTypes: ['access_token', 'refresh_token'],
  response_type: 'code',
  response_mode: 'query',
  revokeTokensOnSignout: true,
  automaticSilentRenew: true,
  includeIdTokenInSilentRenew: true,
  accessTokenExpiringNotificationTimeInSeconds: 60,
  loadUserInfo: true,
  scope: 'openid clients profile email username directory PDFAnnotatorAPI CarFSApi',
}

Object.freeze(AUTHORIZATION_SERVICE_SETTINGS)

export default AUTHORIZATION_SERVICE_SETTINGS
