import type { Ref } from 'vue'

import { shallowRef, computed } from 'vue'
import { createSharedComposable, useTimeoutFn } from '@vueuse/core'
import { useUniqueId } from '../../lib/uuid'

interface UseToast {
  toasts: Ref<Array<Toast>>
  variants: typeof TOAST_VARIANTS
  addToast: (toast: Omit<Toast, 'id'>, lifeTime?: number) => string
  removeToast: (id: string) => void
}

const TOAST_VARIANTS = {
  INFO: 'info',
  SUCCESS: 'success',
  DANGER: 'danger'
} as const

type ToastVariant = (typeof TOAST_VARIANTS)[keyof typeof TOAST_VARIANTS]

export interface Toast {
  id: string
  title: string
  desc?: string
  variant: ToastVariant
}

const TOAST_LIFE_TIME = 5000

export const useToast = createSharedComposable((): UseToast => {
  const toasts: UseToast['toasts'] = shallowRef([])

  const addToast: UseToast['addToast'] = (toast, lifeTime = TOAST_LIFE_TIME) => {
    const id = useUniqueId()

    toasts.value = [...toasts.value, { ...toast, id }]
    if (lifeTime) useTimeoutFn(() => removeToast(id), lifeTime)

    return id
  }

  const removeToast: UseToast['removeToast'] = (id) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  return {
    toasts: computed(() => toasts.value),
    variants: TOAST_VARIANTS,
    addToast,
    removeToast
  }
})
