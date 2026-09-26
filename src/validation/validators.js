import { apiRules } from './apiRules.js'

/**
 * Reusable validation functions powered directly by apiRules.js (single source of truth).
 * All error messages are localized in Arabic according to backend constraints.
 */

export function validateField(value, rule) {
  if (!rule) return null

  const trimmed = typeof value === 'string' ? value.trim() : (value ?? '')

  // 1. Required check
  if (rule.required && (trimmed === '' || trimmed === null || trimmed === undefined)) {
    return rule.messages?.required || 'هذا الحقل مطلوب'
  }

  // If not required and empty, it is valid
  if (!rule.required && (trimmed === '' || trimmed === null || trimmed === undefined)) {
    return null
  }

  // 2. Minimum length
  if (rule.min != null && String(trimmed).length < rule.min) {
    return rule.messages?.min || `يجب أن لا يقل عن ${rule.min} أحرف`
  }

  // 3. Maximum length
  if (rule.max != null && String(trimmed).length > rule.max) {
    return rule.messages?.max || `الحد الأقصى ${rule.max} حرفاً`
  }

  // 4. Regex / pattern format
  if (rule.pattern && !rule.pattern.test(String(trimmed))) {
    return rule.messages?.invalid || 'الصيغة المدخلة غير صحيحة'
  }

  // 5. Enum / Allowed values
  if (rule.allowedValues && rule.allowedValues.length > 0) {
    if (!rule.allowedValues.includes(String(trimmed))) {
      return rule.messages?.invalid || 'القيمة المحددة غير صالحة'
    }
  }

  // 6. Types
  if (rule.type === 'integer') {
    const num = Number(trimmed)
    if (!Number.isInteger(num)) {
      return rule.messages?.invalid || 'يجب إدخال رقم صحيح'
    }
  } else if (rule.type === 'double' || rule.type === 'number') {
    const num = Number(trimmed)
    if (isNaN(num)) {
      return rule.messages?.invalid || 'يجب إدخال قيمة رقمية صحيحة'
    }
  }

  return null
}

export function validateLoginIdentifier(value) {
  return validateField(value, apiRules.login.login)
}

export function validateLoginPassword(value) {
  return validateField(value, apiRules.login.password)
}

export function validateLoginRole(value) {
  return validateField(value, apiRules.login.role)
}

export function validateLookupName(value) {
  return validateField(value, apiRules.lookups.name)
}

/** Sanitize numeric input: strip non-digits and enforce maxLength */
export function sanitizeNumeric(value, maxLength) {
  if (value == null) return ''
  const digits = String(value).replace(/\D/g, '')
  return maxLength ? digits.slice(0, maxLength) : digits
}

/** Cut text to maximum allowed length */
export function enforceMaxLength(value, maxLength) {
  if (value == null) return ''
  return maxLength ? String(value).slice(0, maxLength) : String(value)
}
