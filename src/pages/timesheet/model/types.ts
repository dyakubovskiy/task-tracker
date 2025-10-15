export interface Worklog {
  id: number
  start: string
  duration: string
  issue: {
    id: string
    key: string
    display: string
    comment: string | null
  }
}
