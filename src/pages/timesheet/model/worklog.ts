import type { Worklog } from './types'

import { getWorklogs } from '../api'
import { getMonthPeriod } from '../lib'

interface UseWorklog {
  fetchWorklogs: (month: Date) => Promise<Array<Worklog>>
}

export const useWorklog = (): UseWorklog => {
  const USER_ID = '8000000000000085'

  const fetchWorklogs: UseWorklog['fetchWorklogs'] = async (month) => {
    const { from, to } = getMonthPeriod(month)

    const worklogs = await getWorklogs({
      userId: USER_ID,
      period: { from, to }
    })

    return worklogs
  }

  return { fetchWorklogs }
}
