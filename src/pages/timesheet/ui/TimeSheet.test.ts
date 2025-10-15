import type { CalendarDay, DayWorklogSummary } from './useTimesheet'
import type { Worklog } from '../model'

import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getWorklogs } from '../api'
import TimeSheet from './TimeSheet.vue'

const getAuthUserMock = vi.fn<() => { id: number; name: string; token: string }>()

vi.mock('@/entities/user', () => ({
  userModel: () => ({
    getAuthUser: getAuthUserMock
  })
}))

vi.mock('../api', () => ({
  getWorklogs: vi.fn()
}))

const getWorklogsMock = vi.mocked(getWorklogs)

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

const mountComponent = () =>
  mount(TimeSheet, {
    attachTo: document.body
  })

describe('TimeSheet', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-10-01T00:00:00.000Z'))
    document.body.innerHTML = ''
    getWorklogsMock.mockReset()
    getAuthUserMock.mockReturnValue({ id: 1, name: 'Test User', token: 'token-1' })
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('показывает скелетон во время загрузки', async () => {
    const deferred = createDeferred<Worklog[]>()
    getWorklogsMock.mockReturnValueOnce(deferred.promise)

    const wrapper = mountComponent()

    await flushPromises()
    expect(wrapper.findAll('.dayCell.skeleton')).toHaveLength(42)

    const vm = wrapper.vm as unknown as {
      selectedSummary: DayWorklogSummary | null
      selectedDateTitle: string
    }
    expect(vm.selectedSummary).toBeNull()
    expect(vm.selectedDateTitle).toBe('')

    deferred.resolve([])
    await flushPromises()

    expect(wrapper.findAll('.dayCell.skeleton')).toHaveLength(0)
    wrapper.unmount()
  })

  it('отображает данные и открывает попап с деталями дня', async () => {
    getWorklogsMock.mockResolvedValueOnce([
      {
        id: 1,
        start: '2024-10-01T09:00:00.000Z',
        duration: 'PT1H30M',
        issue: { id: '1', key: 'TASK-1', display: 'Task 1', comment: null }
      },
      {
        id: 2,
        start: '2024-10-01T13:00:00.000Z',
        duration: 'PT45M',
        issue: { id: '2', key: 'TASK-2', display: 'Task 2', comment: null }
      },
      {
        id: 3,
        start: '2024-10-03T09:00:00.000Z',
        duration: 'PT30M',
        issue: { id: '3', key: 'TASK-3', display: 'Task 3', comment: null }
      }
    ])

    const wrapper = mountComponent()
    await flushPromises()

    const targetDay = wrapper.get('[data-date-key="2024-10-01"]')
    expect(targetDay.text()).toContain('2 ч 15 м')

    await targetDay.trigger('click')
    await flushPromises()

    const overlay = document.querySelector<HTMLDivElement>('.detailsOverlay')
    expect(overlay).not.toBeNull()
    const items = Array.from(document.querySelectorAll('.detailsItem'))
    expect(items).toHaveLength(2)
    const durations = Array.from(document.querySelectorAll('.detailsDuration')).map((node) =>
      node.textContent?.trim()
    )
    expect(durations).toEqual(['1 ч 30 м', '45 м'])

    const closeButton = document.querySelector<HTMLButtonElement>('[aria-label="Закрыть"]')
    expect(closeButton).not.toBeNull()
    closeButton?.click()
    await flushPromises()

    expect(document.querySelector<HTMLDivElement>('.detailsOverlay')).toBeNull()
    wrapper.unmount()
  })

  it('закрывает попап по клику на фон', async () => {
    getWorklogsMock.mockResolvedValueOnce([
      {
        id: 1,
        start: '2024-10-05T09:00:00.000Z',
        duration: 'PT1H',
        issue: { id: '4', key: 'TASK-4', display: 'Task 4', comment: null }
      }
    ])

    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.get('[data-date-key="2024-10-05"]').trigger('click')
    await flushPromises()

    const overlay = document.querySelector<HTMLDivElement>('.detailsOverlay')
    expect(overlay).not.toBeNull()
    overlay?.click()
    await flushPromises()

    expect(document.querySelector<HTMLDivElement>('.detailsOverlay')).toBeNull()
    wrapper.unmount()
  })

  it('повторно запрашивает данные при смене месяца', async () => {
    getWorklogsMock.mockResolvedValue([])

    const wrapper = mountComponent()
    await flushPromises()

    expect(getWorklogsMock).toHaveBeenCalledTimes(1)

    await wrapper.get('[aria-label="Следующий месяц"]').trigger('click')
    await flushPromises()

    expect(getWorklogsMock).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('запрашивает данные при переходе на предыдущий месяц', async () => {
    getWorklogsMock.mockResolvedValue([])

    const wrapper = mountComponent()
    await flushPromises()

    expect(getWorklogsMock).toHaveBeenCalledTimes(1)

    await wrapper.get('[aria-label="Предыдущий месяц"]').trigger('click')
    await flushPromises()

    expect(getWorklogsMock).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('показывает пустое состояние для дня без записей', async () => {
    getWorklogsMock.mockResolvedValueOnce([])

    const wrapper = mountComponent()
    await flushPromises()

    const targetDay = wrapper.get('[data-date-key="2024-10-01"]')
    await targetDay.trigger('click')
    await flushPromises()

    const emptyState = document.querySelector<HTMLParagraphElement>('.detailsEmpty')
    expect(emptyState?.textContent?.trim()).toBe('Нет записей за этот день')

    document.querySelector<HTMLButtonElement>('[aria-label="Закрыть"]')?.click()
    await flushPromises()

    expect(document.querySelector<HTMLDivElement>('.detailsOverlay')).toBeNull()
    wrapper.unmount()
  })

  it('не открывает попап, если календарь ещё загружается', async () => {
    const deferred = createDeferred<Worklog[]>()
    getWorklogsMock.mockReturnValueOnce(deferred.promise)

    const wrapper = mountComponent()
    await flushPromises()

    const day: CalendarDay = {
      dateKey: '2024-10-02',
      label: 2,
      isCurrentMonth: true,
      isToday: false,
      totalMinutes: 0
    }

    ;(wrapper.vm as unknown as { openDay: (day: CalendarDay) => void }).openDay(day)
    await flushPromises()

    expect(document.querySelector<HTMLDivElement>('.detailsOverlay')).toBeNull()

    deferred.resolve([])
    await flushPromises()
    wrapper.unmount()
  })

  it('закрывает попап при смене месяца', async () => {
    getWorklogsMock
      .mockResolvedValueOnce([
        {
          id: 1,
          start: '2024-10-01T09:00:00.000Z',
          duration: 'PT1H',
          issue: { id: '1', key: 'TASK-1', display: 'Task 1', comment: null }
        }
      ])
      .mockResolvedValueOnce([])

    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.get('[data-date-key="2024-10-01"]').trigger('click')
    await flushPromises()
    expect(document.querySelector<HTMLDivElement>('.detailsOverlay')).not.toBeNull()

    await wrapper.get('[aria-label="Следующий месяц"]').trigger('click')
    await flushPromises()

    expect(document.querySelector<HTMLDivElement>('.detailsOverlay')).toBeNull()
    wrapper.unmount()
  })

  it('поддерживает управление клавиатурой', async () => {
    getWorklogsMock.mockResolvedValue([
      {
        id: 1,
        start: '2024-10-01T10:00:00.000Z',
        duration: 'PT30M',
        issue: { id: '5', key: 'TASK-5', display: 'Task 5', comment: null }
      }
    ])

    const wrapper = mountComponent()
    await flushPromises()

    const targetDay = wrapper.get('[data-date-key="2024-10-01"]')

    await targetDay.trigger('keydown.enter')
    await flushPromises()
    expect(document.querySelector<HTMLDivElement>('.detailsOverlay')).not.toBeNull()

    document.querySelector<HTMLButtonElement>('[aria-label="Закрыть"]')?.click()
    await flushPromises()
    expect(document.querySelector<HTMLDivElement>('.detailsOverlay')).toBeNull()

    await targetDay.trigger('keydown.space')
    await flushPromises()
    expect(document.querySelector<HTMLDivElement>('.detailsOverlay')).not.toBeNull()

    document.querySelector<HTMLButtonElement>('[aria-label="Закрыть"]')?.click()
    await flushPromises()
    wrapper.unmount()
  })
})
