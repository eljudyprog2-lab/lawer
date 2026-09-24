import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createClient,
  deleteClient,
  fetchClient,
  fetchClients,
  normalizeClient,
  parseApiError,
  updateClient,
} from '../api/clients'
import { clientKeys } from './queryKeys'

export function useClients(params = {}) {
  const query = useQuery({
    queryKey: clientKeys.list(params),
    queryFn: async () => {
      const list = await fetchClients(params)
      return list.map(normalizeClient)
    },
  })
  return {
    clients: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useClient(id, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: async () => normalizeClient(await fetchClient(id)),
    enabled: Boolean(id) && enabled,
  })
  return {
    client: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useClientMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: clientKeys.all })
  return {
    create: useMutation({
      mutationFn: createClient,
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, values }) => updateClient(id, values),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: deleteClient,
      onSuccess: invalidate,
    }),
  }
}
