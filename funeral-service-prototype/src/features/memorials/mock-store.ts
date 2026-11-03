import { ApiError } from '@/lib/api-error'
import {
  approvedTributes,
  MAX_PHOTOS,
  uniqueSlug,
  type Memorial,
  type MemorialPhoto,
  type MemorialUpdate,
  type NewMemorial,
  type NewPhoto,
  type NewTribute,
  type OfferingKind,
  type OfferingResult,
  type OwnedMemorial,
  type Tribute,
  type TributeStatus,
} from './data'
import { seedMemorials, seedTributes, type MemorialRecord } from './seed'
import { hasErrors, validateBiography, validateNewMemorial, validateTimeline, validateTribute } from './validation'

// The "server" behind memorial endpoints in mock mode. Everything persists in one localStorage entry, seeded
// with a sample memorial on first use. Loaded on demand (dynamic import) so a live build never fetches it.

const STORE_KEY = 'fidelity.mock.memorials'
const MAX_PHOTO_CHARS = 1_500_000
const TRIBUTES_PER_HOUR = 5
const OFFERINGS_PER_DAY = 20

type Store = {
  memorials: MemorialRecord[]
  tributes: Record<string, Tribute[]>
}

// Visitor rate limits live in memory, so they reset on reload, which is plenty for a demo.
const tributeLog = new Map<string, number[]>()
const offeringLog = new Map<string, number[]>()

function read(): Store {
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw) as Store
  } catch {
    // Unreadable storage: fall through to the seed.
  }
  return { memorials: seedMemorials(), tributes: seedTributes() }
}

function write(store: Store): void {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch {
    throw new ApiError(413, 'storage_full', 'There is no room left to store that')
  }
}

const notFound = () => new ApiError(404, 'not_found', 'No such memorial')

function withinLimit(log: Map<string, number[]>, key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (log.get(key) ?? []).filter((time) => now - time < windowMs)
  if (recent.length >= limit) {
    log.set(key, recent)
    return false
  }
  log.set(key, [...recent, now])
  return true
}

function toPublic(record: MemorialRecord): Memorial {
  const { ownerId: _ownerId, ...memorial } = record
  return memorial
}

function toOwned(record: MemorialRecord, tributes: Tribute[]): OwnedMemorial {
  return {
    ...toPublic(record),
    tributeCount: tributes.filter((tribute) => tribute.status === 'approved').length,
    pendingTributes: tributes.filter((tribute) => tribute.status === 'pending').length,
  }
}

function findVisible(store: Store, slug: string, viewerId: string | null): MemorialRecord {
  const record = store.memorials.find((candidate) => candidate.slug === slug)
  if (!record || (!record.published && record.ownerId !== viewerId)) throw notFound()
  return record
}

function findOwned(store: Store, userId: string, id: string): MemorialRecord {
  const record = store.memorials.find((candidate) => candidate.id === id && candidate.ownerId === userId)
  if (!record) throw notFound()
  return record
}

const invalid = (details: Record<string, string>) =>
  new ApiError(422, 'validation_failed', 'The request is invalid', details)

