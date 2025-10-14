import type { Serializer } from '@vueuse/core'

import { safeDestr } from 'destr'

export const dataSerializer = <T>(): Serializer<T | null> => ({
  read: (v: string | null): T | null => {
    if (v === null) return null

    try {
      return safeDestr<T>(v)
    } catch {
      return null
    }
  },
  write: (v: T | null): string => JSON.stringify(v)
})
