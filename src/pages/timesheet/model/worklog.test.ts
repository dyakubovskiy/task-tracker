import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { useWorklog } from './worklog'
import { getWorklogs } from '../api'
import { getMonthPeriod } from '../lib'

vi.mock('../api', () => ({
  getWorklogs: vi.fn()
}))

vi.mock('../lib', () => ({
  getMonthPeriod: vi.fn()
}))

describe('useWorklog', () => {
  const mockWorklogs = [{ id: 1 }]

  beforeEach(() => {
    vi.mocked(getWorklogs).mockResolvedValue(mockWorklogs as never)
    vi.mocked(getMonthPeriod).mockReturnValue({
      from: '2024-10-01T00:00:00.000+0000',
      to: '2024-10-31T23:59:59.999+0000'
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('возвращает worklogs и проксирует параметры', async () => {
    const { fetchWorklogs } = useWorklog()
    const month = new Date('2024-10-15T12:00:00.000Z')

    const result = await fetchWorklogs(month)

    expect(getMonthPeriod).toHaveBeenCalledWith(month)
    expect(getWorklogs).toHaveBeenCalledWith({
      userId: '8000000000000085',
      period: {
        from: '2024-10-01T00:00:00.000+0000',
        to: '2024-10-31T23:59:59.999+0000'
      }
    })
    expect(result).toBe(mockWorklogs)
  })

  it('пробрасывает исключение fetchWorklogs', async () => {
    const failure = new Error('API down')
    vi.mocked(getWorklogs).mockRejectedValueOnce(failure)

    const { fetchWorklogs } = useWorklog()

    await expect(fetchWorklogs(new Date('2024-01-01'))).rejects.toThrow(failure)
  })
})
