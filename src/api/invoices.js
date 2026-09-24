import { apiClient, extractList, extractItem, parseApiError } from './client'
import { formatMoney, formatDisplayDate, toDateInputValue } from '../utils/formatDisplay'
import {
  MSG,
  isValidDateOrder,
  isValidNumber,
  requireText,
  trimStr,
  validationResult,
} from '../utils/validation'

export { parseApiError, formatMoney }

export function formatInvoiceDate(date) {
  return formatDisplayDate(date)
}

const PATH = '/invoices'
const ITEMS_PATH = '/invoice-items'

export const invoiceStatusOptions = [
  { value: 'paid', label: 'مدفوعة' },
  { value: 'partial', label: 'مدفوعة جزئياً' },
  { value: 'unpaid', label: 'غير مدفوعة' },
  { value: 'cancelled', label: 'ملغاة' },
]

export const paymentMethodOptions = [
  { value: 'cash', label: 'نقدي' },
  { value: 'check', label: 'شيك' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
  { value: 'card', label: 'بطاقة' },
]

const STATUS_LABELS = Object.fromEntries(invoiceStatusOptions.map((o) => [o.value, o.label]))
const STATUS_VALUES = Object.fromEntries(invoiceStatusOptions.map((o) => [o.label, o.value]))
const METHOD_LABELS = Object.fromEntries(paymentMethodOptions.map((o) => [o.value, o.label]))
const METHOD_VALUES = Object.fromEntries(paymentMethodOptions.map((o) => [o.label, o.value]))

export function invoiceStatusLabel(status) {
  return STATUS_LABELS[status] || status || '—'
}

export function paymentMethodLabel(method) {
  return METHOD_LABELS[method] || method || '—'
}

export async function fetchInvoices(params = {}) {
  const { data } = await apiClient.get(PATH, { params })
  return extractList(data)
}

export async function fetchInvoice(id) {
  const { data } = await apiClient.get(`${PATH}/${id}`)
  return extractItem(data)
}

/**
 * GET /invoices/payments-dashboard — KPI endpoint.
 */
export async function fetchInvoiceDashboard(params = {}) {
  try {
    const { data } = await apiClient.get(`${PATH}/payments-dashboard`, { params })
    return data?.data ?? data ?? null
  } catch (err) {
    const status = err?.response?.status
    // Endpoint missing (404) or unavailable — fall back to list-derived KPIs.
    if (status === 404 || status === 405) return null
    throw err
  }
}

export async function createInvoice(values) {
  const { data } = await apiClient.post(PATH, values)
  return extractItem(data)
}

export async function updateInvoice(id, values) {
  const { data } = await apiClient.put(`${PATH}/${id}`, values)
  return extractItem(data)
}

export async function deleteInvoice(id) {
  const { data } = await apiClient.delete(`${PATH}/${id}`)
  return data
}

export async function fetchInvoiceItems(params = {}) {
  const { data } = await apiClient.get(ITEMS_PATH, { params })
  return extractList(data)
}

export async function createInvoiceItem(values) {
  const { data } = await apiClient.post(ITEMS_PATH, values)
  return extractItem(data)
}

export async function updateInvoiceItem(id, values) {
  const { data } = await apiClient.put(`${ITEMS_PATH}/${id}`, values)
  return extractItem(data)
}

export async function deleteInvoiceItem(id) {
  const { data } = await apiClient.delete(`${ITEMS_PATH}/${id}`)
  return data
}

export function normalizeInvoice(inv) {
  if (!inv) return null
  const client = inv.client || null
  const legalCase = inv.legal_case || inv.case || null
  const total = Number(inv.total_amount ?? inv.total ?? 0)
  const paid = Number(inv.paid_amount ?? inv.paid ?? 0)
  const remainingAmount =
    inv.remaining_amount != null
      ? Number(inv.remaining_amount)
      : Math.max(0, total - paid)
  return {
    id: inv.id,
    company_id: inv.company_id,
    number: inv.invoice_number ?? '',
    issueDate: toDateInputValue(inv.issue_date),
    dueDate: toDateInputValue(inv.due_date),
    clientId: inv.client_id != null ? String(inv.client_id) : '',
    clientName: client?.full_name ?? '—',
    caseId: inv.case_id != null ? String(inv.case_id) : '',
    caseTitle: legalCase?.title ?? '',
    description: inv.description ?? '',
    total,
    paid,
    remaining: remainingAmount,
    status: invoiceStatusLabel(inv.status),
    statusRaw: inv.status ?? 'unpaid',
    paymentMethod: paymentMethodLabel(inv.payment_method),
    paymentMethodRaw: inv.payment_method ?? '',
    notes: inv.notes ?? '',
    items: inv.items || [],
    payments: inv.payments || [],
    raw: inv,
  }
}

export function remaining(invoice) {
  if (!invoice) return 0
  if (invoice.remaining != null) return Number(invoice.remaining)
  return Math.max(0, Number(invoice.total || 0) - Number(invoice.paid || 0))
}

export function buildInvoicePayload(form, { companyId } = {}) {
  const payload = {
    invoice_number: form.number || undefined,
    client_id: form.clientId ? Number(form.clientId) || form.clientId : null,
    case_id: form.caseId ? Number(form.caseId) || form.caseId : null,
    issue_date: form.issueDate,
    due_date: form.dueDate || null,
    description: form.description?.trim?.() ?? form.description ?? '',
    total_amount: Number(form.total) || 0,
    paid_amount: Number(form.paid) || 0,
    status: STATUS_VALUES[form.status] || form.statusRaw || form.status || 'unpaid',
    payment_method:
      METHOD_VALUES[form.paymentMethod] || form.paymentMethodRaw || form.paymentMethod || null,
    notes: form.notes?.trim?.() ?? form.notes ?? '',
  }
  if (companyId) payload.company_id = companyId
  return payload
}

export function deriveStatus(total, paid) {
  const t = Number(total) || 0
  const p = Number(paid) || 0
  if (p <= 0) return 'غير مدفوعة'
  if (p >= t) return 'مدفوعة'
  return 'مدفوعة جزئياً'
}

export function deriveStatusValue(total, paid) {
  return STATUS_VALUES[deriveStatus(total, paid)] || 'unpaid'
}

export function generateInvoiceNumber() {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `INV-${stamp}-${rand}`
}

export function calcInvoiceStats(invoices = []) {
  const list = Array.isArray(invoices) ? invoices : []
  const total = list.reduce((sum, i) => sum + Number(i.total || 0), 0)
  const paid = list.reduce((sum, i) => sum + Number(i.paid || 0), 0)
  const due = list.reduce((sum, i) => sum + remaining(i), 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdue = list.filter((item) => {
    if (remaining(item) <= 0 || item.status === 'ملغاة' || item.statusRaw === 'cancelled') {
      return false
    }
    if (!item.dueDate) return false
    const dueDate = new Date(`${item.dueDate}T00:00:00`)
    return !Number.isNaN(dueDate.getTime()) && dueDate < today
  }).length
  return {
    count: list.length,
    total,
    paid,
    collected: paid,
    due,
    overdue,
    unpaid: list.filter((i) => i.statusRaw === 'unpaid' || i.status === 'غير مدفوعة').length,
  }
}

export function mapInvoiceDashboardStats(dash) {
  if (!dash || typeof dash !== 'object') return null
  const total = Number(
    dash.total_invoices ?? dash.total_amount ?? dash.total ?? dash.invoices_total ?? 0,
  )
  const collected = Number(
    dash.collected ?? dash.paid_amount ?? dash.paid ?? dash.collected_amount ?? 0,
  )
  const due = Number(dash.due ?? dash.outstanding ?? dash.remaining ?? 0)
  const overdue = Number(dash.overdue ?? dash.overdue_count ?? dash.overdue_invoices ?? 0)
  if (!total && !collected && !due && !overdue) return null
  return { total, collected, due, overdue }
}

export const emptyInvoiceForm = {
  number: '',
  issueDate: '',
  dueDate: '',
  clientId: '',
  caseId: '',
  description: '',
  total: '',
  paid: '',
  status: 'غير مدفوعة',
  items: [],
  paymentMethod: '',
  notes: '',
}

export const emptyPaymentForm = {
  amount: '',
  date: '',
  method: 'نقدي',
  reference: '',
  notes: '',
  receiptName: '',
}

/** Validate invoice create/edit form before save. */
export function validateInvoiceForm(form) {
  const fieldErrors = {}
  if (!form.clientId) fieldErrors.clientId = 'الموكل مطلوب'
  const description = trimStr(form.description)
  if (!requireText(description, { min: 2, max: 2000 })) {
    fieldErrors.description = description ? MSG.minLen(2) : 'وصف الفاتورة مطلوب'
  }
  if (!isValidNumber(form.total, { required: true, min: 0 })) {
    fieldErrors.total = trimStr(form.total) ? MSG.number : 'المبلغ الإجمالي مطلوب'
  }
  if (!isValidNumber(form.paid, { required: false, min: 0 })) {
    fieldErrors.paid = MSG.number
  } else if (
    isValidNumber(form.total, { required: false, min: 0 }) &&
    Number(form.paid) > Number(form.total)
  ) {
    fieldErrors.paid = 'المبلغ المدفوع لا يمكن أن يتجاوز الإجمالي'
  }
  if (!trimStr(form.issueDate)) fieldErrors.issueDate = MSG.required
  if (!isValidDateOrder(form.issueDate, form.dueDate)) {
    fieldErrors.dueDate = MSG.dateOrder
  }
  return validationResult(fieldErrors)
}

export function invoiceToForm(invoice) {
  if (!invoice) return emptyInvoiceForm
  return {
    number: invoice.number || '',
    issueDate: invoice.issueDate || '',
    dueDate: invoice.dueDate || '',
    clientId: invoice.clientId || '',
    caseId: invoice.caseId || '',
    description: invoice.description || '',
    total: invoice.total != null ? String(invoice.total) : '',
    paid: invoice.paid != null ? String(invoice.paid) : '',
    status: invoice.status || 'غير مدفوعة',
    items: invoice.items || [],
    paymentMethod: invoice.paymentMethod || '',
    notes: invoice.notes || '',
  }
}
