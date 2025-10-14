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
    <teleport to="body">
      <div
        v-if="isDetailsOpen"
        class="detailsOverlay"
        @click.self="closeDetails">
        <section
          class="detailsDialog"
          role="dialog"
          aria-modal="true">
          <header class="detailsHeader">
            <div class="detailsInfo">
              <span class="detailsEyebrow">Записи за</span>
              <h2 class="detailsTitle">{{ selectedDateTitle }}</h2>
            </div>
            <VButtonIcon
              aria-label="Закрыть"
              :icon="{ iconId: 'x' }"
              @click="closeDetails" />
          </header>
          <div
            v-if="selectedSummary?.items.length"
            class="detailsList">
            <article
              v-for="item in selectedSummary.items"
              :key="item.id"
              class="detailsItem">
              <div class="detailsIssue">
                <span class="detailsIssueKey">{{ item.issue.key }}</span>
                <span class="detailsIssueName">{{ item.issue.display }}</span>
              </div>
              <span class="detailsDuration">{{ formatMinutes(item.minutes) }}</span>
            </article>
          </div>
          <p
            v-else
            class="detailsEmpty">
            Нет записей за этот день
          </p>
        </section>
      </div>
    </teleport>
  </section>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { CalendarDay, DayWorklogSummary } from './useTimesheet'

import { ref, computed, watch } from 'vue'
import { userModel } from '@/entities/user'
import { VButtonIcon } from '@/shared/ui/button'
import { formatMinutes, getMonthPeriod } from '../lib'
import { getWorklogs } from '../api'
import { useTimesheetCalendar } from './useTimesheet'

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const skeletonGrid = Array.from({ length: 6 }, (_, weekIndex) =>
  Array.from({ length: 7 }, (_, dayIndex) => `${weekIndex}-${dayIndex}`)
)

const isLoading: Ref<boolean> = ref(false)
const selectedDay: Ref<CalendarDay | null> = ref(null)

const { activeMonth, weeks, monthTitle, changeMonth, getMonthlyTimesheet, getDaySummary } =
  useTimesheetCalendar()

const selectedSummary: Ref<DayWorklogSummary | null> = computed(() => {
  if (!selectedDay.value) return null

  const summary = getDaySummary(selectedDay.value.dateKey)
  if (summary) return summary

  return {
    dateKey: selectedDay.value.dateKey,
    totalMinutes: 0,
    items: []
  }
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
  selectedDay.value = null

  const worklogs = await getWorklogs({ userId, period: getMonthPeriod(date) })
  getMonthlyTimesheet(date, worklogs)

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

.detailsOverlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 11, 19, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-24);
  z-index: 1000;
}

.detailsDialog {
  width: min(42rem, 100%);
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: var(--spacing-24);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-20);
}

.detailsHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-16);
}

.detailsInfo {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.detailsEyebrow {
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.detailsTitle {
  font-size: 2rem;
}

.detailsList {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
}

.detailsItem {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-12);
  padding: var(--spacing-12) 0;
  border-bottom: 0.1rem solid var(--color-border);
}

.detailsItem:last-of-type {
  border-bottom: none;
}

.detailsIssue {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.detailsIssueKey {
  font-weight: var(--font-weight-medium);
}

.detailsIssueName {
  color: var(--color-text-secondary);
}

.detailsDuration {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.detailsEmpty {
  margin: 0;
  color: var(--color-text-secondary);
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
