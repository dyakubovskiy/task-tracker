import type { HttpConfig } from './types'

const HTTP_CONFIG: HttpConfig = {
  baseURL: import.meta.env.VITE_API_URL,
  defaultHeaderss: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Referer: import.meta.env.VITE_HEADER_REFERER,
    Authorization: `OAuth ${import.meta.env.VITE_TOKEN}`
  }
} as const satisfies HttpConfig

export { HTTP_CONFIG }
