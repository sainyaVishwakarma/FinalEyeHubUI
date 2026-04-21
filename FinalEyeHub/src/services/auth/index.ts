import { UserManager, type UserManagerSettings, User } from 'oidc-client-ts'
import router from '@/router'
import AUTHORIZATION_SERVICE_SETTINGS from './settings'
// import { useAuthStore } from '@/stores/authModule'
import { setAccessToken } from '@/helper/LocalStorageHelper'
import { RoutePath } from '@/constants/RoutePath'

class AuthorizationService {
  private manager: UserManager
  public readonly settings: UserManagerSettings

  constructor(settings: UserManagerSettings) {
    this.settings = settings
    this.manager = new UserManager(settings)

    this.manager.events.addUserLoaded(() => {
      // const authStore = useAuthStore()
      // authStore.authenticated = true
      // console.log(authStore.getUser)
      // console.log('addUserLoaded')
      // console.log('Authenticated')
    })

    this.manager.events.addSilentRenewError(() => {
      // console.log('Silent renew failed')
    })

    this.manager.events.addAccessTokenExpiring(() => {
      // console.log('Token expiring')
    })

    this.manager.events.addAccessTokenExpired(() => {
      // console.log('Silent renew expired')
      // const authStore = useAuthStore()
      // authStore.clearUserSession()
      this.manager.clearStaleState()
      this.login()
    })

    this.manager.events.addUserSignedOut(() => {
      this.login()
    })
  }

  login = () => {
    const currentPath = window.location.pathname + window.location.search
    if (window.location.pathname === RoutePath.Logout) {
      return this.manager.signinRedirect()
    } else {
      return this.manager.signinRedirect({
        state: currentPath, // Save original path here
      })
    }
  }

  getUser = () => {
    return this.manager.getUser()
  }

  logout = () => {
    this.manager.signoutRedirect()
    sessionStorage.removeItem('IsLoggedInUserMatomoEventTracked')
  }

  isLoggedIn = async () => {
    const user = await this.manager.getUser()
    return user !== null && !user.expired
  }

  loginCallback = () => {
    this.manager.signinCallback().then((loggedInUser: User | void) => {
      if (loggedInUser) {
        setAccessToken(loggedInUser.access_token)
      }
      const savedPath = (loggedInUser as User)?.state as string | undefined
      const redirectPath = savedPath && savedPath !== '/' ? savedPath : RoutePath.Root
      router.push(redirectPath)
    })
  }
  logoutCallback = () => {
    // console.log('logoutCallback')

    this.manager.removeUser()
  }

  renewToken = async () => {
    // console.log('In Renew Token')

    return await this.manager.signinSilentCallback().catch((error:any) => {
      console.log(`Renewal Failed : ${error}`)

      this.logout()
    })
  }
}

export const authorizationService = new AuthorizationService(AUTHORIZATION_SERVICE_SETTINGS)
