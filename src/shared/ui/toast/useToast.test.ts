import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseUniqueId = vi.fn<() => string>()
const timeoutCalls: Array<{ callback: () => void; delay: number }> = []
const useTimeoutFnSpy = vi.fn((callback: () => void, delay: number) => {
  timeoutCalls.push({ callback, delay })
  return {
    stop: vi.fn(),
    start: vi.fn(),
    isPending: { value: false }
  }
})

vi.mock('../../lib/uuid', () => ({
  useUniqueId: mockUseUniqueId
}))

vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual<typeof import('@vueuse/core')>('@vueuse/core')
  return {
    ...actual,
    useTimeoutFn: useTimeoutFnSpy
  }
})

let useToast: typeof import('./useToast').useToast

beforeEach(async () => {
  vi.resetModules()
  mockUseUniqueId.mockReset()
  useTimeoutFnSpy.mockClear()
  timeoutCalls.length = 0
  ;({ useToast } = await import('./useToast'))
})

describe('useToast', () => {
  it('инициализирует пустой список уведомлений и варианты по умолчанию', () => {
    const toast = useToast()

    expect(toast.toasts.value).toEqual([])
    expect(toast.variants).toMatchObject({
      INFO: 'info',
      SUCCESS: 'success',
      DANGER: 'danger'
    })
  })

  it('добавляет тост с уникальным идентификатором', () => {
    mockUseUniqueId.mockReturnValueOnce('toast-1')
    const toast = useToast()

    const id = toast.addToast({
      title: 'Заголовок',
      desc: 'Описание',
      variant: toast.variants.INFO
    })

    expect(id).toBe('toast-1')
    expect(toast.toasts.value).toEqual([
      {
        id: 'toast-1',
        title: 'Заголовок',
        desc: 'Описание',
        variant: toast.variants.INFO
      }
    ])
  })

  it('удаляет тост по идентификатору', () => {
    mockUseUniqueId.mockReturnValueOnce('toast-1')
    const toast = useToast()

    const id = toast.addToast({ title: 'Удалить', variant: toast.variants.INFO })
    toast.removeToast(id)

    expect(toast.toasts.value).toEqual([])
  })

  it('автоматически удаляет тост после истечения времени жизни', () => {
    mockUseUniqueId.mockReturnValueOnce('toast-1')
    const toast = useToast()

    toast.addToast({ title: 'Временный', variant: toast.variants.INFO })

    expect(useTimeoutFnSpy).toHaveBeenCalled()
    expect(timeoutCalls.at(-1)?.delay).toBe(5000)

    timeoutCalls.at(-1)?.callback()

    expect(toast.toasts.value).toEqual([])
  })

  it('не планирует автоудаление, если время жизни равно нулю', () => {
    mockUseUniqueId.mockReturnValueOnce('toast-1')
    const toast = useToast()

    toast.addToast({ title: 'Постоянный', variant: toast.variants.INFO }, 0)

    expect(useTimeoutFnSpy).not.toHaveBeenCalled()
    expect(toast.toasts.value).toHaveLength(1)
  })

  it('возвращает общий экземпляр композиции при повторном вызове', () => {
    const first = useToast()
    const second = useToast()

    expect(second).toBe(first)
    expect(second.toasts).toBe(first.toasts)
  })
})
