import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { getCurrentUser } from './login'
import { http } from '@/shared/api'

vi.mock('@/shared/api', () => ({
  http: {
    fetchData: vi.fn()
  }
}))

describe('getCurrentUser', () => {
  const fetchData = http.fetchData as ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchData.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('запрашивает данные пользователя и возвращает адаптированный ответ', async () => {
    const dto = {
      self: 'https://tracker/users/123',
      uid: 123,
      login: 'john.doe',
      trackerUid: 999,
      passportUid: 777,
      cloudUid: 'cloud-123',
      firstName: 'John',
      lastName: 'Doe',
      display: 'John Doe',
      email: 'john.doe@example.com',
      external: false,
      hasLicense: true,
      dismissed: false,
      useNewFilters: true,
      disableNotifications: false,
      firstLoginDate: '2024-01-01T00:00:00Z',
      lastLoginDate: '2024-02-01T00:00:00Z',
      welcomeMailSent: true,
      sources: ['staff']
    }

    fetchData.mockImplementation(async (_method, _url, options) => {
      const adapter = options?.adapter
      return adapter ? adapter(dto) : null
    })

    const result = await getCurrentUser()

    expect(fetchData).toHaveBeenCalledWith('get', '/myself', {
      adapter: expect.any(Function)
    })
    expect(result).toEqual({ id: 123, name: 'John Doe' })
  })

  it('возвращает null, если fetchData возвращает null', async () => {
    fetchData.mockResolvedValueOnce(null)

    const result = await getCurrentUser()

    expect(result).toBeNull()
  })
})
