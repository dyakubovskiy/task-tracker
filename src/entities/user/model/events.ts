import { useEventBuses } from '@/shared/lib/events'

const USER_EVENTS = {
  AUTHORIZE: 'authorize',
  LOGOUT: 'logout'
} as const

type UserEvents = typeof USER_EVENTS

type UserEventPayloads = {
  [USER_EVENTS.AUTHORIZE]: { token: string }
  [USER_EVENTS.LOGOUT]: void
}

export const useUserEvents = useEventBuses<UserEvents, UserEventPayloads>(USER_EVENTS)
