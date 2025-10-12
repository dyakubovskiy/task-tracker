import type { RouteRecordRaw, RouteLocationRaw } from 'vue-router'

const TIME_SHEET_ROUTE_NAME = 'timesheet'

export const TIME_SHEET_LINK = {
  name: TIME_SHEET_ROUTE_NAME
} as const satisfies RouteLocationRaw

export const TIME_SHEET_ROUTE = {
  path: '/timesheet',
  name: TIME_SHEET_LINK.name,
  component: () => import('../ui')
} as const satisfies RouteRecordRaw
