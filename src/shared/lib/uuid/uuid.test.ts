// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mockUuid = vi.fn<() => string>()

vi.mock('uuidv7', () => ({
  uuidv7: mockUuid
}))

let useUniqueId: () => string

beforeAll(async () => {
  ;({ useUniqueId } = await import('./uuid'))
})

beforeEach(() => {
  mockUuid.mockReset()
})

describe('useUniqueId', () => {
  it('возвращает значение, полученное от uuidv7', () => {
    const id = 'generated-id'
    mockUuid.mockReturnValue(id)

    const result = useUniqueId()

    expect(result).toBe(id)
    expect(mockUuid).toHaveBeenCalledTimes(1)
  })

  it('возвращает разные значения при последовательных вызовах', () => {
    mockUuid.mockImplementationOnce(() => 'id-1').mockImplementationOnce(() => 'id-2')

    const first = useUniqueId()
    const second = useUniqueId()

    expect(first).toBe('id-1')
    expect(second).toBe('id-2')
    expect(first).not.toBe(second)
    expect(mockUuid).toHaveBeenCalledTimes(2)
  })
})
