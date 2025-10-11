import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import VPassword from './VPassword.vue'

describe('VPassword', () => {
  it('по умолчанию скрывает значение и позволяет переключать видимость', async () => {
    const wrapper = mount(VPassword, {
      props: {
        modelValue: 'secret'
      }
    })

    const input = wrapper.get('input')
    const toggle = wrapper.get('button')

    expect(input.attributes('type')).toBe('password')
    expect(toggle.text()).toBe('Показать')
    expect(toggle.attributes('aria-pressed')).toBe('false')

    await toggle.trigger('click')

    expect(wrapper.get('input').attributes('type')).toBe('text')
    expect(toggle.text()).toBe('Скрыть')
    expect(toggle.attributes('aria-pressed')).toBe('true')
  })

  it('эмитит события ввода и изменений', async () => {
    const wrapper = mount(VPassword, {
      props: {
        modelValue: 'token'
      }
    })

    const input = wrapper.get('input')
    const toggle = wrapper.get('button')

    await input.setValue('new-token')
    await input.trigger('focus')
    await input.trigger('blur')
    await input.trigger('change')
    await toggle.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['new-token']])
    expect(wrapper.emitted('focus')).toHaveLength(1)
    expect(wrapper.emitted('blur')).toHaveLength(1)
    expect(wrapper.emitted('change')?.length).toBeGreaterThanOrEqual(1)
    expect(toggle.text()).toBe('Скрыть')
  })

  it('передаёт disabled в InputBase и кнопку', async () => {
    const wrapper = mount(VPassword, {
      props: {
        modelValue: 'token',
        disabled: true
      }
    })

    const toggle = wrapper.get('button')

    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
    expect(toggle.attributes('disabled')).toBeDefined()

    await toggle.trigger('click')

    expect(wrapper.get('input').attributes('type')).toBe('password')
  })
})
