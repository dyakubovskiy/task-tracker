import { userModel } from '@/entities/user'
import { http } from '@/shared/api'
import { getCurrentUser } from '../api'

interface UseAuth {
  login: (token: string) => Promise<boolean>
}

export const useAuth = (): UseAuth => {
  const { setUser } = userModel()

  const login: UseAuth['login'] = async (token) => {
    http.setToken(token)

    const user = await getCurrentUser()

    if (user) setUser({ ...user, token })
    else http.resetToken()

    return Boolean(user)
  }
  return { login }
}
