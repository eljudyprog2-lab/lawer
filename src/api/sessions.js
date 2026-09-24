import { apiClient, extractList, extractItem, parseApiError } from './client'
import { toDateInputValue, toTimeInputValue } from '../utils/formatDisplay'
import { MSG, requireText, trimStr, validationResult } from '../utils/validation'

export { parseApiError }

const PATH = '/court-sessions'

export const sessionTypeOptions = [
  { value: 'hearing', label: 'جلسة استماع' },
  { value: 'pleading', label: 'مرافعة' },
  { value: 'judgment_reserved', label: 'حجز للحكم' },
  { value: 'verdict', label: 'نطق بالحكم' },
]

export const sessionStatusOptions = ['مجدولة', 'مؤجلة', 'منتهية', 'ملغاة']
export const sessionDecisionOptions = ['معلقة', 'تأجيل', 'حكم', 'شطب', 'تم التأجيل']
export const sessionImportanceOptions = [
  { value: 'normal', label: 'عادية' },
  { value: 'high', label: 'مهمة' },
  { value: 'urgent', label: 'عاجلة' },
]

const TYPE_LABELS = Object.fromEntries(sessionTypeOptions.map((o) => [o.value, o.label]))
const TYPE_VALUES = Object.fromEntries(sessionTypeOptions.map((o) => [o.label, o.value]))
const IMPORTANCE_LABELS = Object.fromEntries(
  sessionImportanceOptions.map((o) => [o.value, o.label]),
)
const IMPORTANCE_VALUES = Object.fromEntries(
  sessionImportanceOptions.map((o) => [o.label, o.value]),
)

export function sessionTypeLabel(value) {
  return TYPE_LABELS[value] || value || '—'
}

export function sessionImportanceLabel(value) {
  return IMPORTANCE_LABELS[value] || value || '—'
}

export async function fetchSessions(params = {}) {
  const { data } = await apiClient.get(PATH, { params })
  return extractList(data)
}

export async function fetchSession(id) {
  const { data } = await apiClient.get(`${PATH}/${id}`)
  return extractItem(data)
}

export async function createSession(values) {
  const { data } = await apiClient.post(PATH, values)
  return extractItem(data)
}

export async function updateSession(id, values) {
  const { data } = await apiClient.put(`${PATH}/${id}`, values)
  return extractItem(data)
}

export async function deleteSession(id) {
  const { data } = await apiClient.delete(`${PATH}/${id}`)
  return data
}

export async function updateSessionStatus(id, status) {
  const values = typeof status === 'object' && status !== null ? status : { status }
  const { data } = await apiClient.put(`${PATH}/${id}/change-status`, values)
  return extractItem(data)
}

export async function fetchSessionKpis(params = {}) {
  try {
    const { data } = await apiClient.get(`${PATH}/statistics`, { params })
    return data?.data ?? data ?? null
  } catch {
    return null
  }
}

export async function fetchSessionCalendar({ month, year, ...params } = {}) {
  try {
    const { data } = await apiClient.get(`${PATH}/calendar`, {
      params: { month, year, ...params },
    })
    return data?.data ?? data ?? []
  } catch {
    return []
  }
}

/**
 * Map API court-session → UI shape used by SessionsPage / modals.
 */
export function normalizeSession(s) {
  if (!s) return null
  const legalCase = s.legal_case || s.case || null
  const lawyer = s.lawyer || legalCase?.lawyer || null
  const date = toDateInputValue(s.session_date)
  const time = toTimeInputValue(s.session_time)
  return {
    id: s.id,
    company_id: s.company_id,
    sessionNumber: String(s.session_number ?? ''),
    caseId: s.case_id != null ? String(s.case_id) : '',
    caseTitle: legalCase?.title ?? '—',
    caseNumber: legalCase?.case_number ?? '',
    court: s.court_name ?? '',
    circuit: s.court_circuit ?? '',
    judge: s.judge_name ?? '',
    hall: s.courtroom ?? '',
    courtAddress: s.court_address ?? '',
    date,
    time,
    type: sessionTypeLabel(s.session_type),
    typeRaw: s.session_type ?? 'hearing',
    decision: s.result ?? '',
    status: s.status ?? 'مجدولة',
    importance: sessionImportanceLabel(s.importance),
    importanceRaw: s.importance ?? 'normal',
    notes: s.notes ?? '',
    lawyerId: lawyer?.id != null ? String(lawyer.id) : legalCase?.lawyer_id != null ? String(legalCase.lawyer_id) : '',
    lawyerName: lawyer?.user?.full_name ?? lawyer?.full_name ?? '',
    postponeReason: '',
    nextSessionDate: toDateInputValue(s.next_session_date),
    raw: s,
  }
}

