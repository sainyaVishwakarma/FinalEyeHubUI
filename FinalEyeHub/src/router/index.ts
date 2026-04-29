import { RouteName } from '@/constants/RouteName'
import { RoutePath } from '@/constants/RoutePath'
import { authorizationService } from '@/services/auth'
// import { useAuthStore } from '@/stores/authModule'
import { createRouter, createWebHistory } from 'vue-router'
import { authMiddleWare } from './RouteMiddleware'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: RoutePath.Root,
      redirect: (to) => ({
        path: RoutePath.Dashboard,
        query: to.query,
      }),
    },
    {
      path: RoutePath.Dashboard,
      name: RouteName.Dashboard,
      component: () => import('@/views/Dashboard.vue'),
    },
    {
      path: RoutePath.Reports,
      name: RouteName.Reports,
      component: () => import('@/views/Reports.vue'),
    },
    {
      path: RoutePath.Viewer,
      name: RouteName.Viewer,
      component: () => import('@/views/Viewer.vue'),
    },
    {
      path: RoutePath.Txlf,
      name: RouteName.Txlf,
      component: () => import('@/views/Txlf.vue'),
    },
    {
      path: RoutePath.Finalize,
      name: RouteName.Finalize,
      component: () => import('@/views/Finalize.vue'),
    },

    // {
    //   path: RoutePath.Logout,
    //   name: RouteName.Logout,
    //   component: () => import('../views/LogoutView.vue'),
    //   beforeEnter: (to, from, next) => {
    //     const authStore = useAuthStore()
    //     console.log(authStore.authenticated)
    //     if (authStore.authenticated) {
    //       authorizationService.logout()
    //       return
    //     } else {
    //       next()
    //     }
    //   },
    // },
    // {
    //   path: RoutePath.Auth,
    //   component: () => import('../views/LoginCallback.vue'),
    //   meta: {
    //     // Parameter is responsible to ignore analytics in Matomo
    //     analyticsIgnore: true,
    //   },
    // },
    // {
    //   path: RoutePath.SilentAuth,
    //   component: () => import('../views/LoginCallback.vue'),
    //   meta: {
    //     analyticsIgnore: true,
    //   },
    //   props: {
    //     silentMode: true,
    //   },
    // },

    {
      path: '/:catchAll(.*)',
      redirect: RoutePath.Dashboard,
    },
  ],
})

router.beforeEach(authMiddleWare)

export default router
