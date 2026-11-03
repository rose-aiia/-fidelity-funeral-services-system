import type { Plan } from './data'

export const SERVICE_TYPES = ['Traditional burial', 'Repatriation support', 'Cemetery planning', 'Memorial only'] as const
export type ServiceType = (typeof SERVICE_TYPES)[number]

export const TOWNS = ['Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Chitungwiza'] as const
export type Town = (typeof TOWNS)[number]

const TOWN_SURCHARGE: Record<Town, number> = {
  Harare: 1200,
  Bulawayo: 1500,
  Mutare: 1400,
  Gweru: 1300,
  Chitungwiza: 1700,
}

const SERVICE_SURCHARGE: Record<ServiceType, number> = {
  'Traditional burial': 0,
  'Repatriation support': 2600,
  'Cemetery planning': 1900,
  'Memorial only': 0,
}

export function estimateTotal(plan: Plan, town: Town, serviceType: ServiceType): number {
  return plan.price + TOWN_SURCHARGE[town] + SERVICE_SURCHARGE[serviceType]
}
