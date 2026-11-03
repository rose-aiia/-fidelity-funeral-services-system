import type { IconName } from '@/components/ui/Icon'
import { anchor, paths } from './routes'

export type NavLink = {
  label: string
  to: string
}

export const site = {
  name: 'Fidelity Life Assurance of Zimbabwe',
  footerName: 'Zimbabwe Funeral Service',
  logo: '/fidelity-life-logo.svg',
}

export const primaryNav: NavLink[] = [
  { label: 'Services', to: anchor('services') },
  { label: 'Plans', to: anchor('plans') },
  { label: 'Memorials', to: anchor('memorials') },
  { label: 'Support', to: anchor('support') },
]

export type AccountNavItem = NavLink & { icon: IconName; end?: boolean }

export const accountNav: AccountNavItem[] = [
  { label: 'Overview', to: paths.account, icon: 'home', end: true },
  { label: 'My policy', to: paths.accountPolicy, icon: 'shield' },
  { label: 'Requests', to: paths.accountRequests, icon: 'chat' },
  { label: 'Memorials', to: paths.accountMemorials, icon: 'flower' },
  { label: 'Profile', to: paths.accountProfile, icon: 'user' },
]

/** Parts of the account that are designed but not built yet; shown so the product direction is visible. */
export const accountComingSoon: { label: string; icon: IconName; preview: string }[] = [
  { label: 'Marketplace', icon: 'bag', preview: anchor('marketplace') },
]

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: 'Explore',
    links: [
      { label: 'Services', to: anchor('services') },
      { label: 'Plans', to: anchor('plans') },
      { label: 'Remembrance', to: anchor('memorials') },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Repatriation', to: anchor('diaspora') },
      { label: 'AI support', to: anchor('support') },
      { label: 'FAQs', to: anchor('faq') },
    ],
  },
  {
    title: 'Sample notice',
    links: [
      { label: 'Request a sample quote', to: anchor('quote-form') },
      { label: 'Sign in', to: paths.login },
      { label: 'My account', to: paths.account },
      { label: 'Provider concept', to: paths.provider },
      { label: 'Demo prototype', to: anchor('top') },
    ],
  },
]
