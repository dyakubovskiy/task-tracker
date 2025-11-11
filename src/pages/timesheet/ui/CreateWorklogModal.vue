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
                  @focus="handleInputFocus"
                  @blur="handleInputBlur" />

                <div
                  v-if="showDropdown"
                  class="dropdown"
                  @mouseenter="isMouseInsideDropdown = true"
                  @mouseleave="isMouseInsideDropdown = false"
                  @mousedown.prevent>
                  <!-- Tabs -->
                  <div class="tabs">
                    <button
                      v-for="tab in tabs"
                      :key="tab.id"
                      type="button"
                      class="tab"
                      :class="{ active: activeTab === tab.id }"
                      @click="activeTab = tab.id">
                      {{ tab.label }}
                      <span
                        v-if="tab.count !== undefined"
                        class="tabBadge">
                        {{ tab.count }}
                      </span>
                    </button>
                  </div>

                  <!-- Tab Content -->
                  <div class="tabContent">
                    <!-- Search Tab -->
                    <div
                      v-if="activeTab === 'search'"
                      class="tabPanel">
                      <div
                        v-if="searchQuery.length < 2"
                        class="dropdownItem empty">
                        Введите минимум 2 символа
                      </div>
                      <div
                        v-else-if="isSearching"
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
                          v-if="suggestions.length === 0 && searchQuery.length >= 2"
                          class="dropdownItem empty">
                          Ничего не найдено
                        </div>
                      </template>
                    </div>

                    <!-- Favorites Tab -->
                    <div
                      v-if="activeTab === 'favorites'"
                      class="tabPanel">
                      <button
                        v-for="issue in favoriteIssues"
                        :key="issue.id"
                        type="button"
                        class="dropdownItem"
                        @click="selectIssue(issue)">
                        <span class="issueKey">{{ issue.key }}</span>
                        <span class="issueSummary">{{ issue.summary }}</span>
                      </button>
                      <div
                        v-if="favoriteIssues.length === 0"
                        class="dropdownItem empty">
                        Нет избранных задач
                      </div>
                    </div>

                    <!-- Recent Tab -->
                    <div
                      v-if="activeTab === 'recent'"
                      class="tabPanel">
                      <button
                        v-for="issue in recentIssues"
                        :key="issue.id"
                        type="button"
                        class="dropdownItem"
                        @click="selectIssue(issue)">
                        <span class="issueKey">{{ issue.key }}</span>
                        <span class="issueSummary">{{ issue.summary }}</span>
                      </button>
                      <div
                        v-if="recentIssues.length === 0"
                        class="dropdownItem empty">
                        Нет недавних задач за этот месяц
                      </div>
                    </div>
                  </div>
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

interface Issue {
  id: string
  key: string
  summary: string
}

interface Props {
  visible: boolean
  dateKey: string
  favoriteIssues?: Issue[]
  recentIssues?: Issue[]
}

const props = withDefaults(defineProps<Props>(), {
  favoriteIssues: () => [],
  recentIssues: () => []
})

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
const isFocused = ref(false)
const activeTab = ref<'search' | 'favorites' | 'recent'>('search')
const isMouseInsideDropdown = ref(false)

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

const tabs = computed(() => [
  { id: 'search' as const, label: 'Поиск' },
  { id: 'favorites' as const, label: 'Избранное', count: props.favoriteIssues.length },
  { id: 'recent' as const, label: 'Недавние', count: props.recentIssues.length }
])

const formattedDate = computed(() => {
  const date = new Date(props.dateKey)
  const formatted = date
    .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    .replace(' г.', '')
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
})

const showDropdown = computed(() => {
  if (isIssueSelected.value) return false
  if (!isFocused.value) return false

  // Show dropdown if there's content to show in any tab
  if (activeTab.value === 'search') {
    return searchQuery.value.length >= 0 // Always show search tab when focused
  }
  if (activeTab.value === 'favorites') {
    return props.favoriteIssues.length > 0 || isFocused.value
  }
  if (activeTab.value === 'recent') {
    return props.recentIssues.length > 0 || isFocused.value
  }

  return false
})

const handleInputFocus = () => {
  isFocused.value = true
  // Auto-switch to appropriate tab based on content
  if (searchQuery.value.length < 2) {
    if (props.favoriteIssues.length > 0) {
      activeTab.value = 'favorites'
    } else if (props.recentIssues.length > 0) {
      activeTab.value = 'recent'
    } else {
      activeTab.value = 'search'
    }
  }
}

