import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteNotification,
  fetchNotifications,
  markNotificationRead,
  normalizeNotification,
  parseApiError,
  updateNotification,
} from '../api/notifications'
import { notificationKeys } from './queryKeys'

export function useNotifications(params = {}) {
  const query = useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: async () => {
      const list = await fetchNotifications(params)
      return list.map(normalizeNotification)
    },
  })
  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error).message : null,
    refetch: query.refetch,
    unreadCount: (query.data ?? []).filter((n) => !n.read).length,
  }
}

export function useNotificationMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: notificationKeys.all })
  return {
    markRead: useMutation({
      mutationFn: markNotificationRead,
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, values }) => updateNotification(id, values),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: deleteNotification,
      onSuccess: invalidate,
    }),
  }
}
