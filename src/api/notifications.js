import { apiClient, extractList, extractItem, parseApiError } from './client'
import { formatRelativeTime } from '../utils/formatDisplay'

export { parseApiError }

const PATH = '/notifications'

export async function fetchNotifications(params = {}) {
  const { data } = await apiClient.get(PATH, { params })
  return extractList(data)
}

export async function fetchNotification(id) {
  const { data } = await apiClient.get(`${PATH}/${id}`)
  return extractItem(data)
}

export async function createNotification(values) {
  const { data } = await apiClient.post(PATH, values)
  return extractItem(data)
}

export async function updateNotification(id, values) {
  const { data } = await apiClient.put(`${PATH}/${id}`, values)
  return extractItem(data)
}

export async function deleteNotification(id) {
  const { data } = await apiClient.delete(`${PATH}/${id}`)
  return data
}

export async function markNotificationRead(id) {
  const { data } = await apiClient.put(`${PATH}/${id}/mark-as-read`)
  return extractItem(data)
}

export function normalizeNotification(n) {
  if (!n) return null
  return {
    id: n.id,
    company_id: n.company_id,
    user_id: n.user_id,
    title: n.title ?? '',
    message: n.message ?? '',
    type: n.type ?? 'info',
    referenceId: n.reference_id ?? null,
    read: Boolean(n.is_read),
    readAt: n.read_at ?? null,
    timeAgo: formatRelativeTime(n.created_at),
    createdAt: n.created_at,
    raw: n,
  }
}
