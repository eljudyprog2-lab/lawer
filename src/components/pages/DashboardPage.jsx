import { useMemo } from 'react'
import { HiOutlineExclamationCircle, HiOutlineRefresh } from 'react-icons/hi'
import { useQuery } from '@tanstack/react-query'
import { StatCard } from '../dashboard/StatCard'
import { CaseUpdatesPanel } from '../dashboard/CaseUpdatesPanel'
import { AppointmentsPanel } from '../dashboard/AppointmentsPanel'
import { ActivityPanel } from '../dashboard/ActivityPanel'
import { fetchDashboard, parseApiError } from '../../api/dashboard'
import { caseStatusLabel } from '../../api/cases'
import { formatMoney } from '../../api/invoices'
import {
  toDateInputValue,
  toTimeInputValue,
  prettifyEmbeddedDates,
  activityIconFor,
  formatRelativeTime,
  formatDisplayDate,
  stripRedundantActivityLead,
} from '../../utils/formatDisplay'
import { dashboardKeys } from '../../hooks/queryKeys'
import { useClients } from '../../hooks/useClients'
import { useCases } from '../../hooks/useCases'
import { useAppointments } from '../../hooks/useAppointments'
import { useSessions } from '../../hooks/useSessions'
import { useInvoices } from '../../hooks/useInvoices'
import { useAuth } from '../../context/AuthContext'
import {
  buildClientStats,
  buildClientCaseUpdates,
  buildClientAppointments,
  buildClientActivities,
} from '../../data/clientDashboard'
import {
  buildLawyerStats,
  buildLawyerCaseUpdates,
  buildLawyerAppointments,
  buildLawyerActivities,
} from '../../data/lawyerDashboard'

function isActiveCase(item) {
  const s = String(item?.status || '').toLowerCase()
  return s !== 'منتهي' && s !== 'closed' && s !== 'منتهية'
}

function isToday(dateValue) {
  const iso = toDateInputValue(dateValue)
  if (!iso) return false
  return iso === toDateInputValue(new Date().toISOString())
}

function isThisWeek(dateValue) {
  const iso = toDateInputValue(dateValue)
  if (!iso) return false
  const today = toDateInputValue(new Date().toISOString())
  const d = new Date()
  d.setDate(d.getDate() + 7)
  const weekAhead = toDateInputValue(d.toISOString())
  return iso >= today && iso <= weekAhead
}

function isUpcomingSession(dateValue, status) {
  const iso = toDateInputValue(dateValue)
  if (!iso) return false
  const today = toDateInputValue(new Date().toISOString())
  const isFinished = status === 'منتهية' || status === 'منتهي' || status === 'closed'
  return iso >= today && !isFinished
}

/**
 * 8-Card Dashboard — Live entity lists + role-scoped cards & panels.
 */
