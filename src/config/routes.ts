export const paths = {
  home: '/',
  provider: '/provider-portal',
} as const

/** Link to a section of the home page, e.g. `anchor('plans')` -> `/#plans`. */
export const anchor = (id: string) => `/#${id}`

/** Document title per route; unknown paths fall back to the not-found title. */
export const pageTitles: Record<string, string> = {
  [paths.home]: 'Zimbabwe Funeral Service | Funeral Services, Memorials & Family Support',
  [paths.provider]: 'Provider portal | Zimbabwe Funeral Service',
}

export const NOT_FOUND_TITLE = 'Page not found | Zimbabwe Funeral Service'
