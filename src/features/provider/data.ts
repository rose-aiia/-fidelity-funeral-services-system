import type { StatRow } from '@/components/ui/StatCard'

export const dashboardStats: StatRow[] = [
  { label: 'New enquiries', value: '26' },
  { label: 'Pending follow-ups', value: '11' },
  { label: 'Family memorials', value: '14' },
  { label: 'Urgent support requests', value: '3', alert: true },
]

export const weeklyStats: StatRow[] = [
  { label: 'This week', value: '18 funerals' },
  { label: 'Completed services', value: '92%' },
  { label: 'Response time', value: '4.2 hrs' },
]

export const attentionStats: StatRow[] = [
  { label: 'Need attention', value: '3 cases', alert: true },
  { label: 'Family check-ins', value: '14 sent' },
  { label: 'Payments due', value: 'US$6,200' },
]
