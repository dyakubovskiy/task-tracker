<template>
  <Teleport to="body">
    <section class="inner">
      <TransitionGroup
        name="toast-fall"
        tag="ul"
        class="list">
        <li
          v-for="toast in toasts"
          :key="toast.id"
          class="item">
          <VToast
            v-bind="toast"
            @close="removeToast" />
        </li>
      </TransitionGroup>
    </section>
  </Teleport>
</template>

<script setup lang="ts">
import { VToast, useToast } from '@/shared/ui/toast'

const { toasts, removeToast } = useToast()
</script>

<style scoped>
.inner {
  position: fixed;
  right: var(--spacing-32);
  bottom: var(--spacing-32);
  display: flex;
  pointer-events: none;
  z-index: 1000;
  width: min(40rem, 90vw);
}

.list {
  display: flex;
  flex-direction: column-reverse;
  gap: var(--spacing-16);
  margin: 0;
  padding: 0;
  width: 100%;
  list-style: none;
  overflow: visible;
}

.item {
  display: flex;
  justify-content: flex-end;
  pointer-events: auto;
  position: relative;
}

.toast-fall-enter-active,
.toast-fall-leave-active {
  transition:
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 240ms ease;
  will-change: transform, opacity;
}

.toast-fall-move {
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.toast-fall-leave-active {
  position: absolute;
  width: 100%;
}

.toast-fall-enter-from {
  opacity: 0;
  transform: translateY(-2.4rem);
}

.toast-fall-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.toast-fall-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.toast-fall-leave-to {
  opacity: 0;
  transform: translateY(2.4rem);
}

@media (max-width: 768px) {
  .inner {
    right: var(--spacing-16);
    bottom: var(--spacing-16);
    width: calc(100vw - var(--spacing-32));
  }

  .list {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast-fall-enter-active,
  .toast-fall-leave-active {
    transition: none;
  }

  .toast-fall-enter-from,
  .toast-fall-leave-to {
    transform: translateY(0);
  }

  .toast-fall-leave-active .item {
    position: static;
  }
}
</style>
