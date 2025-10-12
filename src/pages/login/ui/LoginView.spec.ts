import type { Router } from 'vue-router'
import type { VueWrapper } from '@vue/test-utils'

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import LoginView from './LoginView.vue'
import { http } from '@/shared/api'
import { useToast } from '@/shared/ui/toast'

const toastStore = useToast()

const resetToasts = () => {
  const items = [...toastStore.toasts.value]
  items.forEach(({ id }) => toastStore.removeToast(id))
}

const getSubmitButton = (wrapper: VueWrapper) => {
  const buttons = wrapper.findAll('button')
  if (!buttons.length) throw new Error('Submit button not found')
  return buttons[buttons.length - 1]
}

const getErrorMessage = (wrapper: VueWrapper) => wrapper.find('p.error')

const getTokenInput = (wrapper: VueWrapper) => wrapper.get('input[name="oauth-token"]')

const createDeferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

const flushComponent = async (wrapper: VueWrapper) => {
  await flushPromises()
  await wrapper.vm.$nextTick()
}

const mountLoginView = async () => {
  const router: Router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: { template: '<div />' } },
      { path: '/', name: 'main', redirect: '/timesheet' },
      { path: '/timesheet', name: 'timesheet', component: { template: '<div />' } }
    ]
  })

  await router.push('/login')
  await router.isReady()

  const wrapper = mount(LoginView, {
    global: {
      plugins: [router]
    }
  })

  return { wrapper, router }
}

