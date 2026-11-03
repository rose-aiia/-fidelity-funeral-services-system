import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PRIVATE_QUERY_ROOT } from '@/features/auth'
import {
  assignRequest,
  createProvider,
  getCustomer,
  getOverview,
  listActivity,
  listCustomers,
  listOrders,
  listProviders,
  listRequests,
  respondToRequest,
  setProviderActive,
  updateOrderStatus,
} from './api'

// Everything the portal fetches is private to the signed-in staff member, so signing out drops it.
const root = [PRIVATE_QUERY_ROOT, 'portal'] as const
const key = (...parts: (string | number)[]) => [...root, ...parts] as const

export const useOverview = () => useQuery(queryOptions({ queryKey: key('overview'), queryFn: ({ signal }) => getOverview(signal) }))

export const useRequests = () => useQuery(queryOptions({ queryKey: key('requests'), queryFn: ({ signal }) => listRequests(undefined, signal) }))

export const useOrders = () => useQuery(queryOptions({ queryKey: key('orders'), queryFn: ({ signal }) => listOrders(undefined, signal) }))

export const useCustomers = () => useQuery(queryOptions({ queryKey: key('customers'), queryFn: ({ signal }) => listCustomers(signal) }))

export const useCustomer = (id: string | undefined) =>
  useQuery({ queryKey: key('customers', id ?? ''), queryFn: ({ signal }) => getCustomer(id!, signal), enabled: Boolean(id) })

export const useProviders = () => useQuery(queryOptions({ queryKey: key('providers'), queryFn: ({ signal }) => listProviders(signal) }))

export const useActivity = () => useQuery(queryOptions({ queryKey: key('activity'), queryFn: ({ signal }) => listActivity(signal) }))

/** After any change, everything the portal shows may be out of date (counts, attention list, activity log). */
function useRefreshPortal() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: root })
    // Families' own screens show the same requests and orders.
    void queryClient.invalidateQueries({ queryKey: [PRIVATE_QUERY_ROOT, 'requests'] })
    void queryClient.invalidateQueries({ queryKey: [PRIVATE_QUERY_ROOT, 'orders'] })
  }
}

export function useAssignRequest() {
  const refresh = useRefreshPortal()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; providerId: string; note?: string }) => assignRequest(id, input),
    onSuccess: refresh,
  })
}

export function useRespondToRequest() {
  const refresh = useRefreshPortal()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'accepted' | 'declined' | 'completed' }) => respondToRequest(id, { status }),
    onSuccess: refresh,
  })
}

export function useUpdateOrderStatus() {
  const refresh = useRefreshPortal()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Parameters<typeof updateOrderStatus>[1] }) => updateOrderStatus(id, status),
    onSuccess: refresh,
  })
}

export function useCreateProvider() {
  const refresh = useRefreshPortal()
  return useMutation({ mutationFn: createProvider, onSuccess: refresh })
}

export function useSetProviderActive() {
  const queryClient = useQueryClient()
  const refresh = useRefreshPortal()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setProviderActive(id, isActive),
    onSuccess: () => {
      refresh()
      // Switching a provider on or off changes what the shop sells.
      void queryClient.invalidateQueries({ queryKey: ['marketplace'] })
    },
  })
}