/** Build API payload from UI form values. */
export function buildSessionPayload(form, { companyId } = {}) {
  const payload = {
    case_id: Number(form.caseId) || form.caseId,
    session_number: Number(form.sessionNumber) || form.sessionNumber || undefined,
    session_date: form.date,
    session_time: form.time ? `${form.time}:00`.replace(/:00:00$/, ':00') : undefined,
    session_type: TYPE_VALUES[form.type] || form.typeRaw || form.type || 'hearing',
    court_name: form.court?.trim?.() ?? form.court ?? '',
    court_circuit: form.circuit?.trim?.() ?? form.circuit ?? '',
    judge_name: form.judge?.trim?.() ?? form.judge ?? '',
    courtroom: form.hall?.trim?.() ?? form.hall ?? '',
    court_address: form.courtAddress?.trim?.() ?? form.courtAddress ?? '',
    importance: IMPORTANCE_VALUES[form.importance] || form.importanceRaw || form.importance || 'normal',
    notes: form.notes?.trim?.() ?? form.notes ?? '',
    result: form.decision?.trim?.() ?? form.decision ?? '',
    status: form.status || 'مجدولة',
  }
  if (form.nextSessionDate) payload.next_session_date = form.nextSessionDate
  if (companyId) payload.company_id = companyId
  // Normalize time to HH:mm:ss
  if (form.time && form.time.length === 5) payload.session_time = `${form.time}:00`
  return payload
}

export function calcSessionStats(sessions = []) {
  const todayKey = new Date().toISOString().slice(0, 10)
  return {
    total: sessions.length,
    upcoming: sessions.filter((item) => item.date > todayKey && item.status === 'مجدولة').length,
    today: sessions.filter((item) => item.date === todayKey).length,
    postponed: sessions.filter((item) => item.status === 'مؤجلة').length,
  }
}

export const emptySessionForm = {
  caseId: '',
  sessionNumber: '',
  date: '',
  time: '',
  type: 'جلسة استماع',
  court: '',
  circuit: '',
  judge: '',
  hall: '',
  courtAddress: '',
  notes: '',
  importance: 'عادية',
  status: 'مجدولة',
  decision: 'معلقة',
  lawyerId: '',
}

/** Validate session create/edit form before save. */
export function validateSessionForm(form) {
  const fieldErrors = {}
  if (!form.caseId) fieldErrors.caseId = 'القضية مطلوبة'
  if (!trimStr(form.date)) fieldErrors.date = MSG.required
  const court = trimStr(form.court)
  if (!requireText(court, { min: 2, max: 255 })) {
    fieldErrors.court = court ? MSG.minLen(2) : 'اسم المحكمة مطلوب'
  }
  return validationResult(fieldErrors)
}

export function sessionToForm(session) {
  if (!session) return emptySessionForm
  return {
    caseId: session.caseId || '',
    sessionNumber: session.sessionNumber || '',
    date: session.date || '',
    time: session.time || '',
    type: session.type || 'جلسة استماع',
    court: session.court || '',
    circuit: session.circuit || '',
    judge: session.judge || '',
    hall: session.hall || '',
    courtAddress: session.courtAddress || '',
    notes: session.notes || '',
    importance: session.importance || 'عادية',
    status: session.status || 'مجدولة',
    decision: session.decision || 'معلقة',
    lawyerId: session.lawyerId || '',
  }
}
