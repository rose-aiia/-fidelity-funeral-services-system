export const paths = {
  home: '/',
  provider: '/provider-portal',
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
  [paths.home]: 'Zimbabwe Funeral Service | Funeral Services, Memorials & Family Support',
  [paths.provider]: 'Provider portal | Zimbabwe Funeral Service',
  [paths.login]: 'Sign in | Zimbabwe Funeral Service',
  [paths.signup]: 'Create your account | Zimbabwe Funeral Service',
  [paths.account]: 'My account | Zimbabwe Funeral Service',
  [paths.accountPolicy]: 'My policy | Zimbabwe Funeral Service',
  [paths.accountRequests]: 'My requests | Zimbabwe Funeral Service',
  [paths.accountMemorials]: 'My memorials | Zimbabwe Funeral Service',
  [paths.accountMemorialNew]: 'Create a memorial | Zimbabwe Funeral Service',
  [paths.accountOrders]: 'My orders | Zimbabwe Funeral Service',
  [paths.accountProfile]: 'Profile | Zimbabwe Funeral Service',
  [paths.marketplace]: 'Marketplace | Zimbabwe Funeral Service',
  [paths.checkout]: 'Checkout | Zimbabwe Funeral Service',
}

export const NOT_FOUND_TITLE = 'Page not found | Zimbabwe Funeral Service'

/** Routes whose title depends on the page content; the page sets the precise title itself once it loads. */
const dynamicTitles: [prefix: string, title: string][] = [
  [`${paths.memorials}/`, 'In memory | Zimbabwe Funeral Service'],
  [`${paths.accountMemorials}/`, 'Edit memorial | Zimbabwe Funeral Service'],
  [`${paths.marketplace}/`, 'Marketplace | Zimbabwe Funeral Service'],
  [`${paths.accountOrders}/`, 'Order | Zimbabwe Funeral Service'],
]

export function titleFor(pathname: string): string {
  const exact = pageTitles[pathname]
  if (exact) return exact
  return dynamicTitles.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? NOT_FOUND_TITLE
}
