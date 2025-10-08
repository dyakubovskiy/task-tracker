import { useEventBus } from '@vueuse/core'

export const useEventBuses = <
  const Events extends Record<string, string>,
  Payloads extends { [K in Events[keyof Events]]: unknown }
>(
  events: Events
) => {
  type EventName = Events[keyof Events]

  type EventBuses = {
    [E in EventName]: ReturnType<typeof useEventBus<Payloads[E]>>
  }

  const eventBuses = (): EventBuses =>
    (Object.values(events) as Array<EventName>).reduce((acc, event) => {
      acc[event] = useEventBus<Payloads[typeof event]>(event)
      return acc
    }, {} as EventBuses)

  return eventBuses
}
