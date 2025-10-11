<template>
  <InputBase
    v-bind="props"
    :type="visible ? 'text' : 'password'"
    v-model="model"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
    @change="emit('change', $event)">
    <template #suffix>
      <VButton
        variant="ghost"
        class="toggle"
        :aria-pressed="visible"
        :disabled="disabled"
        @click="toggleVisibility">
        {{ visible ? 'Скрыть' : 'Показать' }}
      </VButton>
    </template>
  </InputBase>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { InputBaseProps } from './type'

import { ref } from 'vue'
import { VButton } from '../button'
import InputBase from './InputBase.vue'

const props = defineProps<InputBaseProps>()

const emit = defineEmits<{
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'change', event: Event): void
}>()

const model = defineModel<string | null>({ default: null })

const visible: Ref<boolean> = ref(false)

const toggleVisibility = (): void => {
  visible.value = !visible.value
}
</script>

<style scoped>
.toggle {
  height: 100%;
}
</style>
