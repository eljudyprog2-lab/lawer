import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createInvoice,
  deleteInvoice,
  fetchInvoice,
  fetchInvoiceDashboard,
  fetchInvoices,
  normalizeInvoice,
  parseApiError,
  updateInvoice,
} from '../api/invoices'
import { invoiceKeys } from './queryKeys'

export function useInvoices(params = {}) {
  const query = useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: async () => {
      const list = await fetchInvoices(params)
      return list.map(normalizeInvoice)
    },
  })
  return {
    invoices: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useInvoice(id, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => normalizeInvoice(await fetchInvoice(id)),
    enabled: Boolean(id) && enabled,
  })
  return {
    invoice: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useInvoiceDashboard(params = {}, { enabled = false } = {}) {
  // Disabled by default: GET /invoices/dash returns 404 on the live API.
  // Enable when the backend exposes this route; until then KPIs come from the invoices list.
  return useQuery({
    queryKey: invoiceKeys.dash(params),
    queryFn: () => fetchInvoiceDashboard(params),
    enabled,
    retry: false,
  })
}

export function useInvoiceMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: invoiceKeys.all })
  return {
    create: useMutation({ mutationFn: createInvoice, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, values }) => updateInvoice(id, values),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: deleteInvoice, onSuccess: invalidate }),
  }
}
