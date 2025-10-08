export interface HttpConfig {
  baseURL: string
  defaultHeaderss: RequestInit['headers']
}

export interface RequestOptions {
  payload: object
  method: RequestInit['method']
  headers: RequestInit['headers']
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

export interface HttpClient {
  fetchData: <T>(url: string, options: RequestOptions) => Promise<T | null>
}
