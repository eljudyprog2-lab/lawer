import { apiClient, extractList, extractItem, parseApiError } from './client'
import { formatDisplayDate, toDateInputValue } from '../utils/formatDisplay'
import {
  MSG,
  isValidDateOrder,
  requireText,
  trimStr,
  validationResult,
} from '../utils/validation'

export { parseApiError }

const PATH = '/cases'

/**
 * GET /cases?company_id=X
 */
export async function fetchCases(params = {}) {
  const { data } = await apiClient.get(PATH, { params })
  return extractList(data)
}

/**
 * GET /cases/:id
 */
export async function fetchCase(id) {
  const { data } = await apiClient.get(`${PATH}/${id}`)
  return extractItem(data)
}

/**
 * POST /cases
 * API fields (from real response inspection):
 * company_id, case_number, title, short_description, description,
 * type_id, category_id, client_id, lawyer_id,
 * opponent_name, opponent_lawyer, opponent_phone,
 * court_name, court_circuit, judge_name, court_case_number,
 * first_session_date, next_session_date, incident_date,
 * power_of_attorney_date, limitation_date, judgement_deadline,
 * required_documents, internal_notes, priority, stage, status
 */
export async function createCase(values) {
  const { data } = await apiClient.post(PATH, values)
  return extractItem(data)
}

/**
 * PUT /cases/:id
 */
export async function updateCase(id, values) {
  const { data } = await apiClient.put(`${PATH}/${id}`, values)
  return extractItem(data)
}

/**
 * DELETE /cases/:id
 */
export async function deleteCase(id) {
  const { data } = await apiClient.delete(`${PATH}/${id}`)
  return data
}

const STAGE_LABELS = Object.fromEntries(
  [
    ['investigation', 'تحقيق'],
    ['court', 'مرافعة'],
    ['judgement', 'حجز للحكم'],
    ['appeal', 'استئناف'],
    ['execution', 'تنفيذ'],
    ['closed', 'مغلقة'],
  ].map(([value, label]) => [value, label]),
)
const STAGE_VALUES = Object.fromEntries(
  Object.entries(STAGE_LABELS).map(([value, label]) => [label, value]),
)

const PRIORITY_LABELS = {
  urgent: 'عاجل',
  high: 'مرتفع',
  normal: 'عادي',
  low: 'منخفض',
}
const PRIORITY_VALUES = {
  عاجل: 'urgent',
  مرتفع: 'high',
  عالي: 'high',
  عادي: 'normal',
  منخفض: 'low',
}

const STATUS_UI = {
  active: 'نشطة',
  pending: 'قيد',
  postponed: 'مؤجل',
  closed: 'منتهي',
}
const STATUS_VALUES = {
  نشطة: 'active',
  قيد: 'pending',
  مؤجل: 'postponed',
  منتهي: 'closed',
}

export function caseStageLabel(stage) {
  return STAGE_LABELS[stage] ?? stage ?? '—'
}

/**
 * Map API case to UI shape (list, details, and legacy modal fields).
 */
