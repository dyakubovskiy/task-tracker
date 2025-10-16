<template>
  <teleport to="body">
    <transition name="dialog-fade">
      <div
        v-if="visible"
        class="overlay"
        @click.self="handleClose">
        <transition name="dialog-slide">
          <section
            v-if="visible"
            class="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialogTitle">
            <header class="header">
              <div class="info">
                <span class="eyebrow">Редактирование записи</span>
                <h2
                  id="dialogTitle"
                  class="title">
                  {{ issueKey }}
                </h2>
              </div>
              <VButtonIcon
                aria-label="Закрыть диалог"
                :icon="{ iconId: 'x' }"
                @click="handleClose" />
            </header>
            <form
              class="form"
              @submit.prevent="handleSubmit">
              <InputBase
                v-model="formData.hours"
                label="Часы"
                type="number"
                inputmode="numeric"
                placeholder="0"
                :disabled="isLoading"
                :error="errors.hours" />
              <InputBase
                v-model="formData.minutes"
                label="Минуты"
                type="number"
                inputmode="numeric"
                placeholder="0"
                :disabled="isLoading"
                :error="errors.minutes" />
              <InputBase
                v-model="formData.comment"
                label="Комментарий (опционально)"
                type="text"
                placeholder="Комментарий к записи"
                :disabled="isLoading" />
              <div class="actions">
                <VButton
                  variant="ghost"
                  type="button"
                  :disabled="isLoading"
                  @click="handleClose">
                  Отмена
                </VButton>
                <VButton
                  variant="primary"
                  type="submit"
                  :disabled="isLoading || !isFormValid">
                  {{ isLoading ? 'Сохранение...' : 'Сохранить' }}
                </VButton>
              </div>
            </form>
          </section>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'

import { ref, computed, watch } from 'vue'
import { VButton, VButtonIcon } from '@/shared/ui/button'
import { InputBase } from '@/shared/ui/input'
import { parseDurationToMinutes, minutesToDuration } from '../lib'

interface Props {
  visible: boolean
  worklogId: number
  issueId: string
  issueKey: string
  currentDuration: string
  currentComment: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: { worklogId: number; issueId: string; duration: string; comment: string }): void
}>()

interface FormData {
  hours: number | null
  minutes: number | null
  comment: string | null
}

const formData: Ref<FormData> = ref({
  hours: null,
  minutes: null,
  comment: null
})

const errors: Ref<{ hours?: string; minutes?: string }> = ref({})
const isLoading: Ref<boolean> = ref(false)

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      const totalMinutes = parseDurationToMinutes(props.currentDuration)
      formData.value = {
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
        comment: props.currentComment
      }
      errors.value = {}
    }
  }
)

const isFormValid = computed(() => {
  const { hours, minutes } = formData.value
  const totalMinutes = (hours ?? 0) * 60 + (minutes ?? 0)
  return totalMinutes > 0
})

const validateForm = (): boolean => {
  errors.value = {}

  const { hours, minutes } = formData.value

  if (hours !== null && (hours < 0 || hours > 999)) {
    errors.value.hours = 'Часы должны быть от 0 до 999'
  }

  if (minutes !== null && (minutes < 0 || minutes >= 60)) {
    errors.value.minutes = 'Минуты должны быть от 0 до 59'
  }

  const totalMinutes = (hours ?? 0) * 60 + (minutes ?? 0)
  if (totalMinutes <= 0) {
    errors.value.hours = 'Укажите затраченное время'
    return false
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (!validateForm()) return

  const { hours, minutes, comment } = formData.value
  const totalMinutes = (hours ?? 0) * 60 + (minutes ?? 0)
  const duration = minutesToDuration(totalMinutes)

  emit('save', {
    worklogId: props.worklogId,
    issueId: props.issueId,
    duration,
    comment: comment ?? ''
  })
}

const handleClose = () => {
  if (!isLoading.value) {
    emit('close')
  }
}
</script>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-slide-enter-active,
.dialog-slide-leave-active {
  transition: transform 0.3s ease;
}

.dialog-slide-enter-from,
.dialog-slide-leave-to {
  transform: translateY(-20px);
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 16px;
}

.dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  gap: 16px;
}

.info {
  flex: 1;
  min-width: 0;
}

.eyebrow {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  word-break: break-word;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

@media (max-width: 640px) {
  .overlay {
    align-items: flex-end;
  }

  .dialog {
    max-width: 100%;
    border-radius: 12px 12px 0 0;
  }

  .actions {
    flex-direction: column-reverse;
  }

  .actions button {
    width: 100%;
  }
}
</style>
