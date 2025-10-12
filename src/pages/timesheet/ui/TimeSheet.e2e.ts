import { test, expect } from '@playwright/test'

const FIXED_DATE_ISO = '2024-10-01T00:00:00.000Z'

const formatDateKey = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const fixedDate = new Date(FIXED_DATE_ISO)
const currentYear = fixedDate.getUTCFullYear()
const currentMonth = fixedDate.getUTCMonth()
const currentDateKey = formatDateKey(currentYear, currentMonth, 1)
const currentStartISO = new Date(Date.UTC(currentYear, currentMonth, 1, 9, 0, 0, 0)).toISOString()

const nextMonthDate = new Date(Date.UTC(currentYear, currentMonth + 1, 5, 9, 0, 0, 0))
const nextDateKey = formatDateKey(
  nextMonthDate.getUTCFullYear(),
  nextMonthDate.getUTCMonth(),
  nextMonthDate.getUTCDate()
)
const nextStartISO = nextMonthDate.toISOString()

const TIMEZONE_OFFSET_MS = 3 * 60 * 60 * 1000
const toTrackerDate = (ms: number) => new Date(ms).toISOString().replace('Z', '+0000')

const getPeriod = (year: number, month: number) => {
  const monthStart = Date.UTC(year, month, 1, 0, 0, 0, 0) - TIMEZONE_OFFSET_MS
  const lastDay = new Date(year, month + 1, 0).getDate()
  const monthEnd = Date.UTC(year, month, lastDay, 23, 59, 59, 999) - TIMEZONE_OFFSET_MS

  return {
    from: toTrackerDate(monthStart),
    to: toTrackerDate(monthEnd)
  }
}

const currentPeriod = getPeriod(currentYear, currentMonth)
const nextPeriodDate = new Date(Date.UTC(currentYear, currentMonth + 1, 1, 0, 0, 0, 0))
const nextPeriod = getPeriod(nextPeriodDate.getUTCFullYear(), nextPeriodDate.getUTCMonth())

const createWorklog = (overrides: Partial<Record<string, unknown>> = {}) => ({
  self: 'https://tempo.test/worklog/1',
  id: 1,
  version: 1,
  issue: {
    self: 'https://tempo.test/issue/1',
    id: '1',
    key: 'TASK-1',
    display: 'Task 1'
  },
  createdBy: {
    self: '',
    id: '',
    display: '',
    cloudUid: '',
    passportUid: 0
  },
  updatedBy: {
    self: '',
    id: '',
    display: '',
    cloudUid: '',
    passportUid: 0
  },
  createdAt: currentStartISO,
  updatedAt: currentStartISO,
  start: currentStartISO,
  duration: 'PT1H',
  ...overrides
})

type WorklogDTO = ReturnType<typeof createWorklog>
type MockQueueItem =
  | Array<WorklogDTO>
  | {
      payload?: Array<WorklogDTO>
      delay?: number
      status?: number
      headers?: Record<string, string>
    }
type WorklogRequestPayload = {
  createdBy?: string
  createdById?: string
  start?: { from: string; to: string }
}

declare global {
  interface Window {
    __mockWorklogQueue: Array<MockQueueItem>
    __capturedWorklogRequests: Array<unknown>
  }
}

