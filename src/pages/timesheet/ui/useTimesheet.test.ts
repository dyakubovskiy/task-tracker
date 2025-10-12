import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

import { getTodayKey, getMonthStartUTC, toDateKey, parseDurationToMinutes } from '../lib'
import { useTimesheetCalendar } from './useTimesheet'

vi.mock('../lib', () => ({
  toDateKey: vi.fn(),
  parseDurationToMinutes: vi.fn(),
  getTodayKey: vi.fn(),
  getMonthStartUTC: vi.fn()
}))

const mockToDateKey = vi.mocked(toDateKey)
const mockParseDuration = vi.mocked(parseDurationToMinutes)
const mockGetTodayKey = vi.mocked(getTodayKey)
const mockGetMonthStartUTC = vi.mocked(getMonthStartUTC)

const createWorklog = (overrides = {}) => {
  return {
    id: 1,
    start: '2024-10-01T09:00:00.000Z',
    duration: 'PT1H',
    issue: { id: '1', key: 'TASK-1', display: 'Task' },
    ...overrides
  }
}

describe('useTimesheetCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToDateKey.mockImplementation((value: string | Date) =>
      value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10)
    )
    mockParseDuration.mockImplementation(() => 60)
    mockGetTodayKey.mockReturnValue('2024-10-01')
    mockGetMonthStartUTC.mockImplementation((date: Date) => new Date(date))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('предоставляет текущий месяц и обновляет его при смене', () => {
    const { activeMonth, changeMonth } = useTimesheetCalendar()

    const initial = activeMonth.value
    changeMonth(1)
    const next = activeMonth.value

    expect(initial.getMonth() + 1 === next.getMonth() || next.getMonth() === 0).toBe(true)
    expect(next.getDate()).toBe(1)
  })

  it('формирует заголовок месяца на русском', () => {
    const { activeMonth, monthTitle } = useTimesheetCalendar()

    activeMonth.value = new Date('2024-05-15T00:00:00.000Z')
    expect(monthTitle.value).toBe('Май 2024')
  })

  it('группирует ворклоги по датам и формирует 6 недель календаря', () => {
    const { weeks, daySummaries, getMonthlyTimesheet, getDaySummary } = useTimesheetCalendar()

    const worklogs = [
      createWorklog({ id: 1, start: '2024-10-01T09:00:00.000Z', duration: 'PT2H' }),
      createWorklog({ id: 2, start: '2024-10-01T14:00:00.000Z', duration: 'PT1H30M' }),
      createWorklog({
        id: 3,
        start: '2024-10-03T09:00:00.000Z',
        duration: 'PT30M',
        issue: { id: '2', key: 'TASK-2', display: 'Task 2' }
      })
    ]

    mockParseDuration.mockImplementationOnce(() => 120)
    mockParseDuration.mockImplementationOnce(() => 90)
    mockParseDuration.mockImplementationOnce(() => 30)

    getMonthlyTimesheet(new Date('2024-10-01T00:00:00.000Z'), worklogs)

    expect(weeks.value).toHaveLength(6)
    expect(weeks.value[0]).toHaveLength(7)

    const flattened = weeks.value.flat()
    const dayMap = Object.fromEntries(flattened.map((day) => [day.dateKey, day]))

    expect(daySummaries.value.get('2024-10-01')?.items).toHaveLength(2)
    expect(getDaySummary('2024-10-01')?.totalMinutes).toBe(210)
    expect(dayMap['2024-10-01']?.totalMinutes).toBe(210)
    expect(dayMap['2024-10-03']?.totalMinutes).toBe(30)
  })

  it('помечает текущий день и дни текущего месяца', () => {
    const { weeks, getMonthlyTimesheet } = useTimesheetCalendar()

    getMonthlyTimesheet(new Date('2024-10-01T00:00:00.000Z'), [createWorklog()])

    const today = weeks.value.flat().find((day) => day.dateKey === '2024-10-01')
    expect(today?.isToday).toBe(true)
    expect(today?.isCurrentMonth).toBe(true)
  })

  it('возвращает 0 минут, если по дате нет записей', () => {
    const { weeks, daySummaries, getMonthlyTimesheet, getDaySummary } = useTimesheetCalendar()

    getMonthlyTimesheet(new Date('2024-10-01T00:00:00.000Z'), [])

    const flattened = weeks.value.flat()
    expect(flattened.every((day) => day.totalMinutes === 0)).toBe(true)
    expect(daySummaries.value.size).toBe(0)
    expect(getDaySummary('2024-10-05')).toBeUndefined()
  })

  it('создаёт пустое резюме для даты без записей', () => {
    const { getMonthlyTimesheet, getDaySummary } = useTimesheetCalendar()

    const worklogs = [createWorklog({ start: '2024-10-05T10:00:00.000Z' })]
    getMonthlyTimesheet(new Date('2024-10-01T00:00:00.000Z'), worklogs)

    expect(getDaySummary('2024-10-05')?.totalMinutes).toBe(60)
    expect(getDaySummary('2024-10-10')).toBeUndefined()
  })
})
