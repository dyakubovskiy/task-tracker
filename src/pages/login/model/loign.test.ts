import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuth } from './loign'
import { http } from '@/shared/api'
import { getCurrentUser } from '../api'

vi.mock('@/shared/api', () => ({
  http: {
    setToken: vi.fn(),
    resetToken: vi.fn()
  }
}))

vi.mock('../api', () => ({
  getCurrentUser: vi.fn()
}))

describe('useAuth', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('устанавливает токен и возвращает true при успешной авторизации', async () => {
    ;(getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 1,
      name: 'John Doe'
    })

    const { login } = useAuth()
    const result = await login('token-123')

    expect(http.setToken).toHaveBeenCalledWith('token-123')
    expect(getCurrentUser).toHaveBeenCalledTimes(1)
    expect(http.resetToken).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('сбрасывает токен и возвращает false при ошибке авторизации', async () => {
    ;(getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const { login } = useAuth()
    const result = await login('token-456')

    expect(http.setToken).toHaveBeenCalledWith('token-456')
    expect(http.resetToken).toHaveBeenCalledTimes(1)
    expect(result).toBe(false)
  })
})
