import { http } from '@/shared/api'
import { getCurrentUser } from '../api'

interface UseAuth {
  login: (token: string) => Promise<boolean>
}

export const useAuth = (): UseAuth => {
  const login: UseAuth['login'] = async (token) => {
    http.setToken(token)

    const user = await getCurrentUser()
    if (!user) http.resetToken()

    return Boolean(user)
  }
  return { login }
}
