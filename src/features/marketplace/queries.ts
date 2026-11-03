import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PRIVATE_QUERY_ROOT } from '@/features/auth'
import { seedInMockMode } from '@/lib/mock'
import { createOrder, getOrder, listMarketplaceItems, listOrders, payOrder, resolveHostedPayment } from './api'
import { marketplaceItems, type Order } from './data'

const marketplaceItemsQuery = queryOptions({
  queryKey: ['marketplace', 'items'],
  queryFn: ({ signal }) => listMarketplaceItems(signal),
  initialData: seedInMockMode(marketplaceItems),
})

export const useMarketplaceItems = () => useQuery(marketplaceItemsQuery)

/** One product, picked from the catalogue (it is small, and already cached for the shop pages). */
export function useMarketplaceItem(id: string | undefined) {
  const query = useMarketplaceItems()
  const item = query.data?.find((candidate) => candidate.id === id)
  return { ...query, item }
}

const ordersKey = [PRIVATE_QUERY_ROOT, 'orders'] as const
const orderKey = (id: string) => [PRIVATE_QUERY_ROOT, 'orders', id] as const

export const useOrders = () => useQuery(queryOptions({ queryKey: ordersKey, queryFn: ({ signal }) => listOrders(signal) }))

const PAYMENT_POLL_MS = 2000
const TRACKING_POLL_MS = 5000

/** An order is polled while money or goods are still moving, and left alone once it has settled. */
function pollInterval(order: Order | undefined): number | false {
  if (!order) return false
  if (order.payment.status === 'pending') return PAYMENT_POLL_MS
  return order.status === 'paid' || order.status === 'confirmed' || order.status === 'in_progress' ? TRACKING_POLL_MS : false
}

export const useOrder = (id: string | undefined) =>
  useQuery({
    queryKey: orderKey(id ?? ''),
    queryFn: ({ signal }) => getOrder(id!, signal),
    enabled: Boolean(id),
    refetchInterval: (query) => pollInterval(query.state.data),
  })

function useStoreOrder() {
  const queryClient = useQueryClient()
  return (order: Order) => {
    queryClient.setQueryData(orderKey(order.id), order)
    void queryClient.invalidateQueries({ queryKey: ordersKey, exact: true })
  }
}

export function useCreateOrder() {
  const store = useStoreOrder()
  return useMutation({ mutationFn: createOrder, onSuccess: store })
}

export function usePayOrder(id: string) {
  const store = useStoreOrder()
  return useMutation({ mutationFn: (payment: Parameters<typeof payOrder>[1]) => payOrder(id, payment), onSuccess: store })
}

export function useResolveHostedPayment(id: string) {
  const store = useStoreOrder()
  return useMutation({ mutationFn: (outcome: 'paid' | 'failed') => resolveHostedPayment(id, outcome), onSuccess: store })
}
