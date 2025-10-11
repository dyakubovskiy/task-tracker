import type {
  HttpConfig,
  HttpClient,
  HttpResponse,
  HttpError,
  RequestOptions,
  HttpMethod
} from './types'

import { safeDestr } from 'destr'
import { ERROR_TYPE } from './types'

const useHttpClient = ({ baseURL, defaultHeaders }: HttpConfig): HttpClient => {
  let authToken: string | null = null

  const setToken = (token: string): void => {
    authToken = token
  }

  const resetToken = (): void => {
    authToken = null
  }

  const fetchData = async <DTO, Data = DTO>(
    method: HttpMethod,
    url: string,
    options?: RequestOptions<DTO, Data>
  ): Promise<Data | null> => {
    const { data } = await request<DTO>(method, url, options || {})

    if (data === null) return null

    return options?.adapter ? options.adapter(data) : (data as Data)
  }

  const fetchList = async <DTO, Data = DTO>(
    method: HttpMethod,
    url: string,
    options?: RequestOptions<DTO, Data>
  ): Promise<Array<Data>> => {
    const { data } = await request<Array<DTO>>(method, url, options || {})

    if (data === null || !Array.isArray(data)) return []

    return options?.adapter ? data.map(options.adapter) : (data as unknown as Array<Data>)
  }

  const request = async <T>(
    method: HttpMethod,
    url: string,
    { headers, payload, query }: Omit<RequestOptions, 'adapter'>
  ): Promise<HttpResponse<T>> => {
    try {
      const fullUrl = buildUrl(baseURL + url, query)

      const response = await fetch(fullUrl, {
        method: method.toUpperCase(),
        headers: buildHeaders(headers),
        body: payload ? JSON.stringify(payload) : undefined
      })

      const status = response.status
      const text = await response.text()
      const data = safeDestr<T>(text, { strict: true })

      if (!isStatusSuccess(status)) throw createHttpError(status, data)

      return { data, status }
    } catch (err: unknown) {
      if (isHttpError<T>(err)) return { data: err.data, status: err.status }

      return { data: null, status: 500 }
    }
  }

  const buildUrl = (
    baseUrl: string,
    query?: Record<string, string | number | boolean | undefined>
  ): string => {
    if (!query) return baseUrl

    const params = new URLSearchParams()

    Object.entries(query).forEach(([key, value]) => params.append(key, String(value)))

    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  }

  const buildHeaders = (customHeaders?: RequestInit['headers']): HeadersInit => {
    const authHeader = authToken ? { Authorization: `OAuth ${authToken}` } : {}

    return {
      ...defaultHeaders,
      ...authHeader,
      ...customHeaders
    } as HeadersInit
  }

  const isStatusSuccess = (status: number): boolean => status >= 200 && status < 300

  const createHttpError = <T>(
    status: number,
    data: T | null,
    message = 'HTTP Error'
  ): HttpError<T> => ({
    type: ERROR_TYPE.HTTP_ERROR,
    status,
    data,
    message
  })

  const isHttpError = <T>(err: unknown): err is HttpError<T> =>
    typeof err === 'object' && err !== null && 'type' in err && err.type === ERROR_TYPE.HTTP_ERROR

  return { fetchData, fetchList, setToken, resetToken }
}

export { useHttpClient }
