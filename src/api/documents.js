import { apiClient, extractList, extractItem, parseApiError } from './client'
import { formatFileSize, toDateInputValue } from '../utils/formatDisplay'

export { parseApiError, formatFileSize }

const PATH = '/documents'
const CASE_DOCS_PATH = '/case-documents'

export const documentTypeOptions = [
  'عقد',
  'مذكرة دفاع',
  'محضر جلسة',
  'هوية',
  'توكيل',
  'Contract',
  'أخرى',
]

export async function fetchDocuments(params = {}) {
  const { data } = await apiClient.get(PATH, { params })
  return extractList(data)
}

export async function fetchDocument(id) {
  const { data } = await apiClient.get(`${PATH}/${id}`)
  return extractItem(data)
}

export async function createDocument(values) {
  const isFormData = values instanceof FormData
  const { data } = await apiClient.post(PATH, values, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
  return extractItem(data)
}

export async function updateDocument(id, values) {
  const isFormData = values instanceof FormData
  const { data } = await apiClient.put(`${PATH}/${id}`, values, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
  return extractItem(data)
}

export async function deleteDocument(id) {
  const { data } = await apiClient.delete(`${PATH}/${id}`)
  return data
}

export async function fetchCaseDocuments(params = {}) {
  const { data } = await apiClient.get(CASE_DOCS_PATH, { params })
  return extractList(data)
}

export async function createCaseDocument(values) {
  const isFormData = values instanceof FormData
  const { data } = await apiClient.post(CASE_DOCS_PATH, values, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  })
  return extractItem(data)
}

export async function updateCaseDocument(id, values) {
  const { data } = await apiClient.put(`${CASE_DOCS_PATH}/${id}`, values)
  return extractItem(data)
}

export async function deleteCaseDocument(id) {
  const { data } = await apiClient.delete(`${CASE_DOCS_PATH}/${id}`)
  return data
}

export function normalizeDocument(d) {
  if (!d) return null
  const legalCase = d.legal_case || d.case || null
  const user = d.user || null
  return {
    id: d.id,
    company_id: d.company_id,
    fileName: d.original_name || d.file_name || d.title || '—',
    description: d.description || d.title || '',
    sizeBytes: Number(d.file_size) || 0,
    mimeType: d.file_extension ? `application/${d.file_extension}` : '',
    docType: d.document_type || '',
    caseId: d.case_id != null ? String(d.case_id) : '',
    caseTitle: legalCase?.title ?? '',
    caseNumber: legalCase?.case_number ?? '',
    uploadedBy: user?.full_name ?? String(d.uploaded_by ?? '—'),
    uploadedAt: toDateInputValue(d.created_at),
    notes: d.notes ?? '',
    filePath: d.file_path ?? '',
    title: d.title ?? '',
    raw: d,
  }
}

export function buildDocumentFormData(form, { companyId, uploadedBy } = {}) {
  const fd = new FormData()
  if (companyId) fd.append('company_id', String(companyId))
  if (form.caseId) fd.append('case_id', String(form.caseId))
  if (uploadedBy) fd.append('uploaded_by', String(uploadedBy))
  fd.append('title', form.description || form.fileName || form.title || 'مستند')
  fd.append('description', form.description || '')
  fd.append('document_type', form.docType || 'أخرى')
  fd.append('notes', form.notes || '')
  if (form.file instanceof File) {
    fd.append('file', form.file)
  }
  return fd
}

export function calcDocumentsStats(documents = []) {
  const totalBytes = documents.reduce((sum, d) => sum + (Number(d.sizeBytes) || 0), 0)
  return {
    total: documents.length,
    withCase: documents.filter((d) => d.caseId).length,
    totalSize: formatFileSize(totalBytes),
  }
}

export function formatMimeLabel(mimeType, fileName = '') {
  if (!mimeType) {
    const ext = fileName.split('.').pop()?.toLowerCase()
    return ext || '—'
  }
  if (mimeType === 'application/pdf' || mimeType.includes('pdf')) return 'application/pdf'
  if (mimeType.startsWith('image/')) return mimeType
  if (mimeType.includes('word')) return 'doc'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'xls'
  return mimeType.split('/').pop() || mimeType
}

export function resolveDocumentFileUrl(filePath) {
  if (!filePath) return null
  const raw = String(filePath).trim()
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw

  // API stores relative paths like: uploads/documents/xxx.jpeg
  // Files are served at: https://law.elmoroj.com/public/uploads/documents/xxx.jpeg
  const path = raw.replace(/^\/+/, '').replace(/^public\//i, '')
  const origin = import.meta.env.DEV
    ? '' // Vite proxies /public → law.elmoroj.com
    : 'https://law.elmoroj.com'
  return `${origin}/public/${path}`
}

/**
 * Trigger a real file download for a document record.
 * Uses blob download when possible; falls back to opening the file URL.
 */
export async function downloadDocumentFile(doc) {
  const filePath = doc?.filePath || doc?.raw?.file_path || doc?.file_path || ''
  const url = resolveDocumentFileUrl(filePath)
  if (!url) {
    const err = new Error('رابط التحميل غير متوفر')
    err.code = 'NO_URL'
    throw err
  }

  const fileName =
    doc?.fileName ||
    doc?.original_name ||
    doc?.raw?.original_name ||
    doc?.file_name ||
    pathFileName(filePath) ||
    'document'

  try {
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    triggerAnchorDownload(objectUrl, fileName)
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500)
    return { ok: true, url }
  } catch {
    // Cross-origin / network fallback — still open the real file
    triggerAnchorDownload(url, fileName, true)
    return { ok: true, url, fallback: true }
  }
}

function pathFileName(filePath) {
  const parts = String(filePath || '').split(/[/\\]/)
  return parts[parts.length - 1] || ''
}

function triggerAnchorDownload(href, fileName, openInNewTab = false) {
  const a = document.createElement('a')
  a.href = href
  if (openInNewTab) {
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
  } else {
    a.download = fileName
  }
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export const emptyDocumentForm = {
  fileName: '',
  description: '',
  caseId: '',
  docType: '',
  notes: '',
  sizeBytes: 0,
  mimeType: '',
  file: null,
}
