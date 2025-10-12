import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { useHttpClient } from './http'

const fetchMock = vi.fn()

const mockResponse = (status: number, body: unknown) =>
  Promise.resolve({
    status,
    text: async () => JSON.stringify(body)
  })

const mockTextResponse = (status: number, body: string) =>
  Promise.resolve({
    status,
    text: async () => body
  })

const createHttpError = (status: number, data: unknown, message = 'HTTP Error') => ({
  type: 'HttpError' as const,
  status,
  data,
  message
})

const requestOptions = {
  headers: { 'X-Custom': '1' },
  payload: { name: 'John' }
} as const

const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
} as const

const createClient = (baseURL = '') =>
  useHttpClient({
    baseURL,
    defaultHeaders
  })

type HttpInstance = ReturnType<typeof createClient>

describe('useHttpClient.fetchData', () => {
  let http: HttpInstance

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  beforeEach(async () => {
    http = createClient('')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('возвращает распарсенные данные при статусе 2xx', async () => {
    http = createClient('https://api.test')

    const data = { id: 1, name: 'John' }
    fetchMock.mockResolvedValueOnce(mockResponse(200, data))

    const result = await http.fetchData<typeof data>('post', '/users', requestOptions)

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/users', {
      method: 'POST',
      headers: {
        ...defaultHeaders,
        'X-Custom': '1'
      },
      body: JSON.stringify(requestOptions.payload)
    })
    expect(result).toEqual(data)
  })

  it('применяет адаптер к результату', async () => {
    const dto = { value: '42' }
    fetchMock.mockResolvedValueOnce(mockResponse(200, dto))

    const result = await http.fetchData<typeof dto, number>('get', '/value', {
      adapter: (payload) => Number(payload.value)
    })

    expect(result).toBe(42)
  })

  it('переопределяет заголовки пользовательскими значениями', async () => {
    http = createClient('https://api.test')

    const payload = { ok: true }
    fetchMock.mockResolvedValueOnce(mockResponse(200, payload))

    await http.fetchData('get', '/override', {
      headers: {
        Accept: 'text/plain'
      }
    })

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/override', {
      method: 'GET',
      headers: {
        ...defaultHeaders,
        Accept: 'text/plain'
      },
      body: undefined
    })
  })

  it('корректно собирает URL с query-параметрами', async () => {
    http = createClient('https://api.test')

    fetchMock.mockResolvedValueOnce(mockResponse(200, null))

    await http.fetchData('get', '/users', {
      query: { search: 'john', page: 1, active: true }
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/users?search=john&page=1&active=true',
      {
        method: 'GET',
        headers: defaultHeaders,
        body: undefined
      }
    )
  })

  it('возвращает базовый URL при пустом наборе query-параметров', async () => {
    http = createClient('https://api.test')

    fetchMock.mockResolvedValueOnce(mockResponse(200, null))

    await http.fetchData('get', '/users', { query: {} })

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/users', {
      method: 'GET',
      headers: defaultHeaders,
      body: undefined
    })
  })

  it('использует значения по умолчанию, если опции не переданы', async () => {
    http = createClient('https://api.test')

    const payload = { ok: true }
    fetchMock.mockResolvedValueOnce(mockResponse(200, payload))

    const result = await http.fetchData<typeof payload>('get', '/ping')

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/ping', {
      method: 'GET',
      headers: defaultHeaders,
      body: undefined
    })
    expect(result).toEqual(payload)
  })

  it('возвращает null при статусе 2xx и пустом теле', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, null))

    const result = await http.fetchData('get', '/empty')

    expect(result).toBeNull()
  })

  it('возвращает null при неуспешном статусе 4xx', async () => {
    const errorBody = { message: 'Not found' }
    fetchMock.mockResolvedValueOnce(mockResponse(404, errorBody))

    const result = await http.fetchData<typeof errorBody>('post', '/users/1', requestOptions)

    expect(result).toBeNull()
  })

  it('возвращает данные ошибки при неуспешном статусе, если запрошено', async () => {
    const errorBody = { message: 'Not found' }
    fetchMock.mockResolvedValueOnce(mockResponse(404, errorBody))

    const result = await http.fetchData<typeof errorBody, string>('get', '/users', {
      returnErrorData: true,
      adapter: (dto) => dto.message
    })

    expect(result).toBe('Not found')
  })

  it('возвращает null при исключении с HttpError', async () => {
    const httpError = createHttpError(503, { message: 'Service unavailable' })
    fetchMock.mockRejectedValueOnce(httpError)

    const result = await http.fetchData<{ message: string }>('post', '/users', requestOptions)

    expect(result).toBeNull()
  })

  it('возвращает null при исключении с HttpError без данных', async () => {
    const httpError = createHttpError(400, null)
    fetchMock.mockRejectedValueOnce(httpError)

    const result = await http.fetchData<null>('post', '/users', requestOptions)

    expect(result).toBeNull()
  })

  it('возвращает null при исключении без HttpError', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'))

    const result = await http.fetchData('post', '/users', requestOptions)

    expect(result).toBeNull()
  })

  it('возвращает null при невалидном JSON, возвращённом fetch', async () => {
    fetchMock.mockResolvedValueOnce(mockTextResponse(200, 'not json'))

    const result = await http.fetchData('post', '/users', requestOptions)

    expect(result).toBeNull()
  })
})

