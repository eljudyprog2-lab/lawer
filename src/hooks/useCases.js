import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCase,
  deleteCase,
  fetchCase,
  fetchCases,
  normalizeCase,
  parseApiError,
  updateCase,
} from '../api/cases'
import {
  createCaseCategory,
  createCaseType,
  deleteCaseCategory,
  deleteCaseType,
  fetchCaseCategories,
  fetchCaseTypes,
  updateCaseCategory,
  updateCaseType,
} from '../api/caseClassifications'
import { caseCategoryKeys, caseKeys, caseTypeKeys } from './queryKeys'

export function useCases(params = {}) {
  const query = useQuery({
    queryKey: caseKeys.list(params),
    queryFn: async () => {
      const list = await fetchCases(params)
      return list.map(normalizeCase)
    },
  })
  return {
    cases: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useCase(id, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: caseKeys.detail(id),
    queryFn: async () => normalizeCase(await fetchCase(id)),
    enabled: Boolean(id) && enabled,
  })
  return {
    caseItem: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useCaseMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: caseKeys.all })
  return {
    create: useMutation({ mutationFn: createCase, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, values }) => updateCase(id, values),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: deleteCase, onSuccess: invalidate }),
  }
}

export function useCaseTypes(params = {}) {
  const query = useQuery({
    queryKey: caseTypeKeys.list(params),
    queryFn: () => fetchCaseTypes(params),
  })
  return {
    caseTypes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useCaseCategories(params = {}) {
  const query = useQuery({
    queryKey: caseCategoryKeys.list(params),
    queryFn: () => fetchCaseCategories(params),
  })
  return {
    caseCategories: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useCaseMetaMutations() {
  const qc = useQueryClient()
  return {
    createType: useMutation({
      mutationFn: createCaseType,
      onSuccess: () => qc.invalidateQueries({ queryKey: caseTypeKeys.all }),
    }),
    updateType: useMutation({
      mutationFn: ({ id, values }) => updateCaseType(id, values),
      onSuccess: () => qc.invalidateQueries({ queryKey: caseTypeKeys.all }),
    }),
    removeType: useMutation({
      mutationFn: deleteCaseType,
      onSuccess: () => qc.invalidateQueries({ queryKey: caseTypeKeys.all }),
    }),
    createCategory: useMutation({
      mutationFn: createCaseCategory,
      onSuccess: () => qc.invalidateQueries({ queryKey: caseCategoryKeys.all }),
    }),
    updateCategory: useMutation({
      mutationFn: ({ id, values }) => updateCaseCategory(id, values),
      onSuccess: () => qc.invalidateQueries({ queryKey: caseCategoryKeys.all }),
    }),
    removeCategory: useMutation({
      mutationFn: deleteCaseCategory,
      onSuccess: () => qc.invalidateQueries({ queryKey: caseCategoryKeys.all }),
    }),
  }
}
