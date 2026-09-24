import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createUser,
  deleteUser,
  fetchUser,
  fetchUsers,
  normalizeUser,
  parseApiError,
  updateUser,
} from '../api/users'
import { userKeys } from './queryKeys'

/**
 * GET /api/users — list (company_id injected by apiClient).
 */
export function useUsers(params = {}) {
  const query = useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      const list = await fetchUsers(params)
      return list.map(normalizeUser)
    },
  })

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
    query,
  }
}

/**
 * GET /api/users/{id}
 */
export function useUser(id, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => normalizeUser(await fetchUser(id)),
    enabled: Boolean(id) && enabled,
  })

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
    query,
  }
}

/**
 * Create / update / delete — invalidate list + detail after success.
 */
export function useUserMutations() {
  const queryClient = useQueryClient()

  const invalidate = async (id) => {
    await queryClient.invalidateQueries({ queryKey: userKeys.all })
    if (id != null) {
      await queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
    }
  }

  const create = useMutation({
    mutationFn: (values) => createUser(values),
    onSuccess: async (saved) => {
      await invalidate(saved?.id)
    },
  })

  const update = useMutation({
    mutationFn: ({ id, values }) => updateUser(id, values),
    onSuccess: async (_result, variables) => {
      await invalidate(variables.id)
    },
  })

  const remove = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: async (_result, id) => {
      await invalidate(id)
    },
  })

  return { create, update, remove, invalidate }
}
