import { apiClient, extractList, extractItem, parseApiError, getStoredCompanyId } from './client'
import { createUser, updateUser } from './users'
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

const PATH = '/lawyers'

/**
 * GET /lawyers?company_id=X
 * company_id is injected automatically by the axios interceptor.
 */
export async function fetchLawyers(params = {}) {
  const { data } = await apiClient.get(PATH, { params })
  return extractList(data)
}

/**
 * GET /lawyers/:id
 */
export async function fetchLawyer(id) {
  const { data } = await apiClient.get(`${PATH}/${id}`)
  return extractItem(data)
}

/**
 * POST /lawyers
 * Lawyers are linked to a user (user_id). Create the user first when needed,
 * then create the lawyer profile.
 */
export async function createLawyer(values) {
  const companyId = values.company_id ?? getStoredCompanyId()
  let userId = values.user_id ?? null
  let createdUser = null

  if (!userId) {
    const password = values.password || ''
    createdUser = await createUser({
      company_id: companyId,
      full_name: values.full_name,
      email: values.email,
      phone: values.phone || '',
      password,
      password_confirmation: values.password_confirmation || password,
      role: values.role || 'lawyer',
      status: values.status || 'active',
    })
    userId = createdUser?.id
    if (!userId) {
      throw new Error('تعذر إنشاء حساب المستخدم للمحامي')
    }
  }

  const profile = {
    company_id: companyId,
    user_id: userId,
    national_id: values.national_id || '',
    bar_number: values.bar_number || '',
    specialization: values.specialization || '',
    address: values.address || '',
    notes: values.notes || '',
  }

  const { data } = await apiClient.post(PATH, profile)
  const created = extractItem(data)

  // Ensure UI has user fields even if API omits nested user on create response
  if (created && !created.user) {
    created.user =
      createdUser ||
      {
        id: userId,
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        role: values.role || 'lawyer',
        status: values.status || 'active',
      }
  }
  return created
}

/**
 * PUT /lawyers/:id — update profile; sync user account when user_id is known.
 */
export async function updateLawyer(id, values) {
  const companyId = values.company_id ?? getStoredCompanyId()
  const profile = {
    company_id: companyId,
    national_id: values.national_id || '',
    bar_number: values.bar_number || '',
    specialization: values.specialization || '',
    address: values.address || '',
    notes: values.notes || '',
  }
  if (values.user_id) profile.user_id = values.user_id

  const { data } = await apiClient.put(`${PATH}/${id}`, profile)
  const updated = extractItem(data)

  if (values.user_id) {
    const userPayload = {
      company_id: companyId,
      full_name: values.full_name,
      email: values.email,
      phone: values.phone || '',
      role: values.role || 'lawyer',
      status: values.status || 'active',
    }
    if (values.password) {
      userPayload.password = values.password
      userPayload.password_confirmation =
        values.password_confirmation || values.password
    }
    try {
      const user = await updateUser(values.user_id, userPayload)
      if (updated && user) updated.user = user
    } catch {
      /* profile saved; user sync may fail on partial APIs */
    }
  }

  if (updated && !updated.user) {
    updated.user = {
      id: values.user_id,
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      role: values.role || 'lawyer',
      status: values.status || 'active',
    }
  }
  return updated
}

/**
 * DELETE /lawyers/:id
 */
export async function deleteLawyer(id) {
  const { data } = await apiClient.delete(`${PATH}/${id}`)
  return data
}

/**
 * Map API lawyer object to a UI-friendly shape.
 * API structure: { id, company_id, user_id, national_id, bar_number,
 *   specialization, address, notes, user: { full_name, email, phone, role, status } }
 */
