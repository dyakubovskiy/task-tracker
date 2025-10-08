import { describe, expect, it, vi, beforeEach } from 'vitest'

describe('http singleton client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('создаёт экземпляр с конфигом из HTTP_CONFIG', async () => {
    const httpModule = await import('./client')
    const configModule = await import('./config')

    const http = httpModule.http

    expect(http).toBeDefined()
    expect(typeof http.fetchData).toBe('function')
    expect(configModule.HTTP_CONFIG.baseURL).toBe(import.meta.env.VITE_API_URL)
  })
})
