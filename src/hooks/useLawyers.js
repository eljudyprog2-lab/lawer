import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createLawyer,
  deleteLawyer,
  fetchLawyer,
  fetchLawyers,
  normalizeLawyer,
  parseApiError,
  updateLawyer,
} from '../api/lawyers'
import { lawyerKeys } from './queryKeys'

export function useLawyers(params = {}) {
  const query = useQuery({
    queryKey: lawyerKeys.list(params),
    queryFn: async () => {
      const list = await fetchLawyers(params)
      return list.map(normalizeLawyer)
    },
  })
  return {
    lawyers: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useLawyer(id, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: lawyerKeys.detail(id),
    queryFn: async () => normalizeLawyer(await fetchLawyer(id)),
    enabled: Boolean(id) && enabled,
  })
  return {
    lawyer: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useLawyerMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: lawyerKeys.all })
  return {
    create: useMutation({
      mutationFn: createLawyer,
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, values }) => updateLawyer(id, values),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: deleteLawyer,
      onSuccess: invalidate,
    }),
  }
}
