import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { authorizationService } from '../services/auth'
// import { useAuthStore } from '@/stores/authModule'
import type { User } from 'oidc-client-ts'

export const authMiddleWare = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  // const authStore = useAuthStore()
  if (to.matched.some((record) => record.meta.requiresAuthorization)) {
    const user = (await authorizationService.getUser()) as User
    if (!user) {
      authorizationService.login()
      next(false)
    } else {
      // authStore.setUpUserCredentials(user)
      next()
    }
  } else {
    next()
  }
}