export function normalizeCase(c) {
  if (!c) return null
  const status = c.status ?? 'active'
  const priority = c.priority ?? 'normal'
  const stage = c.stage ?? 'court'
  const client = c.client ?? null
  const lawyer = c.lawyer ?? null
  const typeRel = c.type ?? null
  const categoryRel = c.category ?? null

  return {
    id: c.id,
    company_id: c.company_id,
    case_number: c.case_number ?? '',
    number: c.case_number ?? '',
    title: c.title ?? '—',
    short_description: c.short_description ?? '',
    description: c.description ?? '',
    type_id: c.type_id ?? null,
    category_id: c.category_id ?? null,
    client_id: c.client_id ?? null,
    lawyer_id: c.lawyer_id ?? null,
    client,
    lawyer,
    type: typeRel,
    category: categoryRel,
    opponent_name: c.opponent_name ?? '',
    opponent_lawyer: c.opponent_lawyer ?? '',
    opponent_phone: c.opponent_phone ?? '',
    court_name: c.court_name ?? '',
    court_circuit: c.court_circuit ?? '',
    judge_name: c.judge_name ?? '',
    court_case_number: c.court_case_number ?? '',
    first_session_date: c.first_session_date ?? null,
    next_session_date: c.next_session_date ?? null,
    incident_date: c.incident_date ?? null,
    power_of_attorney_date: c.power_of_attorney_date ?? null,
    limitation_date: c.limitation_date ?? null,
    judgement_deadline: c.judgement_deadline ?? null,
    required_documents: c.required_documents ?? '',
    internal_notes: c.internal_notes ?? '',
    priority,
    stage,
    status,
    created_at: c.created_at ?? null,
    updated_at: c.updated_at ?? null,
    // Legacy / details-modal display aliases (same layout, API-backed values)
    courtName: c.court_name ?? '—',
    circuit: c.court_circuit ?? '—',
    judgeName: c.judge_name ?? '—',
    courtCaseNumber: c.court_case_number ?? '—',
    firstSession: formatDisplayDate(c.first_session_date),
    nextSession: formatDisplayDate(c.next_session_date),
    incidentDate: formatDisplayDate(c.incident_date),
    powerOfAttorneyDate: formatDisplayDate(c.power_of_attorney_date),
    limitationExpiry: formatDisplayDate(c.limitation_date),
    judgmentDeadline: formatDisplayDate(c.judgement_deadline),
    startDate: formatDisplayDate(c.first_session_date || c.created_at),
    opponent: c.opponent_name ?? '—',
    opponentLawyer: c.opponent_lawyer ?? '—',
    opponentLawyerPhone: c.opponent_phone ?? '—',
    classification: categoryRel?.name ?? '—',
    priorityLabel: PRIORITY_LABELS[priority] ?? priority,
    stageLabel: caseStageLabel(stage),
    statusLabel: caseStatusLabel(status),
    statusUi: STATUS_UI[status] ?? caseStatusLabel(status),
    clientName: client?.full_name ?? client?.name ?? '—',
    // Cases list nests lawyer without user; name may come from lawyers list later
    lawyerName:
      lawyer?.user?.full_name ??
      lawyer?.full_name ??
      lawyer?.name ??
      '—',
    typeName: typeRel?.name ?? '—',
    clientDetails: {
      name: client?.full_name ?? client?.name ?? '—',
      nationalId: client?.national_id ?? '—',
      phone: client?.phone ?? '—',
      address: client?.address ?? '—',
    },
    lawyerDetails: {
      name:
        lawyer?.user?.full_name ?? lawyer?.full_name ?? lawyer?.name ?? '—',
      phone: lawyer?.user?.phone ?? lawyer?.phone ?? '—',
      email: lawyer?.user?.email ?? lawyer?.email ?? '—',
    },
    events: Array.isArray(c.events) ? c.events : [],
    documents: Array.isArray(c.documents) ? c.documents : [],
  }
}

export const emptyCaseForm = {
  number: '',
  title: '',
  type: '',
  status: 'نشطة',
  courtName: '',
  circuit: '',
  judgeName: '',
  courtCaseNumber: '',
  firstSession: '',
  nextSession: '',
  client: '',
  lawyer: '',
  opponent: '',
  opponentLawyer: '',
  opponentLawyerPhone: '',
  description: '',
  internalNotes: '',
  requiredDocuments: '',
  incidentDate: '',
  powerOfAttorneyDate: '',
  limitationExpiry: '',
  judgmentDeadline: '',
  priority: 'عادي',
  classification: '',
  stage: 'مرافعة',
}

/** Map API case → add/edit form state. */
export function caseToForm(caseItem) {
  const c = caseItem?.case_number != null ? caseItem : normalizeCase(caseItem)
  if (!c) return { ...emptyCaseForm }
  return {
    number: c.case_number ?? '',
    title: c.title === '—' ? '' : c.title ?? '',
    type: c.type_id != null ? String(c.type_id) : '',
    status: STATUS_UI[c.status] ?? c.statusUi ?? 'نشطة',
    courtName: c.court_name ?? '',
    circuit: c.court_circuit ?? '',
    judgeName: c.judge_name ?? '',
    courtCaseNumber: c.court_case_number ?? '',
    firstSession: toDateInputValue(c.first_session_date),
    nextSession: toDateInputValue(c.next_session_date),
    client: c.client_id != null ? String(c.client_id) : '',
    lawyer: c.lawyer_id != null ? String(c.lawyer_id) : '',
    opponent: c.opponent_name ?? '',
    opponentLawyer: c.opponent_lawyer ?? '',
    opponentLawyerPhone: c.opponent_phone ?? '',
    description: c.description === '—' ? '' : c.description ?? '',
    internalNotes: c.internal_notes ?? '',
    requiredDocuments: c.required_documents ?? '',
    incidentDate: toDateInputValue(c.incident_date),
    powerOfAttorneyDate: toDateInputValue(c.power_of_attorney_date),
    limitationExpiry: toDateInputValue(c.limitation_date),
    judgmentDeadline: toDateInputValue(c.judgement_deadline),
    priority: PRIORITY_LABELS[c.priority] ?? 'عادي',
    classification: c.category_id != null ? String(c.category_id) : '',
    stage: caseStageLabel(c.stage) === '—' ? 'مرافعة' : caseStageLabel(c.stage),
  }
}

