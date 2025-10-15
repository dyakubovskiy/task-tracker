import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import TimeSheetDetailsModal from './WorklogModal.vue'

describe('WorklogModal', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  const createWrapper = (props?: Partial<InstanceType<typeof TimeSheetDetailsModal>['$props']>) =>
    mount(TimeSheetDetailsModal, {
      attachTo: document.body,
      props: {
        visible: true,
        title: '1 октября 2024',
        summary: {
          dateKey: '2024-10-01',
          totalMinutes: 105,
          items: [
            {
              id: 1,
              dateKey: '2024-10-01',
              minutes: 60,
              issue: { id: '1', key: 'TASK-1', display: 'Task 1', comment: 'Комментарий' }
            }
          ]
        },
        groups: [
          {
            issue: { id: '1', key: 'TASK-1', display: 'Task 1', comment: 'Комментарий' },
            entries: [
              { id: 1, dateKey: '2024-10-01', minutes: 60, comment: 'Комментарий' },
              { id: 2, dateKey: '2024-10-01', minutes: 45, comment: null }
            ],
            totalMinutes: 105
          }
        ],
        ...props
      }
    })

  it('отображает список задач и их записи с форматированием времени', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    const overlay = document.querySelector('.detailsOverlay')
    expect(overlay).not.toBeNull()

    const issueNames = Array.from(document.querySelectorAll('.issueName')).map((node) =>
      node.textContent?.trim()
    )
    expect(issueNames).toContain('Task 1')

    const totals = Array.from(document.querySelectorAll('.issueTotalTime')).map((node) =>
      node.textContent?.trim()
    )
    expect(totals).toContain('1 ч 45 м')

    const entryDurations = Array.from(document.querySelectorAll('.entryTime')).map((node) =>
      node.textContent?.trim()
    )
    expect(entryDurations).toEqual(['1 ч', '45 м'])

    const comments = Array.from(document.querySelectorAll('.entryComment')).map((node) =>
      node.textContent?.trim()
    )
    expect(comments).toContain('Комментарий отсутствует')

    await wrapper.unmount()
  })

  it('эмитит события удаления и закрытия', async () => {
    const wrapper = createWrapper()

    const deleteButton = document.querySelector(
      '[aria-label="Удалить запись"]'
    ) as HTMLButtonElement | null

    expect(deleteButton).not.toBeNull()

    deleteButton?.click()

    const deleteEvents = wrapper.emitted('delete') as Array<[string, number]> | undefined

    expect(deleteEvents?.[0]).toEqual(['1', 1])

    const overlay = document.querySelector('.detailsOverlay')
    overlay?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()

    expect(wrapper.emitted('close')).toHaveLength(1)

    await wrapper.unmount()
  })

  it('отображает скелетон при загрузке', async () => {
    const wrapper = createWrapper({ isLoading: true })
    await flushPromises()

    const skeletonGroups = document.querySelectorAll('.detailsIssueGroup.skeleton')
    expect(skeletonGroups).toHaveLength(3)

    await wrapper.unmount()
  })

  it('показывает пустое состояние при отсутствии записей', async () => {
    const wrapper = createWrapper({
      groups: [],
      summary: {
        dateKey: '2024-10-01',
        totalMinutes: 0,
        items: []
      }
    })

    await flushPromises()
    const emptyState = document.querySelector('.detailsEmpty')
    expect(emptyState?.textContent).toContain('Нет записей за этот день')

    await wrapper.unmount()
  })

  it('не отображает модалку, когда она скрыта', async () => {
    const wrapper = createWrapper({ visible: false })
    await flushPromises()

    expect(document.querySelector('.detailsOverlay')).toBeNull()

    await wrapper.unmount()
  })

  it('эмитит событие закрытия по клику на кнопку', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    const closeButton = document.querySelector(
      '[aria-label="Закрыть диалог"]'
    ) as HTMLButtonElement | null

    expect(closeButton).not.toBeNull()

    closeButton?.click()
    await flushPromises()

    expect(wrapper.emitted().close).toHaveLength(1)

    await wrapper.unmount()
  })
})
