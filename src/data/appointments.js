import { initialClients } from './clients'
import { initialLawyers } from './lawyers'
import { initialCases } from './cases'

export const appointmentTypeOptions = ['استشارة', 'اجتماع', 'أخرى']
export const appointmentStatusOptions = ['مؤكد', 'معلق', 'قيد الانتظار', 'ملغي']

export const appointmentClients = initialClients.map(({ id, name, phone }) => ({
  id,
  name,
  phone,
}))

export const appointmentLawyers = initialLawyers.map(({ id, name }) => ({
  id,
  name,
}))

export const appointmentCases = initialCases.map(({ id, title, number }) => ({
  id,
  title,
  number,
}))

export const emptyAppointmentForm = {
  date: '',
  time: '',
  lawyerId: '',
  clientId: '',
  caseId: '',
  type: 'استشارة',
  notes: '',
}

export const initialAppointments = [
  {
    id: '1',
    date: '2026-03-13',
    time: '16:00',
    type: 'استشارة',
    clientId: '1',
    clientName: 'محمد اشرف',
    clientPhone: '01234567890',
    lawyerId: '1',
    lawyerName: 'أ. حسن علي',
    caseId: '',
    caseTitle: '',
    notes: 'Very urgent',
    status: 'ملغي',
  },
  {
    id: '2',
    date: '2026-03-14',
    time: '10:06',
    type: 'استشارة',
    clientId: '1',
    clientName: 'محمد اشرف',
    clientPhone: '01234567890',
    lawyerId: '3',
    lawyerName: 'أ. سارة محمود',
    caseId: '1',
    caseTitle: 'قضية تعويض عن حادث مروري',
    notes: 'مراجعة المستندات',
    status: 'مؤكد',
  },
  {
    id: '3',
    date: '2026-03-14',
    time: '14:47',
    type: 'أخرى',
    clientId: '4',
    clientName: 'خالد عبدالله',
    clientPhone: '0501112233',
    lawyerId: '',
    lawyerName: '',
    caseId: '4',
    caseTitle: 'نزاع تجاري',
    notes: 'موعد بخصوص قضية جديدة',
    status: 'مؤكد',
  },
  {
    id: '4',
    date: '2026-03-15',
    time: '03:20',
    type: 'أخرى',
    clientId: '5',
    clientName: 'نورة سعد القحطاني',
    clientPhone: '0532223344',
    lawyerId: '',
    lawyerName: '',
    caseId: '',
    caseTitle: '',
    notes: '',
    status: 'معلق',
  },
  {
    id: '5',
    date: '2026-03-15',
    time: '17:00',
    type: 'استشارة',
    clientId: '6',
    clientName: 'سامي يوسف',
    clientPhone: '0543334455',
    lawyerId: '',
    lawyerName: '',
    caseId: '',
    caseTitle: '',
    notes: '',
    status: 'قيد الانتظار',
  },
  {
    id: '6',
    date: '2026-03-16',
    time: '19:52',
    type: 'استشارة',
    clientId: '7',
    clientName: 'ريم عبدالرحمن',
    clientPhone: '0567778899',
    lawyerId: '2',
    lawyerName: 'د. أحمد يوسف علي',
    caseId: '1',
    caseTitle: 'سرقة',
    notes: 'استلام صكوك',
    status: 'معلق',
  },
  {
    id: '7',
    date: '2026-03-17',
    time: '12:46',
    type: 'استشارة',
    clientId: '2',
    clientName: 'محمود احمد امير',
    clientPhone: '01025547777',
    lawyerId: '',
    lawyerName: '',
    caseId: '3',
    caseTitle: 'ميراث جديد',
    notes: '',
    status: 'مؤكد',
  },
]

export function createAppointment(form) {
  const client = appointmentClients.find((item) => item.id === form.clientId)
  const lawyer = appointmentLawyers.find((item) => item.id === form.lawyerId)
  const linkedCase = appointmentCases.find((item) => item.id === form.caseId)

  return {
    id: String(Date.now()),
    date: form.date,
    time: form.time,
    type: form.type,
    clientId: client?.id || '',
    clientName: client?.name || '',
    clientPhone: client?.phone || '',
    lawyerId: lawyer?.id || '',
    lawyerName: lawyer?.name || '',
    caseId: linkedCase?.id || '',
    caseTitle: linkedCase?.title || '',
    notes: form.notes.trim(),
    status: 'قيد الانتظار',
  }
}

export function formatAppointmentDate(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(`${date}T00:00:00`))
}
