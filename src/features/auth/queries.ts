import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { env } from '@/lib/env'
import { getMe, requestOtp, signIn, signInAsPersona, signOut, signUp, updateProfile } from './api'
import { readSessionUser } from './session'
import { clearSignOutIntent } from './signout-intent'
import type { User } from './types'

export const meQueryKey = ['me'] as const

/** Everything that belongs to the signed-in user lives under this root, so signing out can drop it in one call. */
export const PRIVATE_QUERY_ROOT = 'private'

const meQuery = queryOptions({
  queryKey: meQueryKey,
  queryFn: ({ signal }) => getMe(signal),
  // Mock mode reads the stored session synchronously so a reload doesn't flash a signed-out state.
  initialData: () => (env.useMock ? readSessionUser() : undefined),
})

export const useMe = () => useQuery(meQuery)

/** Forgets the user and everything fetched on their behalf. */
export function clearSession(queryClient: QueryClient) {
  queryClient.setQueryData(meQueryKey, null)
  queryClient.removeQueries({ queryKey: [PRIVATE_QUERY_ROOT] })
}

function useStoreUser() {
  const queryClient = useQueryClient()
  return (user: User) => {
    clearSignOutIntent()
    queryClient.removeQueries({ queryKey: [PRIVATE_QUERY_ROOT] })
    queryClient.setQueryData(meQueryKey, user)
  }
}

export const useRequestOtp = () => useMutation({ mutationFn: requestOtp })

export function useSignIn() {
  const storeUser = useStoreUser()
  return useMutation({ mutationFn: signIn, onSuccess: storeUser })
}

export function useSignUp() {
  const storeUser = useStoreUser()
  return useMutation({ mutationFn: signUp, onSuccess: storeUser })
}

export function useDemoSignIn() {
  const storeUser = useStoreUser()
  return useMutation({ mutationFn: signInAsPersona, onSuccess: storeUser })
}

export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: signOut, onSettled: () => clearSession(queryClient) })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => queryClient.setQueryData(meQueryKey, user),
  })
}
