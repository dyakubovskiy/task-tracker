export interface HttpConfig {
  baseURL: string
  defaultHeaderss: RequestInit['headers']
}

export interface RequestOptions {
  payload?: object
  query?: Record<string, string | number | boolean>
  headers?: RequestInit['headers']
}

export interface HttpResponse<T> {
  data: T | null
  status: number
}

export const ERROR_TYPE = {
  HTTP_ERROR: 'HttpError'
} as const

type ErrorType = (typeof ERROR_TYPE)[keyof typeof ERROR_TYPE]

export interface HttpError<T = unknown> {
  type: ErrorType
  status: number
  data: T | null
  message: string
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export interface HttpClient {
  fetchData: <T>(method: HttpMethod, url: string, options?: RequestOptions) => Promise<T | null>
}
