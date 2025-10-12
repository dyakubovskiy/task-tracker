import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const loginMock = vi.fn()
const addToastMock = vi.fn()
const pushMock = vi.fn()

vi.mock('../model', () => ({
  useAuth: () => ({
    login: loginMock
  })
}))

vi.mock('@/shared/ui/input', () => ({
  VPassword: {
    name: 'VPassword',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input class="password" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
  }
}))

vi.mock('@/shared/ui/button', () => ({
  VButton: {
    name: 'VButton',
    props: ['disabled'],
    emits: ['click'],
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
  }
}))

vi.mock('@/shared/ui/toast', () => ({
  useToast: () => ({
    addToast: addToastMock
  })
}))

vi.mock('@/shared/config', () => ({
  MAIN_LINK: '/main'
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock
  })
}))

const mountView = async () => {
  const component = await import('./LoginView.vue')
  return mount(component.default)
}

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    loginMock.mockReset()
    addToastMock.mockReset()
    pushMock.mockReset()
  })

  it('показывает скелетон во время отправки и возвращается к полю после завершения', async () => {
    let resolveLogin: (value: boolean) => void = () => {}
    loginMock.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveLogin = resolve
        })
    )

    const wrapper = await mountView()

    await wrapper.get('input.password').setValue('token-123')
    await wrapper.get('button').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.password-placeholder').exists()).toBe(true)
    expect(wrapper.find('input.password').exists()).toBe(false)

    resolveLogin(true)
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.password-placeholder').exists()).toBe(false)
    expect(wrapper.find('input.password').exists()).toBe(true)
  })

  it('показывает уведомление и оставляет форму доступной при ошибке', async () => {
    loginMock.mockResolvedValue(false)

    const wrapper = await mountView()

    await wrapper.get('input.password').setValue('invalid')
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(addToastMock).toHaveBeenCalledWith({
      title: 'Неверный токен',
      variant: 'danger'
    })
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
  })

  it('перенаправляет на главную страницу при успешной авторизации', async () => {
    loginMock.mockResolvedValue(true)

    const wrapper = await mountView()

    await wrapper.get('input.password').setValue('token-456')
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(pushMock).toHaveBeenCalledWith('/main')
  })

  it('не инициирует авторизацию, если токен пустой, и показывает скелетон', async () => {
    loginMock.mockResolvedValue(true)

    const wrapper = await mountView()

    const { handleSubmit } = wrapper.vm as unknown as { handleSubmit: () => Promise<void> }

    await handleSubmit()
    await flushPromises()

    expect(loginMock).not.toHaveBeenCalled()
    expect(addToastMock).not.toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
    expect(wrapper.find('.password-placeholder').exists()).toBe(true)
  })
})
