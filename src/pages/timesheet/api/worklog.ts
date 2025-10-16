import type { Worklog } from '../model'

import { http } from '@/shared/api'

interface WorklogParams {
  userId: number
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
  comment?: string
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

export const deleteWorkLog = async (issueId: string, worklogId: number): Promise<boolean> =>
  http.requestSuccess('delete', `/issues/${issueId}/worklog/${worklogId}`)

interface UpdateWorklogParams {
  issueId: string
  worklogId: number
  duration: string
  comment?: string
}

export const updateWorklog = async ({
  issueId,
  worklogId,
  duration,
  comment
}: UpdateWorklogParams): Promise<Worklog | null> =>
  http.fetchData<WorklogDTO, Worklog>('patch', `/issues/${issueId}/worklog/${worklogId}`, {
    payload: {
      duration,
      ...(comment !== undefined && { comment })
    },
    adapter: worklogMapDTO
  })

interface CreateWorklogParams {
  issueKey: string
  start: string
  duration: string
  comment?: string
}

export const createWorklog = async ({
  issueKey,
  start,
  duration,
  comment
}: CreateWorklogParams): Promise<Worklog | null> =>
  http.fetchData<WorklogDTO, Worklog>('post', `/issues/${issueKey}/worklog`, {
    payload: {
      start,
      duration,
      ...(comment && { comment })
    },
    adapter: worklogMapDTO
  })

export interface IssueSuggest {
  key: string
  id: string
  summary: string
}

interface IssueSuggestDTO {
  self: string
  id: string
  key: string
  version?: number
  summary?: string
  display?: string
}

interface SearchIssuesParams {
  input: string
  queue?: string
  username?: string
}

const buildSearchQuery = ({ input, queue, username }: SearchIssuesParams): string => {
  const textQuery = input.trim()

  return `("Queue": ${queue} OR "Related": ${username}) AND ("Key": ${textQuery} OR "Summary": ${textQuery})`
}

export const searchIssues = async (params: SearchIssuesParams): Promise<Array<IssueSuggest>> => {
  const query = buildSearchQuery(params)

  console.log('Search query:', query)
  console.log('Search params:', params)

  try {
    return await http.fetchList<IssueSuggestDTO, IssueSuggest>('post', '/issues/_search', {
      query: { perPage: 20 },
      payload: { query },
      adapter: issueSuggestMapDTO
    })
  } catch (error) {
    console.error('Search issues error:', error)
    return []
  }
}

const issueSuggestMapDTO = (dto: IssueSuggestDTO): IssueSuggest => ({
  id: dto.id,
  key: dto.key,
  summary: dto.summary || dto.display || dto.key
})

const worklogMapDTO = (dto: WorklogDTO): Worklog => ({
  id: dto.id,
  start: dto.start,
  duration: dto.duration,
  issue: {
    id: dto.issue.id,
    key: dto.issue.key,
    display: dto.issue.display,
    comment: dto.comment ? dto.comment : null
  }
})
