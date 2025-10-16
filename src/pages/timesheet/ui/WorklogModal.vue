<template>
  <teleport to="body">
    <transition name="dialog-fade">
      <div
        v-if="visible"
        class="detailsOverlay"
        @click.self="handleClose">
        <transition name="dialog-slide">
          <section
            v-if="visible"
            class="detailsDialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detailsTitle">
            <header class="detailsHeader">
              <div class="detailsInfo">
                <span class="detailsEyebrow">Записи за</span>
                <h2
                  id="detailsTitle"
                  class="detailsTitle">
                  {{ title }}
                </h2>
              </div>
              <VButtonIcon
                aria-label="Закрыть диалог"
                :icon="{ iconId: 'x' }"
                @click="handleClose" />
            </header>
            <div
              v-if="isLoading"
              class="detailsList">
              <div
                v-for="i in 3"
                :key="`skeleton-${i}`"
                class="detailsIssueGroup skeleton">
                <header class="issueHeader">
                  <div class="issueInfo">
                    <span class="skeletonLine skeletonLine--short" />
                    <span class="skeletonLine skeletonLine--long" />
                  </div>
                  <span class="skeletonLine skeletonLine--time" />
                </header>
                <div class="entriesList">
                  <div
                    v-for="j in 2"
                    :key="`skeleton-entry-${j}`"
                    class="entryItem skeleton">
                    <div class="entryContent">
                      <span class="skeletonLine skeletonLine--comment" />
                      <span class="skeletonLine skeletonLine--time" />
                    </div>
                    <div class="entryActions">
                      <span class="skeletonLine skeletonLine--icon" />
                      <span class="skeletonLine skeletonLine--icon" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else-if="hasEntries"
              class="detailsList">
              <article
                v-for="grouped in groups"
                :key="grouped.issue.key"
                class="detailsIssueGroup">
                <header class="issueHeader">
                  <div class="issueInfo">
                    <a
                      :href="`https://tracker.yandex.ru/${grouped.issue.key}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="issueKey">
                      {{ grouped.issue.key }}
                    </a>
                    <h3 class="issueName">{{ grouped.issue.display }}</h3>
                  </div>
                  <div class="issueTotalTime">
                    {{ formatMinutes(grouped.totalMinutes) }}
                  </div>
                </header>
                <div class="entriesList">
                  <div
                    v-for="entry in grouped.entries"
                    :key="entry.id"
                    class="entryItem">
                    <div class="entryContent">
                      <p class="entryComment">
                        {{ entry.comment ?? 'Комментарий отсутствует' }}
                      </p>
                      <span class="entryTime">{{ formatMinutes(entry.minutes) }}</span>
                    </div>
                    <div class="entryActions">
                      <VButtonIcon
                        aria-label="Редактировать запись"
                        :icon="{ iconId: 'edit' }"
                        class="actionBtn actionBtn--edit"
                        @click="
                          handleEdit(
                            entry.id,
                            entry.minutes,
                            entry.comment,
                            grouped.issue.id,
                            grouped.issue.key,
                            entry.duration
                          )
                        " />
                      <VButtonIcon
                        aria-label="Удалить запись"
                        :icon="{ iconId: 'trash' }"
                        class="actionBtn actionBtn--delete"
                        @click="$emit('delete', grouped.issue.id, entry.id)" />
                    </div>
                  </div>
                </div>
              </article>
            </div>
            <p
              v-if="!isLoading && !hasEntries"
              class="detailsEmpty">
              Нет записей за этот день
            </p>
          </section>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { VButtonIcon } from '@/shared/ui/button'
import { formatMinutes } from '../lib'
import type { DayWorklogSummary, GroupedWorklogIssue } from './useTimesheet'

interface Props {
  visible: boolean
  title: string
  summary: DayWorklogSummary | null
  groups: GroupedWorklogIssue[]
  isLoading?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete', issueId: string, worklogId: number): void
  (
    e: 'edit',
    payload: {
      worklogId: number
      issueId: string
      issueKey: string
      duration: string
      comment: string | null
    }
  ): void
}>()

