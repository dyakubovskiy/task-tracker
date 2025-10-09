import type { Toast } from './useToast'

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { VButtonIcon } from '../button'
import { VIcon } from '../icon'
import VToast from './VToast.vue'

const baseToast: Toast = {
  id: 'toast-1',
  title: 'Уведомление',
  desc: 'Дополнительное описание',
  variant: 'info' as const
}

const mountToast = (props?: Partial<Toast>) =>
  mount(VToast, {
    props: { ...baseToast, ...props } as Toast
  })

describe('VToast', () => {
  it('рендерит заголовок и описание', () => {
    const wrapper = mountToast()

    expect(wrapper.get('.title').text()).toBe(baseToast.title)
    expect(wrapper.get('.desc').text()).toBe(baseToast.desc)
  })

  it('не отображает описание, если оно не передано', () => {
    const wrapper = mountToast({ desc: undefined })

    expect(wrapper.find('.desc').exists()).toBe(false)
  })

  const variants: Array<{ variant: Toast['variant']; icon: string }> = [
    { variant: 'info', icon: 'info' },
    { variant: 'success', icon: 'success' },
    { variant: 'danger', icon: 'danger' }
  ]

  variants.forEach(({ variant, icon }) => {
    it(`отображает вариант ${variant} с соответствующей иконкой`, () => {
      const wrapper = mountToast({ variant })

      expect(wrapper.classes()).toContain(variant)

      const icons = wrapper.findAllComponents(VIcon)
      const variantIcon = icons.at(0)?.props('iconId') as string | undefined
      const closeIcon = icons.at(1)?.props('iconId') as string | undefined

      expect(variantIcon).toBe(icon)
      expect(closeIcon).toBe('x')
    })
  })

  it('эмитит событие close с идентификатором тоста', async () => {
    const wrapper = mountToast()

    await wrapper.getComponent(VButtonIcon).trigger('click')

    expect(wrapper.emitted('close')).toEqual([[baseToast.id]])
  })
})
