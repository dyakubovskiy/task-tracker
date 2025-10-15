import type { Ref } from 'vue'
import type { EventBusListener } from '@vueuse/core'

import { computed } from 'vue'
import { createSharedComposable } from '@vueuse/core'
import { useLocalStorage } from '@/shared/lib/storage'
import { useUserEvents } from './events'

interface User {
  id: number
  name: string
  token: string
}

interface UserModel {
  isUserAuthorized: Ref<boolean>
  getAuthUser: () => User
  setUser: (data: User) => void
  onAuthorize: (payload: EventBusListener<{ token: string }>) => void
}

const useUserModel = (): UserModel => {
  const { authorize } = useUserEvents()
  const user: Ref<User | null> = useLocalStorage('tracker-user')

  const isUserAuthorized: UserModel['isUserAuthorized'] = computed(() => user.value !== null)

  const getAuthUser: UserModel['getAuthUser'] = () => {
    if (user.value === null) throw new Error('Logic Exception. User should be authorized')
    return user.value
  }

  const setUser: UserModel['setUser'] = (data) => {
    user.value = data

    authorize.emit({ token: data.token })
  }

  return {
    isUserAuthorized,
    getAuthUser,
    setUser,
    onAuthorize: authorize.on
  }
}

export const userModel = createSharedComposable(useUserModel)
