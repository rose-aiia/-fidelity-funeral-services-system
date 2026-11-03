import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PRIVATE_QUERY_ROOT } from '@/features/auth'
import { createRequest, getPolicy, linkPolicy, listRequests } from './api'
import type { AssistanceRequest } from './data'

const policyKey = [PRIVATE_QUERY_ROOT, 'policy'] as const
const requestsKey = [PRIVATE_QUERY_ROOT, 'requests'] as const

const policyQuery = queryOptions({
  queryKey: policyKey,
  queryFn: ({ signal }) => getPolicy(signal),
})

const requestsQuery = queryOptions({
  queryKey: requestsKey,
  queryFn: ({ signal }) => listRequests(signal),
})

export const usePolicy = () => useQuery(policyQuery)

export const useRequests = () => useQuery(requestsQuery)

export function useLinkPolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: linkPolicy,
    onSuccess: (policy) => queryClient.setQueryData(policyKey, policy),
  })
}

export function useCreateRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRequest,
    onSuccess: (request) =>
      queryClient.setQueryData<AssistanceRequest[]>(requestsKey, (existing) => [request, ...(existing ?? [])]),
  })
}
