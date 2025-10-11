export interface HttpConfig {
  baseURL: string
  defaultHeaderss: RequestInit['headers']
}

export interface RequestOptions<DTO = unknown, Data = unknown> {
  payload?: object
  query?: Record<string, string | number | boolean>
  headers?: RequestInit['headers']
  adapter?: (dto: DTO) => Data
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
  fetchData<DTO>(
    method: HttpMethod,
    url: string,
    options?: Omit<RequestOptions<DTO>, 'adapter'>
  ): Promise<DTO | null>

  fetchData<DTO, Data>(
    method: HttpMethod,
    url: string,
    options: RequestOptions<DTO, Data> & { adapter: (dto: DTO) => Data }
  ): Promise<Data | null>

  fetchList<DTO>(
    method: HttpMethod,
    url: string,
    options?: Omit<RequestOptions<DTO>, 'adapter'>
  ): Promise<Array<DTO>>

  fetchList<DTO, Data>(
    method: HttpMethod,
    url: string,
    options: RequestOptions<DTO, Data> & { adapter: (dto: DTO) => Data }
  ): Promise<Array<Data>>
}
