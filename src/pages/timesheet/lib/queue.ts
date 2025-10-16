import type { Worklog } from '../model'

export const extractQueueFromKey = (issueKey: string): string | null => {
  const match = issueKey.match(/^([A-Z]+)-\d+$/)
  return match && match[1] ? match[1] : null
}

export const getPrimaryQueue = (worklogs: Array<Worklog>): string | null => {
  if (worklogs.length === 0) return null

  const queueCounts = new Map<string, number>()

  for (const worklog of worklogs) {
    const queue = extractQueueFromKey(worklog.issue.key)
    if (queue) {
      queueCounts.set(queue, (queueCounts.get(queue) ?? 0) + 1)
    }
  }

  if (queueCounts.size === 0) return null

  let primaryQueue: string | null = null
  let maxCount = 0

  for (const [queue, count] of queueCounts.entries()) {
    if (count > maxCount) {
      maxCount = count
      primaryQueue = queue
    }
  }

  return primaryQueue
}
