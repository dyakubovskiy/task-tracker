import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { TransitionGroup, nextTick } from 'vue'

import ToastList from './ToastList.vue'
import { VToast, useToast } from '@/shared/ui/toast'
import type { Toast } from '@/shared/ui/toast/useToast'

const toastStore = useToast()

const renderComponent = async (items: Array<Toast>) => {
  toastStore.toasts.value = items

  const TeleportStub = {
    inheritAttrs: false,
    setup(_props: unknown, { slots }: { slots: { default?: () => unknown } }) {
      return () => slots.default?.()
    }
  }

  const wrapper = mount(ToastList, {
    global: {
      stubs: {
        teleport: TeleportStub
      }
    }
  })

  await nextTick()
  await flushPromises()

  return wrapper
}

describe('ToastList', () => {
  beforeEach(() => {
    toastStore.toasts.value = []
  })

  afterEach(() => {
    toastStore.toasts.value = []
  })

  it('рендерит тосты из стора в исходном порядке', async () => {
    const wrapper = await renderComponent([
      {
        id: 'toast-1',
        title: 'Первый',
        desc: 'Описание',
        variant: toastStore.variants.INFO
      },
      {
        id: 'toast-2',
        title: 'Второй',
        variant: toastStore.variants.SUCCESS
      }
    ])

    const renderedToasts = wrapper.findAllComponents(VToast)

    expect(renderedToasts).toHaveLength(2)
    expect(renderedToasts[0]?.props('title')).toBe('Первый')
    expect(renderedToasts[1]?.props('title')).toBe('Второй')

    wrapper.unmount()
  })

  it('удаляет тост при событии close', async () => {
    const toast: Toast = {
      id: 'close-me',
      title: 'Закрыть',
      variant: toastStore.variants.DANGER
    }

    const wrapper = await renderComponent([toast])

    wrapper.getComponent(VToast).vm.$emit('close', toast.id)
    await nextTick()

    expect(toastStore.toasts.value).toEqual([])
    expect(wrapper.findComponent(VToast).exists()).toBe(false)

    wrapper.unmount()
  })

  it('использует TransitionGroup с анимацией падения', async () => {
    const wrapper = await renderComponent([])

    const group = wrapper.getComponent(TransitionGroup)
    expect(group.props('name')).toBe('toast-fall')
    expect(group.props('tag')).toBe('ul')
    expect(group.classes()).toContain('list')

    wrapper.unmount()
  })

  it('обновляет список при добавлении нового тоста', async () => {
    const firstToast: Toast = {
      id: 'toast-1',
      title: 'Первый',
      variant: toastStore.variants.INFO
    }

    const wrapper = await renderComponent([firstToast])

    toastStore.toasts.value = [
      firstToast,
      { id: 'toast-2', title: 'Второй', variant: toastStore.variants.SUCCESS }
    ]
    await flushPromises()

    const items = wrapper.findAll('li.item')

    expect(items).toHaveLength(2)
    expect(items[0]?.classes()).toContain('item')
    expect(wrapper.findAllComponents(VToast)).toHaveLength(2)

    wrapper.unmount()
  })
})
