<template>
  <section class="timesheet">
    <div class="timesheetContainer">
      <header class="header">
        <div class="heading">
          <span class="eyebrow">Табель</span>
          <h1 class="title">{{ monthTitle }}</h1>
        </div>
        <div
          class="controls"
          role="group"
          aria-label="Навигация по месяцам">
          <VButtonIcon
            aria-label="Предыдущий месяц"
            :icon="{ iconId: 'arrow-left' }"
            @click="changeMonth(-1)" />
          <VButtonIcon
            aria-label="Следующий месяц"
            :icon="{ iconId: 'arrow-right' }"
            @click="changeMonth(1)" />
        </div>
      </header>
      <div class="calendarCard surface surface--elevated">
        <div class="weekdayRow">
          <span
            v-for="weekday in WEEKDAY_LABELS"
            :key="weekday"
            class="weekday">
            {{ weekday }}
          </span>
        </div>
        <div
          v-if="isLoading"
          class="calendarSkeleton">
          <div
            v-for="(week, weekIndex) in skeletonGrid"
            :key="`skeleton-week-${weekIndex}`"
            class="weekRow">
            <div
              v-for="dayKey in week"
              :key="`skeleton-day-${dayKey}`"
              class="dayCell skeleton">
              <span class="skeletonLabel" />
              <span class="skeletonTotal" />
            </div>
          </div>
        </div>
        <div
          v-else
          class="calendarGrid">
          <div
            v-for="(week, weekIndex) in weeks"
            :key="week[0]?.dateKey ?? weekIndex"
            class="weekRow">
            <article
              v-for="day in week"
              :key="day.dateKey"
              class="dayCell"
              :class="{
                muted: !day.isCurrentMonth,
                active: day.totalMinutes > 0
              }"
              role="button"
              tabindex="0"
              :data-date-key="day.dateKey"
              @click="openDay(day)"
              @keydown.enter.prevent="openDay(day)"
              @keydown.space.prevent="openDay(day)">
              <header class="dayHeader">
                <span class="dayLabel">{{ day.label }}</span>
                <span class="dayTotal">{{ formatMinutes(day.totalMinutes) }}</span>
              </header>
            </article>
          </div>
        </div>
      </div>
    </div>
    <TimeSheetDetailsModal
      :visible="isDetailsOpen"
      :title="selectedDateTitle"
      :summary="selectedSummary"
      :groups="selectedGroups"
      :isLoading
      @close="closeDetails"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="deleteWorkLogHandler" />
    <EditWorklogModal
      :visible="isEditModalOpen"
      :worklog-id="editingWorklog.worklogId"
      :issue-id="editingWorklog.issueId"
      :issue-key="editingWorklog.issueKey"
      :current-duration="editingWorklog.duration"
      :current-comment="editingWorklog.comment"
      @close="closeEditModal"
      @save="handleEditSave" />
    <CreateWorklogModal
      ref="createModalRef"
      :visible="isCreateModalOpen"
      :date-key="selectedDay?.dateKey ?? ''"
      @close="closeCreateModal"
      @save="handleCreateSave" />
  </section>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { CalendarDay, DayWorklogSummary } from './useTimesheet'

import { ref, computed, watch } from 'vue'
import { userModel } from '@/entities/user'
import { useToast } from '@/shared/ui/toast'
import { VButtonIcon } from '@/shared/ui/button'
import { formatMinutes, getMonthPeriod, getPrimaryQueue } from '../lib'
import { getWorklogs, deleteWorkLog, updateWorklog, createWorklog } from '../api'
import { useTimesheetCalendar } from './useTimesheet'
import TimeSheetDetailsModal from './WorklogModal.vue'
import EditWorklogModal from './EditWorklogModal.vue'
import CreateWorklogModal from './CreateWorklogModal.vue'

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const skeletonGrid = Array.from({ length: 6 }, (_, weekIndex) =>
  Array.from({ length: 7 }, (_, dayIndex) => `${weekIndex}-${dayIndex}`)
)

const isLoading: Ref<boolean> = ref(false)
const selectedDay: Ref<CalendarDay | null> = ref(null)
const isEditModalOpen: Ref<boolean> = ref(false)
const isCreateModalOpen: Ref<boolean> = ref(false)
const primaryQueue: Ref<string | null> = ref(null)
const createModalRef: Ref<InstanceType<typeof CreateWorklogModal> | null> = ref(null)
const editingWorklog: Ref<{
  worklogId: number
  issueId: string
  issueKey: string
  duration: string
  comment: string | null
}> = ref({
  worklogId: 0,
  issueId: '',
  issueKey: '',
  duration: '',
  comment: null
})

