import type { HttpConfig, HttpClient, HttpResponse, RequestOptions, HttpMethod } from './types'

import { safeDestr } from 'destr'

const useHttpClient = ({ baseURL, defaultHeaders }: HttpConfig): HttpClient => {
  let authToken: string | null = null

  const setToken: HttpClient['setToken'] = (token) => {
    authToken = token
  }

  const resetToken: HttpClient['resetToken'] = () => {
    authToken = null
  }

  const fetchData = async <DTO, Data = DTO>(
    method: HttpMethod,
    url: string,
    options?: RequestOptions<DTO, Data>
  ): Promise<Data | null> => {
    const { data, status } = await request<DTO>(method, url, options || {})

    if (!isStatusSuccess(status) && !options?.returnErrorData) return null
    if (data === null) return null

    return options?.adapter ? options.adapter(data) : (data as Data)
  }

  const fetchList = async <DTO, Data = DTO>(
    method: HttpMethod,
    url: string,
    options?: RequestOptions<DTO, Data>
  ): Promise<Array<Data>> => {
    const { data, status } = await request<Array<DTO>>(method, url, options || {})

    if (!isStatusSuccess(status)) return []
    if (data === null || !Array.isArray(data)) return []

    return options?.adapter ? data.map(options.adapter) : (data as unknown as Array<Data>)
  }

  const requestSuccess: HttpClient['requestSuccess'] = async (method, url, options) => {
    const { status } = await request(method, url, options || {})

    return isStatusSuccess(status)
  }

  const request = async <T>(
    method: HttpMethod,
    url: string,
    { headers, payload, query }: Omit<RequestOptions, 'adapter' | 'returnErrorData'>
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
      const data = text ? safeDestr<T>(text, { strict: true }) : null

      return { data, status }
    } catch {
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

  return { fetchData, fetchList, requestSuccess, setToken, resetToken }
}

export { useHttpClient }
