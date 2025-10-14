<template>
  <section class="container">
    <div class="card surface surface--elevated">
      <header class="header">
        <span class="badge">Task Tracker</span>
        <h1 class="title">Войдите в Task Tracker</h1>
        <p class="subtitle">
          Подключите OAuth токен из Яндекс Трекера, чтобы видеть, на что уходит ваше рабочее время.
        </p>
      </header>
      <div class="form">
        <div class="password-field">
          <template v-if="isSubmitting">
            <div
              class="password-placeholder"
              aria-hidden="true">
              <span class="password-placeholder__label">OAuth токен</span>
              <div class="password-placeholder__input" />
            </div>
          </template>
          <template v-else>
            <VPassword
              v-model="token"
              inputmode="text"
              name="oauth-token"
              autocomplete="off"
              :spellcheck="false"
              label="OAuth токен"
              autocapitalize="none"
              :error="errorMessage"
              :disabled="isSubmitting"
              placeholder="xxxxxxxxxxxx" />
          </template>
        </div>
        <p class="actions-hint">
          Мы сохраним токен локально и используем его только для запросов к API.
        </p>
        <VButton
          :disabled="isSubmitDisabled"
          @click="handleSubmit">
          Войти
        </VButton>
      </div>
    </div>
    <p class="privacy">
      Токен хранится в браузере. Если используете общий компьютер, очистите данные после работы.
    </p>
  </section>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'

import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { VPassword } from '@/shared/ui/input'
import { VButton } from '@/shared/ui/button'
import { useToast } from '@/shared/ui/toast'
import { MAIN_LINK } from '@/shared/config'
import { useAuth } from '../model'

const { login } = useAuth()

const router = useRouter()

const token: Ref<string | null> = ref(null)
watch(token, () => (errorMessage.value = null))

const errorMessage: Ref<string | null> = ref<string | null>(null)
const isSubmitting: Ref<boolean> = ref(false)

const isTokenFilled: Ref<boolean> = computed(() => !!token.value && token.value.trim().length > 0)
const isSubmitDisabled: Ref<boolean> = computed(() => isSubmitting.value || !isTokenFilled.value)

const { addToast } = useToast()

const handleSubmit = async () => {
  isSubmitting.value = true
  if (!isTokenValid(token.value)) return

  const isAuth = await login(token.value)
  isSubmitting.value = false

  addToast({
    title: isAuth ? 'Авторизация успешна' : 'Неверный токен',
    variant: isAuth ? 'success' : 'danger'
  })

  if (isAuth) router.push(MAIN_LINK)
  else errorMessage.value = 'Неверный токен'
}

const isTokenValid = (token: string | null): token is string => !!token && token.trim().length > 0
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-16);
}

.card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-24);
  padding: clamp(2.4rem, 4vw, 3.6rem);
  isolation: isolate;
}

.card::before {
  content: '';
  position: absolute;
  inset: -40% auto auto -30%;
  width: 22rem;
  height: 22rem;
  background: radial-gradient(55% 55% at 50% 50%, rgba(74, 123, 255, 0.25) 0%, transparent 75%);
  z-index: -1;
}

.header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
}

.badge {
  align-self: flex-start;
  padding: 0.4rem 1.2rem;
  border-radius: var(--radius-md);
  background: var(--color-surface-variant);
  color: var(--color-text-muted);
  font-size: 1.3rem;
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.title {
  font-size: clamp(2.4rem, 4vw, 3.2rem);
  color: var(--color-text-primary);
}

.subtitle {
  color: var(--color-text-secondary);
  max-width: 46rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-24);
}

.password-field {
  position: relative;
}

.password-placeholder {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
  margin: 0 1.6rem;
  padding: 2.4rem 0;
}

.password-placeholder__label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.password-placeholder__input {
  width: 100%;
  border-radius: var(--radius-lg);
  padding: 2.8rem 1.6rem;
  background: linear-gradient(
    90deg,
    rgba(74, 123, 255, 0.1),
    rgba(74, 123, 255, 0.2),
    rgba(74, 123, 255, 0.1)
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.2s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-12);
  color: var(--color-text-muted);
}

.action {
  border: none;
  background: rgba(74, 123, 255, 0.12);
  color: var(--color-accent);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-lg);
  padding: 0.8rem 1.6rem;
  transition:
    background-color var(--transition-base),
    color var(--transition-base);
}

.action:hover,
.action:focus-visible {
  background: rgba(74, 123, 255, 0.18);
  color: var(--color-accent-strong);
}

.action:disabled {
  background: var(--color-border);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.actions-divider {
  width: 0.2rem;
  height: 2.4rem;
  background: var(--color-border);
  border-radius: 999px;
}

.actions-hint {
  font-size: 1.4rem;
}

.privacy {
  font-size: 1.4rem;
  color: var(--color-text-muted);
  text-align: center;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .card {
    padding: var(--spacing-24);
  }

  .actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .actions-divider {
    display: none;
  }

  .actions-hint {
    font-size: 1.3rem;
  }
}

@media (prefers-color-scheme: dark) {
  .card::before {
    background: radial-gradient(55% 55% at 50% 50%, rgba(122, 162, 255, 0.28) 0%, transparent 75%);
  }

  .input-wrapper:hover {
    background: rgba(122, 162, 255, 0.12);
  }

  .action {
    background: rgba(122, 162, 255, 0.14);
  }

  .action:hover,
  .action:focus-visible {
    background: rgba(122, 162, 255, 0.2);
  }
}
</style>
