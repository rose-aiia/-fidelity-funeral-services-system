import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PRIVATE_QUERY_ROOT } from '@/features/auth'
import {
  addPhoto,
  captionPhoto,
  createMemorial,
  deleteMemorial,
  getMemorial,
  getMyMemorial,
  leaveOffering,
  listMyMemorials,
  listMyTributes,
  listTributes,
  moderateTribute,
  removePhoto,
  submitTribute,
  updateMemorial,
} from './api'
import type { Memorial, OfferingKind, OwnedMemorial, Tribute } from './data'

// Public pages are cached per slug; everything the owner manages lives under the private root so signing
// out drops it.
const memorialKey = (slug: string) => ['memorial', slug] as const
const tributesKey = (slug: string) => ['memorial', slug, 'tributes'] as const
const mineKey = [PRIVATE_QUERY_ROOT, 'memorials'] as const
const ownedKey = (id: string) => [PRIVATE_QUERY_ROOT, 'memorials', id] as const
const ownedTributesKey = (id: string) => [PRIVATE_QUERY_ROOT, 'memorials', id, 'tributes'] as const

// ---------------------------------------------------------------- public

export const usePublicMemorial = (slug: string) =>
  useQuery(queryOptions({ queryKey: memorialKey(slug), queryFn: ({ signal }) => getMemorial(slug, signal) }))

export const usePublicTributes = (slug: string) =>
  useQuery(queryOptions({ queryKey: tributesKey(slug), queryFn: ({ signal }) => listTributes(slug, signal) }))

export function useSubmitTribute(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Parameters<typeof submitTribute>[1]) => submitTribute(slug, input),
    // Visitor tributes wait for the family; only an approved one (the owner's own) shows straight away.
    onSuccess: (tribute) => {
      if (tribute.status === 'approved') void queryClient.invalidateQueries({ queryKey: tributesKey(slug) })
    },
  })
}

/** Counts jump the moment someone taps; a failed request puts them back. */
export function useOffering(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (kind: OfferingKind) => leaveOffering(slug, kind),
    onMutate: async (kind) => {
      await queryClient.cancelQueries({ queryKey: memorialKey(slug) })
      const previous = queryClient.getQueryData<Memorial>(memorialKey(slug))
      if (previous) {
        queryClient.setQueryData<Memorial>(memorialKey(slug), {
          ...previous,
          flowers: previous.flowers + (kind === 'flower' ? 1 : 0),
          candles: previous.candles + (kind === 'candle' ? 1 : 0),
        })
      }
      return { previous }
    },
    onError: (_error, _kind, context) => {
      if (context?.previous) queryClient.setQueryData(memorialKey(slug), context.previous)
    },
    onSuccess: (result) =>
      queryClient.setQueryData<Memorial>(memorialKey(slug), (existing) => existing && { ...existing, ...result }),
  })
}

// ----------------------------------------------------------------- owner

export const useMyMemorials = () =>
  useQuery(queryOptions({ queryKey: mineKey, queryFn: ({ signal }) => listMyMemorials(signal) }))

export const useMyMemorial = (id: string | undefined) =>
  useQuery({
    queryKey: ownedKey(id ?? ''),
    queryFn: ({ signal }) => getMyMemorial(id!, signal),
    enabled: Boolean(id),
  })

export const useMyTributes = (id: string | undefined) =>
  useQuery({
    queryKey: ownedTributesKey(id ?? ''),
    queryFn: ({ signal }) => listMyTributes(id!, signal),
    enabled: Boolean(id),
  })

/** After any change to an owned memorial: refresh the cached copy, the list, and the public page. */
function useStoreOwned() {
  const queryClient = useQueryClient()
  return (memorial: OwnedMemorial) => {
    queryClient.setQueryData(ownedKey(memorial.id), memorial)
    void queryClient.invalidateQueries({ queryKey: mineKey, exact: true })
    void queryClient.invalidateQueries({ queryKey: memorialKey(memorial.slug) })
  }
}

export function useCreateMemorial() {
  const store = useStoreOwned()
  return useMutation({ mutationFn: createMemorial, onSuccess: store })
}

export function useUpdateMemorial(id: string) {
  const store = useStoreOwned()
  return useMutation({
    mutationFn: (update: Parameters<typeof updateMemorial>[1]) => updateMemorial(id, update),
    onSuccess: store,
  })
}

export function useDeleteMemorial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMemorial,
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: ownedKey(id) })
      void queryClient.invalidateQueries({ queryKey: mineKey, exact: true })
    },
  })
}

/** Photo changes touch the memorial itself, so they re-fetch it rather than patching the cache by hand. */
function useRefreshOwned(id: string, slug?: string) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ownedKey(id), exact: true })
    void queryClient.invalidateQueries({ queryKey: mineKey, exact: true })
    if (slug) void queryClient.invalidateQueries({ queryKey: memorialKey(slug) })
  }
}

export function useAddPhoto(id: string, slug?: string) {
  const refresh = useRefreshOwned(id, slug)
  return useMutation({ mutationFn: (photo: Parameters<typeof addPhoto>[1]) => addPhoto(id, photo), onSuccess: refresh })
}

export function useRemovePhoto(id: string, slug?: string) {
  const refresh = useRefreshOwned(id, slug)
  return useMutation({ mutationFn: (photoId: string) => removePhoto(id, photoId), onSuccess: refresh })
}

export function useCaptionPhoto(id: string, slug?: string) {
  const refresh = useRefreshOwned(id, slug)
  return useMutation({
    mutationFn: ({ photoId, caption }: { photoId: string; caption: string }) => captionPhoto(id, photoId, caption),
    onSuccess: refresh,
  })
}

export function useModerateTribute(id: string, slug?: string) {
  const queryClient = useQueryClient()
  const refresh = useRefreshOwned(id, slug)
  return useMutation({
    mutationFn: ({ tributeId, status }: { tributeId: string; status: 'approved' | 'removed' }) =>
      moderateTribute(id, tributeId, status),
    onSuccess: (tribute) => {
      queryClient.setQueryData<Tribute[]>(ownedTributesKey(id), (existing) =>
        existing
          ?.map((candidate) => (candidate.id === tribute.id ? tribute : candidate))
          .filter((candidate) => candidate.status !== 'removed'),
      )
      if (slug) void queryClient.invalidateQueries({ queryKey: tributesKey(slug) })
      refresh()
    },
  })
}
