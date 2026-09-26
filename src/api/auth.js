import { apiClient, parseApiError } from './client'

export { parseApiError }

/**
 * POST /api/login
 * Calls the real backend login endpoint.
 * Payload: { login, password, role }
 */
export async function loginApi({ login, password, role }) {
  const { data } = await apiClient.post('/login', {
    login: String(login).trim(),
    password: String(password),
    role: String(role).trim(),
  })
  return data
}