describe('useHttpClient auth token', () => {
  let http: HttpInstance

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    http = createClient('https://api.test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('добавляет и сбрасывает OAuth токен в заголовках', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, { ok: true }))

    http.setToken('token-123')

    await http.fetchData('get', '/profile')

    const firstCall = fetchMock.mock.calls[0]
    expect(firstCall).toBeDefined()

    if (!firstCall) throw new Error('First call not found')

    expect(firstCall[0]).toBe('https://api.test/profile')
    expect(firstCall[1]).toMatchObject({
      headers: {
        ...defaultHeaders,
        Authorization: 'OAuth token-123'
      }
    })

    http.resetToken()

    await http.fetchData('get', '/profile')

    const secondCall = fetchMock.mock.calls[1]

    if (!secondCall) throw new Error('Second call not found')

    expect(secondCall[1]).toMatchObject({
      headers: defaultHeaders
    })
  })
})

describe('useHttpClient.fetchList', () => {
  let http: HttpInstance

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    http = createClient('https://api.test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('возвращает массив DTO при успешном ответе', async () => {
    const data = [{ id: 1 }, { id: 2 }]
    fetchMock.mockResolvedValueOnce(mockResponse(200, data))

    const result = await http.fetchList<(typeof data)[number]>('get', '/items')

    expect(result).toEqual(data)
  })

  it('применяет адаптер ко всем элементам', async () => {
    const dto = [{ id: '1' }, { id: '2' }]
    fetchMock.mockResolvedValueOnce(mockResponse(200, dto))

    const result = await http.fetchList<(typeof dto)[number], number>('get', '/items', {
      adapter: (item) => Number(item.id)
    })

    expect(result).toEqual([1, 2])
  })

  it('возвращает пустой массив при ответе не-списком', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, { id: 1 }))

    const result = await http.fetchList('get', '/items')

    expect(result).toEqual([])
  })

  it('возвращает пустой массив при пустом теле', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, null))

    const result = await http.fetchList('get', '/items')

    expect(result).toEqual([])
  })

  it('возвращает пустой массив при ошибке HTTP', async () => {
    const errorBody = { message: 'Not found' }
    fetchMock.mockResolvedValueOnce(mockResponse(404, errorBody))

    const result = await http.fetchList('get', '/items')

    expect(result).toEqual([])
  })

  it('добавляет query-параметры в запрос списка', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, []))

    await http.fetchList('get', '/items', {
      query: { page: 1, search: 'test' }
    })

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/items?page=1&search=test', {
      method: 'GET',
      headers: defaultHeaders,
      body: undefined
    })
  })
})
