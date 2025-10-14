import { createApp } from 'vue'
import { router } from './router'
import App from './App.vue'
import './styles/index.css'

import { userModel } from '@/entities/user'
import { http } from '@/shared/api'

const { onAuthorize } = userModel()
onAuthorize(({ token }) => http.setToken(token))

const app = createApp(App)

app.use(router)

export { app }
