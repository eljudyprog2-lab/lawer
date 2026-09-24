import { apiClient, extractList, extractItem, parseApiError } from './client'
import {
  MSG,
  isValidEmail,
  isValidNationalId,
  isValidPassword,
  isValidPhone,
  requireText,
  trimStr,
  validationResult,
} from '../utils/validation'

export { parseApiError }

const PATH = '/clients'

/**
 * GET /clients?company_id=X
 * company_id injected automatically by interceptor.
 */
export async function fetchClients(params = {}) {
  const { data } = await apiClient.get(PATH, { params })
  return extractList(data)
}

/**
 * GET /clients/:id
 */
export async function fetchClient(id) {
  const { data } = await apiClient.get(`${PATH}/${id}`)
  return extractItem(data)
}

/**
 * POST /clients
 * API fields: full_name, email, phone, national_id, address, status, notes
 */
export async function createClient(values) {
  const { data } = await apiClient.post(PATH, values)
  return extractItem(data)
}

/**
 * PUT /clients/:id
 */
export async function updateClient(id, values) {
  const { data } = await apiClient.put(`${PATH}/${id}`, values)
  return extractItem(data)
}

/**
 * DELETE /clients/:id
 */
export async function deleteClient(id) {
  const { data } = await apiClient.delete(`${PATH}/${id}`)
  return data
}

/**
 * Map API client to UI shape.
 * API: { id, company_id, full_name, email, phone, national_id, address, status, notes, created_at, updated_at }
 */
export function normalizeClient(client) {
  if (!client) return null
  return {
    id: client.id,
    company_id: client.company_id,
    name: client.full_name ?? '—',
    full_name: client.full_name ?? '—',
    email: client.email ?? '—',
    phone: client.phone ?? '—',
    national_id: client.national_id ?? '',
    nationalId: client.national_id ?? '',
    address: client.address ?? '',
    status: client.status === 'active' ? 'نشط' : (client.status === 'inactive' ? 'موقوف' : (client.status ?? 'نشط')),
    statusRaw: client.status ?? 'active',
    notes: client.notes ?? '',
    registeredAt: client.created_at ?? null,
    updatedAt: client.updated_at ?? null,
    casesCount: 0,
    appointmentsCount: 0,
    balance: null,
    raw: client,
  }
}

export const clientStatusOptions = ['نشط', 'موقوف', 'معلق']
export const clientStatusLabels = { active: 'نشط', inactive: 'موقوف' }

export const emptyClientForm = {
  name: '',
  email: '',
  phone: '',
  nationalId: '',
  address: '',
  password: '',
  status: 'نشط',
  notes: '',
}

const STATUS_TO_API = { نشط: 'active', موقوف: 'inactive', معلق: 'inactive' }

export function buildClientPayload(form, { companyId } = {}) {
  const payload = {
    full_name: form.name?.trim() || form.full_name?.trim() || '',
    email: form.email?.trim() || '',
    phone: form.phone?.trim() || '',
    national_id: form.nationalId?.trim() || form.national_id?.trim() || '',
    address: form.address?.trim() || '',
    status: STATUS_TO_API[form.status] || form.statusRaw || form.status || 'active',
    notes: form.notes?.trim() || '',
  }
  if (form.password?.trim()) payload.password = form.password.trim()
  if (companyId) payload.company_id = companyId
  return payload
}

/**
 * Frontend validation for create/update client forms.
 * @returns {{ ok: true } | { ok: false, message: string, fieldErrors: Record<string,string> }}
 */
export function validateClientForm(form, { isUpdate = false } = {}) {
  const fieldErrors = {}
  const name = trimStr(form.name || form.full_name)
  const email = trimStr(form.email)
  const phone = trimStr(form.phone)
  const nationalId = trimStr(form.nationalId || form.national_id)
  const password = String(form.password || '')
  const address = trimStr(form.address)

  if (!requireText(name, { min: 2, max: 255 })) {
    fieldErrors.name = name ? MSG.minLen(2) : 'الاسم الكامل مطلوب'
  }
  if (!email) fieldErrors.email = 'البريد الإلكتروني مطلوب'
  else if (!isValidEmail(email)) fieldErrors.email = MSG.email
  if (!isValidPhone(phone)) fieldErrors.phone = MSG.phone
  if (!isValidNationalId(nationalId)) fieldErrors.nationalId = MSG.nationalId
  if (address && address.length > 500) fieldErrors.address = MSG.maxLen(500)
  if (!isUpdate) {
    if (!password) fieldErrors.password = MSG.passwordRequired
    else if (!isValidPassword(password)) fieldErrors.password = MSG.password
  } else if (password && !isValidPassword(password)) {
    fieldErrors.password = MSG.password
  }

  return validationResult(fieldErrors)
}
