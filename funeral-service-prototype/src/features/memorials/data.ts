// Types and pure helpers for memorials. No imports: scripts/mock-api.mjs loads this file directly under Node.

export type MemorialPhoto = {
  id: string
  /** An image URL. In mock mode this may be a small `data:` URL; a live API serves hosted files. */
  url: string
  caption?: string
}

export type TimelineEntry = {
  id: string
  year: number
  title: string
  text?: string
}

export type ServiceDetails = {
  /** ISO date-time of the funeral or memorial service. */
  date: string
  venue: string
  address?: string
  note?: string
}

export type Memorial = {
  id: string
  /** URL-safe name used in the public address, `/memorials/<slug>`. */
  slug: string
  name: string
  /** `YYYY-MM-DD` */
  born: string
  /** `YYYY-MM-DD` */
  died: string
  tagline?: string
  location?: string
  /** Paragraphs separated by a blank line. */
  biography: string
  timeline: TimelineEntry[]
  photos: MemorialPhoto[]
  /** The `id` of the photo shown as the portrait. */
  portraitId?: string
  service?: ServiceDetails
  /** Unpublished memorials are visible to their owner only. */
  published: boolean
  flowers: number
  candles: number
  createdAt: string
}

/** What the owner sees: the memorial plus moderation counts. */
export type OwnedMemorial = Memorial & {
  tributeCount: number
  pendingTributes: number
}

export type TributeStatus = 'approved' | 'pending' | 'removed'

export type Tribute = {
  id: string
  authorName: string
  relationship?: string
  message: string
  /** ISO timestamp. */
  createdAt: string
  status: TributeStatus
}

export type NewMemorial = {
  name: string
  born: string
  died: string
  tagline?: string
  location?: string
}

export type MemorialUpdate = Partial<
  Pick<Memorial, 'name' | 'born' | 'died' | 'tagline' | 'location' | 'biography' | 'timeline' | 'published'>
> & {
  /** Set to the id of one of the memorial's photos. */
  portraitId?: string | null
  /** `null` clears the service details. */
  service?: ServiceDetails | null
}

export type NewTribute = {
  authorName: string
  relationship?: string
  message: string
}

export type OfferingKind = 'flower' | 'candle'

export type OfferingResult = { flowers: number; candles: number }

export type NewPhoto = { dataUrl: string; caption?: string }

export const NAME_MAX_LENGTH = 80
export const TAGLINE_MAX_LENGTH = 120
export const BIOGRAPHY_MAX_LENGTH = 6000
export const TRIBUTE_MAX_LENGTH = 500
export const TRIBUTE_AUTHOR_MAX_LENGTH = 60
export const MAX_PHOTOS = 8
export const MAX_TIMELINE_ENTRIES = 20

const DIACRITICS = /[̀-ͯ]/g

/** "Grace Nyathi" -> "grace-nyathi". Always returns something usable as a path segment. */
export function slugify(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
  return slug || 'memorial'
}

/** A slug that isn't in `taken`, adding `-2`, `-3`... when the plain one is. */
export function uniqueSlug(name: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  const base = slugify(name)
  if (!used.has(base)) return base
  let counter = 2
  while (used.has(`${base}-${counter}`)) counter += 1
  return `${base}-${counter}`
}

/** "1949 – 2025" */
export function lifespan(born: string, died: string): string {
  return `${born.slice(0, 4)} – ${died.slice(0, 4)}`
}

/** Whole years lived, or null when the dates don't make sense. */
export function ageAtDeath(born: string, died: string): number | null {
  const birth = new Date(`${born}T00:00:00Z`)
  const death = new Date(`${died}T00:00:00Z`)
  if (Number.isNaN(birth.getTime()) || Number.isNaN(death.getTime()) || death < birth) return null
  let age = death.getUTCFullYear() - birth.getUTCFullYear()
  const hadBirthday =
    death.getUTCMonth() > birth.getUTCMonth() ||
    (death.getUTCMonth() === birth.getUTCMonth() && death.getUTCDate() >= birth.getUTCDate())
  if (!hadBirthday) age -= 1
  return age
}

export const biographyParagraphs = (biography: string): string[] =>
  biography
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

export type MemorialStep = { id: string; label: string; done: boolean }

/** How finished a memorial is, as a checklist the owner can work through. */
export function completeness(memorial: Memorial): { percent: number; steps: MemorialStep[] } {
  const steps: MemorialStep[] = [
    { id: 'portrait', label: 'Choose a portrait', done: Boolean(memorial.portraitId) },
    { id: 'tagline', label: 'Add a line in their memory', done: Boolean(memorial.tagline?.trim()) },
    { id: 'story', label: 'Write their life story', done: biographyParagraphs(memorial.biography).length > 0 },
    { id: 'timeline', label: 'Add three moments to the timeline', done: memorial.timeline.length >= 3 },
    { id: 'photos', label: 'Share three photos', done: memorial.photos.length >= 3 },
    { id: 'service', label: 'Add the service details', done: Boolean(memorial.service?.venue.trim()) },
  ]
  const done = steps.filter((step) => step.done).length
  return { percent: Math.round((done / steps.length) * 100), steps }
}

/** Newest first, approved only: what the public wall shows. */
export function approvedTributes(tributes: Tribute[]): Tribute[] {
  return tributes
    .filter((tribute) => tribute.status === 'approved')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
