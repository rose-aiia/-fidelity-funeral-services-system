import type { User } from './types'

/** Mock mode accepts this one-time code for every number. It is shown in the UI as a demo hint. */
export const DEMO_OTP = '123456'

export type DemoPersona = {
  user: User
  title: string
  blurb: string
}

/** One-click sign-ins for demos. Mock mode only: the login page hides them when talking to a live API. */
export const demoPersonas: DemoPersona[] = [
  {
    user: {
      id: 'u-moyo',
      name: 'Rutendo Moyo',
      phone: '+263771234567',
      email: 'rutendo.moyo@example.com',
      role: 'customer',
      language: 'en',
    },
    title: 'Policyholder',
    blurb: 'Active policy, beneficiaries and an open request.',
  },
  {
    user: { id: 'u-ncube', name: 'Tafara Ncube', phone: '+263772000111', role: 'customer', language: 'en' },
    title: 'New family',
    blurb: 'No policy yet. Starts from a quote.',
  },
  {
    user: { id: 'u-dube', name: 'Chipo Dube', phone: '+263773000222', role: 'provider', language: 'en' },
    title: 'Provider staff',
    blurb: 'Opens the provider portal concept.',
  },
]

export const demoUsers: User[] = demoPersonas.map((persona) => persona.user)
