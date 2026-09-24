import { initialCases } from './cases'
import { initialSessions } from './sessions'
import { initialAppointments } from './appointments'
import { initialDocuments } from './documents'
import { initialInvoices } from './invoices'
import { isSamePerson } from './roles'
import { remaining, formatMoney } from './invoices'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function weekAheadKey() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().slice(0, 10)
}

export function getClientCases(clientName, cases = initialCases) {
  const list = cases && cases.length > 0 ? cases : initialCases
  const filtered = list.filter((item) =>
    isSamePerson(item.clientName || item.client?.full_name || item.client, clientName),
  )
  if (filtered.length > 0) return filtered
  return list === initialCases
    ? []
    : initialCases.filter((item) =>
        isSamePerson(item.clientName || item.client?.full_name || item.client, clientName),
      )
}

export function getClientCaseIds(clientName, cases = initialCases) {
  return new Set(getClientCases(clientName, cases).map((item) => item.id))
}

export function getClientSessions(clientName, sessions = initialSessions, cases = initialCases) {
  const list = sessions && sessions.length > 0 ? sessions : initialSessions
  const caseIds = getClientCaseIds(clientName, cases)
  const filtered = list.filter(
    (item) => (item.caseId && caseIds.has(item.caseId)) || (item.case_id && caseIds.has(item.case_id)),
  )
  if (filtered.length > 0) return filtered
  return list === initialSessions
    ? []
    : initialSessions.filter(
        (item) => (item.caseId && caseIds.has(item.caseId)) || (item.case_id && caseIds.has(item.case_id)),
      )
}

export function getClientAppointments(
  clientName,
  appointments = initialAppointments,
) {
  const list = appointments && appointments.length > 0 ? appointments : initialAppointments
  const filtered = list.filter((item) =>
    isSamePerson(item.clientName || item.client?.full_name || item.client, clientName),
  )
  if (filtered.length > 0) return filtered
  return list === initialAppointments
    ? []
    : initialAppointments.filter((item) =>
        isSamePerson(item.clientName || item.client?.full_name || item.client, clientName),
      )
}

export function getClientDocuments(
  clientName,
  documents = initialDocuments,
  cases = initialCases,
) {
  const caseIds = getClientCaseIds(clientName, cases)
  return documents.filter((doc) => doc.caseId && caseIds.has(doc.caseId))
}

export function getClientInvoices(clientName, invoices = initialInvoices) {
  const list = invoices && invoices.length > 0 ? invoices : initialInvoices
  const filtered = list.filter((inv) =>
    isSamePerson(inv.clientName || inv.client?.full_name || inv.client, clientName),
  )
  if (filtered.length > 0) return filtered
  return list === initialInvoices
    ? []
    : initialInvoices.filter((inv) =>
        isSamePerson(inv.clientName || inv.client?.full_name || inv.client, clientName),
      )
}

export function buildClientStats(
  clientName,
  {
    cases = initialCases,
    sessions = initialSessions,
    appointments = initialAppointments,
    invoices = initialInvoices,
  } = {},
) {
  const cCases = getClientCases(clientName, cases)
  const cSessions = getClientSessions(clientName, sessions, cCases)
  const cAppts = getClientAppointments(clientName, appointments)
  const cInvs = getClientInvoices(clientName, invoices)

  const today = todayKey()
  const weekAhead = weekAheadKey()
  const activeCases = cCases.filter((item) => item.status !== 'منتهي' && item.status !== 'closed')
  const closedCases = cCases.filter((item) => item.status === 'منتهي' || item.status === 'closed')
  const balance = cInvs.reduce(
    (sum, inv) => sum + (Number(inv.remaining ?? (typeof remaining === 'function' ? remaining(inv) : 0)) || 0),
    0,
  )

  return [
    { id: 'cases', label: 'قضايا', value: String(activeCases.length), tone: 'gold', icon: 'cases' },
    {
      id: 'appointments',
      label: 'مواعيدي',
      value: String(cAppts.length),
      tone: 'teal',
      icon: 'calendar',
    },
    {
      id: 'today',
      label: 'مواعيد اليوم',
      value: String(cAppts.filter((item) => item.date === today).length),
      tone: 'muted',
      icon: 'clock',
    },
    {
      id: 'balance',
      label: 'الرصيد',
      value: formatMoney(balance),
      tone: 'success',
      icon: 'invoices',
    },
    {
      id: 'total',
      label: 'إجمالي القضايا',
      value: String(cCases.length),
      tone: 'gold',
      icon: 'folder',
    },
    {
      id: 'closed',
      label: 'قضايا منتهية',
      value: String(closedCases.length),
      tone: 'teal',
      icon: 'check',
    },
    {
      id: 'week',
      label: 'مواعيد الأسبوع',
      value: String(
        cAppts.filter((item) => item.date >= today && item.date <= weekAhead).length,
      ),
      tone: 'muted',
      icon: 'appointments',
    },
    {
      id: 'sessions',
      label: 'جلسات قادمة',
      value: String(
        cSessions.filter((item) => item.date >= today && item.status !== 'منتهية' && item.status !== 'منتهي').length,
      ),
      tone: 'success',
      icon: 'sessions',
    },
  ]
}

export function buildClientCaseUpdates(clientName, cases = initialCases) {
  return getClientCases(clientName, cases).map((item) => ({
    id: item.id,
    title: item.title,
    sessionDate: item.nextSession || item.sessionDate || '—',
    status: item.status === 'منتهي' || item.status === 'closed' ? 'منتهي' : 'نشط',
  }))
}

export function buildClientAppointments(clientName, appointments = initialAppointments) {
  const today = todayKey()
  return getClientAppointments(clientName, appointments)
    .filter((item) => item.date >= today)
    .map((item) => ({
      id: item.id,
      title: item.type || item.title || 'موعد',
      client: item.lawyerName || item.lawyer || 'بانتظار التعيين',
      date: item.date,
      time: item.time,
    }))
}

export function buildClientActivities(clientName, appointments = initialAppointments) {
  return getClientAppointments(clientName, appointments)
    .map((item) => ({
      id: `appointment-${item.id}`,
      title: `موعد ${item.type || 'استشارة'}`,
      description: `موعد ${item.type || 'استشارة'} بتاريخ ${item.date}${item.time ? ' الساعة ' + item.time : ''}`,
      text: `موعد ${item.type || 'استشارة'} في ${item.date}`,
      date: item.date,
      time: item.time,
      clientName: item.clientName || item.client || clientName,
      lawyerName: item.lawyerName || item.lawyer || 'مكتب الدوسري',
      type: 'appointment',
      targetPath: '/appointments',
      icon: 'folder',
      tone: 'teal',
    }))
    .slice(0, 6)
}
