import { beforeEach, describe, expect, it, vi } from 'vitest'

const safeDestrMock = vi.fn()

vi.mock('destr', () => ({
  safeDestr: safeDestrMock
}))

describe('dataSerializer', () => {
  beforeEach(() => {
    vi.resetModules()
    safeDestrMock.mockReset()
  })

  it('возвращает null, когда входное значение отсутствует', async () => {
    const { dataSerializer } = await import('./serilazer')
    const serializer = dataSerializer<number>()

    expect(serializer.read(null as unknown as string)).toBeNull()
    expect(safeDestrMock).not.toHaveBeenCalled()
  })

  it('распарсивает корректный JSON', async () => {
    safeDestrMock.mockReturnValue({ foo: 'bar' })

    const { dataSerializer } = await import('./serilazer')
    const serializer = dataSerializer<{ foo: string }>()

    expect(serializer.read('{"foo":"bar"}')).toEqual({ foo: 'bar' })
    expect(safeDestrMock).toHaveBeenCalledWith('{"foo":"bar"}')
  })

  it('возвращает null, если safeDestr выбрасывает ошибку', async () => {
    safeDestrMock.mockImplementation(() => {
      throw new Error('invalid')
    })

    const { dataSerializer } = await import('./serilazer')
    const serializer = dataSerializer<Record<string, never>>()

    expect(serializer.read('invalid-json')).toBeNull()
  })

  it('сериализует значение в строку', async () => {
    const { dataSerializer } = await import('./serilazer')
    const serializer = dataSerializer<{ foo: string }>()

    expect(serializer.write({ foo: 'bar' })).toBe('{"foo":"bar"}')
  })
})