export function normalizeLawyer(lawyer) {
  if (!lawyer) return null
  const user = lawyer.user ?? null
  const statusRaw = user?.status ?? lawyer.status ?? 'active'
  return {
    id: lawyer.id,
    company_id: lawyer.company_id,
    user_id: lawyer.user_id ?? user?.id ?? null,
    name: user?.full_name ?? lawyer.full_name ?? lawyer.name ?? '—',
    email: user?.email ?? lawyer.email ?? '—',
    phone: user?.phone ?? lawyer.phone ?? '—',
    role: user?.role ?? lawyer.role ?? 'lawyer',
    status:
      statusRaw === 'active'
        ? 'نشط'
        : statusRaw === 'inactive'
          ? 'موقوف'
          : statusRaw === 'نشط' || statusRaw === 'موقوف' || statusRaw === 'معلق'
            ? statusRaw
            : 'نشط',
    statusRaw:
      statusRaw === 'نشط'
        ? 'active'
        : statusRaw === 'موقوف' || statusRaw === 'معلق'
          ? 'inactive'
          : statusRaw,
    national_id: lawyer.national_id ?? '',
    nationalId: lawyer.national_id ?? '',
    bar_number: lawyer.bar_number ?? '',
    barNumber: lawyer.bar_number ?? '',
    specialization: lawyer.specialization ?? '',
    address: lawyer.address ?? '',
    notes: lawyer.notes ?? '',
    registeredAt: lawyer.created_at ?? null,
    updatedAt: lawyer.updated_at ?? null,
    casesCount: 0,
    appointmentsCount: 0,
    company: lawyer.company ?? null,
    raw: lawyer,
  }
}

export const lawyerStatusOptions = ['نشط', 'موقوف', 'معلق']

export const specializationOptions = [
  'قضايا مدنية',
  'قضايا جنائية',
  'جنائي',
  'أحوال شخصية',
  'قضايا عمالية',
  'قضايا تجارية',
  'قضايا إدارية',
  'استشارات قانونية',
]

export const emptyLawyerForm = {
  name: '',
  email: '',
  phone: '',
  nationalId: '',
  barNumber: '',
  address: '',
  password: '',
  status: 'نشط',
  specialization: '',
  notes: '',
}

const STATUS_TO_API = { نشط: 'active', موقوف: 'inactive', معلق: 'inactive' }

/** Map UI lawyer form → API create/update payload. */
export function buildLawyerPayload(form, { companyId, userId } = {}) {
  const password = form.password?.trim() || ''
  const payload = {
    full_name: form.name?.trim() || form.full_name?.trim() || '',
    email: form.email?.trim() || '',
    phone: form.phone?.trim() || '',
    national_id: form.nationalId?.trim() || form.national_id?.trim() || '',
    bar_number: form.barNumber?.trim() || form.bar_number?.trim() || '',
    specialization: form.specialization?.trim() || '',
    address: form.address?.trim() || '',
    notes: form.notes?.trim() || '',
    status: STATUS_TO_API[form.status] || form.statusRaw || form.status || 'active',
    role: 'lawyer',
  }
  if (password) {
    payload.password = password
    payload.password_confirmation = password
  }
  const cid = companyId ?? getStoredCompanyId()
  if (cid != null) payload.company_id = cid
  if (userId != null) payload.user_id = userId
  return payload
}

/**
 * Frontend validation for lawyer create/update.
 */
export function validateLawyerForm(form, { isUpdate = false } = {}) {
  const fieldErrors = {}
  const name = trimStr(form.name || form.full_name)
  const email = trimStr(form.email)
  const phone = trimStr(form.phone)
  const nationalId = trimStr(form.nationalId || form.national_id)
  const password = String(form.password || '')
  const barNumber = trimStr(form.barNumber || form.bar_number)

  if (!requireText(name, { min: 2, max: 255 })) {
    fieldErrors.name = name ? MSG.minLen(2) : 'الاسم الكامل مطلوب'
  }
  if (!email) fieldErrors.email = 'البريد الإلكتروني مطلوب'
  else if (!isValidEmail(email)) fieldErrors.email = MSG.email
  if (!isValidPhone(phone)) fieldErrors.phone = MSG.phone
  if (!isValidNationalId(nationalId)) fieldErrors.nationalId = MSG.nationalId
  if (barNumber && barNumber.length > 50) fieldErrors.barNumber = MSG.maxLen(50)
  if (!isUpdate) {
    if (!password) fieldErrors.password = MSG.passwordRequired
    else if (!isValidPassword(password)) fieldErrors.password = MSG.password
  } else if (password && !isValidPassword(password)) {
    fieldErrors.password = MSG.password
  }

  return validationResult(fieldErrors)
}
