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
                <span class="eyebrow">Добавление записи</span>
                <h2
                  id="dialogTitle"
                  class="title">
                  {{ formattedDate }}
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
              <div class="searchField">
                <InputBase
                  ref="inputRef"
                  :modelValue="searchQuery"
                  label="Задача"
                  type="text"
                  placeholder="TASK-123 или название задачи"
                  :disabled="isLoading"
                  :error="errors.issue"
                  autocomplete="off"
                  @update:model-value="(newQuery) => (searchQuery = newQuery ?? '')"
                  @focus="isFocused = true"
                  @blur="isFocused = false" />
                <div
                  v-if="(showDropdown || isFocused) && searchQuery.length >= 2"
                  class="dropdown">
                  <div
                    v-if="isSearching"
                    class="dropdownItem loading">
                    Поиск задач...
                  </div>
                  <template v-else>
                    <button
                      v-for="suggestion in suggestions"
                      :key="suggestion.id"
                      type="button"
                      class="dropdownItem"
                      @click="selectIssue(suggestion)">
                      <span class="issueKey">{{ suggestion.key }}</span>
                      <span class="issueSummary">{{ suggestion.summary }}</span>
                    </button>
                    <div
                      v-if="showNoResults"
                      class="dropdownItem empty">
                      Ничего не найдено
                    </div>
                  </template>
                </div>
              </div>
              <div class="timeFields">
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
              </div>
              <InputBase
                v-model="formData.comment"
                label="Комментарий (опционально)"
                type="text"
                placeholder="Описание работы"
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
                  {{ isLoading ? 'Сохранение...' : 'Добавить' }}
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
import { minutesToDuration } from '../lib'
import { useIssueSearch } from './useIssueSearch'

interface Props {
  visible: boolean
  dateKey: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: { issueKey: string; start: string; duration: string; comment: string }): void
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

const selectedIssueKey: Ref<string> = ref('')
const errors: Ref<{ issue?: string; hours?: string; minutes?: string }> = ref({})
const isLoading: Ref<boolean> = ref(false)
const isIssueSelected: Ref<boolean> = ref(false)

const {
  searchQuery,
  suggestions,
  isSearching,
  selectIssue: selectIssueSuggestion,
  clearSearch,
  setPrimaryQueue,
  setUsername
} = useIssueSearch()

defineExpose({
  setPrimaryQueue,
  setUsername
})

const formattedDate = computed(() => {
  const date = new Date(props.dateKey)
  const formatted = date
    .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    .replace(' г.', '')
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
})

const isFocused = ref(false)

const showDropdown = computed(() => {
  if (isIssueSelected.value) return false
  if (searchQuery.value.length < 2) return false
  return isSearching.value || suggestions.value.length > 0
})

const showNoResults = computed(() => {
  return (
    !isIssueSelected.value &&
    !isSearching.value &&
    suggestions.value.length === 0 &&
    searchQuery.value.length >= 2
  )
})

watch(searchQuery, (newValue) => {
  if (isIssueSelected.value && newValue !== selectedIssueKey.value) {
    isIssueSelected.value = false
    selectedIssueKey.value = ''
  }
})

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      formData.value = { hours: null, minutes: null, comment: null }
      selectedIssueKey.value = ''
      isIssueSelected.value = false
      clearSearch()
      errors.value = {}
    }
  }
)

const selectIssue = (issue: { key: string; id: string; summary: string }): void => {
  selectedIssueKey.value = issue.key
  isIssueSelected.value = true
  selectIssueSuggestion(issue)
  errors.value.issue = undefined
}

const isFormValid = computed(() => {
  const { hours, minutes } = formData.value
  const totalMinutes = (hours ?? 0) * 60 + (minutes ?? 0)
  const hasIssue = selectedIssueKey.value.trim().length > 0 || searchQuery.value.trim().length > 0
  return totalMinutes > 0 && hasIssue
})

const validateForm = (): boolean => {
  errors.value = {}

  const issueKey = selectedIssueKey.value || searchQuery.value
  if (!issueKey || issueKey.trim().length === 0) {
    errors.value.issue = 'Выберите задачу'
  }

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

  const issueKey = selectedIssueKey.value || searchQuery.value

  const startDate = new Date(props.dateKey)
  startDate.setHours(9, 0, 0, 0)
  const start = startDate.toISOString().replace('Z', '+0000')

  emit('save', {
    issueKey: issueKey.trim(),
    start,
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
  z-index: 1002;
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

.searchField {
  position: relative;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-height: 240px;
  overflow-y: auto;
  z-index: 10;
  margin-top: 4px;
}

.dropdownItem {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: white;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-bottom: 1px solid #f3f4f6;
}

.dropdownItem:last-child {
  border-bottom: none;
}

.dropdownItem:hover:not(.loading):not(.empty) {
  background-color: #f9fafb;
}

.dropdownItem.loading,
.dropdownItem.empty {
  color: #6b7280;
  cursor: default;
  font-size: 14px;
  justify-content: center;
  align-items: center;
}

.issueKey {
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
}

.issueSummary {
  font-size: 14px;
  color: #4b5563;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeFields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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
