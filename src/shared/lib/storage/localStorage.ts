import { useStorage } from '@vueuse/core'
import { dataSerializer } from './serilazer'

export const useLocalStorage = <T>(key: string) =>
  useStorage<T | null>(key, null, localStorage, { serializer: dataSerializer<T>() })
