import type { VueWrapper } from '@vue/test-utils'
import type { Worklog } from '../model'

import { createMemoryHistory, createRouter } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { TIME_SHEET_ROUTE } from '../config'
import { getWorklogs } from '../api'
import { getMonthPeriod } from '../lib'
import TimeSheet from './TimeSheet.vue'

const getAuthUserMock = vi.fn<() => { id: number; name: string; token: string }>()

vi.mock('@/entities/user', () => ({
  userModel: () => ({
    getAuthUser: getAuthUserMock
  })
}))

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>()
  return {
    ...actual,
    getWorklogs: vi.fn(actual.getWorklogs),
    deleteWorkLog: vi.fn()
  }
})

const mockedGetWorklogs = vi.mocked(getWorklogs)

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

const flushComponent = async (wrapper: VueWrapper) => {
  await flushPromises()
  await wrapper.vm.$nextTick()
}

const mountTimeSheet = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [TIME_SHEET_ROUTE]
  })

  await router.push('/timesheet')
  await router.isReady()

  const wrapper = mount(TimeSheet, {
    attachTo: document.body,
    global: {
      plugins: [router]
    }
  })

  return { wrapper, router }
}

describe('TimeSheet integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-10-01T00:00:00.000Z'))
    document.body.innerHTML = ''
    mockedGetWorklogs.mockReset()
    getAuthUserMock.mockReturnValue({ id: 1, name: 'Integrated User', token: 'token-int' })
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('отображает скелетон и данные после загрузки', async () => {
    const deferred = createDeferred<Array<Worklog>>()
    mockedGetWorklogs.mockReturnValueOnce(deferred.promise)

    const { wrapper } = await mountTimeSheet()

    await flushComponent(wrapper)
    expect(wrapper.findAll('.dayCell.skeleton')).toHaveLength(42)

    deferred.resolve([
      {
        id: 1,
        start: '2024-10-01T09:00:00.000Z',
        duration: 'PT1H30M',
        issue: { id: '1', key: 'TASK-1', display: 'Task 1', comment: null }
      }
    ])

    await flushComponent(wrapper)

    expect(wrapper.find('.calendarGrid').text()).toContain('1 ч 30 м')
    expect(mockedGetWorklogs).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('запрашивает рабочие логи с корректным периодом для текущего и следующего месяца', async () => {
    mockedGetWorklogs
      .mockResolvedValueOnce([
        {
          id: 1,
          start: '2024-10-01T09:00:00.000Z',
          duration: 'PT1H',
          issue: { id: '1', key: 'TASK-1', display: 'Task 1', comment: null }
        }
      ])
      .mockResolvedValueOnce([])

    const { wrapper } = await mountTimeSheet()
    await flushComponent(wrapper)

    expect(mockedGetWorklogs).toHaveBeenCalledTimes(1)
    expect(mockedGetWorklogs).toHaveBeenCalledWith({
      userId: 1,
      period: getMonthPeriod(new Date('2024-10-01T00:00:00.000Z'))
    })

    await wrapper.get('[aria-label="Следующий месяц"]').trigger('click')
    await flushComponent(wrapper)

    expect(mockedGetWorklogs).toHaveBeenCalledTimes(2)
    expect(mockedGetWorklogs).toHaveBeenLastCalledWith({
      userId: 1,
      period: getMonthPeriod(new Date('2024-11-01T00:00:00.000Z'))
    })

    wrapper.unmount()
  })

  it('показывает детали дня с агрегированным временем', async () => {
    mockedGetWorklogs.mockResolvedValue([
      {
        id: 1,
        start: '2024-10-01T09:00:00.000Z',
        duration: 'PT1H',
        issue: { id: '1', key: 'TASK-1', display: 'Task 1', comment: null }
      },
      {
        id: 2,
        start: '2024-10-01T13:00:00.000Z',
        duration: 'PT45M',
        issue: { id: '2', key: 'TASK-2', display: 'Task 2', comment: null }
      }
    ])

    const { wrapper } = await mountTimeSheet()
    await flushComponent(wrapper)

    const targetDay = wrapper.get('[data-date-key="2024-10-01"]')
    expect(targetDay.text()).toContain('1 ч 45 м')

    await targetDay.trigger('click')
    await flushComponent(wrapper)

    const overlay = document.querySelector<HTMLDivElement>('.detailsOverlay')
    expect(overlay).not.toBeNull()

    const issueNames = Array.from(document.querySelectorAll('.issueName')).map((node) =>
      node.textContent?.trim()
    )
    expect(issueNames).toEqual(['Task 1', 'Task 2'])

    const issueLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.issueKey')).map(
      (node) => node.getAttribute('href')
    )
    expect(issueLinks).toContain('https://tracker.yandex.ru/TASK-1')
    expect(issueLinks).toContain('https://tracker.yandex.ru/TASK-2')

    document.querySelector<HTMLButtonElement>('[aria-label="Закрыть диалог"]')?.click()
    await flushComponent(wrapper)
    wrapper.unmount()
  })
})
