import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAppointment,
  deleteAppointment,
  fetchAppointment,
  fetchAppointments,
  normalizeAppointment,
  parseApiError,
  updateAppointment,
} from '../api/appointments'
import { appointmentKeys } from './queryKeys'

export function useAppointments(params = {}) {
  const query = useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: async () => {
      const list = await fetchAppointments(params)
      return list.map(normalizeAppointment)
    },
  })
  return {
    appointments: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useAppointment(id, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: async () => normalizeAppointment(await fetchAppointment(id)),
    enabled: Boolean(id) && enabled,
  })
  return {
    appointment: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useAppointmentMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: appointmentKeys.all })
  return {
    create: useMutation({ mutationFn: createAppointment, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, values }) => updateAppointment(id, values),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: deleteAppointment, onSuccess: invalidate }),
  }
}