const handleInputBlur = () => {
  // Delay to allow click on dropdown items
  setTimeout(() => {
    if (!isMouseInsideDropdown.value) {
      isFocused.value = false
    }
  }, 150)
}

watch(searchQuery, (newValue) => {
  if (isIssueSelected.value && newValue !== selectedIssueKey.value) {
    isIssueSelected.value = false
    selectedIssueKey.value = ''
  }

  // Auto-switch to search tab when user types
  if (newValue.length >= 2 && activeTab.value !== 'search') {
    activeTab.value = 'search'
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
      // Reset to default tab
      if (props.favoriteIssues.length > 0) {
        activeTab.value = 'favorites'
      } else {
        activeTab.value = 'search'
      }
    }
  }
)

const selectIssue = (issue: Issue): void => {
  selectedIssueKey.value = issue.key
  isIssueSelected.value = true
  searchQuery.value = issue.key
  selectIssueSuggestion(issue)
  errors.value.issue = undefined
  isFocused.value = false
  isMouseInsideDropdown.value = false
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
.overlay {
  position: fixed;
  inset: 0;
  background-color: var(--color-backdrop);
  backdrop-filter: blur(0.4rem);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-16);
}

.dialog {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: min(52rem, 100%);
  max-height: calc(100dvh - 3.2rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-16);
  padding: var(--spacing-24);
  border-bottom: 0.1rem solid var(--color-border);
}

.info {
  flex: 1;
}

.eyebrow {
  display: block;
  font-size: 1.3rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-4);
}

.title {
  font-size: 2rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.form {
  padding: var(--spacing-24);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-20);
  overflow-y: auto;
}

.searchField {
  position: relative;
}

.dropdown {
  position: absolute;
  top: calc(100% + 0.4rem);
  left: 0;
  right: 0;
  background-color: var(--color-surface);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  max-height: 32rem;
  overflow: hidden;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  gap: 0;
  padding: var(--spacing-8) var(--spacing-8) 0;
  border-bottom: 0.1rem solid var(--color-border);
  background-color: var(--color-surface);
}

.tab {
  flex: 1;
  padding: var(--spacing-8) var(--spacing-12);
  font-size: 1.4rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  background: none;
  border: none;
  border-bottom: 0.2rem solid transparent;
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-8);
  position: relative;
  margin-bottom: -0.1rem;
}

.tab:hover {
  color: var(--color-text-secondary);
  background-color: var(--color-surface-variant);
}

.tab.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.tabBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 var(--spacing-4);
  font-size: 1.2rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  background-color: var(--color-surface-variant);
  border-radius: var(--radius-sm);
}

.tab.active .tabBadge {
  color: var(--color-accent);
  background-color: var(--color-toast-info-bg);
}

.tabContent {
  overflow-y: auto;
  max-height: 28rem;
}

.tabPanel {
  padding: var(--spacing-4);
}

.dropdownItem {
  width: 100%;
  padding: var(--spacing-12) var(--spacing-16);
  text-align: left;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color var(--transition-base);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.dropdownItem:not(.empty):not(.loading):hover {
  background-color: var(--color-surface-variant);
}

.dropdownItem.empty,
.dropdownItem.loading {
  color: var(--color-text-muted);
  font-size: 1.4rem;
  text-align: center;
  cursor: default;
  padding: var(--spacing-20);
}

.issueKey {
  font-size: 1.3rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-accent);
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
}

.issueSummary {
  font-size: 1.4rem;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeFields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-16);
}

.actions {
  display: flex;
  gap: var(--spacing-12);
  justify-content: flex-end;
  padding-top: var(--spacing-8);
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity var(--transition-emphasized);
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-slide-enter-active,
.dialog-slide-leave-active {
  transition: all var(--transition-emphasized);
}

.dialog-slide-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-2rem);
}

.dialog-slide-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(2rem);
}

@media (max-width: 640px) {
  .dialog {
    width: 100%;
    max-height: 100dvh;
    border-radius: 0;
  }

  .timeFields {
    grid-template-columns: 1fr;
  }

  .tabs {
    padding: var(--spacing-4);
  }

  .tab {
    font-size: 1.3rem;
    padding: var(--spacing-8);
  }
}
</style>
