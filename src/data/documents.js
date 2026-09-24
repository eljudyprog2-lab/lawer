import { documentTypeOptions } from './cases'

export { documentTypeOptions }

export const emptyDocumentForm = {
  fileName: '',
  description: '',
  caseId: '',
  docType: '',
  notes: '',
  sizeBytes: 0,
  mimeType: '',
}

const caseOptionsFromCases = [
  { id: '1', title: 'قضية تعويض عن حادث مروري', number: '2025/123' },
  { id: '2', title: 'قضية انتحال شخصية', number: '45455/2026' },
  { id: '3', title: 'ميراث جديد', number: '56546/2026' },
  { id: '4', title: 'نزاع تجاري', number: '42342/2026' },
  { id: '5', title: 'قضية ميراث', number: '87654/2026' },
  { id: '7', title: 'قضية نصب واحتيال', number: '456435/423' },
]

export const documentCaseOptions = caseOptionsFromCases

export const initialDocuments = [
  {
    id: '1',
    fileName: '1920w light.png',
    description: 'عقد إيجار',
    sizeBytes: 145459,
    mimeType: 'image/png',
    docType: 'عقد',
    caseId: '1',
    caseTitle: 'قضية تعويض عن حادث مروري',
    caseNumber: '2025/123',
    uploadedBy: 'د. سارة أحمد محمود',
    uploadedAt: '2025/09/14',
    notes: 'مرفق عقد الإيجار الأصلي',
  },
  {
    id: '2',
    fileName: 'n.jpg_175819886...',
    description: 'عقد ايجار',
    sizeBytes: 350259,
    mimeType: 'image/jpeg',
    docType: 'عقد',
    caseId: '1',
    caseTitle: 'قضية تعويض عن حادث مروري',
    caseNumber: '2025/123',
    uploadedBy: 'محمد اشرف',
    uploadedAt: '2025/09/17',
    notes: '',
  },
  {
    id: '3',
    fileName: 'defense-memo.docx',
    description: 'مذكرة دفاع',
    sizeBytes: 2139095,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    docType: 'مذكرة دفاع',
    caseId: '1',
    caseTitle: 'سرقة',
    caseNumber: '54654/2026',
    uploadedBy: 'أحمد يوسف علي',
    uploadedAt: '2026/02/10',
    notes: '',
  },
  {
    id: '4',
    fileName: 'session-minutes.pdf',
    description: 'محضر الجلسة',
    sizeBytes: 892416,
    mimeType: 'application/pdf',
    docType: 'محضر جلسة',
    caseId: '4',
    caseTitle: 'نزاع تجاري',
    caseNumber: '42342/2026',
    uploadedBy: 'سارة محمود',
    uploadedAt: '2026/01/22',
    notes: 'محضر الجلسة الأولى',
  },
  {
    id: '5',
    fileName: 'id-scan.png',
    description: 'صورة البطاقة',
    sizeBytes: 512000,
    mimeType: 'image/png',
    docType: 'هوية',
    caseId: '',
    caseTitle: '',
    caseNumber: '',
    uploadedBy: 'مدير النظام',
    uploadedAt: '2026/03/01',
    notes: '',
  },
  {
    id: '6',
    fileName: 'power-of-attorney.pdf',
    description: 'توكيل رسمي',
    sizeBytes: 1048576,
    mimeType: 'application/pdf',
    docType: 'توكيل',
    caseId: '3',
    caseTitle: 'ميراث جديد',
    caseNumber: '56546/2026',
    uploadedBy: 'عمر حسن',
    uploadedAt: '2025/12/05',
    notes: 'توكيل موثق',
  },
  {
    id: '7',
    fileName: 'judgment.pdf',
    description: 'صورة الحكم',
    sizeBytes: 734003,
    mimeType: 'application/pdf',
    docType: 'حكم',
    caseId: '2',
    caseTitle: 'قضية انتحال شخصية',
    caseNumber: '45455/2026',
    uploadedBy: 'سارة محمود',
    uploadedAt: '2025/11/14',
    notes: '',
  },
  {
    id: '8',
    fileName: 'invoice-scan.xlsx',
    description: 'كشف حساب',
    sizeBytes: 245760,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    docType: 'أخرى',
    caseId: '',
    caseTitle: '',
    caseNumber: '',
    uploadedBy: 'مدير النظام',
    uploadedAt: '2026/02/28',
    notes: 'مستند إداري غير مرتبط بقضية',
  },
]

export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function formatMimeLabel(mimeType, fileName = '') {
  if (!mimeType) {
    const ext = fileName.split('.').pop()?.toLowerCase()
    return ext || '—'
  }
  if (mimeType === 'application/pdf') return 'application/pdf'
  if (mimeType.startsWith('image/')) return mimeType
  if (mimeType.includes('word')) return 'doc'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'xls'
  return mimeType.split('/').pop() || mimeType
}

export function createDocumentFromForm(form, caseOptions = documentCaseOptions) {
  const linked = caseOptions.find((item) => item.id === form.caseId)
  const today = new Date()
  const uploadedAt = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`

  return {
    id: String(Date.now()),
    fileName: form.fileName,
    description: form.description.trim(),
    sizeBytes: form.sizeBytes || 0,
    mimeType: form.mimeType || guessMime(form.fileName),
    docType: form.docType || 'أخرى',
    caseId: linked?.id || '',
    caseTitle: linked?.title || '',
    caseNumber: linked?.number || '',
    uploadedBy: form.uploadedBy || 'مدير النظام',
    uploadedAt,
    notes: form.notes?.trim() || '',
  }
}

function guessMime(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const map = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }
  return map[ext] || 'application/octet-stream'
}

export function calcDocumentsStats(documents) {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()

  const linked = documents.filter((doc) => doc.caseId).length
  const thisMonth = documents.filter((doc) => {
    const parts = String(doc.uploadedAt || '').split(/[/-]/)
    if (parts.length < 3) return false
    const y = Number(parts[0])
    const m = Number(parts[1]) - 1
    return y === year && m === month
  }).length
  const totalBytes = documents.reduce((sum, doc) => sum + (doc.sizeBytes || 0), 0)

  return {
    total: documents.length,
    linked,
    thisMonth,
    spaceUsed: formatFileSize(totalBytes),
  }
}

export function downloadDocumentStub(doc) {
  const content = [
    `اسم الملف: ${doc.fileName}`,
    `الوصف: ${doc.description}`,
    `النوع: ${doc.docType}`,
    `القضية: ${doc.caseTitle || 'غير مرتبط'}`,
    `رفع بواسطة: ${doc.uploadedBy}`,
    `تاريخ الرفع: ${doc.uploadedAt}`,
    '',
    doc.notes ? `ملاحظات:\n${doc.notes}` : '',
  ].join('\n')

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${doc.fileName.replace(/\.[^.]+$/, '') || 'document'}.txt`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
