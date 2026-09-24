import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDocument,
  deleteDocument,
  fetchDocument,
  fetchDocuments,
  normalizeDocument,
  parseApiError,
  updateDocument,
} from '../api/documents'
import { documentKeys } from './queryKeys'

export function useDocuments(params = {}) {
  const query = useQuery({
    queryKey: documentKeys.list(params),
    queryFn: async () => {
      const list = await fetchDocuments(params)
      return list.map(normalizeDocument)
    },
  })
  return {
    documents: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useDocument(id, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: async () => normalizeDocument(await fetchDocument(id)),
    enabled: Boolean(id) && enabled,
  })
  return {
    document: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useDocumentMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: documentKeys.all })
  return {
    create: useMutation({ mutationFn: createDocument, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, values }) => updateDocument(id, values),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: deleteDocument, onSuccess: invalidate }),
  }
}
