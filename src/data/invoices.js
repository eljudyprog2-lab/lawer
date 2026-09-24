import { initialClients } from './clients'
import { initialCases } from './cases'

export const invoiceStatusOptions = [
  'مدفوعة',
  'مدفوعة جزئياً',
  'غير مدفوعة',
  'ملغاة',
]

export const paymentMethodOptions = ['نقدي', 'شيك', 'تحويل بنكي', 'بطاقة']

export const invoiceClients = initialClients.map(({ id, name }) => ({ id, name }))

export const invoiceCases = initialCases.map(({ id, title, number }) => ({
  id,
  title,
  number,
}))

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

export const initialInvoices = [
  {
    id: '1',
    number: 'INV-202603-1465',
    issueDate: '2026-03-01',
    dueDate: '2026-04-28',
    clientId: '1',
    clientName: 'محمد اشرف',
    caseId: '1',
    caseTitle: 'قضية تعويض عن حادث مروري',
    description: 'أتعاب محاماة',
    total: 5000,
    paid: 0,
    status: 'غير مدفوعة',
    items: [],
    paymentMethod: '',
    notes: '',
    payments: [],
  },
  {
    id: '2',
    number: 'INV-202509-0866',
    issueDate: '2025-09-05',
    dueDate: '',
    clientId: '3',
    clientName: 'قضية نصب واحتيال',
    caseId: '4',
    caseTitle: 'نزاع تجاري',
    description: 'مصاريف',
    total: 5637,
    paid: 5063.27,
    status: 'مدفوعة جزئياً',
    items: [],
    paymentMethod: 'شيك',
    notes: '',
    payments: [
      {
        id: 'p1',
        amount: 5063.27,
        date: '2025-09-16',
        method: 'شيك',
        reference: '543453353223523',
        notes: 'تم الدفع بنجاح',
      },
    ],
  },
  {
    id: '3',
    number: 'INV-202509-21614',
    issueDate: '2025-09-06',
    dueDate: '2025-10-06',
    clientId: '3',
    clientName: 'قضية نصب واحتيال',
    caseId: '4',
    caseTitle: 'نزاع تجاري',
    description: 'واقع الدنيا!!!',
    total: 100,
    paid: 100,
    status: 'مدفوعة',
    items: [],
    paymentMethod: 'نقدي',
    notes: '',
    payments: [
      {
        id: 'p2',
        amount: 100,
        date: '2025-09-06',
        method: 'نقدي',
        reference: '',
        notes: '',
      },
    ],
  },
  {
    id: '4',
    number: 'INV-202509-05014',
    issueDate: '2025-08-25',
    dueDate: '2025-09-25',
    clientId: '3',
    clientName: 'قضية تسويض عن حادث مروري',
    caseId: '',
    caseTitle: '',
    description: 'تكوده',
    total: 100,
    paid: 100,
    status: 'مدفوعة',
    items: [],
    paymentMethod: 'تحويل بنكي',
    notes: '',
    payments: [
      {
        id: 'p3',
        amount: 100,
        date: '2025-08-25',
        method: 'تحويل بنكي',
        reference: '',
        notes: '',
      },
    ],
  },
  {
    id: '5',
    number: 'INV-202509-99074',
    issueDate: '2025-09-11',
    dueDate: '2025-09-22',
    clientId: '3',
    clientName: 'قضية نصب واحتيال',
    caseId: '4',
    caseTitle: 'نزاع تجاري',
    description: 'ايوه تعزيز',
    total: 2232232,
    paid: 2229072,
    status: 'مدفوعة جزئياً',
    items: [],
    paymentMethod: 'نقدي',
    notes: '',
    payments: [
      {
        id: 'p4',
        amount: 2229072,
        date: '2025-09-11',
        method: 'نقدي',
        reference: '',
        notes: '',
      },
    ],
  },
  {
    id: '6',
    number: 'INV-202509-54024',
    issueDate: '2025-09-11',
    dueDate: '',
    clientId: '',
    clientName: 'mohamed ashraf sayed',
    caseId: '',
    caseTitle: '',
    description: 'مستفستفف',
    total: 100,
    paid: 100,
    status: 'مدفوعة',
    items: [],
    paymentMethod: 'نقدي',
    notes: '',
    payments: [
      {
        id: 'p5',
        amount: 100,
        date: '2025-09-11',
        method: 'نقدي',
        reference: '',
        notes: '',
      },
    ],
  },
  {
    id: '7',
    number: 'INV-202401-76454',
    issueDate: '2024-01-10',
    dueDate: '',
    clientId: '',
    clientName: 'mohamed ashraf sayed',
    caseId: '',
    caseTitle: '',
    description: 'بيليبل',
    total: 122232,
    paid: 0,
    status: 'غير مدفوعة',
    items: [],
    paymentMethod: '',
    notes: '',
    payments: [],
  },
  {
    id: '8',
    number: 'INV-202401-00018',
    issueDate: '2024-01-05',
    dueDate: '2024-02-06',
    clientId: '3',
    clientName: 'قضية تسويض عن حادث مروري',
    caseId: '',
    caseTitle: '',
    description: 'أتعاب قانونية - قضية رقم 123',
    total: 10000,
    paid: 8100,
    status: 'مدفوعة جزئياً',
    items: [],
    paymentMethod: 'شيك',
    notes: '',
    payments: [
      {
        id: 'p6',
        amount: 8000,
        date: '2024-01-15',
        method: 'شيك',
        reference: '432452352',
        notes: '',
      },
      {
        id: 'p7',
        amount: 100,
        date: '2024-01-20',
        method: 'نقدي',
        reference: '',
        notes: '',
      },
    ],
  },
  {
    id: '9',
    number: 'INV-202401-00028',
    issueDate: '2025-09-14',
    dueDate: '2025-09-29',
    clientId: '',
    clientName: 'محمد اشرف',
    caseId: '',
    caseTitle: '',
    description: 'استشارة قانونية',
    total: 2000,
    paid: 2000,
    status: 'مدفوعة',
    items: [],
    paymentMethod: 'شيك',
    notes: '',
    payments: [
      {
        id: 'p8',
        amount: 2000,
        date: '2025-09-16',
        method: 'شيك',
        reference: '543453353223523',
        notes: 'تم الدفع بنجاح',
      },
    ],
  },
]

