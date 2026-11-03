import { readSessionUser } from '@/features/auth'
import { ApiError } from '@/lib/api-error'
import { env } from '@/lib/env'
import { del, get, patch, post } from '@/lib/http'
import { mockResponse } from '@/lib/mock'
import type {
  Memorial,
  MemorialPhoto,
  MemorialUpdate,
  NewMemorial,
  NewPhoto,
  NewTribute,
  OfferingKind,
  OfferingResult,
  OwnedMemorial,
  Tribute,
} from './data'

const MOCK_READ_LATENCY_MS = 450
const MOCK_WRITE_LATENCY_MS = 500
const MOCK_QUICK_WRITE_LATENCY_MS = 250

const mockServer = () => import('./mock-store')

const viewerId = (): string | null => readSessionUser()?.id ?? null

function ownerId(): string {
  const id = viewerId()
  if (!id) throw new ApiError(401, 'unauthenticated', 'Not signed in')
  return id
}

const memorialPath = (slug: string) => `/memorials/${encodeURIComponent(slug)}`
const ownedPath = (id: string) => `/me/memorials/${encodeURIComponent(id)}`

// ---------------------------------------------------------------- public

export async function getMemorial(slug: string, signal?: AbortSignal): Promise<Memorial> {
  if (!env.useMock) return get<Memorial>(memorialPath(slug), { signal })
  const server = await mockServer()
  return mockResponse(server.getPublic(slug, viewerId()), MOCK_READ_LATENCY_MS)
}

export async function listTributes(slug: string, signal?: AbortSignal): Promise<Tribute[]> {
  if (!env.useMock) return get<Tribute[]>(`${memorialPath(slug)}/tributes`, { signal })
  const server = await mockServer()
  return mockResponse(server.listApprovedTributes(slug, viewerId()), MOCK_READ_LATENCY_MS)
}

export async function submitTribute(slug: string, input: NewTribute): Promise<Tribute> {
  if (!env.useMock) return post<Tribute>(`${memorialPath(slug)}/tributes`, input)
  const server = await mockServer()
  return mockResponse(server.addTribute(slug, viewerId(), input), MOCK_WRITE_LATENCY_MS)
}

export async function leaveOffering(slug: string, kind: OfferingKind): Promise<OfferingResult> {
  if (!env.useMock) return post<OfferingResult>(`${memorialPath(slug)}/offerings`, { kind })
  const server = await mockServer()
  return mockResponse(server.addOffering(slug, viewerId(), kind), MOCK_QUICK_WRITE_LATENCY_MS)
}

// ----------------------------------------------------------------- owner

export async function listMyMemorials(signal?: AbortSignal): Promise<OwnedMemorial[]> {
  if (!env.useMock) return get<OwnedMemorial[]>('/me/memorials', { signal })
  const server = await mockServer()
  return mockResponse(server.listOwned(ownerId()), MOCK_READ_LATENCY_MS)
}

export async function getMyMemorial(id: string, signal?: AbortSignal): Promise<OwnedMemorial> {
  if (!env.useMock) return get<OwnedMemorial>(ownedPath(id), { signal })
  const server = await mockServer()
  return mockResponse(server.getOwned(ownerId(), id), MOCK_READ_LATENCY_MS)
}

export async function createMemorial(input: NewMemorial): Promise<OwnedMemorial> {
  if (!env.useMock) return post<OwnedMemorial>('/me/memorials', input)
  const server = await mockServer()
  return mockResponse(server.createMemorial(ownerId(), input), MOCK_WRITE_LATENCY_MS)
}

export async function updateMemorial(id: string, update: MemorialUpdate): Promise<OwnedMemorial> {
  if (!env.useMock) return patch<OwnedMemorial>(ownedPath(id), update)
  const server = await mockServer()
  return mockResponse(server.updateMemorial(ownerId(), id, update), MOCK_WRITE_LATENCY_MS)
}

export async function deleteMemorial(id: string): Promise<void> {
  if (!env.useMock) return del(ownedPath(id))
  const server = await mockServer()
  server.deleteMemorial(ownerId(), id)
  return mockResponse(undefined, MOCK_WRITE_LATENCY_MS)
}

export async function addPhoto(id: string, photo: NewPhoto): Promise<MemorialPhoto> {
  if (!env.useMock) return post<MemorialPhoto>(`${ownedPath(id)}/photos`, photo)
  const server = await mockServer()
  return mockResponse(server.addPhoto(ownerId(), id, photo), MOCK_WRITE_LATENCY_MS)
}

export async function removePhoto(id: string, photoId: string): Promise<void> {
  if (!env.useMock) return del(`${ownedPath(id)}/photos/${encodeURIComponent(photoId)}`)
  const server = await mockServer()
  server.removePhoto(ownerId(), id, photoId)
  return mockResponse(undefined, MOCK_QUICK_WRITE_LATENCY_MS)
}

export async function captionPhoto(id: string, photoId: string, caption: string): Promise<MemorialPhoto> {
  if (!env.useMock) return patch<MemorialPhoto>(`${ownedPath(id)}/photos/${encodeURIComponent(photoId)}`, { caption })
  const server = await mockServer()
  return mockResponse(server.captionPhoto(ownerId(), id, photoId, caption), MOCK_QUICK_WRITE_LATENCY_MS)
}

export async function listMyTributes(id: string, signal?: AbortSignal): Promise<Tribute[]> {
  if (!env.useMock) return get<Tribute[]>(`${ownedPath(id)}/tributes`, { signal })
  const server = await mockServer()
  return mockResponse(server.listOwnerTributes(ownerId(), id), MOCK_READ_LATENCY_MS)
}

export async function moderateTribute(
  id: string,
  tributeId: string,
  status: 'approved' | 'removed',
): Promise<Tribute> {
  const path = `${ownedPath(id)}/tributes/${encodeURIComponent(tributeId)}`
  if (!env.useMock) return patch<Tribute>(path, { status })
  const server = await mockServer()
  return mockResponse(server.moderateTribute(ownerId(), id, tributeId, status), MOCK_QUICK_WRITE_LATENCY_MS)
}
