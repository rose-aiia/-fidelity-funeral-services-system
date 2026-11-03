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
      { label: 'Provider concept', to: paths.provider },
      { label: 'Demo prototype', to: anchor('top') },
    ],
  },
]