const hasEntries = computed(() => props.groups.length > 0)

const handleClose = () => {
  emit('close')
}

const handleEdit = (
  worklogId: number,
  minutes: number,
  comment: string | null,
  issueId: string,
  issueKey: string,
  duration: string
) => {
  emit('edit', {
    worklogId,
    issueId,
    issueKey,
    duration,
    comment
  })
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

/* Smooth scroll behavior */
.detailsDialog {
  scroll-behavior: smooth;
}

/* Overlay */
.detailsOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

/* Dialog */
.detailsDialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 700px;
  width: 100%;
  max-height: 75dvh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  /* Firefox scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

/* Chrome, Safari, Edge scrollbar */
.detailsDialog::-webkit-scrollbar {
  width: 8px;
}

.detailsDialog::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
  margin: 4px 0;
}

.detailsDialog::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
  border: 2px solid #f3f4f6;
  transition: background-color 0.2s ease;
}

.detailsDialog::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.detailsDialog::-webkit-scrollbar-thumb:active {
  background: #6b7280;
}

/* Header */
.detailsHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  gap: 16px;
}

.detailsInfo {
  flex: 1;
  min-width: 0;
}

.detailsEyebrow {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.detailsTitle {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

/* List */
.detailsList {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detailsEmpty {
  text-align: center;
  color: #9ca3af;
  padding: 48px 16px;
  font-size: 16px;
}

/* Issue Group */
.detailsIssueGroup {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #f9fafb;
  transition: box-shadow 0.2s ease;
}

.detailsIssueGroup:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.issueHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  gap: 12px;
}

.issueInfo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.issueKey {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
  transition: color 0.2s ease;
  width: fit-content;
}

.issueKey:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.issueKey:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
  border-radius: 2px;
}

.issueName {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  word-break: break-word;
}

.issueTotalTime {
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  background: white;
  padding: 4px 12px;
  border-radius: 6px;
  white-space: nowrap;
}

/* Entries List */
.entriesList {
  display: flex;
  flex-direction: column;
  padding: 0;
}

.entryItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: white;
  transition: background-color 0.2s ease;
  gap: 12px;
}

.entriesList > .entryItem:first-child {
  border-top: none;
}

.entryItem:hover {
  background-color: #f3f4f6;
}

.entryContent {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.entryComment {
  flex: 1;
  font-size: 14px;
  color: #4b5563;
  margin: 0;
  word-break: break-word;
}

.entryTime {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  background: #f0f1f3;
  padding: 4px 10px;
  border-radius: 4px;
  white-space: nowrap;
}

/* Actions */
.entryActions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.actionBtn {
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.actionBtn--edit {
  color: #2563eb;
}

.actionBtn--edit:hover {
  background-color: #dbeafe;
  color: #1d4ed8;
}

.actionBtn--delete {
  color: #dc2626;
}

.actionBtn--delete:hover {
  background-color: #fee2e2;
  color: #b91c1c;
}

.actionBtn:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Skeleton Loading */
.skeleton {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeletonLine {
  display: block;
  background: #e5e7eb;
  border-radius: 4px;
  height: 16px;
}

.skeletonLine--short {
  width: 60px;
}

.skeletonLine--long {
  width: 100%;
  height: 20px;
  margin-top: 8px;
}

.skeletonLine--comment {
  width: 100%;
  height: 14px;
}

.skeletonLine--time {
  width: 50px;
  height: 14px;
}

.skeletonLine--icon {
  width: 24px;
  height: 24px;
}

/* Responsive */
@media (max-width: 640px) {
  .detailsOverlay {
    align-items: flex-end;
  }

  .detailsDialog {
    max-width: 100%;
    border-radius: 12px 12px 0 0;
    max-height: 90vh;
  }

  .detailsHeader {
    flex-direction: column;
    gap: 12px;
  }

  .issueHeader {
    flex-direction: column;
    gap: 8px;
  }

  .issueTotalTime {
    align-self: flex-start;
  }

  .entryContent {
    flex-direction: column;
    align-items: flex-start;
  }

  .entryTime {
    align-self: flex-end;
  }
}
</style>
