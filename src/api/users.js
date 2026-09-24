import { apiClient, extractList, extractItem, parseApiError, getStoredCompanyId } from './client'

export { parseApiError }

const PATH = '/users'

/** UI auth role → API `role` value for POST /users */
const UI_ROLE_TO_API = {
  admin: 'admin',
  lawyer: 'lawyer',
  client: 'secretary',
}

const API_ROLE_LABELS = {
  owner: 'مالك',
  admin: 'المستشار العام',
  lawyer: 'محامي',
  secretary: 'سكرتير',
}

export async function fetchUsers(params = {}) {
  const { data } = await apiClient.get(PATH, { params })
  return extractList(data)
}

export async function fetchUser(id) {
  const { data } = await apiClient.get(`${PATH}/${id}`)
  return extractItem(data)
}

export async function createUser(values) {
  const { data } = await apiClient.post(PATH, values)
  return extractItem(data)
}

/**
 * Build POST /users payload from the Auth register form.
 * API fields (from live responses): company_id, full_name, email, phone, role, status
 * + password (required on create).
 */
export function buildRegisterUserPayload(form, { companyId } = {}) {
  const roleKey = form.role || 'admin'
  const apiRole = UI_ROLE_TO_API[roleKey] || form.role || 'admin'
  const company_id = companyId ?? getStoredCompanyId() ?? 2

  return {
    company_id,
    full_name: String(form.name || form.full_name || '').trim(),
    email: String(form.email || '').trim().toLowerCase(),
    phone: String(form.phone || '').trim(),
    password: String(form.password || ''),
    password_confirmation: String(form.confirmPassword || form.password_confirmation || form.password || ''),
    role: apiRole,
    status: 'active',
  }
}

/**
 * Client-side validation before POST /users.
 * Returns { ok: true } or { ok: false, message, fieldErrors }.
 */
export function validateRegisterForm(form) {
  const fieldErrors = {}
  const name = String(form.name || '').trim()
  const email = String(form.email || '').trim()
  const password = String(form.password || '')
  const confirm = String(form.confirmPassword || '')

  if (!name || name.length < 2) fieldErrors.name = 'الاسم الكامل مطلوب'
  if (!email) fieldErrors.email = 'البريد الإلكتروني مطلوب'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    fieldErrors.email = 'صيغة البريد الإلكتروني غير صحيحة'
  }
  if (!password) fieldErrors.password = 'كلمة المرور مطلوبة'
  else if (password.length < 6) fieldErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
  if (password !== confirm) fieldErrors.confirmPassword = 'كلمتا المرور غير متطابقتين'

  if (Object.keys(fieldErrors).length) {
    return {
      ok: false,
      message: Object.values(fieldErrors)[0],
      fieldErrors,
    }
  }
  return { ok: true, fieldErrors: {} }
}

/**
 * Register a new user via POST /api/users and return a session shape for AuthContext.
 */
export async function registerUserViaApi(form, { companyId } = {}) {
  const validation = validateRegisterForm(form)
  if (!validation.ok) {
    const err = new Error(validation.message)
    err.fieldErrors = validation.fieldErrors
    err.isValidation = true
    throw err
  }

  const payload = buildRegisterUserPayload(form, { companyId })
  const created = await createUser(payload)
  const user = created || {}

  const fullName = user.full_name || payload.full_name
  const apiRole = user.role || payload.role
  const roleId =
    apiRole === 'lawyer'
      ? 'lawyer'
      : apiRole === 'secretary'
        ? 'client'
        : 'admin'

  return {
    id: user.id,
    name: fullName,
    email: user.email || payload.email,
    phone: user.phone || payload.phone || '',
    role: API_ROLE_LABELS[apiRole] || apiRole,
    roleId,
    status: user.status === 'active' ? 'نشط' : (user.status || 'نشط'),
    company_id: user.company_id || payload.company_id,
    company_name: user.company?.name || 'Law Office',
    initials: String(fullName)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join(''),
    raw: user,
  }
}

export async function updateUser(id, values) {
  const { data } = await apiClient.put(`${PATH}/${id}`, values)
  return extractItem(data)
}

export async function deleteUser(id) {
  const { data } = await apiClient.delete(`${PATH}/${id}`)
  return data
}

/**
 * API user shape: { id, company_id, full_name, email, phone, role, status, last_login }
 */
export function normalizeUser(user) {
  if (!user) return null
  return {
    id: user.id,
    company_id: user.company_id,
    full_name: user.full_name ?? '—',
    name: user.full_name ?? '—',
    email: user.email ?? '—',
    phone: user.phone ?? '—',
    role: user.role ?? '—',
    roleLabel: API_ROLE_LABELS[user.role] || user.role || '—',
    status: user.status ?? 'active',
    statusLabel: user.status === 'active' ? 'نشط' : user.status === 'inactive' ? 'غير نشط' : (user.status ?? '—'),
    last_login: user.last_login ?? null,
    company: user.company ?? null,
    raw: user,
  }
}

export const emptyUserForm = {
  full_name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: 'admin',
  status: 'active',
}

export function userToForm(user) {
  if (!user) return { ...emptyUserForm }
  return {
    full_name: user.full_name || user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    password: '',
    confirmPassword: '',
    role: user.role || 'admin',
    status: user.status || 'active',
  }
}

/**
 * Build create/update payload for /api/users (admin CRUD).
 * Password is optional on update — only sent when provided.
 */
export function buildUserPayload(form, { companyId, isUpdate = false } = {}) {
  const payload = {
    full_name: String(form.full_name || form.name || '').trim(),
    email: String(form.email || '').trim().toLowerCase(),
    phone: String(form.phone || '').trim(),
    role: form.role || 'admin',
    status: form.status || 'active',
  }
  const cid = companyId ?? getStoredCompanyId()
  if (cid) payload.company_id = cid

  const password = String(form.password || '').trim()
  if (password) {
    payload.password = password
    payload.password_confirmation = String(
      form.confirmPassword || form.password_confirmation || password,
    )
  } else if (!isUpdate) {
    payload.password = ''
    payload.password_confirmation = ''
  }

  return payload
}

export const userRoleOptions = [
  { value: 'owner', label: 'مالك' },
  { value: 'admin', label: 'مدير' },
  { value: 'lawyer', label: 'محامي' },
  { value: 'secretary', label: 'سكرتير' },
]

export const userStatusOptions = [
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
]
