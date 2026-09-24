import { initialCases } from './cases'
import { initialSessions } from './sessions'
import { initialAppointments } from './appointments'
import { initialDocuments } from './documents'
import { initialClients } from './clients'
import { initialInvoices, formatMoney } from './invoices'
import { isSamePerson } from './roles'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function weekAheadKey() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().slice(0, 10)
}

export function getLawyerCases(lawyerName, cases = initialCases) {
  return cases.filter((item) => isSamePerson(item.lawyer, lawyerName))
}

export function getLawyerCaseIds(lawyerName, cases = initialCases) {
  return new Set(getLawyerCases(lawyerName, cases).map((item) => item.id))
}

export function getLawyerClientNames(lawyerName, cases = initialCases) {
  return new Set(
    getLawyerCases(lawyerName, cases)
      .map((item) => item.client)
      .filter(Boolean),
  )
}

export function getLawyerSessions(lawyerName, sessions = initialSessions) {
  return sessions.filter((item) => isSamePerson(item.lawyerName, lawyerName))
}

export function getLawyerAppointments(
  lawyerName,
  appointments = initialAppointments,
) {
  return appointments.filter((item) => isSamePerson(item.lawyerName, lawyerName))
}

export function getLawyerDocuments(
  lawyerName,
  documents = initialDocuments,
  cases = initialCases,
) {
  const caseIds = getLawyerCaseIds(lawyerName, cases)
  return documents.filter((doc) => doc.caseId && caseIds.has(doc.caseId))
}

export function getLawyerClients(
  lawyerName,
  clients = initialClients,
  cases = initialCases,
) {
  const names = getLawyerClientNames(lawyerName, cases)
  return clients.filter((client) =>
    [...names].some((name) => isSamePerson(name, client.name)),
  )
}

export function getLawyerInvoices(
  lawyerName,
  invoices = initialInvoices,
  cases = initialCases,
) {
  const names = getLawyerClientNames(lawyerName, cases)
  const caseIds = getLawyerCaseIds(lawyerName, cases)
  return invoices.filter(
    (inv) =>
      (inv.caseId && caseIds.has(inv.caseId)) ||
      [...names].some((name) => isSamePerson(name, inv.clientName)),
  )
}

export function getClientCases(clientName, cases = initialCases) {
  return cases.filter((item) => isSamePerson(item.client, clientName))
}

export function buildLawyerStats(
  lawyerName,
  {
    cases = initialCases,
    sessions = initialSessions,
    appointments = initialAppointments,
  } = {},
) {
  const effectiveCases = cases && cases.length > 0 ? cases : initialCases
  const effectiveSessions = sessions && sessions.length > 0 ? sessions : initialSessions
  const effectiveAppts = appointments && appointments.length > 0 ? appointments : initialAppointments

  let lCases = getLawyerCases(lawyerName, effectiveCases)
  if (lCases.length === 0 && effectiveCases !== initialCases) {
    lCases = getLawyerCases(lawyerName, initialCases)
  }
  let lSessions = getLawyerSessions(lawyerName, effectiveSessions)
  if (lSessions.length === 0 && effectiveSessions !== initialSessions) {
    lSessions = getLawyerSessions(lawyerName, initialSessions)
  }
  let lAppts = getLawyerAppointments(lawyerName, effectiveAppts)
  if (lAppts.length === 0 && effectiveAppts !== initialAppointments) {
    lAppts = getLawyerAppointments(lawyerName, initialAppointments)
  }

  const today = todayKey()
  const weekAhead = weekAheadKey()

  const activeCases = lCases.filter((item) => item.status !== 'منتهي' && item.status !== 'closed')
  const closedCases = lCases.filter((item) => item.status === 'منتهي' || item.status === 'closed')
  const clients = new Set(lCases.map((item) => item.client || item.clientName).filter(Boolean))

  return [
    { id: 'cases', label: 'قضايا', value: String(activeCases.length), tone: 'gold', icon: 'cases' },
    {
      id: 'appointments',
      label: 'مواعيدي',
      value: String(lAppts.length),
      tone: 'teal',
      icon: 'calendar',
    },
    {
      id: 'today',
      label: 'مواعيد اليوم',
      value: String(lAppts.filter((item) => item.date === today).length),
      tone: 'muted',
      icon: 'clock',
    },
    { id: 'balance', label: 'الرصيد', value: formatMoney(5000), tone: 'success', icon: 'invoices' },
    { id: 'total', label: 'إجمالي القضايا', value: String(lCases.length), tone: 'gold', icon: 'folder' },
    { id: 'closed', label: 'قضايا منتهية', value: String(closedCases.length), tone: 'teal', icon: 'check' },
    {
      id: 'week',
      label: 'مواعيد الأسبوع',
      value: String(
        lAppts.filter((item) => item.date >= today && item.date <= weekAhead).length,
      ),
      tone: 'muted',
      icon: 'appointments',
    },
    {
      id: 'sessions',
      label: 'جلسات قادمة',
      value: String(
        lSessions.filter((item) => item.date >= today && item.status !== 'منتهية' && item.status !== 'منتهي').length,
      ),
      tone: 'success',
      icon: 'sessions',
    },
  ]
}

export function buildLawyerCaseUpdates(lawyerName, cases = initialCases) {
  const effective = cases && cases.length > 0 ? cases : initialCases
  let lCases = getLawyerCases(lawyerName, effective)
  if (lCases.length === 0 && effective !== initialCases) {
    lCases = getLawyerCases(lawyerName, initialCases)
  }
  return lCases.map((item) => ({
    id: item.id,
    title: item.title,
    sessionDate: item.nextSession || item.sessionDate || '—',
    status: item.status === 'منتهي' || item.status === 'closed' ? 'منتهي' : 'نشط',
  }))
}

export function buildLawyerAppointments(lawyerName) {
  const today = todayKey()
  return getLawyerAppointments(lawyerName)
    .filter((item) => item.date >= today)
    .map((item) => ({
      id: item.id,
      title: item.type,
      client: item.clientName,
      date: item.date,
      time: item.time,
    }))
}

export function buildLawyerActivities(lawyerName) {
  const appointments = getLawyerAppointments(lawyerName)
  const sessions = getLawyerSessions(lawyerName)

  return [
    ...appointments.map((item) => ({
      id: `appointment-${item.id}`,
      text: `موعد ${item.type} مع ${item.clientName} في ${item.date}`,
      type: 'appointment',
    })),
    ...sessions.map((item) => ({
      id: `session-${item.id}`,
      text: `جلسة ${item.type} في قضية ${item.caseTitle} بتاريخ ${item.date}`,
      type: 'session',
    })),
  ].slice(0, 6)
}
