import { createRouter, createWebHistory } from 'vue-router'
import { LOGIN_ROUTE } from '@/pages/login'
import { TIME_SHEET_ROUTE, TIME_SHEET_LINK } from '@/pages/timesheet'
import { MAIN_LINK } from '@/shared/config'
import { CenteredLayout } from '../layout'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: MAIN_LINK.name,
      redirect: TIME_SHEET_LINK
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
    TIME_SHEET_ROUTE
  ]
})

export { router }
