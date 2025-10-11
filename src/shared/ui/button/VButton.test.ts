import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import VButton from './VButton.vue'

describe('VButton', () => {
  it('отображает слот и применяет variant=primary по умолчанию', () => {
    const wrapper = mount(VButton, {
      slots: {
        default: 'Продолжить'
      }
    })

    expect(wrapper.text()).toBe('Продолжить')
    expect(wrapper.classes()).toContain('button')
    expect(wrapper.classes()).toContain('primary')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.attributes('disabled')).toBeUndefined()
  })

  it('применяет вариант ghost и обновляет класс при смене пропса', async () => {
    const wrapper = mount(VButton)

    await wrapper.setProps({ variant: 'ghost' })

    expect(wrapper.classes()).toContain('ghost')
    expect(wrapper.classes()).not.toContain('primary')
  })

  it('устанавливает атрибут disabled и не эмитит click', async () => {
    const wrapper = mount(VButton, {
      props: { disabled: true }
    })

    expect(wrapper.attributes('disabled')).toBeDefined()

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('эмитит click, когда не disabled', async () => {
    const wrapper = mount(VButton)

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
