import type { HttpConfig, HttpClient, HttpResponse, HttpError, RequestOptions } from './types'

import { safeDestr } from 'destr'
import { ERROR_TYPE } from './types'

const useHttpClient = ({ baseURL, defaultHeaderss }: HttpConfig): HttpClient => {
  const fetchData: HttpClient['fetchData'] = async <T>(url: string, options: RequestOptions) => {
    const { data } = await request<T>(url, options)

    return data
  }

  const request = async <T>(
    url: string,
    { method, headers, payload }: RequestOptions
  ): Promise<HttpResponse<T>> => {
    try {
      const response = await fetch(baseURL + url, {
        method,
        headers: { ...defaultHeaderss, ...headers },
        body: JSON.stringify(payload)
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

  return { fetchData }
}

export { useHttpClient }
