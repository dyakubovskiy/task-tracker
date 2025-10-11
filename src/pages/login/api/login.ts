import { http } from '@/shared/api'

interface UserDTO {
  self: string
  uid: number
  login: string
  trackerUid: number
  passportUid: number
  cloudUid: string
  firstName: string
  lastName: string
  display: string
  email: string
  external: boolean
  hasLicense: boolean
  dismissed: boolean
  useNewFilters: boolean
  disableNotifications: boolean
  firstLoginDate: string
  lastLoginDate: string
  welcomeMailSent: boolean
  sources: Array<string>
}

interface User {
  id: number
  name: string
}

export const getCurrentUser = () =>
  http.fetchData<UserDTO, User>('get', '/myself', { adapter: userMapDTO })

const userMapDTO = (dto: UserDTO): User => ({ id: dto.uid, name: dto.display })
