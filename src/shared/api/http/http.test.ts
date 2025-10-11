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

const createClient = (baseURL = '') =>
  useHttpClient({
    baseURL,
    defaultHeaderss: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
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
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Custom': '1'
      },
      body: JSON.stringify(requestOptions.payload)
    })
    expect(result).toEqual(data)
  })

  it('корректно собирает URL с query-параметрами', async () => {
    http = createClient('https://api.test')

    fetchMock.mockResolvedValueOnce(mockResponse(200, null))

    await http.fetchData('get', '/users', {
      query: { search: 'john', page: 1, active: true }
    })

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/users?search=john&page=1&active=true', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: undefined
    })
  })

  it('возвращает базовый URL при пустом наборе query-параметров', async () => {
    http = createClient('https://api.test')

    fetchMock.mockResolvedValueOnce(mockResponse(200, null))

    await http.fetchData('get', '/users', { query: {} })

    expect(fetchMock).toHaveBeenCalledWith('https://api.test/users', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
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
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: undefined
    })
    expect(result).toEqual(payload)
  })

  it('возвращает null при неуспешном статусе 4xx', async () => {
    const errorBody = { message: 'Not found' }
    fetchMock.mockResolvedValueOnce(mockResponse(404, errorBody))

    const result = await http.fetchData<typeof errorBody>('post', '/users/1', requestOptions)

    expect(result).toEqual(errorBody)
  })

  it('возвращает null и статус 500 при исключении с HttpError', async () => {
    const httpError = createHttpError(503, { message: 'Service unavailable' })
    fetchMock.mockRejectedValueOnce(httpError)

    const result = await http.fetchData<{ message: string }>('post', '/users', requestOptions)

    expect(result).toEqual(httpError.data)
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
