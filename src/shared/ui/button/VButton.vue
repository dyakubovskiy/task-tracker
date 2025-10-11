<template>
  <button
    type="button"
    :disabled
    :class="[variant]"
    class="button"
    @click="$emit('click')">
    <slot />
  </button>
</template>

<script setup lang="ts">
type ButtonVariant = 'primary' | 'ghost'

interface ButtonProps {
  variant?: ButtonVariant
  disabled?: boolean
}

const { variant = 'primary' } = defineProps<ButtonProps>()

defineEmits<{
  (e: 'click'): void
}>()
</script>

<style scoped>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-8);
  padding: 1.4rem;
  border-radius: var(--radius-lg);
  font-size: 1.6rem;
  font-weight: var(--font-weight-medium);
  transition:
    transform var(--transition-base),
    box-shadow var(--transition-base),
    filter var(--transition-base),
    background-color var(--transition-base),
    color var(--transition-base);
  cursor: pointer;
  border: none;
  min-height: 4.4rem;
  padding-inline: 1.6rem;
  padding-block: 1.4rem;
}

.button:disabled {
  cursor: not-allowed;
}

.primary {
  background: linear-gradient(135deg, #4a7bff, #2f5ee3);
  color: #ffffff;
  box-shadow: var(--shadow-md);
}

.primary:not(:disabled):hover,
.primary:not(:disabled):focus-visible {
  transform: translateY(-0.1rem);
  box-shadow: var(--shadow-lg);
}

.primary:disabled {
  opacity: 0.65;
  transform: none;
  box-shadow: var(--shadow-sm);
}

.ghost {
  background: transparent;
  color: var(--color-accent);
  padding: 0 1.6rem;
  min-height: auto;
  align-self: stretch;
}

.ghost:not(:disabled):hover,
.ghost:not(:disabled):focus-visible {
  color: var(--color-accent-strong);
}

.ghost:disabled {
  opacity: 0.6;
}
</style>