const {
  activeMonth,
  weeks,
  monthTitle,
  changeMonth,
  getMonthlyTimesheet,
  getDaySummary,
  getDayDetails
} = useTimesheetCalendar()

const createEmptySummary = (dateKey: string): DayWorklogSummary => ({
  dateKey,
  totalMinutes: 0,
  items: []
})

const selectedSummary: Ref<DayWorklogSummary | null> = computed(() => {
  if (!selectedDay.value) return null

  const summary = getDaySummary(selectedDay.value.dateKey)
  if (summary) return summary

  return createEmptySummary(selectedDay.value.dateKey)
})

const selectedGroups = computed(() => {
  if (!selectedDay.value) return []
  return getDayDetails(selectedDay.value.dateKey)?.groups ?? []
})

const selectedDateTitle: Ref<string> = computed(() => {
  if (!selectedDay.value) return ''

  const date = new Date(selectedDay.value.dateKey)
  const formatted = date
    .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    .replace(' г.', '')

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
})

const isDetailsOpen: Ref<boolean> = computed(() => selectedDay.value !== null)

const loadMonth = async (userId: number, date: Date): Promise<void> => {
  isLoading.value = true
  await new Promise((resolve) => setTimeout(resolve, 500))
  const worklogs = await getWorklogs({ userId, period: getMonthPeriod(date) })
  getMonthlyTimesheet(date, worklogs)

  primaryQueue.value = getPrimaryQueue(worklogs)

  isLoading.value = false
}

const { getAuthUser } = userModel()
const userId: Ref<number> = computed(() => getAuthUser().id)

watch(
  [userId, activeMonth],
  ([newUserId, newActiveMonth]) => loadMonth(newUserId, newActiveMonth),
  { immediate: true }
)

const openDay = (day: CalendarDay): void => {
  if (isLoading.value) return
  selectedDay.value = day
}

const closeDetails = (): void => {
  selectedDay.value = null
}

const handleAdd = (): void => {
  isCreateModalOpen.value = true
  if (createModalRef.value) {
    if (primaryQueue.value) {
      createModalRef.value.setPrimaryQueue(primaryQueue.value)
    }
    const user = getAuthUser()
    createModalRef.value.setUsername(String(user.id))
  }
}

const handleEdit = (payload: {
  worklogId: number
  issueId: string
  issueKey: string
  duration: string
  comment: string | null
}): void => {
  editingWorklog.value = payload
  isEditModalOpen.value = true
}

const closeEditModal = (): void => {
  isEditModalOpen.value = false
}

const closeCreateModal = (): void => {
  isCreateModalOpen.value = false
}

const handleEditSave = async (payload: {
  worklogId: number
  issueId: string
  duration: string
  comment: string
}): Promise<void> => {
  isLoading.value = true
  isEditModalOpen.value = false

  const updatedWorklog = await updateWorklog({
    issueId: payload.issueId,
    worklogId: payload.worklogId,
    duration: payload.duration,
    comment: payload.comment || undefined
  })

  if (updatedWorklog === null) {
    isLoading.value = false
    addToast({
      variant: 'danger',
      title: 'Ошибка при редактировании записи'
    })
    return
  }

  await loadMonth(userId.value, activeMonth.value)
  selectedDay.value = selectedDay.value

  isLoading.value = false

  addToast({
    variant: 'success',
    title: 'Запись успешно обновлена'
  })
}

const handleCreateSave = async (payload: {
  issueKey: string
  start: string
  duration: string
  comment: string
}): Promise<void> => {
  isLoading.value = true
  isCreateModalOpen.value = false

  const createdWorklog = await createWorklog({
    issueKey: payload.issueKey,
    start: payload.start,
    duration: payload.duration,
    comment: payload.comment || undefined
  })

  if (createdWorklog === null) {
    isLoading.value = false
    addToast({
      variant: 'danger',
      title: 'Ошибка при добавлении записи'
    })
    return
  }

  await loadMonth(userId.value, activeMonth.value)
  selectedDay.value = selectedDay.value

  isLoading.value = false

  addToast({
    variant: 'success',
    title: 'Запись успешно добавлена'
  })
}

