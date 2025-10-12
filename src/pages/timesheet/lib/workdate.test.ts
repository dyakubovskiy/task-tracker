import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

import {
  toDateKey,
  getMonthPeriod,
  toTrackerDate,
  parseDurationToMinutes,
  formatMinutes,
  getTodayKey,
  getMonthStartUTC
} from '@/pages/timesheet/lib/workdate'

describe('workdate utilities', () => {
  describe('toDateKey', () => {
    it('форматирует дату без смещения на следующий день', () => {
      expect(toDateKey('2024-10-10T00:30:00.000Z')).toBe('2024-10-10')
    })

    it('учитывает смещение по часовому поясу и переносит дату на следующий день', () => {
      expect(toDateKey('2024-10-10T22:30:00.000Z')).toBe('2024-10-11')
    })

    it('принимает экземпляр Date', () => {
      const date = new Date('2024-05-05T11:00:00.000Z')
      expect(toDateKey(date)).toBe('2024-05-05')
    })
  })

  describe('getMonthPeriod', () => {
    it('возвращает корректные границы месяца с учётом смещения', () => {
      const period = getMonthPeriod(new Date('2024-10-18T12:00:00.000Z'))

      expect(period).toEqual({
        from: '2024-09-30T21:00:00.000+0000',
        to: '2024-10-31T20:59:59.999+0000'
      })
    })
  })

  describe('toTrackerDate', () => {
    it('конвертирует миллисекунды в строку формата +0000', () => {
      const ms = Date.UTC(2024, 4, 9, 7, 0, 0, 0)
      expect(toTrackerDate(ms)).toBe('2024-05-09T07:00:00.000+0000')
    })
  })

  describe('parseDurationToMinutes', () => {
    it('парсит длительность в днях, часах и минутах', () => {
      expect(parseDurationToMinutes('P2DT3H15M')).toBe((2 * 8 + 3) * 60 + 15)
    })

    it('возвращает минуты для чисто минутного значения', () => {
      expect(parseDurationToMinutes('PT45M')).toBe(45)
    })

    it('возвращает минуты для часов без минут', () => {
      expect(parseDurationToMinutes('PT6H')).toBe(360)
    })

    it('возвращает 0 для некорректного формата', () => {
      expect(parseDurationToMinutes('INVALID')).toBe(0)
    })
  })

  describe('formatMinutes', () => {
    it('возвращает прочерк для нулевого и отрицательного значения', () => {
      expect(formatMinutes(0)).toBe('—')
      expect(formatMinutes(-15)).toBe('—')
    })

    it('форматирует значения в минуты, часы и часы с минутами', () => {
      expect(formatMinutes(45)).toBe('45 м')
      expect(formatMinutes(120)).toBe('2 ч')
      expect(formatMinutes(125)).toBe('2 ч 5 м')
    })
  })

  describe('getTodayKey', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('возвращает ключ текущего дня с учётом смещения', () => {
      vi.setSystemTime(new Date('2024-02-10T23:30:00.000Z'))
      expect(getTodayKey()).toBe('2024-02-11')
    })
  })

  describe('getMonthStartUTC', () => {
    it('возвращает дату начала месяца в UTC', () => {
      const result = getMonthStartUTC(new Date('2024-12-24T15:45:00.000Z'))
      expect(result).toEqual(new Date(Date.UTC(2024, 11, 1, 0, 0, 0, 0)))
    })
  })
})
