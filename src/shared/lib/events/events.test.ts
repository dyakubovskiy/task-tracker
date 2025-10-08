import type { Mock } from 'vitest'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventBus } from '@vueuse/core'
import { useEventBuses } from './events'

const useEventBusMock = useEventBus as unknown as Mock

vi.mock('@vueuse/core', () => {
  const busFactory = (event: string) => ({
    event,
    on: vi.fn(),
    emit: vi.fn()
  })

  return {
    useEventBus: vi.fn(busFactory)
  }
})

describe('useEventBuses', () => {
  const events = {
    open: 'modal:open',
    close: 'modal:close'
  } as const

  type Payloads = {
    'modal:open': { id: number }
    'modal:close': void
  }

  beforeEach(() => {
    useEventBusMock.mockClear()
  })

  it('возвращает фабрику, создающую карту событий с on/emit', () => {
    const register = useEventBuses<typeof events, Payloads>(events)

    const buses = register()

    expect(typeof register).toBe('function')
    expect(Object.keys(buses)).toEqual(['modal:open', 'modal:close'])

    const openBus = buses['modal:open']
    const closeBus = buses['modal:close']

    expect(openBus).toHaveProperty('on')
    expect(openBus).toHaveProperty('emit')
    expect(closeBus).toHaveProperty('on')
    expect(closeBus).toHaveProperty('emit')

    expect(useEventBusMock).toHaveBeenCalledTimes(2)
    expect(useEventBusMock).toHaveBeenNthCalledWith(1, 'modal:open')
    expect(useEventBusMock).toHaveBeenNthCalledWith(2, 'modal:close')
  })

  it('создаёт новые экземпляры шин при каждом вызове фабрики', () => {
    const register = useEventBuses<typeof events, Payloads>(events)

    const first = register()
    const second = register()

    expect(first['modal:open']).not.toBe(second['modal:open'])
    expect(first['modal:close']).not.toBe(second['modal:close'])
    expect(useEventBusMock).toHaveBeenCalledTimes(4)
  })
})
