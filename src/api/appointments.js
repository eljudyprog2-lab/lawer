import { apiClient, extractList, extractItem, parseApiError } from './client'
import { toDateInputValue, toTimeInputValue } from '../utils/formatDisplay'
import { MSG, trimStr, validationResult } from '../utils/validation'

export { parseApiError }

const PATH = '/appointments'

export const appointmentTypeOptions = ['استشارة', 'اجتماع', 'أخرى']
export const appointmentStatusOptions = ['مؤكد', 'معلق', 'قيد الانتظار', 'ملغي', 'غير معين']

export async function fetchAppointments(params = {}) {
  const { data } = await apiClient.get(PATH, { params })
  return extractList(data)
}

export async function fetchAppointment(id) {
  const { data } = await apiClient.get(`${PATH}/${id}`)
  return extractItem(data)
}

export async function createAppointment(values) {
  const { data } = await apiClient.post(PATH, values)
  return extractItem(data)
}

export async function updateAppointment(id, values) {
  const { data } = await apiClient.put(`${PATH}/${id}`, values)
  return extractItem(data)
}

export async function deleteAppointment(id) {
  const { data } = await apiClient.delete(`${PATH}/${id}`)
  return data
}

export function normalizeAppointment(a) {
  if (!a) return null
  const client = a.client || null
  const lawyer = a.lawyer || null
  const legalCase = a.legal_case || a.case || null
  return {
    id: a.id,
    company_id: a.company_id,
    date: toDateInputValue(a.appointment_date),
    time: toTimeInputValue(a.appointment_time),
    type: a.appointment_type ?? 'استشارة',
    clientId: a.client_id != null ? String(a.client_id) : '',
    clientName: client?.full_name ?? '—',
    clientPhone: client?.phone ?? '',
    lawyerId: a.lawyer_id != null ? String(a.lawyer_id) : '',
    lawyerName: lawyer?.user?.full_name ?? lawyer?.full_name ?? '',
    caseId: a.case_id != null ? String(a.case_id) : '',
    caseTitle: legalCase?.title ?? '',
    notes: a.notes ?? '',
    status: a.status ?? 'غير معين',
    raw: a,
  }
}

export function buildAppointmentPayload(form, { companyId } = {}) {
  const payload = {
    client_id: form.clientId ? Number(form.clientId) || form.clientId : null,
    lawyer_id: form.lawyerId ? Number(form.lawyerId) || form.lawyerId : null,
    case_id: form.caseId ? Number(form.caseId) || form.caseId : null,
    appointment_date: form.date,
    appointment_time: form.time?.length === 5 ? `${form.time}:00` : form.time,
    appointment_type: form.type || 'استشارة',
    notes: form.notes?.trim?.() ?? form.notes ?? '',
    status: form.status || undefined,
  }
  if (companyId) payload.company_id = companyId
  return payload
}

export const emptyAppointmentForm = {
  date: '',
  time: '',
  lawyerId: '',
  clientId: '',
  caseId: '',
  type: 'استشارة',
  notes: '',
}

/** Validate appointment booking form before save. */
export function validateAppointmentForm(form, { requireClient = true } = {}) {
  const fieldErrors = {}
  if (!trimStr(form.date)) fieldErrors.date = MSG.required
  if (!trimStr(form.time)) fieldErrors.time = MSG.required
  if (requireClient && !form.clientId) fieldErrors.clientId = 'الموكل مطلوب'
  return validationResult(fieldErrors)
}

export function appointmentToForm(appointment) {
  if (!appointment) return emptyAppointmentForm
  return {
    date: appointment.date || '',
    time: appointment.time || '',
    lawyerId: appointment.lawyerId || '',
    clientId: appointment.clientId || '',
    caseId: appointment.caseId || '',
    type: appointment.type || 'استشارة',
    notes: appointment.notes || '',
  }
}
