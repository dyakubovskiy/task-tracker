import { createRouter, createWebHistory } from 'vue-router'
import { LOGIN_ROUTE, LOGIN_LINK } from '@/pages/login'
import { CenteredLayout } from '../layout'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: LOGIN_LINK
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
    }
  ]
})

export { router }
