import axios from 'axios'

/**
 * Shared Axios client for the Laravel SaaS API.
 * No authentication required — uses company_id as context.
 * Dev: Vite proxy (`/api` → law.elmoroj.com)
 * Prod: absolute API origin
 */
export const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : 'https://law.elmoroj.com/api'

const AUTH_KEY = 'doussary_auth'

/** Read stored company_id from session */
export function getStoredCompanyId() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    return session?.company_id ?? null
  } catch {
    return null
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
  },
})

/**
 * Request interceptor: automatically inject company_id into
 * GET params and POST/PUT/PATCH JSON bodies for tenant-scoped endpoints.
 */
apiClient.interceptors.request.use((config) => {
  const companyId = getStoredCompanyId()
  if (companyId) {
    if (!config.params) config.params = {}
    if (!config.params.company_id) {
      config.params.company_id = companyId
    }
    const method = String(config.method || 'get').toLowerCase()
    if (['post', 'put', 'patch'].includes(method) && config.data) {
      if (typeof config.data === 'object' && !(config.data instanceof FormData)) {
        if (config.data.company_id == null) {
          config.data = { ...config.data, company_id: companyId }
        }
      }
    }
  }
  return config
})

/**
 * Response interceptor: handle common HTTP errors.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401 || status === 403) {
      // Clear session on auth error
      localStorage.removeItem(AUTH_KEY)
      window.location.href = `${import.meta.env.BASE_URL}login`
    }
    return Promise.reject(error)
  },
)

/**
 * Normalize Laravel / Axios errors into a UI-friendly shape.
 */
export function parseApiError(error) {
  const data = error?.response?.data
  const fieldErrors = {}

  if (data?.errors && typeof data.errors === 'object') {
    for (const [key, value] of Object.entries(data.errors)) {
      fieldErrors[key] = Array.isArray(value) ? value[0] : String(value)
    }
  }

  if (!data) {
    const isNetwork = error?.message === 'Network Error' || !error?.response
    return {
      message: isNetwork
        ? 'تعذر الاتصال بالخادم. تحقق من الاتصال بالإنترنت ثم حاول مرة أخرى.'
        : 'حدث خطأ غير متوقع. حاول مرة أخرى.',
      fieldErrors,
      status: error?.response?.status,
    }
  }

  const status = error?.response?.status
  let message =
    data.message ||
    Object.values(fieldErrors)[0] ||
    'تعذر إكمال العملية. راجع البيانات المدخلة.'

  if (status === 422) {
    if (Object.keys(fieldErrors).length > 0) {
      message = Object.values(fieldErrors).join(' ')
    } else if (!data.message) {
      message = 'البيانات المدخلة غير صالحة. راجع الحقول المطلوبة وحاول مرة أخرى.'
    }
  } else if (status === 409) {
    message =
      data.message ||
      'تعارض في البيانات — قد يكون السجل موجوداً مسبقاً أو مرتبطاً بسجلات أخرى.'
  } else if (status === 500 && /SQLSTATE.*1366|Incorrect string value/i.test(message)) {
    message =
      'خطأ في قاعدة بيانات الخادم: جدول المستخدمين لا يدعم الحروف العربية في الاسم حالياً (SQL 1366). يُرجى إدخال الاسم بأحرف لاتينية مؤقتاً لحين تعديل ترميز الجدول على الخادم.'
  }

  return { message, fieldErrors, status }
}

/** Extract list from API response { status: true, data: [...] } */
export function extractList(data) {
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data)) return data
  return []
}

/** Extract single item from API response { status: true, data: {...} } */
export function extractItem(data) {
  return data?.data ?? data ?? null
}
