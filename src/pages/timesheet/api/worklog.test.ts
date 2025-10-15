import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/shared/api'
import { getWorklogs, deleteWorkLog } from './worklog'

const fetchListSpy = vi.spyOn(http, 'fetchList')
const requestSuccessSpy = vi.spyOn(http, 'requestSuccess')

describe('getWorklogs', () => {
  beforeEach(() => {
    fetchListSpy.mockReset()
    requestSuccessSpy.mockReset()
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
      duration: 'PT1H',
      comment: 'Worklog comment'
    }

    fetchListSpy.mockImplementationOnce(async (method, url, options) => {
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

    expect(fetchListSpy).toHaveBeenCalledTimes(1)
    expect(result).toEqual([
      {
        id: dto.id,
        start: dto.start,
        duration: dto.duration,
        issue: {
          id: dto.issue.id,
          key: dto.issue.key,
          display: dto.issue.display,
          comment: 'Worklog comment'
        }
      }
    ])
  })

  it('использует значение по умолчанию для perPage', async () => {
    fetchListSpy.mockImplementationOnce(async (method, url, options) => {
      expect(method).toBe('post')
      expect(url).toBe('/worklog/_search')
      expect(options?.query).toEqual({ perPage: 250 })
      const mapped = options?.adapter?.({
        self: '/worklog/2',
        id: 2,
        version: 1,
        issue: {
          self: '/issue/KEY-2',
          id: '1001',
          key: 'KEY-2',
          display: 'Issue title 2'
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
        createdAt: '2024-02-01T00:00:00.000Z',
        updatedAt: '2024-02-01T01:00:00.000Z',
        start: '2024-02-01T08:00:00.000Z',
        duration: 'PT30M'
      } as never) as
        | undefined
        | {
            issue?: {
              comment: string | null
            }
          }

      expect(mapped?.issue?.comment).toBeNull()
      return mapped ? [mapped] : []
    })

    const result = await getWorklogs({
      userId: 2,
      period: { from: '2024-02-01', to: '2024-02-29' }
    })

    expect(fetchListSpy).toHaveBeenCalledTimes(1)
    expect(result[0]?.issue.comment).toBeNull()
  })
})

describe('deleteWorkLog', () => {
  beforeEach(() => {
    requestSuccessSpy.mockReset()
  })

  it('отправляет запрос на удаление ворклога и возвращает результат', async () => {
    requestSuccessSpy.mockResolvedValueOnce(true)

    const result = await deleteWorkLog('ISSUE-1', 42)

    expect(requestSuccessSpy).toHaveBeenCalledWith('delete', '/issues/ISSUE-1/worklog/42')
    expect(result).toBe(true)
  })

  it('возвращает false, если запрос не успешен', async () => {
    requestSuccessSpy.mockResolvedValueOnce(false)

    const result = await deleteWorkLog('ISSUE-2', 7)

    expect(requestSuccessSpy).toHaveBeenCalledWith('delete', '/issues/ISSUE-2/worklog/7')
    expect(result).toBe(false)
  })
})

afterAll(() => {
  fetchListSpy.mockRestore()
  requestSuccessSpy.mockRestore()
})
