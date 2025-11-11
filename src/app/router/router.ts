import { createRouter, createWebHistory } from 'vue-router'
import { LOGIN_ROUTE, LOGIN_LINK } from '@/pages/login'
import { TIME_SHEET_ROUTE, TIME_SHEET_LINK } from '@/pages/timesheet'
import { userModel } from '@/entities/user'
import { MAIN_LINK } from '@/shared/config'
import { CenteredLayout, SidebarLayout } from '../layout'

const { isUserAuthorized } = userModel()

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: MAIN_LINK.name,
      redirect: TIME_SHEET_LINK,
      component: SidebarLayout,
      children: [TIME_SHEET_ROUTE]
    },
    {
      path: LOGIN_ROUTE.path,
      component: CenteredLayout,
      children: [
        {
          path: '',
          name: LOGIN_ROUTE.name,
          component: () => LOGIN_ROUTE.component()
        }
      ]
    },
    // TIME_SHEET_ROUTE,
    {
      path: '/:pathMatch(.*)*',
      redirect: TIME_SHEET_LINK
    }
  ]
})

router.beforeEach((to) => {
  if (!isUserAuthorized.value && to.name !== LOGIN_LINK.name) {
    return { path: '/login' }
  }
})

export { router }
