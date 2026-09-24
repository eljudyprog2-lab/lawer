/**
 * Shared form/filter validation helpers.
 * API is SSOT — rules mirror common Laravel SaaS constraints used by this app.
 */

export function trimStr(value) {
  return String(value ?? '').trim()
}

export function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '')
}

export function isBlank(value) {
  return trimStr(value) === ''
}

export function isValidEmail(value) {
  const email = trimStr(value)
  if (!email) return false
  if (email.length > 255) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Phone: optional country-friendly digits, 8–15 digits (E.164-ish).
 */
export function isValidPhone(value, { required = false } = {}) {
  const raw = trimStr(value)
  if (!raw) return !required
  const digits = digitsOnly(raw)
  return digits.length >= 8 && digits.length <= 15
}

export function isValidNationalId(value, { required = false, min = 5, max = 20 } = {}) {
  const raw = trimStr(value)
  if (!raw) return !required
  return raw.length >= min && raw.length <= max
}

export function isValidPassword(value, { required = false, min = 6 } = {}) {
  const raw = String(value ?? '')
  if (!raw) return !required
  return raw.length >= min
}

export function requireText(value, { min = 1, max = 255 } = {}) {
  const text = trimStr(value)
  if (text.length < min) return false
  if (max && text.length > max) return false
  return true
}

export function isValidNumber(value, { required = false, min, max, allowDecimal = true } = {}) {
  const raw = trimStr(value)
  if (!raw) return !required
  if (allowDecimal) {
    if (!/^-?\d+(\.\d+)?$/.test(raw)) return false
  } else if (!/^-?\d+$/.test(raw)) {
    return false
  }
  const num = Number(raw)
  if (Number.isNaN(num)) return false
  if (min != null && num < min) return false
  if (max != null && num > max) return false
  return true
}

export function isValidDateOrder(from, to) {
  const a = trimStr(from)
  const b = trimStr(to)
  if (!a || !b) return true
  return a <= b
}

export function isValidRange(minValue, maxValue) {
  if (isBlank(minValue) || isBlank(maxValue)) return true
  const min = Number(minValue)
  const max = Number(maxValue)
  if (Number.isNaN(min) || Number.isNaN(max)) return false
  return min <= max
}

/**
 * Map Laravel-style field errors (`full_name`) onto UI form keys (`name`).
 */
export function mapApiFieldErrors(fieldErrors = {}, keyMap = {}) {
  const mapped = {}
  for (const [key, message] of Object.entries(fieldErrors || {})) {
    const uiKey = keyMap[key] || key
    mapped[uiKey] = Array.isArray(message) ? message[0] : String(message)
  }
  return mapped
}

export function firstError(fieldErrors = {}) {
  const values = Object.values(fieldErrors)
  return values.length ? values[0] : ''
}

export function validationResult(fieldErrors = {}) {
  const errors = Object.fromEntries(
    Object.entries(fieldErrors).filter(([, msg]) => Boolean(msg)),
  )
  if (Object.keys(errors).length) {
    return { ok: false, message: firstError(errors), fieldErrors: errors }
  }
  return { ok: true, fieldErrors: {} }
}

/** Common Arabic messages */
export const MSG = {
  required: 'هذا الحقل مطلوب',
  email: 'صيغة البريد الإلكتروني غير صحيحة',
  phone: 'رقم الجوال غير صالح (8–15 رقم)',
  nationalId: 'رقم الهوية غير صالح',
  password: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
  passwordRequired: 'كلمة المرور مطلوبة',
  maxLen: (n) => `الحد الأقصى ${n} حرف`,
  minLen: (n) => `الحد الأدنى ${n} أحرف`,
  number: 'يجب إدخال رقم صالح',
  positive: 'يجب أن يكون الرقم أكبر من صفر',
  dateOrder: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية أو يساويه',
  rangeOrder: 'الحد الأدنى يجب أن يكون أقل من أو يساوي الحد الأقصى',
}
