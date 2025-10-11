import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import InputBase from './InputBase.vue'

describe('InputBase', () => {
  it('рендерит текстовый инпут с подписью, подсказкой и плейсхолдером', async () => {
    const wrapper = mount(InputBase, {
      props: {
        modelValue: null,
        label: 'OAuth токен',
        hint: 'Введите персональный токен',
        error: 'Ошибка валидации',
        placeholder: 'Введите токен',
        autocomplete: 'off',
        inputmode: 'text'
      }
    })

    const input = wrapper.get('input')

    expect(wrapper.find('label').text()).toBe('OAuth токен')
    expect(wrapper.text()).toContain('Ошибка валидации')
    expect(wrapper.text()).toContain('Введите персональный токен')
    expect(input.attributes('placeholder')).toBe('Введите токен')
    expect(input.attributes('autocomplete')).toBe('off')
    expect(input.attributes('inputmode')).toBe('text')
  })

  it('конвертирует значение в число и обрабатывает пустые строки при type="number"', async () => {
    const wrapper = mount(InputBase, {
      props: {
        type: 'number',
        modelValue: 5
      }
    })

    const input = wrapper.get('input')
    expect(input.element.value).toBe('5')

    await input.setValue('42')
    await input.setValue('')
    await input.setValue('7.5')

    expect(wrapper.emitted('update:modelValue')).toEqual([[42], [null], [7.5]])
  })

  it('обновляет модель строкой или null', async () => {
    const wrapper = mount(InputBase, {
      props: {
        modelValue: 'initial'
      }
    })

    const input = wrapper.get('input')
    await input.setValue('')
    await input.setValue('updated')

    expect(wrapper.emitted('update:modelValue')).toEqual([[null], ['updated']])
  })

  it('применяет классы disabled и error', () => {
    const wrapper = mount(InputBase, {
      props: {
        modelValue: '',
        error: 'Ошибка',
        disabled: true
      }
    })

    const classes = wrapper.get('.wrapper').classes()

    expect(classes).toContain('error')
    expect(classes).toContain('disabled')
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
  })
})
