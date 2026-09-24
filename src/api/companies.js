import { apiClient, parseApiError } from './client'

export { parseApiError }

export const COMPANIES_PATH = '/companies'

/** Days ahead used for the “Expiring Plans” SaaS metric. */
export const EXPIRING_WINDOW_DAYS = 30

const PLAN_LABELS = {
  trial: 'تجريبي',
  basic: 'أساسي',
  professional: 'احترافي',
  enterprise: 'مؤسسي',
}

const STATUS_LABELS = {
  active: 'نشط',
  inactive: 'غير نشط',
  expired: 'منتهي',
}

export const subscriptionPlanOptions = [
  { value: 'trial', label: PLAN_LABELS.trial },
  { value: 'basic', label: PLAN_LABELS.basic },
  { value: 'professional', label: PLAN_LABELS.professional },
  { value: 'enterprise', label: PLAN_LABELS.enterprise },
]

export const companyStatusOptions = [
  { value: 'active', label: STATUS_LABELS.active },
  { value: 'inactive', label: STATUS_LABELS.inactive },
  { value: 'expired', label: STATUS_LABELS.expired },
]

export function planLabel(plan) {
  return PLAN_LABELS[plan] || plan || '—'
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || '—'
}

/**
 * SaaS badge palettes (requested product colors).
 * Trial=Orange, Basic=Green, Professional=Blue, Enterprise=Purple
 */
export function planBadgeClass(plan) {
  const map = {
    trial: 'border-orange-200 bg-orange-50 text-orange-700',
    basic: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    professional: 'border-sky-200 bg-sky-50 text-sky-700',
    enterprise: 'border-violet-200 bg-violet-50 text-violet-700',
  }
  return map[plan] || 'border-[#d5e0e0] bg-[#f3f4f4] text-[#6b7f80]'
}

export function statusBadgeClass(status) {
  const map = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    inactive: 'border-slate-200 bg-slate-50 text-slate-600',
    expired: 'border-rose-200 bg-rose-50 text-rose-700',
  }
  return map[status] || map.inactive
}

/** Normalize API datetime / date strings to YYYY-MM-DD for <input type="date">. */
export function toDateInputValue(value) {
  if (!value) return ''
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function formatDisplayDate(value) {
  const iso = toDateInputValue(value)
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function daysUntil(value) {
  const iso = toDateInputValue(value)
  if (!iso) return null
  const end = new Date(`${iso}T23:59:59`)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/** Active tenants whose subscription ends within the next N days. */
export function isExpiringSoon(company, withinDays = EXPIRING_WINDOW_DAYS) {
  if (!company || company.status !== 'active') return false
  const days = daysUntil(company.subscription_end)
  return days !== null && days >= 0 && days <= withinDays
}

/**
 * Derive Super-Admin overview metrics from the tenants list.
 */
export function computeTenantMetrics(companies = []) {
  const list = Array.isArray(companies) ? companies : []
  return {
    total: list.length,
    active: list.filter((c) => c.status === 'active').length,
    trial: list.filter((c) => c.subscription_plan === 'trial').length,
    expiring: list.filter((c) => isExpiringSoon(c)).length,
  }
}

/**
 * Build multipart FormData for create/update.
 * When `method` is "PUT", Laravel method spoofing is appended.
 */
export function buildCompanyFormData(values, { method } = {}) {
  const formData = new FormData()
  const fields = [
    'name',
    'email',
    'phone',
    'address',
    'subscription_plan',
    'subscription_start',
    'subscription_end',
    'status',
  ]

  for (const key of fields) {
    formData.append(key, String(values[key] ?? '').trim())
  }

  if (method) {
    formData.append('_method', method)
  }

  // Logo is optional on update — only send when a new File was chosen.
  if (values.logo instanceof File) {
    formData.append('logo', values.logo)
  }

  return formData
}

/** GET /companies — returns the tenants array. */
export async function fetchCompanies(params = {}) {
  const { data } = await apiClient.get(COMPANIES_PATH, { params })
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data)) return data
  return []
}

/** GET /companies/{id} — single tenant. */
export async function fetchCompany(id) {
  const { data } = await apiClient.get(`${COMPANIES_PATH}/${id}`)
  return data?.data ?? data ?? null
}

/** POST /companies (multipart). */
export async function createCompany(values) {
  const formData = buildCompanyFormData(values)
  const { data } = await apiClient.post(COMPANIES_PATH, formData)
  return data
}

/**
 * POST /companies/{id} with `_method=PUT` (Laravel method spoofing).
 * Prefer spoofed POST for multipart so PHP/Laravel receives file uploads reliably.
 */
export async function updateCompany(id, values) {
  const formData = buildCompanyFormData(values, { method: 'PUT' })
  const { data } = await apiClient.post(`${COMPANIES_PATH}/${id}`, formData)
  return data
}

/** DELETE /companies/{id} */
export async function deleteCompany(id) {
  const { data } = await apiClient.delete(`${COMPANIES_PATH}/${id}`)
  return data
}
