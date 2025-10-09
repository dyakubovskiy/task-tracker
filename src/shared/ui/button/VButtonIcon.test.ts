import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import VButtonIcon from './VButtonIcon.vue'
import { VIcon } from '../icon'

describe('VButtonIcon', () => {
  const iconProps = { iconId: 'close' }

  it('рендерит кнопку с преднастроенными атрибутами', () => {
    const wrapper = mount(VButtonIcon, {
      props: { icon: iconProps }
    })

    const button = wrapper.get('button')

    expect(button.attributes('type')).toBe('button')
    expect(button.classes()).toContain('button')
  })

  it('пробрасывает свойства иконки в компонент VIcon', () => {
    const wrapper = mount(VButtonIcon, {
      props: { icon: iconProps }
    })

    const icon = wrapper.getComponent(VIcon)

    expect(icon.props()).toMatchObject(iconProps)
  })

  it('эмитит событие клика', async () => {
    const wrapper = mount(VButtonIcon, {
      props: { icon: iconProps }
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
