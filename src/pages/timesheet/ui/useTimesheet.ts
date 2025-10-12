import type { Ref } from 'vue'
import type { Worklog } from '../model'

import { ref, computed } from 'vue'
import { toDateKey, parseDurationToMinutes, getTodayKey, getMonthStartUTC } from '../lib'

export interface CalendarDay {
  dateKey: string
  label: number
  isCurrentMonth: boolean
  isToday: boolean
  totalMinutes: number
}

export interface DayWorklogSummary {
  dateKey: string
  totalMinutes: number
  items: Array<NormalizedWorklog>
}

interface NormalizedWorklog {
  id: number
  dateKey: string
  minutes: number
  issue: WorklogIssue
}

interface WorklogIssue {
  id: string
  key: string
  display: string
}

interface TimesheetCalendar {
  activeMonth: Ref<Date>
  weeks: Ref<Array<Array<CalendarDay>>>
  monthTitle: Ref<string>
  daySummaries: Ref<Map<string, DayWorklogSummary>>
  changeMonth: (offset: number) => void
  getMonthlyTimesheet: (date: Date, worklogs: Array<Worklog>) => void
  getDaySummary: (dateKey: string) => DayWorklogSummary | undefined
}

const CALENDAR_WEEKS = 6
const DAYS_PER_WEEK = 7
const CALENDAR_CELLS = CALENDAR_WEEKS * DAYS_PER_WEEK

export const useTimesheetCalendar = (): TimesheetCalendar => {
  const activeMonth: TimesheetCalendar['activeMonth'] = ref(new Date())
  const weeks: TimesheetCalendar['weeks'] = ref([])
  const daySummaries: TimesheetCalendar['daySummaries'] = ref(new Map<string, DayWorklogSummary>())

  const monthTitle: TimesheetCalendar['monthTitle'] = computed(() => {
    const text = activeMonth.value
      .toLocaleString('ru-RU', { month: 'long', year: 'numeric' })
      .replace(' г.', '')

    return text.charAt(0).toUpperCase() + text.slice(1)
  })

  const changeMonth: TimesheetCalendar['changeMonth'] = (offset) => {
    const next = new Date(activeMonth.value)
    next.setMonth(next.getMonth() + offset)
    next.setDate(1)
    activeMonth.value = next
  }

  const getMonthlyTimesheet: TimesheetCalendar['getMonthlyTimesheet'] = (date, worklogs) => {
    const summaries = groupWorklogsByDate(worklogs)

    daySummaries.value = summaries
    weeks.value = chunkByWeek(buildCalendarDays(getMonthStartUTC(date), summaries))
  }

  const normalizeWorklog = (entry: Worklog): NormalizedWorklog => ({
    id: entry.id,
    dateKey: toDateKey(entry.start),
    minutes: parseDurationToMinutes(entry.duration),
    issue: entry.issue
  })

  const groupWorklogsByDate = (entries: Array<Worklog>): Map<string, DayWorklogSummary> => {
    const summaries = new Map<string, DayWorklogSummary>()

    for (const worklog of entries) {
      const normalized = normalizeWorklog(worklog)
      const existing = summaries.get(normalized.dateKey)

      if (existing) {
        existing.totalMinutes += normalized.minutes
        existing.items.push(normalized)
      } else {
        summaries.set(normalized.dateKey, {
          dateKey: normalized.dateKey,
          totalMinutes: normalized.minutes,
          items: [normalized]
        })
      }
    }

    return summaries
  }

  const getMonthBoundaries = (targetDate: Date): { firstDay: Date; lastDay: Date } => {
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth()

    return {
      firstDay: new Date(year, month, 1),
      lastDay: new Date(year, month + 1, 0)
    }
  }

  const getCalendarStartDate = (firstDayOfMonth: Date): Date => {
    const weekdayOffset = (firstDayOfMonth.getDay() + 6) % 7
    const startDate = new Date(firstDayOfMonth)

    startDate.setDate(firstDayOfMonth.getDate() - weekdayOffset)

    return startDate
  }

  const createCalendarDay = (
    date: Date,
    summaries: Map<string, DayWorklogSummary>,
    monthBoundaries: { firstDay: Date; lastDay: Date }
  ): CalendarDay => {
    const dateKey = toDateKey(date)

    return {
      dateKey,
      label: date.getDate(),
      isCurrentMonth: date >= monthBoundaries.firstDay && date <= monthBoundaries.lastDay,
      isToday: dateKey === getTodayKey(),
      totalMinutes: summaries.get(dateKey)?.totalMinutes ?? 0
    }
  }

  const buildCalendarDays = (
    targetDate: Date,
    summaries: Map<string, DayWorklogSummary>
  ): Array<CalendarDay> => {
    const monthBoundaries = getMonthBoundaries(targetDate)
    const startDate = getCalendarStartDate(monthBoundaries.firstDay)

    return Array.from({ length: CALENDAR_CELLS }, (_, index) => {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + index)
      return createCalendarDay(currentDate, summaries, monthBoundaries)
    })
  }

  const chunkByWeek = (days: Array<CalendarDay>): Array<Array<CalendarDay>> =>
    Array.from({ length: CALENDAR_WEEKS }, (_, weekIndex) =>
      days.slice(weekIndex * DAYS_PER_WEEK, (weekIndex + 1) * DAYS_PER_WEEK)
    )

  const getDaySummary: TimesheetCalendar['getDaySummary'] = (dateKey) =>
    daySummaries.value.get(dateKey)

  return {
    activeMonth: computed(() => activeMonth.value),
    weeks: computed(() => weeks.value),
    monthTitle,
    daySummaries: computed(() => daySummaries.value),
    changeMonth,
    getMonthlyTimesheet,
    getDaySummary
  }
}