test.describe('TimeSheet e2e', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ({ fixed }) => {
        const fixedTimestamp = new Date(fixed).valueOf()
        const RealDate = Date

        class MockDate extends RealDate {
          constructor(...args: unknown[]) {
            if (args.length === 0) {
              super(fixedTimestamp)
            } else {
              super(...(args as ConstructorParameters<typeof RealDate>))
            }
          }

          static now() {
            return fixedTimestamp
          }

          static parse = RealDate.parse
          static UTC = RealDate.UTC
        }

        Object.setPrototypeOf(MockDate, RealDate)

        window.Date = MockDate as unknown as DateConstructor

        const originalFetch = window.fetch.bind(window)
        window.__mockWorklogQueue = []
        window.__capturedWorklogRequests = []

        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          if (typeof input === 'string' && input.includes('/worklog/_search')) {
            try {
              const queue = (window.__mockWorklogQueue ?? []) as Array<MockQueueItem>
              const requests = (window.__capturedWorklogRequests ?? []) as Array<unknown>

              if (init?.body) {
                try {
                  requests.push(JSON.parse(init.body as string))
                } catch {
                  requests.push(init.body)
                }
              } else {
                requests.push({})
              }

              const nextResponse = queue.length ? queue.shift() : undefined

              let responsePayload: unknown = []
              let responseStatus = 200
              let responseHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
              let responseDelay = 0

              if (Array.isArray(nextResponse)) {
                responsePayload = nextResponse
              } else if (nextResponse && typeof nextResponse === 'object') {
                const entry = nextResponse as {
                  payload?: Array<WorklogDTO>
                  delay?: number
                  status?: number
                  headers?: Record<string, string>
                }
                if (typeof entry.delay === 'number') {
                  responseDelay = entry.delay
                }
                if (entry.payload) {
                  responsePayload = entry.payload
                }
                if (typeof entry.status === 'number') {
                  responseStatus = entry.status
                }
                if (entry.headers) {
                  responseHeaders = entry.headers
                }
              }

              if (responseDelay > 0) {
                await new Promise((resolve) => setTimeout(resolve, responseDelay))
              }

              return new Response(JSON.stringify(responsePayload), {
                status: responseStatus,
                headers: responseHeaders
              })
            } catch (error) {
              console.error('Mock fetch error', error)
              return new Response('[]', {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              })
            }
          }

          return originalFetch(input, init)
        }
      },
      { fixed: FIXED_DATE_ISO }
    )
  })

  test('показывает скелетон и заменяет его данными после загрузки', async ({ page }) => {
    const responses: Array<MockQueueItem> = [
      {
        delay: 400,
        payload: [
          createWorklog({
            duration: 'PT1H15M',
            issue: { id: '1', key: 'TASK-1', display: 'Task 1' }
          })
        ]
      }
    ]

    await page.addInitScript(
      ({ queue }) => {
        window.__mockWorklogQueue = queue
        window.__capturedWorklogRequests = []
      },
      { queue: responses }
    )

    await page.goto('/timesheet')

    await expect(page.locator('.calendarSkeleton .dayCell')).toHaveCount(42)
    await page.waitForSelector('.calendarGrid .dayCell:not(.skeleton)')

    await expect(page.locator(`[data-date-key="${currentDateKey}"] .dayTotal`)).toHaveText(
      '1 ч 15 м',
      {
        timeout: 10000
      }
    )
  })

  test('открывает детали дня с задачами', async ({ page }) => {
    const responses: Array<MockQueueItem> = [
      {
        payload: [
          createWorklog({
            duration: 'PT45M',
            issue: { id: '1', key: 'TASK-101', display: 'Refactor API' }
          }),
          createWorklog({
            id: 2,
            start: new Date(Date.UTC(currentYear, currentMonth, 1, 13, 0, 0, 0)).toISOString(),
            duration: 'PT30M',
            issue: { id: '2', key: 'TASK-102', display: 'Fix styles' }
          })
        ]
      }
    ]

    await page.addInitScript(
      ({ queue }) => {
        window.__mockWorklogQueue = queue
        window.__capturedWorklogRequests = []
      },
      { queue: responses }
    )

    await page.goto('/timesheet')
    await page.waitForSelector(`[data-date-key="${currentDateKey}"]`)
    await expect(page.locator(`[data-date-key="${currentDateKey}"] .dayTotal`)).toHaveText(
      '1 ч 15 м',
      {
        timeout: 10000
      }
    )

    await page.locator(`[data-date-key="${currentDateKey}"]`).click()
    const modal = page.locator('.detailsOverlay')
    await expect(modal).toBeVisible()
    await expect(modal.locator('.detailsItem')).toHaveCount(2)
    await expect(modal).toContainText('TASK-101')
    await expect(modal).toContainText('TASK-102')

    await page.locator('[aria-label="Закрыть"]').click()
    await expect(modal).toBeHidden()
  })

  test('запрашивает новые данные при переключении месяца', async ({ page }) => {
    const responses: Array<MockQueueItem> = [
      {
        payload: [
          createWorklog({ duration: 'PT1H', issue: { id: '1', key: 'TASK-1', display: 'Task 1' } })
        ]
      },
      {
        payload: [
          createWorklog({
            id: 3,
            start: nextStartISO,
            duration: 'PT2H',
            issue: { id: '3', key: 'TASK-3', display: 'November Task' }
          })
        ]
      }
    ]

    await page.addInitScript(
      ({ queue }) => {
        window.__mockWorklogQueue = queue
        window.__capturedWorklogRequests = []
      },
      { queue: responses }
    )

    await page.goto('/timesheet')
    await page.waitForSelector(`[data-date-key="${currentDateKey}"]`)
    await expect(page.locator(`[data-date-key="${currentDateKey}"] .dayTotal`)).toHaveText('1 ч', {
      timeout: 10000
    })

    await page.locator('[aria-label="Следующий месяц"]').click()
    await page.waitForSelector(`[data-date-key="${nextDateKey}"]`)
    await expect(page.locator(`[data-date-key="${nextDateKey}"] .dayTotal`)).toHaveText('2 ч', {
      timeout: 10000
    })

    const requests = (await page.evaluate(() => window.__capturedWorklogRequests)) as unknown

    if (!Array.isArray(requests) || requests.length < 2) {
      throw new Error(
        `Expected two captured worklog requests, received ${Array.isArray(requests) ? requests.length : 0}`
      )
    }

    const [firstPayload, secondPayload] = requests as [WorklogRequestPayload, WorklogRequestPayload]

    expect(firstPayload.createdBy ?? firstPayload.createdById).toBe('8000000000000085')
    expect(firstPayload.start?.from).toBe(currentPeriod.from)
    expect(firstPayload.start?.to).toBe(currentPeriod.to)
    expect(secondPayload.start?.from).toBe(nextPeriod.from)
    expect(secondPayload.start?.to).toBe(nextPeriod.to)
  })
})
