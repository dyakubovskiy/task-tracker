import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/shared/api'
import { getWorklogs } from './worklog'

const fetchListSpy = vi.spyOn(http, 'fetchList')

describe('getWorklogs', () => {
  beforeEach(() => {
    fetchListSpy.mockReset()
  })

  afterAll(() => {
    fetchListSpy.mockRestore()
  })

  it('вызывает http.fetchList с корректными параметрами и маппит результат', async () => {
    const period = { from: '2024-01-01', to: '2024-01-31' }
    const dto = {
      self: '/worklog/1',
      id: 1,
      version: 2,
      issue: {
        self: '/issue/KEY-1',
        id: '1000',
        key: 'KEY-1',
        display: 'Issue title'
      },
      createdBy: {
        self: '/user/creator',
        id: 'creator-id',
        display: 'Creator',
        cloudUid: 'cloud-creator',
        passportUid: 1
      },
      updatedBy: {
        self: '/user/updater',
        id: 'updater-id',
        display: 'Updater',
        cloudUid: 'cloud-updater',
        passportUid: 2
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T01:00:00.000Z',
      start: '2024-01-01T08:00:00.000Z',
      duration: 'PT1H'
    }

    fetchListSpy.mockImplementation(async (method, url, options) => {
      expect(method).toBe('post')
      expect(url).toBe('/worklog/_search')
      expect(options?.query).toEqual({ perPage: 100 })
      expect(options?.payload).toEqual({
        createdBy: 1,
        start: period
      })

      const mapped = options?.adapter?.(dto as never)
      return mapped ? [mapped] : []
    })

    const result = await getWorklogs({
      userId: 1,
      period,
      elementCount: 100
    })

    expect(result).toEqual([
      {
        id: dto.id,
        start: dto.start,
        duration: dto.duration,
        issue: {
          id: dto.issue.id,
          key: dto.issue.key,
          display: dto.issue.display,
          comment: null
        }
      }
    ])
  })

  it('использует значение по умолчанию для perPage', async () => {
    fetchListSpy.mockImplementation(async (_method, _url, options) => {
      expect(options?.query).toEqual({ perPage: 250 })
      return []
    })

    await getWorklogs({
      userId: 2,
      period: { from: '2024-02-01', to: '2024-02-29' }
    })

    expect(fetchListSpy).toHaveBeenCalledTimes(1)
  })
})