const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`

// ---------------------------------------------------------------- public

export function getPublic(slug: string, viewerId: string | null): Memorial {
  return toPublic(findVisible(read(), slug, viewerId))
}

export function listApprovedTributes(slug: string, viewerId: string | null): Tribute[] {
  const store = read()
  const record = findVisible(store, slug, viewerId)
  return approvedTributes(store.tributes[record.id] ?? [])
}

export function addTribute(slug: string, viewerId: string | null, input: NewTribute): Tribute {
  const store = read()
  const record = findVisible(store, slug, viewerId)
  const errors = validateTribute(input)
  if (hasErrors(errors)) throw invalid(errors)

  const isOwner = record.ownerId === viewerId
  if (!isOwner && !withinLimit(tributeLog, record.id, TRIBUTES_PER_HOUR, 3_600_000)) {
    throw new ApiError(429, 'rate_limited', 'Too many tributes')
  }

  const tribute: Tribute = {
    id: nextId('tr'),
    authorName: input.authorName.trim(),
    ...(input.relationship?.trim() && { relationship: input.relationship.trim() }),
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
    status: isOwner ? 'approved' : 'pending',
  }
  write({ ...store, tributes: { ...store.tributes, [record.id]: [tribute, ...(store.tributes[record.id] ?? [])] } })
  return tribute
}

export function addOffering(slug: string, viewerId: string | null, kind: OfferingKind): OfferingResult {
  if (kind !== 'flower' && kind !== 'candle') throw invalid({ kind: 'Choose a flower or a candle' })
  const store = read()
  const record = findVisible(store, slug, viewerId)
  if (!withinLimit(offeringLog, record.id, OFFERINGS_PER_DAY, 86_400_000)) {
    throw new ApiError(429, 'rate_limited', 'Too many offerings')
  }

  const updated: MemorialRecord = {
    ...record,
    flowers: record.flowers + (kind === 'flower' ? 1 : 0),
    candles: record.candles + (kind === 'candle' ? 1 : 0),
  }
  write({ ...store, memorials: store.memorials.map((candidate) => (candidate.id === record.id ? updated : candidate)) })
  return { flowers: updated.flowers, candles: updated.candles }
}

// ----------------------------------------------------------------- owner

export function listOwned(userId: string): OwnedMemorial[] {
  const store = read()
  return store.memorials
    .filter((record) => record.ownerId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((record) => toOwned(record, store.tributes[record.id] ?? []))
}

export function getOwned(userId: string, id: string): OwnedMemorial {
  const store = read()
  const record = findOwned(store, userId, id)
  return toOwned(record, store.tributes[record.id] ?? [])
}

export function createMemorial(userId: string, input: NewMemorial): OwnedMemorial {
  const errors = validateNewMemorial(input)
  if (hasErrors(errors)) throw invalid(errors)

  const store = read()
  const record: MemorialRecord = {
    id: nextId('m'),
    ownerId: userId,
    slug: uniqueSlug(input.name, store.memorials.map((candidate) => candidate.slug)),
    name: input.name.trim(),
    born: input.born,
    died: input.died,
    ...(input.tagline?.trim() && { tagline: input.tagline.trim() }),
    ...(input.location?.trim() && { location: input.location.trim() }),
    biography: '',
    timeline: [],
    photos: [],
    published: false,
    flowers: 0,
    candles: 0,
    createdAt: new Date().toISOString(),
  }
  write({ ...store, memorials: [record, ...store.memorials] })
  return toOwned(record, [])
}

export function updateMemorial(userId: string, id: string, update: MemorialUpdate): OwnedMemorial {
  const store = read()
  const record = findOwned(store, userId, id)
  const errors: Record<string, string> = {}

  const name = update.name ?? record.name
  const born = update.born ?? record.born
  const died = update.died ?? record.died
  Object.assign(errors, validateNewMemorial({ name, born, died, tagline: update.tagline ?? record.tagline }))
  if (update.biography !== undefined) {
    const message = validateBiography(update.biography)
    if (message) errors.biography = message
  }
  if (update.timeline) {
    const message = validateTimeline(update.timeline)
    if (message) errors.timeline = message
  }
  if (update.service && (!update.service.venue.trim() || Number.isNaN(Date.parse(update.service.date)))) {
    errors.service = 'Add a venue and a date for the service.'
  }
  if (update.portraitId && !record.photos.some((photo) => photo.id === update.portraitId)) {
    errors.portraitId = 'Choose one of the memorial’s photos.'
  }
  if (hasErrors(errors)) throw invalid(errors)

  const next: MemorialRecord = {
    ...record,
    name: name.trim(),
    born,
    died,
    tagline: (update.tagline ?? record.tagline)?.trim() || undefined,
    location: (update.location ?? record.location)?.trim() || undefined,
    biography: update.biography ?? record.biography,
    timeline: update.timeline ? [...update.timeline].sort((a, b) => a.year - b.year) : record.timeline,
    published: update.published ?? record.published,
    portraitId: update.portraitId === undefined ? record.portraitId : (update.portraitId ?? undefined),
    service: update.service === undefined ? record.service : (update.service ?? undefined),
  }
  write({ ...store, memorials: store.memorials.map((candidate) => (candidate.id === id ? next : candidate)) })
  return toOwned(next, store.tributes[id] ?? [])
}

export function deleteMemorial(userId: string, id: string): void {
  const store = read()
  findOwned(store, userId, id)
  const { [id]: _removed, ...tributes } = store.tributes
  write({ memorials: store.memorials.filter((candidate) => candidate.id !== id), tributes })
}

export function addPhoto(userId: string, id: string, photo: NewPhoto): MemorialPhoto {
  const store = read()
  const record = findOwned(store, userId, id)
  if (record.photos.length >= MAX_PHOTOS) throw new ApiError(422, 'photo_limit', 'Photo limit reached')
  if (!/^data:image\/(jpeg|png|webp|svg\+xml)[;,]/.test(photo.dataUrl) || photo.dataUrl.length > MAX_PHOTO_CHARS) {
    throw invalid({ dataUrl: 'Upload a JPEG, PNG or WebP image under 1.5 MB' })
  }

  const added: MemorialPhoto = {
    id: nextId('p'),
    url: photo.dataUrl,
    ...(photo.caption?.trim() && { caption: photo.caption.trim().slice(0, 140) }),
  }
  const next = { ...record, photos: [...record.photos, added] }
  write({ ...store, memorials: store.memorials.map((candidate) => (candidate.id === id ? next : candidate)) })
  return added
}

export function removePhoto(userId: string, id: string, photoId: string): void {
  const store = read()
  const record = findOwned(store, userId, id)
  const next: MemorialRecord = {
    ...record,
    photos: record.photos.filter((photo) => photo.id !== photoId),
    portraitId: record.portraitId === photoId ? undefined : record.portraitId,
  }
  write({ ...store, memorials: store.memorials.map((candidate) => (candidate.id === id ? next : candidate)) })
}

export function captionPhoto(userId: string, id: string, photoId: string, caption: string): MemorialPhoto {
  const store = read()
  const record = findOwned(store, userId, id)
  const photo = record.photos.find((candidate) => candidate.id === photoId)
  if (!photo) throw notFound()

  const updated: MemorialPhoto = { ...photo, caption: caption.trim().slice(0, 140) || undefined }
  const next = { ...record, photos: record.photos.map((candidate) => (candidate.id === photoId ? updated : candidate)) }
  write({ ...store, memorials: store.memorials.map((candidate) => (candidate.id === id ? next : candidate)) })
  return updated
}

export function listOwnerTributes(userId: string, id: string): Tribute[] {
  const store = read()
  findOwned(store, userId, id)
  return (store.tributes[id] ?? [])
    .filter((tribute) => tribute.status !== 'removed')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function moderateTribute(
  userId: string,
  id: string,
  tributeId: string,
  status: Exclude<TributeStatus, 'pending'>,
): Tribute {
  const store = read()
  findOwned(store, userId, id)
  const tribute = (store.tributes[id] ?? []).find((candidate) => candidate.id === tributeId)
  if (!tribute || (status !== 'approved' && status !== 'removed')) throw notFound()

  const updated: Tribute = { ...tribute, status }
  write({
    ...store,
    tributes: { ...store.tributes, [id]: store.tributes[id]!.map((candidate) => (candidate.id === tributeId ? updated : candidate)) },
  })
  return updated
}
