import { initialCases } from './cases'
import { initialLawyers } from './lawyers'

export const sessionTypeOptions = ['جلسة استماع', 'مرافعة', 'حجز للحكم', 'نطق بالحكم']
export const sessionStatusOptions = ['مجدولة', 'مؤجلة', 'منتهية', 'ملغاة']
export const sessionImportanceOptions = ['عادية', 'مهمة', 'عاجلة']
export const sessionDecisionOptions = ['معلقة', 'تأجيل', 'حكم', 'شطب']

export const sessionCaseOptions = initialCases.map(({ id, title, number }) => ({
  id,
  title,
  number,
}))

export const sessionLawyerOptions = initialLawyers.map(({ id, name }) => ({
  id,
  name,
}))

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

export const initialSessions = [
  {
    id: '1',
    sessionNumber: '1',
    caseId: '1',
    caseTitle: 'قضية تعويض عن حادث مروري',
    caseNumber: '2025/123',
    court: 'محكمة بني سويف المدنية',
    circuit: 'الدائرة الثالثة',
    judge: 'المستشار أحمد محمد',
    hall: 'قاعة 4',
    courtAddress: 'بني سويف',
    date: '2025-09-23',
    time: '10:30',
    type: 'جلسة استماع',
    decision: 'تم الاتفاق',
    status: 'مجدولة',
    importance: 'مهمة',
    notes: 'جلسة أولى لسماع الدعوى',
    lawyerId: '3',
    lawyerName: 'أ. سارة محمود',
    postponeReason: '',
  },
  {
    id: '2',
    sessionNumber: '11',
    caseId: '1',
    caseTitle: 'قضية تعويض عن حادث مروري',
    caseNumber: '2025/123',
    court: 'بني سويف',
    circuit: 'الدائرة الأولى',
    judge: 'محمد',
    hall: 'قاعة 2',
    courtAddress: 'بني سويف',
    date: '2024-09-30',
    time: '15:53',
    type: 'مرافعة',
    decision: 'تم الاتفاق',
    status: 'مؤجلة',
    importance: 'عادية',
    notes: '',
    lawyerId: '3',
    lawyerName: 'أ. سارة محمود',
    postponeReason: 'طلب التأجيل',
  },
  {
    id: '3',
    sessionNumber: '3',
    caseId: '3',
    caseTitle: 'ميراث جديد',
    caseNumber: '56546/2026',
    court: 'محكمة الجيزة المدنية',
    circuit: 'الدائرة الأولى',
    judge: 'المستشار أحمد حسن',
    hall: 'قاعة 2',
    courtAddress: 'الجيزة',
    date: '2026-02-18',
    time: '11:00',
    type: 'مرافعة',
    decision: 'تأجيل',
    status: 'مؤجلة',
    importance: 'عادية',
    notes: '',
    lawyerId: '3',
    lawyerName: 'أ. سارة محمود',
    postponeReason: 'طلب محامي الخصم',
  },
  {
    id: '3',
    sessionNumber: '11',
    caseId: '4',
    caseTitle: 'نزاع تجاري',
    caseNumber: '42342/2026',
    court: 'الرياض',
    circuit: 'الدائرة التجارية',
    judge: 'رجب محمد',
    hall: 'قاعة 7',
    courtAddress: 'الرياض',
    date: '2026-04-05',
    time: '09:30',
    type: 'جلسة استماع',
    decision: 'معلقة',
    status: 'مجدولة',
    importance: 'عاجلة',
    notes: 'تقديم مستندات إضافية',
    lawyerId: '1',
    lawyerName: 'أ. حسن علي',
    postponeReason: '',
  },
  {
    id: '4',
    sessionNumber: '7',
    caseId: '2',
    caseTitle: 'قضية انتحال شخصية',
    caseNumber: '45455/2026',
    court: 'محكمة الجنح',
    circuit: 'الدائرة الثانية',
    judge: 'محمد سعيد',
    hall: 'قاعة 1',
    courtAddress: 'القاهرة',
    date: '2026-01-20',
    time: '13:15',
    type: 'نطق بالحكم',
    decision: 'حكم',
    status: 'منتهية',
    importance: 'مهمة',
    notes: 'صدر الحكم لصالح الموكل',
    lawyerId: '2',
    lawyerName: 'د. أحمد يوسف علي',
    postponeReason: '',
  },
  {
    id: '5',
    sessionNumber: '15',
    caseId: '5',
    caseTitle: 'قضية ميراث',
    caseNumber: '87654/2026',
    court: 'محكمة الأسرة',
    circuit: 'الدائرة الرابعة',
    judge: 'نادية كمال',
    hall: 'قاعة 3',
    courtAddress: 'الإسكندرية',
    date: '2026-03-22',
    time: '10:00',
    type: 'مرافعة',
    decision: 'تأجيل',
    status: 'مؤجلة',
    importance: 'عادية',
    notes: '',
    lawyerId: '4',
    lawyerName: 'أ. عمر حسن',
    postponeReason: 'عدم اكتمال الأوراق',
  },
  {
    id: '6',
    sessionNumber: '19',
    caseId: '7',
    caseTitle: 'اعتداء',
    caseNumber: '99887/2026',
    court: 'محكمة الجنايات',
    circuit: 'الدائرة الخامسة',
    judge: 'خالد إبراهيم',
    hall: 'قاعة 9',
    courtAddress: 'القاهرة',
    date: '2026-07-26',
    time: '12:00',
    type: 'جلسة استماع',
    decision: 'معلقة',
    status: 'مجدولة',
    importance: 'عاجلة',
    notes: 'جلسة اليوم',
    lawyerId: '1',
    lawyerName: 'أ. حسن علي',
    postponeReason: '',
  },
  {
    id: '7',
    sessionNumber: '21',
    caseId: '8',
    caseTitle: 'نفقة زوجية',
    caseNumber: '11223/2026',
    court: 'محكمة الأسرة',
    circuit: 'الدائرة الأولى',
    judge: 'ليلى عبدالرحمن',
    hall: 'قاعة 5',
    courtAddress: 'جدة',
    date: '2026-05-12',
    time: '14:45',
    type: 'حجز للحكم',
    decision: 'معلقة',
    status: 'مجدولة',
    importance: 'مهمة',
    notes: '',
    lawyerId: '3',
    lawyerName: 'أ. سارة محمود',
    postponeReason: '',
  },
]

