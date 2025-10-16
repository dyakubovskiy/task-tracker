<template>
  <div class="container">
    <label
      v-if="label"
      class="label"
      :for="id">
      {{ label }}
    </label>
    <div
      class="wrapper"
      :class="{ disabled, error }">
      <input
        v-model="inputValue"
        :id
        :name
        :type
        :disabled
        :inputmode
        :spellcheck
        :placeholder
        :autocomplete
        :autocapitalize
        class="input"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
        @change="$emit('change', $event)" />
      <slot name="suffix" />
    </div>
    <p
      v-if="error"
      class="error"
      role="alert">
      {{ error }}
    </p>
    <p
      v-if="hint && error"
      class="hint">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts" generic="TValue extends string | number | null">
import type { Ref } from 'vue'
import type { InputBaseProps } from './type'

import { computed } from 'vue'

const { type = 'text' } = defineProps<InputBaseProps>()

defineEmits<{
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'change', event: Event): void
}>()

const modelValue = defineModel<TValue>({ default: null })

const isNumeric = (type: InputBaseProps['type']): boolean => type === 'number'

const inputValue: Ref<string | null> = computed({
  get() {
    const value = modelValue.value

    if (isNumeric(type)) {
      return typeof value === 'number' && Number.isFinite(value) ? String(value) : ''
    }

    return (value ?? '') as string
  },
  set(newValue: string) {
    if (isNumeric(type)) {
      const numericValue = newValue === '' ? null : Number(newValue)
      modelValue.value = numericValue as TValue
    } else {
      modelValue.value = (newValue ? newValue : null) as TValue
    }
  }
})
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: var(--radius-lg);
  background: var(--color-surface-variant);
  border: 0.1rem solid transparent;
  transition:
    border-color var(--transition-base),
    box-shadow var(--transition-base),
    background-color var(--transition-base);
}

.wrapper:hover {
  background: rgba(74, 123, 255, 0.08);
}

.wrapper:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 0.3rem rgba(74, 123, 255, 0.12);
  background: #fff;
}

.wrapper.error {
  border-color: var(--color-toast-danger-border);
  box-shadow: 0 0 0 0.3rem rgba(220, 63, 69, 0.12);
}

.wrapper.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input {
  flex: 1;
  padding: 1.4rem 1.6rem;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 1.6rem;
}

.input:disabled {
  cursor: not-allowed;
}

.input::placeholder {
  color: var(--color-text-muted);
}

.error {
  color: var(--color-toast-danger-text);
  font-size: 1.4rem;
}

.hint {
  font-size: 1.4rem;
  color: var(--color-text-muted);
}

input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}

input[type='number']::-ms-clear,
input[type='number']::-ms-expand {
  display: none;
}
</style>
