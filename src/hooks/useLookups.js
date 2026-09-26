import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCaseTypes,
  createCaseType,
  updateCaseType,
  deleteCaseType,
  fetchCaseCategories,
  createCaseCategory,
  updateCaseCategory,
  deleteCaseCategory,
} from '../api/caseClassifications'
import { fetchCases, parseApiError } from '../api/cases'
import { caseTypeKeys, caseCategoryKeys, caseKeys } from './queryKeys'
import { LOOKUP_GROUPS } from '../data/lookupGroups'

export function useLookupOverview() {
  const queryClient = useQueryClient()

  const typesQuery = useQuery({
    queryKey: caseTypeKeys.all,
    queryFn: () => fetchCaseTypes(),
  })

  const categoriesQuery = useQuery({
    queryKey: caseCategoryKeys.all,
    queryFn: () => fetchCaseCategories(),
  })

  const casesQuery = useQuery({
    queryKey: caseKeys.all,
    queryFn: () => fetchCases(),
  })

  const isLoading = typesQuery.isLoading || categoriesQuery.isLoading
  const isFetching = typesQuery.isFetching || categoriesQuery.isFetching
  const error = typesQuery.error || categoriesQuery.error

  const caseTypes = typesQuery.data ?? []
  const caseCategories = categoriesQuery.data ?? []
  const cases = casesQuery.data ?? []

  // Combine groups with counts
  const groupsWithCounts = LOOKUP_GROUPS.map((group) => {
    let count = 0
    let lastUpdated = '—'
    let sampleItems = []

    if (group.key === 'case-types') {
      count = caseTypes.length
      if (caseTypes.length > 0) {
        sampleItems = caseTypes.map((item) => item.name).slice(0, 4)
        const latest = [...caseTypes].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))[0]
        if (latest?.updated_at || latest?.created_at) {
          lastUpdated = new Date(latest.updated_at || latest.created_at).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        }
      }
    } else if (group.key === 'case-categories') {
      count = caseCategories.length
      if (caseCategories.length > 0) {
        sampleItems = caseCategories.map((item) => item.name).slice(0, 4)
        const latest = [...caseCategories].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))[0]
        if (latest?.updated_at || latest?.created_at) {
          lastUpdated = new Date(latest.updated_at || latest.created_at).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        }
      }
    } else if (group.systemEnumValues) {
      count = group.systemEnumValues.length
      sampleItems = group.systemEnumValues.map((item) => item.name).slice(0, 4)
      lastUpdated = 'ثوابت نظامية'
    }

    return {
      ...group,
      count,
      lastUpdated,
      sampleItems,
    }
  })

  const totalRegisteredOptions = groupsWithCounts.reduce((acc, g) => acc + g.count, 0)
  const managedApiGroupsCount = LOOKUP_GROUPS.filter((g) => g.isManagedByApi).length

  const refetch = async () => {
    await Promise.all([typesQuery.refetch(), categoriesQuery.refetch(), casesQuery.refetch()])
  }

  return {
    groups: groupsWithCounts,
    totalRegisteredOptions,
    managedApiGroupsCount,
    isLoading,
    isFetching,
    error: error ? parseApiError(error).message : null,
    refetch,
    cases,
  }
}

export function useLookupGroup(groupKey) {
  const qc = useQueryClient()
  const group = LOOKUP_GROUPS.find((g) => g.key === groupKey) || null

  const isCaseType = groupKey === 'case-types'
  const isCaseCategory = groupKey === 'case-categories'

  const query = useQuery({
    queryKey: isCaseType ? caseTypeKeys.all : isCaseCategory ? caseCategoryKeys.all : ['lookup', groupKey],
    queryFn: async () => {
      if (isCaseType) return fetchCaseTypes()
      if (isCaseCategory) return fetchCaseCategories()
      return group?.systemEnumValues || []
    },
    enabled: Boolean(groupKey),
  })

  const casesQuery = useQuery({
    queryKey: caseKeys.all,
    queryFn: () => fetchCases(),
  })

  const cases = casesQuery.data ?? []

  // Check if an option is referenced in any existing case
  const checkReferences = (optionId) => {
    if (!optionId || !cases.length) return { isReferenced: false, count: 0, cases: [] }
    const idNum = Number(optionId)

    let referencingCases = []
    if (isCaseType) {
      referencingCases = cases.filter(
        (c) => Number(c.type_id) === idNum || Number(c.type?.id) === idNum,
      )
    } else if (isCaseCategory) {
      referencingCases = cases.filter(
        (c) => Number(c.category_id) === idNum || Number(c.category?.id) === idNum,
      )
    }

    return {
      isReferenced: referencingCases.length > 0,
      count: referencingCases.length,
      cases: referencingCases,
    }
  }

  const createMutation = useMutation({
    mutationFn: async (values) => {
      if (isCaseType) {
        return createCaseType({ name: values.name })
      }
      if (isCaseCategory) {
        return createCaseCategory({ name: values.name })
      }
      throw new Error('هذه القائمة نظامية وثابتة ولا تدعم إضافة خيارات عبر الـ API.')
    },
    onSuccess: () => {
      if (isCaseType) qc.invalidateQueries({ queryKey: caseTypeKeys.all })
      if (isCaseCategory) qc.invalidateQueries({ queryKey: caseCategoryKeys.all })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }) => {
      if (isCaseType) {
        return updateCaseType(id, { name: values.name })
      }
      if (isCaseCategory) {
        return updateCaseCategory(id, { name: values.name })
      }
      throw new Error('هذه القائمة نظامية وثابتة ولا تدعم تعديل الخيارات.')
    },
    onSuccess: () => {
      if (isCaseType) qc.invalidateQueries({ queryKey: caseTypeKeys.all })
      if (isCaseCategory) qc.invalidateQueries({ queryKey: caseCategoryKeys.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      if (isCaseType) {
        return deleteCaseType(id)
      }
      if (isCaseCategory) {
        return deleteCaseCategory(id)
      }
      throw new Error('هذه القائمة نظامية وثابتة ولا تدعم حذف الخيارات.')
    },
    onSuccess: () => {
      if (isCaseType) qc.invalidateQueries({ queryKey: caseTypeKeys.all })
      if (isCaseCategory) qc.invalidateQueries({ queryKey: caseCategoryKeys.all })
    },
  })

  return {
    group,
    options: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
    checkReferences,
    createOption: createMutation,
    updateOption: updateMutation,
    deleteOption: deleteMutation,
  }
}
