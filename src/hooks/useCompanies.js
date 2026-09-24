import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCompany,
  deleteCompany,
  fetchCompanies,
  fetchCompany,
  parseApiError,
  updateCompany,
} from '../api/companies'
import { companyKeys } from './queryKeys'

/**
 * List companies (optionally filtered via API query params).
 */
export function useCompanies(params = {}) {
  const query = useQuery({
    queryKey: companyKeys.list(params),
    queryFn: () => fetchCompanies(params),
  })

  return {
    companies: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
    query,
  }
}

/**
 * Single company by id.
 */
export function useCompany(id, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => fetchCompany(id),
    enabled: Boolean(id) && enabled,
  })

  return {
    company: query.data ?? null,
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
export function useCompanyMutations() {
  const queryClient = useQueryClient()

  const invalidate = async (id) => {
    await queryClient.invalidateQueries({ queryKey: companyKeys.all })
    if (id != null) {
      await queryClient.invalidateQueries({ queryKey: companyKeys.detail(id) })
    }
  }

  const create = useMutation({
    mutationFn: (values) => createCompany(values),
    onSuccess: async (result) => {
      const saved = result?.data ?? result
      await invalidate(saved?.id)
    },
  })

  const update = useMutation({
    mutationFn: ({ id, values }) => updateCompany(id, values),
    onSuccess: async (_result, variables) => {
      await invalidate(variables.id)
    },
  })

  const remove = useMutation({
    mutationFn: (id) => deleteCompany(id),
    onSuccess: async (_result, id) => {
      await invalidate(id)
    },
  })

  return { create, update, remove, invalidate }
}
