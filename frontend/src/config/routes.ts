export const paths = {
  home: '/',
  provider: '/provider-portal',
  portalRequests: '/provider-portal/requests',
  portalOrders: '/provider-portal/orders',
  portalCustomers: '/provider-portal/customers',
  portalProviders: '/provider-portal/providers',
  portalActivity: '/provider-portal/activity',
  login: '/login',
  signup: '/signup',
  account: '/account',
  accountPolicy: '/account/policy',
  accountRequests: '/account/requests',
  accountMemorials: '/account/memorials',
  accountMemorialNew: '/account/memorials/new',
  accountOrders: '/account/orders',
  accountProfile: '/account/profile',
  memorials: '/memorials',
  marketplace: '/marketplace',
  checkout: '/checkout',
} as const

/** Link to a section of the home page, e.g. `anchor('plans')` -> `/#plans`. */
export const anchor = (id: string) => `/#${id}`

/** The public page of a memorial. */
export const memorialPath = (slug: string) => `${paths.memorials}/${slug}`

/** A product page in the marketplace, optionally arriving on behalf of a memorial's person. */
export const productPath = (id: string, inMemoryOf?: string) =>
  `${paths.marketplace}/${id}${inMemoryOf ? `?inMemoryOf=${encodeURIComponent(inMemoryOf)}` : ''}`

/** One of the customer's orders. */
export const orderPath = (id: string, query = '') => `${paths.accountOrders}/${id}${query}`

/** The owner's editor for a memorial, optionally on a tab (`story`, `photos`, ...). */
export const accountMemorialPath = (id: string, tab?: string) =>
  `${paths.accountMemorials}/${id}${tab ? `?tab=${tab}` : ''}`

/** Document title per route; unknown paths fall back to the not-found title. */
export const pageTitles: Record<string, string> = {
  [paths.home]: 'Fidelity Life Assurance of Zimbabwe | Funeral Services, Memorials & Family Support',
  [paths.provider]: 'Staff portal | Fidelity Life Assurance of Zimbabwe',
  [paths.portalRequests]: 'Requests | Staff portal | Fidelity Life Assurance of Zimbabwe',
  [paths.portalOrders]: 'Orders | Staff portal | Fidelity Life Assurance of Zimbabwe',
  [paths.portalCustomers]: 'Customers | Staff portal | Fidelity Life Assurance of Zimbabwe',
  [paths.portalProviders]: 'Providers | Staff portal | Fidelity Life Assurance of Zimbabwe',
  [paths.portalActivity]: 'Activity | Staff portal | Fidelity Life Assurance of Zimbabwe',
  [paths.login]: 'Sign in | Fidelity Life Assurance of Zimbabwe',
  [paths.signup]: 'Create your account | Fidelity Life Assurance of Zimbabwe',
  [paths.account]: 'My account | Fidelity Life Assurance of Zimbabwe',
  [paths.accountPolicy]: 'My policy | Fidelity Life Assurance of Zimbabwe',
  [paths.accountRequests]: 'My requests | Fidelity Life Assurance of Zimbabwe',
  [paths.accountMemorials]: 'My memorials | Fidelity Life Assurance of Zimbabwe',
  [paths.accountMemorialNew]: 'Create a memorial | Fidelity Life Assurance of Zimbabwe',
  [paths.accountOrders]: 'My orders | Fidelity Life Assurance of Zimbabwe',
  [paths.accountProfile]: 'Profile | Fidelity Life Assurance of Zimbabwe',
  [paths.marketplace]: 'Marketplace | Fidelity Life Assurance of Zimbabwe',
  [paths.checkout]: 'Checkout | Fidelity Life Assurance of Zimbabwe',
}

export const NOT_FOUND_TITLE = 'Page not found | Fidelity Life Assurance of Zimbabwe'

/** Routes whose title depends on the page content; the page sets the precise title itself once it loads. */
const dynamicTitles: [prefix: string, title: string][] = [
  [`${paths.memorials}/`, 'In memory | Fidelity Life Assurance of Zimbabwe'],
  [`${paths.accountMemorials}/`, 'Edit memorial | Fidelity Life Assurance of Zimbabwe'],
  [`${paths.marketplace}/`, 'Marketplace | Fidelity Life Assurance of Zimbabwe'],
  [`${paths.accountOrders}/`, 'Order | Fidelity Life Assurance of Zimbabwe'],
]

export function titleFor(pathname: string): string {
  const exact = pageTitles[pathname]
  if (exact) return exact
  return dynamicTitles.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? NOT_FOUND_TITLE
}