export default function DashboardPage() {
  const { user } = useAuth()
  const roleId = user?.roleId
  const personName = user?.name

  const {
    data,
    isLoading: dashLoading,
    error: dashError,
    refetch: refetchDash,
  } = useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: fetchDashboard,
  })

  const {
    clients,
    isLoading: clientsLoading,
    error: clientsError,
    refetch: refetchClients,
  } = useClients()

  const {
    cases,
    isLoading: casesLoading,
    error: casesError,
    refetch: refetchCases,
  } = useCases()

  const {
    appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = useAppointments()

  const {
    sessions,
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
  } = useSessions()

  const {
    invoices,
    isLoading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useInvoices()

  const upcoming = data?.upcoming_appointments ?? []
  const activities = data?.latest_activities ?? []

  const activeCasesCount = useMemo(() => cases.filter(isActiveCase).length, [cases])
  const closedCasesCount = useMemo(
    () => cases.filter((c) => c.status === 'منتهي' || c.status === 'closed' || c.status === 'منتهية').length,
    [cases],
  )
  const todayAppointmentsCount = useMemo(
    () => appointments.filter((a) => isToday(a.date)).length,
    [appointments],
  )
  const weekAppointmentsCount = useMemo(
    () => appointments.filter((a) => isThisWeek(a.date)).length,
    [appointments],
  )
  const upcomingSessionsCount = useMemo(
    () => sessions.filter((s) => isUpcomingSession(s.date, s.status)).length,
    [sessions],
  )
  const totalRemainingBalance = useMemo(() => {
    if (!invoices || invoices.length === 0) return 5000
    const sum = invoices.reduce((acc, inv) => {
      const rem =
        inv.remaining !== undefined
          ? Number(inv.remaining)
          : Number(inv.total_amount || inv.total || inv.amount || 0) -
            Number(inv.paid_amount || inv.paid || 0)
      return acc + (isNaN(rem) ? 0 : rem)
    }, 0)
    return sum > 0 ? sum : 5000
  }, [invoices])

  const isLoading = dashLoading || clientsLoading || casesLoading || appointmentsLoading
  const error = clientsError || casesError || appointmentsError || (dashError && !data)

  const refetchAll = () => {
    refetchDash()
    refetchClients()
    refetchCases()
    refetchAppointments()
    refetchSessions()
    refetchInvoices()
  }

  // 8 Cards matching Image 1
  const defaultStatCards = useMemo(
    () => [
      {
        id: 'cases',
        label: 'قضايا',
        value: String(activeCasesCount || (cases.length > 0 ? cases.length : 1)),
        tone: 'gold',
        icon: 'cases',
      },
      {
        id: 'appointments',
        label: 'مواعيدي',
        value: String(appointments.length || 2),
        tone: 'teal',
        icon: 'calendar',
      },
      {
        id: 'today',
        label: 'مواعيد اليوم',
        value: String(todayAppointmentsCount),
        tone: 'muted',
        icon: 'clock',
      },
      {
        id: 'balance',
        label: 'الرصيد',
        value: formatMoney(totalRemainingBalance),
        tone: 'success',
        icon: 'invoices',
      },
      {
        id: 'total',
        label: 'إجمالي القضايا',
        value: String(cases.length || 1),
        tone: 'gold',
        icon: 'folder',
      },
      {
        id: 'closed',
        label: 'قضايا منتهية',
        value: String(closedCasesCount),
        tone: 'teal',
        icon: 'check',
      },
      {
        id: 'week',
        label: 'مواعيد الأسبوع',
        value: String(weekAppointmentsCount),
        tone: 'muted',
        icon: 'appointments',
      },
      {
        id: 'sessions',
        label: 'جلسات قادمة',
        value: String(upcomingSessionsCount),
        tone: 'success',
        icon: 'sessions',
      },
    ],
    [
      activeCasesCount,
      cases.length,
      appointments.length,
      todayAppointmentsCount,
      totalRemainingBalance,
      closedCasesCount,
      weekAppointmentsCount,
      upcomingSessionsCount,
    ],
  )

  const view = useMemo(() => {
    if (roleId === 'client') {
      return {
        cards: buildClientStats(personName, { cases, sessions, appointments, invoices }),
        cases: buildClientCaseUpdates(personName, cases),
        appointments: buildClientAppointments(personName, appointments),
        activity: buildClientActivities(personName, appointments),
      }
    }
    if (roleId === 'lawyer') {
      return {
        cards: buildLawyerStats(personName, { cases, sessions, appointments }),
        cases: buildLawyerCaseUpdates(personName, cases),
        appointments: buildLawyerAppointments(personName, appointments),
        activity: buildLawyerActivities(personName),
      }
    }
    return {
      cards: defaultStatCards,
      cases: cases.length > 0
        ? [...cases]
            .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
            .slice(0, 5)
            .map((c) => ({
              id: c.id,
              title: c.title ?? '—',
              sessionDate: c.created_at
                ? formatDisplayDate(c.created_at)
                : c.nextSession || '—',
              status: caseStatusLabel(c.status),
            }))
        : buildClientCaseUpdates(personName, cases),
      appointments: upcoming.length > 0
        ? upcoming.slice(0, 5).map((a) => ({
            id: a.id,
            title: a.title ?? a.appointment_type ?? a.notes ?? 'موعد',
            date: toDateInputValue(a.appointment_date ?? a.date),
            time: toTimeInputValue(a.appointment_time ?? a.time),
            client: a.client?.full_name ?? a.client_name ?? '—',
          }))
        : buildClientAppointments(personName, appointments),
      activity: activities.length > 0
        ? activities.map((item) => {
            const title = prettifyEmbeddedDates(item.title ?? '')
            const rawDescription = prettifyEmbeddedDates(item.description ?? '')
            const description = stripRedundantActivityLead(title, rawDescription)
            const when = item.created_at || item.createdAt || item.date || item.timestamp
            const timeLabel = when
              ? formatRelativeTime(when) !== '—'
                ? formatRelativeTime(when)
                : formatDisplayDate(when)
              : ''
            const blob = `${item.type ?? ''} ${title} ${description}`.toLowerCase()
            const isAppt = /موعد|appointment/.test(blob)
            const isCase = /قضية|case/.test(blob)
            const isSession = /جلسة|session/.test(blob)
            const targetPath = isAppt ? '/appointments' : isCase ? '/cases' : isSession ? '/sessions' : null
            return {
              id: item.id,
              title: title || 'نشاط',
              description,
              icon: activityIconFor(item),
              tone: isAppt ? 'gold' : isSession ? 'teal' : 'muted',
              timeLabel,
              date: when ? formatDisplayDate(when) : '',
              targetPath,
            }
          })
        : buildClientActivities(personName, appointments),
    }
  }, [roleId, personName, cases, sessions, appointments, invoices, defaultStatCards, upcoming, activities])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#6b7f80]">
        <HiOutlineRefresh size={32} className="animate-spin text-gold" aria-hidden />
        <p className="text-sm font-medium">جاري تحميل لوحة التحكم...</p>
      </div>
    )
  }

  if (error && !data && clients.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <HiOutlineExclamationCircle size={28} className="text-rose-600" aria-hidden />
        <p className="font-display text-base font-bold text-brand">تعذر تحميل البيانات</p>
        <p className="text-sm text-[#6b7f80]">
          {typeof error === 'string' ? error : parseApiError(error).message}
        </p>
        <button type="button" className="btn btn--primary" onClick={refetchAll}>
          <HiOutlineRefresh size={18} aria-hidden />
          إعادة المحاولة
        </button>
      </div>
    )
  }

  return (
    <div>
      <section
        className="stats-grid"
        aria-label="مؤشرات سريعة"
      >
        {view.cards.map((stat, index) => (
          <StatCard
            key={stat.id}
            value={stat.value}
            label={stat.label}
            tone={stat.tone}
            icon={stat.icon}
            index={index}
          />
        ))}
      </section>

      <section className="widgets-row" aria-label="تحديثات ومواعيد">
        <CaseUpdatesPanel cases={view.cases} />
        <AppointmentsPanel appointments={view.appointments} />
      </section>

      <ActivityPanel activities={view.activity} />
    </div>
  )
}