describe('LoginView integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetToasts()
  })

  afterEach(() => {
    http.resetToken()
    resetToasts()
  })

  it('отображает скелетон во время авторизации и перенаправляет при успехе', async () => {
    const deferred = createDeferred<{ id: number; name: string }>()
    const fetchDataSpy = vi.spyOn(http, 'fetchData').mockImplementation(() => deferred.promise)

    const setTokenSpy = vi.spyOn(http, 'setToken')
    const resetTokenSpy = vi.spyOn(http, 'resetToken')

    const { wrapper, router } = await mountLoginView()
    await flushComponent(wrapper)

    const input = getTokenInput(wrapper)
    await input.setValue('token-123')
    await flushComponent(wrapper)

    const submit = getSubmitButton(wrapper)
    if (!submit) throw new Error('Submit button not found')

    await submit.trigger('click')
    await flushComponent(wrapper)

    expect(submit.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.password-placeholder').exists()).toBe(true)

    deferred.resolve({ id: 1, name: 'Test User' })
    await flushComponent(wrapper)

    expect(fetchDataSpy).toHaveBeenCalledWith('get', '/myself', expect.any(Object))
    expect(setTokenSpy).toHaveBeenCalledWith('token-123')
    expect(resetTokenSpy).not.toHaveBeenCalled()
    expect(wrapper.find('.password-placeholder').exists()).toBe(false)
    expect(submit.attributes('disabled')).toBeUndefined()
    expect(router.currentRoute.value.fullPath).toBe('/timesheet')
  })

  it('показывает ошибку и сбрасывает токен при неуспешной авторизации', async () => {
    const fetchDataSpy = vi.spyOn(http, 'fetchData').mockResolvedValue(null)
    const resetTokenSpy = vi.spyOn(http, 'resetToken')

    const addToastSpy = vi.spyOn(toastStore, 'addToast')

    const { wrapper } = await mountLoginView()
    await flushComponent(wrapper)

    const input = getTokenInput(wrapper)
    await input.setValue('token-invalid')
    await flushComponent(wrapper)

    const submit = getSubmitButton(wrapper)
    if (!submit) throw new Error('Submit button not found')

    await submit.trigger('click')
    await flushComponent(wrapper)

    expect(fetchDataSpy).toHaveBeenCalled()
    expect(resetTokenSpy).toHaveBeenCalled()
    expect(addToastSpy).toHaveBeenCalledWith({
      title: 'Неверный токен',
      variant: 'danger'
    })
    expect(getErrorMessage(wrapper).text()).toBe('Неверный токен')
    expect(wrapper.find('.password-placeholder').exists()).toBe(false)
    expect(submit.attributes('disabled')).toBeUndefined()
  })

  it('отключает кнопку при пустом токене и очищает ошибку при изменении поля', async () => {
    vi.spyOn(http, 'fetchData').mockResolvedValue(null)

    const { wrapper } = await mountLoginView()
    await flushComponent(wrapper)

    const submit = getSubmitButton(wrapper)
    if (!submit) throw new Error('Submit button not found')

    expect(submit.attributes('disabled')).toBeDefined()

    const input = getTokenInput(wrapper)
    await input.setValue('token-one')
    await flushComponent(wrapper)
    expect(submit.attributes('disabled')).toBeUndefined()

    await submit.trigger('click')
    await flushComponent(wrapper)

    expect(getErrorMessage(wrapper).exists()).toBe(true)

    await getTokenInput(wrapper).setValue('')
    await flushComponent(wrapper)
    await vi.waitFor(async () => {
      await wrapper.vm.$nextTick()
      expect(getErrorMessage(wrapper).exists()).toBe(false)
    })
    expect(submit.attributes('disabled')).toBeDefined()

    await getTokenInput(wrapper).setValue('token-two')
    await flushComponent(wrapper)
    expect(submit.attributes('disabled')).toBeUndefined()
  })

  it('не позволяет повторно отправить форму, пока выполняется запрос', async () => {
    const deferred = createDeferred<null>()
    const fetchDataSpy = vi.spyOn(http, 'fetchData').mockImplementation(() => deferred.promise)

    const { wrapper } = await mountLoginView()
    await flushComponent(wrapper)

    const input = getTokenInput(wrapper)
    await input.setValue('token-slow')
    await flushComponent(wrapper)

    const submit = getSubmitButton(wrapper)
    if (!submit) throw new Error('Submit button not found')

    await submit.trigger('click')
    await flushComponent(wrapper)

    expect(fetchDataSpy).toHaveBeenCalledTimes(1)
    expect(submit.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.password-placeholder').exists()).toBe(true)

    await submit.trigger('click')
    expect(fetchDataSpy).toHaveBeenCalledTimes(1)

    deferred.resolve(null)
    await flushComponent(wrapper)

    expect(submit.attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.password-placeholder').exists()).toBe(false)
  })

  it('позволяет повторить попытку после ошибки и перенаправляет при успехе', async () => {
    const fetchDataSpy = vi
      .spyOn(http, 'fetchData')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1, name: 'Retry User' })

    const setTokenSpy = vi.spyOn(http, 'setToken')
    const resetTokenSpy = vi.spyOn(http, 'resetToken')

    const addToastSpy = vi.spyOn(toastStore, 'addToast')

    const { wrapper, router } = await mountLoginView()
    await flushComponent(wrapper)

    const input = getTokenInput(wrapper)
    await input.setValue('token-fail')
    await flushComponent(wrapper)

    const submit = getSubmitButton(wrapper)
    if (!submit) throw new Error('Submit button not found')

    await submit.trigger('click')
    await flushComponent(wrapper)

    expect(fetchDataSpy).toHaveBeenCalledTimes(1)
    expect(resetTokenSpy).toHaveBeenCalledTimes(1)
    expect(addToastSpy).toHaveBeenCalledTimes(1)
    expect(getErrorMessage(wrapper).text()).toBe('Неверный токен')

    await input.setValue('token-success')
    await flushComponent(wrapper)

    expect((input.element as HTMLInputElement).value).toBe('token-success')

    await submit.trigger('click')
    await flushComponent(wrapper)

    expect(fetchDataSpy).toHaveBeenCalledTimes(2)
    expect(setTokenSpy).toHaveBeenCalledTimes(2)
    expect(resetTokenSpy).toHaveBeenCalledTimes(1)
    expect(addToastSpy).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.password-placeholder').exists()).toBe(false)
    expect(router.currentRoute.value.fullPath).toBe('/timesheet')
  })
})