const { addToast } = useToast()
const deleteWorkLogHandler = async (issueId: string, worklogId: number) => {
  isLoading.value = true

  const isDeleted = await deleteWorkLog(issueId, worklogId)

  if (isDeleted === false) {
    isLoading.value = false
    addToast({
      variant: 'danger',
      title: 'Ошибка при удалении записи'
    })
    return
  }
  await loadMonth(userId.value, activeMonth.value)

  selectedDay.value = selectedDay.value

  isLoading.value = false

  addToast({
    variant: 'success',
    title: 'Запись успешно удалена'
  })
}
</script>

<style scoped>
.timesheet {
  width: 100%;
  padding: var(--spacing-32) var(--spacing-32) var(--spacing-24);
  background-color: var(--color-bg);
  display: flex;
  justify-content: center;
}

.timesheetContainer {
  width: min(112rem, 100%);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-24);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-20);
}

.heading {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.eyebrow {
  font-size: 1.3rem;
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.title {
  font-size: 2.8rem;
  text-transform: capitalize;
}

.controls {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-12);
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-8);
  box-shadow: var(--shadow-sm);
  border: 0.1rem solid var(--color-border);
}

.controls :deep(.button) {
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  padding: var(--spacing-8) var(--spacing-12);
  line-height: 1;
  color: var(--color-text-primary);
  transition: background-color var(--transition-base);
}

.controls :deep(.button:hover),
.controls :deep(.button:focus-visible) {
  background: var(--color-surface-variant);
}

.calendarCard {
  padding: var(--spacing-24);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-16);
}

.weekdayRow {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--spacing-8);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  text-align: center;
}

.weekday {
  padding: var(--spacing-4) 0;
}

.calendarGrid,
.calendarSkeleton {
  display: grid;
  grid-template-rows: repeat(6, minmax(6.4rem, 1fr));
  gap: var(--spacing-8);
}

.weekRow {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--spacing-8);
}

.dayCell {
  border-radius: var(--radius-md);
  padding: var(--spacing-12);
  background: var(--color-surface);
  border: 0.1rem solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
  min-height: 7.2rem;
  box-shadow: var(--shadow-sm);
  transition:
    border-color var(--transition-base),
    box-shadow var(--transition-base),
    transform var(--transition-base);
  cursor: pointer;
}

.dayCell:focus-visible,
.dayCell:hover {
  transform: translateY(-0.1rem);
  box-shadow: var(--shadow-md);
}

.dayCell.muted {
  opacity: 0.55;
  pointer-events: none;
}

.dayCell.active {
  border-color: var(--color-accent-strong);
}

.dayHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.dayLabel {
  font-size: 1.6rem;
}

.dayTotal {
  color: var(--color-text-secondary);
  font-size: 1.4rem;
}

.dayCell.skeleton {
  cursor: default;
  pointer-events: none;
  border-color: transparent;
  box-shadow: none;
  background: var(--color-surface-variant);
}

.skeletonLabel,
.skeletonTotal {
  display: block;
  height: 1.2rem;
  border-radius: var(--radius-pill);
  background: var(--color-border);
  animation: pulse 1.6s ease-in-out infinite;
}

.skeletonLabel {
  width: 2.4rem;
}

.skeletonTotal {
  width: 4.8rem;
  margin-left: auto;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.45;
  }

  50% {
    opacity: 0.85;
  }
}

@media (max-width: 1024px) {
  .timesheet {
    padding: var(--spacing-24) var(--spacing-20);
  }

  .header {
    align-items: flex-start;
    flex-direction: column;
  }

  .controls {
    align-self: flex-end;
  }

  .title {
    font-size: 2.4rem;
  }

  .calendarGrid,
  .calendarSkeleton {
    gap: var(--spacing-4);
  }

  .weekRow {
    gap: var(--spacing-4);
  }

  .dayCell {
    padding: var(--spacing-8);
    min-height: 6.4rem;
  }
}

@media (max-width: 640px) {
  .timesheet {
    padding: var(--spacing-20) var(--spacing-12);
  }

  .calendarCard {
    padding: var(--spacing-16);
  }

  .title {
    font-size: 2.1rem;
  }

  .weekdayRow,
  .weekRow {
    gap: var(--spacing-4);
  }

  .dayLabel {
    font-size: 1.4rem;
  }

  .dayTotal {
    font-size: 1.2rem;
  }
}
</style>
