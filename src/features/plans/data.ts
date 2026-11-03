export type Plan = {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  popular?: boolean
}

export const plans: Plan[] = [
  {
    id: 'essential',
    name: 'Essential',
    price: 4200,
    description: 'Simple, respectful coverage for a dignified family farewell.',
    features: ['Ceremony coordination', 'Transport and care', 'Memorial booklet', 'Family support checklist'],
  },
  {
    id: 'comfort',
    name: 'Comfort',
    price: 7800,
    description: 'Balanced package with broader service support and remembrance options.',
    features: ['Everything in Essential', 'Enhanced venue support', 'Digital memorial page', 'Grave enquiry support'],
    popular: true,
  },
  {
    id: 'legacy',
    name: 'Legacy',
    price: 12600,
    description: 'Premium plan with remembrance, family collaboration and additional care features.',
    features: ['Everything in Comfort', 'Cemetery plot guidance', 'Life Legacy Studio access', 'Priority aftercare coordination'],
  },
]

export const DEFAULT_PLAN_ID = 'comfort'
