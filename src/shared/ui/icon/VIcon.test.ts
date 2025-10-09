import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import VIcon from './VIcon.vue'

const getHrefValue = (element: SVGUseElement) =>
  element.getAttribute('xlink:href') ?? element.getAttribute('href')

describe('VIcon', () => {
  it('рендерит svg элемент с базовым классом', () => {
    const wrapper = mount(VIcon, {
      props: { iconId: 'close' }
    })

    expect(wrapper.get('svg').classes()).toContain('icon')
  })

  it('использует корректный путь к символу из спрайта', () => {
    const wrapper = mount(VIcon, {
      props: { iconId: 'close' }
    })

    const href = getHrefValue(wrapper.get('use').element as SVGUseElement)

    expect(href).toBe('/sprite.svg#close')
  })

  it('обновляет ссылку при изменении iconId', async () => {
    const wrapper = mount(VIcon, {
      props: { iconId: 'close' }
    })

    await wrapper.setProps({ iconId: 'check' })

    const href = getHrefValue(wrapper.get('use').element as SVGUseElement)

    expect(href).toBe('/sprite.svg#check')
  })
})