export function formatSessionDate(date) {
  if (!date) return '—'
  const value = new Date(`${date}T00:00:00`)
  if (Number.isNaN(value.getTime())) return '—'
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(value)
}

export function createSessionFromForm(form, existing = []) {
  const linkedCase = sessionCaseOptions.find((item) => item.id === form.caseId)
  const lawyer = sessionLawyerOptions.find((item) => item.id === form.lawyerId)
  const nextNumber =
    form.sessionNumber ||
    String(
      Math.max(0, ...existing.map((item) => Number(item.sessionNumber) || 0)) + 1,
    )

  return {
    id: String(Date.now()),
    sessionNumber: nextNumber,
    caseId: linkedCase?.id || '',
    caseTitle: linkedCase?.title || '',
    caseNumber: linkedCase?.number || '',
    court: form.court.trim(),
    circuit: form.circuit.trim(),
    judge: form.judge.trim(),
    hall: form.hall.trim(),
    courtAddress: form.courtAddress.trim(),
    date: form.date,
    time: form.time,
    type: form.type,
    decision: form.decision || 'معلقة',
    status: form.status || 'مجدولة',
    importance: form.importance || 'عادية',
    notes: form.notes.trim(),
    lawyerId: lawyer?.id || '',
    lawyerName: lawyer?.name || '',
    postponeReason: '',
  }
}

export function calcSessionStats(sessions) {
  const today = new Date()
  const todayKey = today.toISOString().slice(0, 10)

  return {
    total: sessions.length,
    upcoming: sessions.filter(
      (item) => item.date > todayKey && item.status === 'مجدولة',
    ).length,
    today: sessions.filter((item) => item.date === todayKey).length,
    postponed: sessions.filter((item) => item.status === 'مؤجلة').length,
  }
}
