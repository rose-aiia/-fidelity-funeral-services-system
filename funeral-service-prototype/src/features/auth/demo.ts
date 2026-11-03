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
    user: { id: 'u-ndlovu-admin', name: 'Nomsa Ndlovu', phone: '+263773000333', role: 'admin', language: 'en' },
    title: 'Administrator',
    blurb: 'Triages requests, assigns providers and sees everything.',
  },
  {
    user: {
      id: 'u-dube',
      name: 'Chipo Dube',
      phone: '+263773000222',
      role: 'provider',
      providerId: 'harare-funeral-care',
      language: 'en',
    },
    title: 'Funeral provider',
    blurb: 'Harare Funeral Care. Has requests waiting to be accepted.',
  },
  {
    user: {
      id: 'u-chigumba',
      name: 'Farai Chigumba',
      phone: '+263773000444',
      role: 'provider',
      providerId: 'msasa-florists',
      language: 'en',
    },
    title: 'Marketplace vendor',
    blurb: 'Msasa Florists. Confirms and delivers flower orders.',
  },
]

/** More customers, so the administrator's tables have something to show. They can sign in like anyone else. */
export const extraDemoUsers: User[] = [
  { id: 'u-sibanda', name: 'Brian Sibanda', phone: '+263774100001', role: 'customer', language: 'en' },
  { id: 'u-chikore', name: 'Memory Chikore', phone: '+263774100002', email: 'memory.chikore@example.com', role: 'customer', language: 'sn' },
  { id: 'u-dlamini', name: 'Nomsa Dlamini', phone: '+263774100003', role: 'customer', language: 'nd' },
  { id: 'u-ndlovu', name: 'Thabo Ndlovu', phone: '+263774100004', role: 'customer', language: 'nd' },
  { id: 'u-phiri', name: 'Tendai Phiri', phone: '+263774100005', role: 'customer', language: 'en' },
  { id: 'u-khumalo', name: 'Lindiwe Khumalo', phone: '+263774100006', email: 'lindiwe.k@example.com', role: 'customer', language: 'en' },
]

export const demoUsers: User[] = [...demoPersonas.map((persona) => persona.user), ...extraDemoUsers]
