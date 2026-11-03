// Pure slug helpers shared by the app and scripts/mock-api.mjs (so no imports).

const DIACRITICS = /[̀-ͯ]/g

/** "Grace Nyathi" -> "grace-nyathi". Always returns something usable as a path segment. */
export function slugify(name: string, fallback = 'memorial'): string {
  const slug = name
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
  return slug || fallback
}
