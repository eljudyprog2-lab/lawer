import { apiClient, parseApiError } from './client'

export { parseApiError }

/**
 * GET /dashboard?company_id=X
 * Returns real-time KPIs and statistics.
 */
export async function fetchDashboard() {
  const { data } = await apiClient.get('/dashboard')
  return data?.data ?? data ?? {}
}
