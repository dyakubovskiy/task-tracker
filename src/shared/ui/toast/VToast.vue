<template>
  <article
    class="toast"
    :class="variant">
    <div class="icon">
      <VIcon :iconId="ICON_VARIANTS[variant]" />
    </div>
    <div class="content">
      <p class="title">{{ title }}</p>
      <p
        v-if="desc"
        class="desc">
        {{ desc }}
      </p>
    </div>
    <VButtonIcon
      class="close"
      :icon="closeIcon"
      aria-label="Закрыть уведомление"
      @click="$emit('close', id)" />
  </article>
</template>

<script setup lang="ts">
import type { IconProps } from '../icon'
import type { Toast } from './useToast'

import { VButtonIcon } from '../button'
import { VIcon } from '../icon'

defineProps<Toast>()

const closeIcon: IconProps = { iconId: 'x' }

defineEmits<{
  (event: 'close', id: string): void
}>()

const ICON_VARIANTS: Record<Toast['variant'], IconProps['iconId']> = {
  info: 'info',
  success: 'success',
  danger: 'danger'
}
</script>

<style scoped>
.toast {
  --toast-bg: var(--color-surface);
  --toast-border: var(--color-border);
  --toast-text: var(--color-text-primary);
  --toast-accent: var(--color-accent);

  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--spacing-16);
  align-items: center;
  min-width: 28rem;
  max-width: 40rem;
  padding: var(--spacing-16) var(--spacing-20);
  border-radius: var(--radius-lg);
  border: 1px solid var(--toast-border);
  background: var(--toast-bg);
  color: var(--toast-text);
  box-shadow: var(--shadow-lg);
  transition:
    transform var(--transition-emphasized),
    opacity var(--transition-base);
}

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 999px;
  background-color: color-mix(in srgb, var(--toast-accent) 12%, transparent);
  color: var(--toast-accent);
}

.content {
  display: grid;
  gap: var(--spacing-4);
  line-height: 1.4;
}

.title {
  margin: 0;
  font-weight: var(--font-weight-semibold);
}

.desc {
  margin: 0;
  font-weight: var(--font-weight-regular);
  color: color-mix(in srgb, var(--toast-text) 80%, transparent);
}

.close {
  align-self: start;
  color: color-mix(in srgb, var(--toast-text) 70%, transparent);
  transition:
    color var(--transition-base),
    transform var(--transition-base);
}

.close:focus-visible,
.close:hover {
  color: var(--toast-text);
  transform: scale(1.05);
}

.info {
  --toast-bg: var(--color-toast-info-bg);
  --toast-border: var(--color-toast-info-border);
  --toast-text: var(--color-toast-info-text);
  --toast-accent: var(--color-toast-info-border);
}

.success {
  --toast-bg: var(--color-toast-success-bg);
  --toast-border: var(--color-toast-success-border);
  --toast-text: var(--color-toast-success-text);
  --toast-accent: var(--color-toast-success-border);
}

.danger {
  --toast-bg: var(--color-toast-danger-bg);
  --toast-border: var(--color-toast-danger-border);
  --toast-text: var(--color-toast-danger-text);
  --toast-accent: var(--color-toast-danger-border);
}

@media (prefers-reduced-motion: reduce) {
  .toast {
    transition: none;
  }

  .close {
    transition: none;
  }
}
</style>