export function formatMoney(amount) {
  const value = Number(amount) || 0
  return `${value.toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ج.م`
}

export function formatInvoiceDate(date) {
  if (!date) return '—'
  const value = new Date(`${date}T00:00:00`)
  if (Number.isNaN(value.getTime())) return '—'
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value)
}

export function remaining(invoice) {
  return Math.max(0, (Number(invoice.total) || 0) - (Number(invoice.paid) || 0))
}

export function deriveStatus(total, paid) {
  const t = Number(total) || 0
  const p = Number(paid) || 0
  if (p <= 0) return 'غير مدفوعة'
  if (p >= t) return 'مدفوعة'
  return 'مدفوعة جزئياً'
}

export function generateInvoiceNumber() {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `INV-${stamp}-${rand}`
}

export function createInvoiceFromForm(form) {
  const client = invoiceClients.find((item) => item.id === form.clientId)
  const linkedCase = invoiceCases.find((item) => item.id === form.caseId)
  const total = Number(form.total) || 0
  const paid = Number(form.paid) || 0
  const payments =
    paid > 0
      ? [
          {
            id: `p${Date.now()}`,
            amount: paid,
            date: form.issueDate || new Date().toISOString().slice(0, 10),
            method: form.paymentMethod || 'نقدي',
            reference: '',
            notes: 'دفعة أولية',
          },
        ]
      : []

  return {
    id: String(Date.now()),
    number: form.number || generateInvoiceNumber(),
    issueDate: form.issueDate,
    dueDate: form.dueDate,
    clientId: client?.id || '',
    clientName: client?.name || form.clientName || '',
    caseId: linkedCase?.id || '',
    caseTitle: linkedCase?.title || '',
    description: form.description.trim(),
    total,
    paid,
    status: form.status || deriveStatus(total, paid),
    items: form.items || [],
    paymentMethod: form.paymentMethod || '',
    notes: form.notes?.trim() || '',
    payments,
  }
}

export function calcInvoiceStats(invoices) {
  const total = invoices.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
  const collected = invoices.reduce((sum, item) => sum + (Number(item.paid) || 0), 0)
  const due = invoices.reduce((sum, item) => sum + remaining(item), 0)
  const overdue = invoices.filter((item) => remaining(item) > 0 && item.dueDate).length

  return {
    total,
    collected,
    due,
    overdue,
  }
}
