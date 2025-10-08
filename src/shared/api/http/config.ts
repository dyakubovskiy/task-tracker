import type { HttpConfig } from './types'

const HTTP_CONFIG: HttpConfig = {
  baseURL: import.meta.env.VITE_API_URL,
  defaultHeaderss: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
} as const satisfies HttpConfig

export { HTTP_CONFIG }
