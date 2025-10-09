import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import CenteredLayout from './CenteredLayout.vue'

describe('CenteredLayout', () => {
  it('оборачивает RouterView в центрированную обёртку', () => {
    const wrapper = mount(CenteredLayout, {
      global: {
        stubs: {
          RouterView: {
            template: '<div class="page">Login</div>'
          }
        }
      }
    })

    const layout = wrapper.get('main.layout')
    const content = layout.get('.content')

    expect(layout.classes()).toContain('layout')
    expect(content.find('.page').text()).toBe('Login')

    wrapper.unmount()
  })

  it('располагает контент вертикально и растягивает макет на всю высоту', () => {
    const wrapper = mount(CenteredLayout, {
      global: {
        stubs: {
          RouterView: {
            template: '<section class="page"><p>OAuth</p></section>'
          }
        }
      }
    })

    const layoutElement = wrapper.get('main.layout').element as HTMLElement
    const contentElement = wrapper.get('.content').element as HTMLElement

    expect(layoutElement.classList.contains('layout')).toBe(true)
    expect(contentElement.classList.contains('content')).toBe(true)
    expect(wrapper.get('.content').text()).toContain('OAuth')

    wrapper.unmount()
  })
})
