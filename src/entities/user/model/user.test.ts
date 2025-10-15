import type { Ref } from 'vue'

import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let storageRef: Ref<{ id: number; name: string; token: string } | null>

const useLocalStorageMock = vi.fn(() => storageRef)
const authorizeEmitMock = vi.fn()
const authorizeOnMock = vi.fn()

vi.mock('@/shared/lib/storage', () => ({
  useLocalStorage: useLocalStorageMock
}))

vi.mock('./events', () => ({
  useUserEvents: () => ({
    authorize: {
      emit: authorizeEmitMock,
      on: authorizeOnMock
    }
  })
}))

describe('userModel', () => {
  beforeEach(() => {
    vi.resetModules()
    storageRef = ref(null)
    useLocalStorageMock.mockReturnValue(storageRef)
    authorizeEmitMock.mockClear()
    authorizeOnMock.mockClear()
  })

  it('бросает исключение при попытке получить пользователя без авторизации', async () => {
    const { userModel } = await import('./user')
    const model = userModel()

    expect(model.isUserAuthorized.value).toBe(false)
    expect(() => model.getAuthUser()).toThrow('Logic Exception. User should be authorized')
  })

  it('сохраняет пользователя, помечает как авторизованного и эмитит событие', async () => {
    const { userModel } = await import('./user')
    const model = userModel()

    const payload = { id: 42, name: 'Alice', token: 'token-42' }
    model.setUser(payload)

    expect(storageRef.value).toEqual(payload)
    expect(model.isUserAuthorized.value).toBe(true)
    expect(model.getAuthUser()).toEqual(payload)
    expect(authorizeEmitMock).toHaveBeenCalledWith({ token: 'token-42' })
  })

  it('передаёт обработчик события авторизации', async () => {
    const { userModel } = await import('./user')
    const model = userModel()

    const handler = vi.fn()
    model.onAuthorize(handler)

    expect(authorizeOnMock).toHaveBeenCalledWith(handler)
  })
})