/** Map form state → POST/PUT payload (real API field names). */
export function buildCasePayload(form, { companyId } = {}) {
  const title = form.title?.trim() || ''
  const description = form.description?.trim() || ''
  const payload = {
    case_number: form.number?.trim() || '',
    title,
    short_description: form.shortDescription?.trim() || title.slice(0, 120) || '',
    description,
    type_id: form.type ? Number(form.type) || form.type : null,
    category_id: form.classification ? Number(form.classification) || form.classification : null,
    client_id: form.client ? Number(form.client) || form.client : null,
    lawyer_id: form.lawyer ? Number(form.lawyer) || form.lawyer : null,
    opponent_name: form.opponent?.trim() || '',
    opponent_lawyer: form.opponentLawyer?.trim() || '',
    opponent_phone: form.opponentLawyerPhone?.trim() || '',
    court_name: form.courtName?.trim() || '',
    court_circuit: form.circuit?.trim() || '',
    judge_name: form.judgeName?.trim() || '',
    court_case_number: form.courtCaseNumber?.trim() || '',
    first_session_date: form.firstSession || null,
    next_session_date: form.nextSession || null,
    incident_date: form.incidentDate || null,
    power_of_attorney_date: form.powerOfAttorneyDate || null,
    limitation_date: form.limitationExpiry || null,
    judgement_deadline: form.judgmentDeadline || null,
    required_documents: form.requiredDocuments?.trim() || '',
    internal_notes: form.internalNotes?.trim() || '',
    priority: PRIORITY_VALUES[form.priority] || form.priority || 'normal',
    stage: STAGE_VALUES[form.stage] || form.stage || 'court',
    status: STATUS_VALUES[form.status] || form.status || 'active',
  }
  const cid = companyId ?? null
  if (cid != null) payload.company_id = cid
  return payload
}

export const casePriorityOptions = [
  { value: 'urgent', label: 'عاجل' },
  { value: 'high', label: 'مرتفع' },
  { value: 'normal', label: 'عادي' },
  { value: 'low', label: 'منخفض' },
]

export const caseStageOptions = [
  { value: 'investigation', label: 'تحقيق' },
  { value: 'court', label: 'مرافعة' },
  { value: 'judgement', label: 'حجز للحكم' },
  { value: 'appeal', label: 'استئناف' },
  { value: 'execution', label: 'تنفيذ' },
  { value: 'closed', label: 'مغلقة' },
]

export const caseStatusOptions = [
  { value: 'active', label: 'نشطة' },
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'postponed', label: 'مؤجل' },
  { value: 'closed', label: 'منتهي' },
]

export function caseStatusLabel(status) {
  const map = {
    active: 'نشطة',
    pending: 'قيد',
    postponed: 'مؤجل',
    closed: 'منتهي',
  }
  return map[status] ?? status ?? '—'
}

export function casePriorityLabel(priority) {
  return PRIORITY_LABELS[priority] ?? priority ?? '—'
}

/** UI status labels for add-case form (unchanged copy). */
export const caseStatusUiOptions = ['نشطة', 'قيد', 'مؤجل', 'منتهي']

export const casePriorityUiOptions = ['عاجل', 'مرتفع', 'عالي', 'عادي', 'منخفض']

export const caseStageUiOptions = [
  'تحقيق',
  'مرافعة',
  'حجز للحكم',
  'استئناف',
  'تنفيذ',
  'مغلقة',
]

export const caseEventTypeOptions = [
  'جلسة محكمة',
  'اجتماع',
  'استشارة',
  'مذكرة',
  'حكم',
  'إجراء إداري',
]

export const caseEventImportanceOptions = ['عاجل', 'مرتفع', 'عادي', 'منخفض']

/** Validate add/edit case form before POST/PUT. */
export function validateCaseForm(form) {
  const fieldErrors = {}
  const number = trimStr(form.number)
  const title = trimStr(form.title)
  const courtName = trimStr(form.courtName)

  if (!requireText(number, { min: 1, max: 100 })) {
    fieldErrors.number = 'رقم القضية مطلوب'
  }
  if (!requireText(title, { min: 2, max: 255 })) {
    fieldErrors.title = title ? MSG.minLen(2) : 'عنوان القضية مطلوب'
  }
  if (!form.type) fieldErrors.type = 'نوع القضية مطلوب'
  if (!form.client) fieldErrors.client = 'الموكل مطلوب'
  if (!form.lawyer) fieldErrors.lawyer = 'المحامي مطلوب'
  if (!requireText(courtName, { min: 2, max: 255 })) {
    fieldErrors.courtName = courtName ? MSG.minLen(2) : 'اسم المحكمة مطلوب'
  }
  if (!isValidDateOrder(form.firstSession, form.nextSession)) {
    fieldErrors.nextSession = MSG.dateOrder
  }
  if (!isValidDateOrder(form.incidentDate, form.powerOfAttorneyDate)) {
    fieldErrors.powerOfAttorneyDate = MSG.dateOrder
  }

  return validationResult(fieldErrors)
}
