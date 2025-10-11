import { http } from '@/shared/api'

interface WorklogParams {
  userId: string
  period: { from: string; to: string }
  elementCount?: number
}

interface WorklogDTO {
  self: string
  id: number
  version: number
  issue: {
    self: string
    id: string
    key: string
    display: string
  }
  createdBy: {
    self: string
    id: string
    display: string
    cloudUid: string
    passportUid: number
  }
  updatedBy: {
    self: string
    id: string
    display: string
    cloudUid: string
    passportUid: number
  }
  createdAt: string
  updatedAt: string
  start: string
  duration: string
}

interface Worklog {
  id: number
  start: string
  duration: string
  issue: {
    id: string
    key: string
    display: string
  }
}

export const getWorklogs = async ({
  userId,
  period: { from, to },
  elementCount = 250
}: WorklogParams): Promise<Array<Worklog>> =>
  http.fetchList<WorklogDTO, Worklog>('post', '/worklog/_search', {
    query: {
      perPage: elementCount
    },
    payload: {
      createdBy: userId,
      start: {
        from,
        to
      }
    },
    adapter: worklogMapDTO
  })

const worklogMapDTO = (dto: WorklogDTO): Worklog => ({
  id: dto.id,
  start: dto.start,
  duration: dto.duration,
  issue: {
    id: dto.issue.id,
    key: dto.issue.key,
    display: dto.issue.display
  }
})
