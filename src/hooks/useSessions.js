import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSession,
  deleteSession,
  fetchSession,
  fetchSessionCalendar,
  fetchSessionKpis,
  fetchSessions,
  normalizeSession,
  parseApiError,
  updateSession,
  updateSessionStatus,
} from '../api/sessions'
import { sessionKeys } from './queryKeys'

export function useSessions(params = {}) {
  const query = useQuery({
    queryKey: sessionKeys.list(params),
    queryFn: async () => {
      const list = await fetchSessions(params)
      return list.map(normalizeSession)
    },
  })
  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useSession(id, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: async () => normalizeSession(await fetchSession(id)),
    enabled: Boolean(id) && enabled,
  })
  return {
    session: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
  }
}

export function useSessionKpis(params = {}) {
  return useQuery({
    queryKey: sessionKeys.kpis(params),
    queryFn: () => fetchSessionKpis(params),
  })
}

export function useSessionCalendar(params = {}) {
  return useQuery({
    queryKey: sessionKeys.calendar(params),
    queryFn: () => fetchSessionCalendar(params),
    enabled: Boolean(params?.month && params?.year),
  })
}

export function useSessionMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: sessionKeys.all })
  return {
    create: useMutation({ mutationFn: createSession, onSuccess: invalidate }),
    update: useMutation({
      mutationFn: ({ id, values }) => updateSession(id, values),
      onSuccess: invalidate,
    }),
    remove: useMutation({ mutationFn: deleteSession, onSuccess: invalidate }),
    changeStatus: useMutation({
      mutationFn: ({ id, status }) => updateSessionStatus(id, status),
      onSuccess: invalidate,
    }),
  }
}
