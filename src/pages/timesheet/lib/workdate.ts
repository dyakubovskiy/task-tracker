const WORK_HOURS_PER_DAY = 8
const MINUTES_IN_HOUR = 60
const TIMEZONE_OFFSET_MS = 3 * 60 * 60 * 1000

export const toDateKey = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value)
  const localDate = new Date(date.getTime() + TIMEZONE_OFFSET_MS)

  const year = localDate.getUTCFullYear()
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(localDate.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const getMonthPeriod = (date: Date): { from: string; to: string } => {
  const year = date.getFullYear()
  const month = date.getMonth()

  const monthStartMs = Date.UTC(year, month, 1, 0, 0, 0, 0) - TIMEZONE_OFFSET_MS
  const lastDay = new Date(year, month + 1, 0).getDate()
  const monthEndMs = Date.UTC(year, month, lastDay, 23, 59, 59, 999) - TIMEZONE_OFFSET_MS

  return {
    from: toTrackerDate(monthStartMs),
    to: toTrackerDate(monthEndMs)
  }
}

export const toTrackerDate = (ms: number): string => {
  return new Date(ms).toISOString().replace('Z', '+0000')
}

export const parseDurationToMinutes = (duration: string): number => {
  const isoRegex = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/u
  const match = isoRegex.exec(duration)

  if (!match) return 0

  const days = match[1] ? Number(match[1]) : 0
  const hours = match[2] ? Number(match[2]) : 0
  const minutes = match[3] ? Number(match[3]) : 0

  return (days * WORK_HOURS_PER_DAY + hours) * MINUTES_IN_HOUR + minutes
}

export const formatMinutes = (minutes: number): string => {
  if (minutes <= 0) return '—'

  const hours = Math.floor(minutes / MINUTES_IN_HOUR)
  const restMinutes = minutes % MINUTES_IN_HOUR

  if (hours && restMinutes) return `${hours} ч ${restMinutes} м`
  if (hours) return `${hours} ч`
  return `${restMinutes} м`
}

export const getTodayKey = (): string => toDateKey(new Date())

export const getMonthStartUTC = (date: Date): Date => {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0))
}
