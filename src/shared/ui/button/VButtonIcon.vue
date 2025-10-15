<template>
  <button
    type="button"
    class="button"
    @click="$emit('click')">
    <VIcon v-bind="icon" />
  </button>
</template>

<script setup lang="ts">
import type { IconProps } from '../icon'

import { VIcon } from '../icon'

export interface ButtonIconProps {
  icon: IconProps
}

defineProps<ButtonIconProps>()

defineEmits<{
  (event: 'click'): void
}>()
</script>

<style scoped>
.button {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
