import { useMemo, useState } from 'react'
import { HiOutlineExclamationCircle, HiOutlineRefresh } from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { FilterSelect } from '../ui/FilterSelect'
import { DateField } from '../ui/DateField'
import { StatCard } from '../dashboard/StatCard'
import { SessionFormModal } from '../sessions/SessionFormModal'
import { SessionDetailsModal } from '../sessions/SessionDetailsModal'
import { PostponeSessionModal } from '../sessions/PostponeSessionModal'
import { useAuth } from '../../context/AuthContext'
import { isSamePerson } from '../../data/roles'
import { getStoredCompanyId } from '../../api/client'
import {
  buildSessionPayload,
  calcSessionStats,
  parseApiError,
  sessionStatusOptions,
  sessionToForm,
  sessionTypeOptions,
} from '../../api/sessions'
import { formatDisplayDate } from '../../utils/formatDisplay'
import { isValidDateOrder, MSG } from '../../utils/validation'
import { useSessions, useSessionKpis, useSessionMutations } from '../../hooks/useSessions'
import { useCases } from '../../hooks/useCases'
import { useLawyers } from '../../hooks/useLawyers'

const WEEKDAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']

function statusClass(status) {
  if (status === 'مجدولة') return 'session-status session-status--scheduled'
  if (status === 'مؤجلة') return 'session-status session-status--postponed'
  if (status === 'منتهية') return 'session-status session-status--done'
  return 'session-status session-status--cancelled'
}

function typeIcon(type) {
  if (type === 'مرافعة') return 'annotation'
  return 'person'
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function buildCalendarDays(monthDate) {
  const first = startOfMonth(monthDate)
  const year = first.getFullYear()
  const month = first.getMonth()
  const startOffset = (first.getDay() + 1) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startOffset; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day))
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function caseClientName(caseItem) {
  return caseItem?.client?.full_name ?? caseItem?.client?.user?.full_name ?? caseItem?.client?.name ?? ''
}

export default function SessionsPage() {
  const { user } = useAuth()
  const isLawyer = user?.roleId === 'lawyer'
  const isClient = user?.roleId === 'client'
  const isAdmin = !isLawyer && !isClient

  const { sessions, isLoading, isFetching, error, refetch } = useSessions()
  const { cases } = useCases()
  const { lawyers } = useLawyers()
  const { data: kpiData } = useSessionKpis()
  const { create, update, remove } = useSessionMutations()

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [caseFilter, setCaseFilter] = useState('')
  const [lawyerFilter, setLawyerFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [quickFilter, setQuickFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [detailsId, setDetailsId] = useState(null)
  const [postponeId, setPostponeId] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())

  const lawyerOptions = useMemo(
    () => lawyers.map((item) => ({ id: String(item.id), name: item.name })),
    [lawyers],
  )

  const allCaseOptions = useMemo(
    () =>
      cases.map((item) => ({
        id: String(item.id),
        title: item.title,
        number: item.case_number || item.number || '',
      })),
    [cases],
  )

  const clientCaseIds = useMemo(() => {
    if (!isClient) return null
    return new Set(
      cases
        .filter((item) => isSamePerson(caseClientName(item), user?.name))
        .map((item) => String(item.id)),
    )
  }, [cases, isClient, user?.name])

  const scopedSessions = useMemo(() => {
    if (isLawyer) {
      const selfLawyer = lawyers.find((item) => isSamePerson(item.name, user?.name))
      const selfLawyerId = selfLawyer ? String(selfLawyer.id) : ''
      if (selfLawyerId) {
        return sessions.filter(
          (item) =>
            String(item.lawyerId) === selfLawyerId ||
            isSamePerson(item.lawyerName, user?.name),
        )
      }
      return sessions.filter((item) => isSamePerson(item.lawyerName, user?.name))
    }
    if (isClient && clientCaseIds) {
      return sessions.filter((item) => clientCaseIds.has(String(item.caseId)))
    }
    return sessions
  }, [sessions, isLawyer, isClient, user?.name, lawyers, clientCaseIds])

  const caseOptionsForFilter = useMemo(() => {
    if (isClient) {
      return allCaseOptions.filter((item) => clientCaseIds?.has(item.id))
    }
    if (isLawyer) {
      const ids = new Set(scopedSessions.map((item) => String(item.caseId)))
      return allCaseOptions.filter((item) => ids.has(item.id))
    }
    return allCaseOptions
  }, [allCaseOptions, isClient, isLawyer, clientCaseIds, scopedSessions])

  const stats = useMemo(() => {
    if (kpiData && typeof kpiData === 'object') {
      const hasMetrics =
        'total' in kpiData ||
        'upcoming' in kpiData ||
        'today' in kpiData ||
        'postponed' in kpiData
      if (hasMetrics) {
        return {
          total: kpiData.total ?? 0,
          upcoming: kpiData.upcoming ?? 0,
          today: kpiData.today ?? 0,
          postponed: kpiData.postponed ?? 0,
        }
      }
    }
    return calcSessionStats(scopedSessions)
  }, [kpiData, scopedSessions])

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const dateRangeInvalid = useMemo(
    () => Boolean(dateFrom && dateTo && !isValidDateOrder(dateFrom, dateTo)),
    [dateFrom, dateTo],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() + 7)
    const weekEndKey = weekEnd.toISOString().slice(0, 10)

    return scopedSessions.filter((item) => {
      if (quickFilter === 'today' && item.date !== todayKey) return false
      if (quickFilter === 'week' && (item.date < todayKey || item.date > weekEndKey)) {
        return false
      }
      if (quickFilter === 'postponed' && item.status !== 'مؤجلة') return false
      if (quickFilter === 'upcoming' && !(item.date > todayKey && item.status === 'مجدولة')) {
        return false
      }
      if (typeFilter && item.type !== typeFilter) return false
      if (statusFilter && item.status !== statusFilter) return false
      if (caseFilter && String(item.caseId) !== caseFilter) return false
      if (isAdmin) {
        if (lawyerFilter && String(item.lawyerId) !== lawyerFilter) return false
      }
      if (!dateRangeInvalid) {
        if (dateFrom && item.date < dateFrom) return false
        if (dateTo && item.date > dateTo) return false
      }
      if (!q) return true
      return [
        item.sessionNumber,
        item.caseTitle,
        item.caseNumber,
        item.court,
        item.judge,
        item.type,
        item.status,
        item.decision,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [
    scopedSessions,
    query,
    typeFilter,
    statusFilter,
    caseFilter,
    lawyerFilter,
    dateFrom,
    dateTo,
    dateRangeInvalid,
    quickFilter,
    todayKey,
    isAdmin,
  ])

  const editingSession = sessions.find((item) => String(item.id) === String(editingId)) || null
  const detailsSession = sessions.find((item) => String(item.id) === String(detailsId)) || null
  const postponeSession = sessions.find((item) => String(item.id) === String(postponeId)) || null

  const sessionsByDay = useMemo(() => {
    const map = {}
    scopedSessions.forEach((item) => {
      if (!map[item.date]) map[item.date] = []
      map[item.date].push(item)
    })
    return map
  }, [scopedSessions])

  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonth),
    [calendarMonth],
  )

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(
        calendarMonth,
      ),
    [calendarMonth],
  )

  const openAdd = () => {
    setEditingId(null)
    setFormOpen(true)
  }

  const openEdit = (id) => {
    setEditingId(id)
    setFormOpen(true)
  }

  const handleSave = async (form) => {
    const companyId = getStoredCompanyId()
    const payload = buildSessionPayload(form, { companyId })
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, values: payload })
      } else {
        await create.mutateAsync(payload)
      }
      await refetch()
    } catch (err) {
      throw new Error(parseApiError(err).message)
    }
  }

  const handlePostpone = async (id, { date, reason }) => {
    const session = sessions.find((item) => String(item.id) === String(id))
    if (!session) return
    const base = sessionToForm(session)
    const notes = reason
      ? [base.notes, `سبب التأجيل: ${reason}`].filter(Boolean).join('\n')
      : base.notes
    const payload = buildSessionPayload(
      {
        ...base,
        date,
        status: 'مؤجلة',
        decision: 'تأجيل',
        notes,
      },
      { companyId: getStoredCompanyId() },
    )
    try {
      await update.mutateAsync({ id, values: payload })
      await refetch()
    } catch {
      /* modal already closed; list refresh on next visit */
    }
  }

  const handleDelete = async (id) => {
    try {
      await remove.mutateAsync(id)
      if (String(detailsId) === String(id)) setDetailsId(null)
      if (String(editingId) === String(id)) setEditingId(null)
      if (String(postponeId) === String(id)) setPostponeId(null)
      await refetch()
    } catch {
      /* keep UI unchanged on failure */
    }
  }

  const clearFilters = () => {
    setQuery('')
    setTypeFilter('')
    setStatusFilter('')
    setCaseFilter('')
    setLawyerFilter('')
    setDateFrom('')
    setDateTo('')
    setQuickFilter('all')
  }

  const submitting = create.isPending || update.isPending

  return (
    <div className="sessions-page">
      <div className="stats-grid">
        <StatCard value={stats.total} label="إجمالي الجلسات" tone="gold" icon="sessions" index={0} />
        <StatCard value={stats.upcoming} label="الجلسات القادمة" tone="teal" icon="calendar" index={1} />
        <StatCard value={stats.today} label="جلسات اليوم" tone="muted" icon="clock" index={2} />
        <StatCard value={stats.postponed} label="جلسات مؤجلة" tone="success" icon="refresh" index={3} />
      </div>

      <div className="cases-toolbar">
        <h2 className="cases-toolbar__title">الجلسات</h2>
        <div className="cases-toolbar__actions">
          <div className="search-field">
            <Icon name="search" className="search-field__icon" />
            <input
              className="search-field__input"
              type="search"
              placeholder="بحث في الجلسات..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn--primary" onClick={openAdd}>
            <Icon name="plus" size={18} />
            إضافة جلسة
          </button>
        </div>
      </div>

      <div className="session-quick-filters">
        {[
          { id: 'all', label: 'الكل' },
          { id: 'today', label: 'اليوم' },
          { id: 'week', label: 'هذا الأسبوع' },
          { id: 'upcoming', label: 'القادمة' },
          { id: 'postponed', label: 'مؤجلة' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            className={`session-chip${quickFilter === item.id ? ' is-active' : ''}`}
            onClick={() => setQuickFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="sessions-filters">
        <div className={`sessions-filters__grid${isLawyer || isClient ? ' sessions-filters__grid--lawyer' : ''}`}>
          {isAdmin && (
            <label>
              <span>المحامي</span>
              <FilterSelect
                value={lawyerFilter}
                onChange={setLawyerFilter}
                aria-label="تصفية حسب المحامي"
                options={[
                  { value: '', label: 'كل المحامين' },
                  ...lawyerOptions.map((item) => ({ value: item.id, label: item.name })),
                ]}
              />
            </label>
          )}
          <label>
            <span>القضية</span>
            <FilterSelect
              value={caseFilter}
              onChange={setCaseFilter}
              aria-label="تصفية حسب القضية"
              options={[
                { value: '', label: 'كل القضايا' },
                ...caseOptionsForFilter.map((item) => ({ value: item.id, label: item.title })),
              ]}
            />
          </label>
          <label>
            <span>من تاريخ</span>
            <DateField
              value={dateFrom}
              onChange={setDateFrom}
              aria-label="من تاريخ"
              placeholder="من تاريخ"
            />
          </label>
          <label>
            <span>إلى تاريخ</span>
            <DateField
              value={dateTo}
              onChange={setDateTo}
              aria-label="إلى تاريخ"
              placeholder="إلى تاريخ"
            />
          </label>
          <label>
            <span>النوع</span>
            <FilterSelect
              value={typeFilter}
              onChange={setTypeFilter}
              aria-label="تصفية حسب النوع"
              options={[
                { value: '', label: 'كل الأنواع' },
                ...sessionTypeOptions.map((opt) => ({ value: opt.label, label: opt.label })),
              ]}
            />
          </label>
          <label>
            <span>الحالة</span>
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              aria-label="تصفية حسب الحالة"
              options={[
                { value: '', label: 'كل الحالات' },
                ...sessionStatusOptions.map((opt) => ({ value: opt, label: opt })),
              ]}
            />
          </label>
        </div>
        {dateRangeInvalid ? (
          <p className="field__error" role="alert">
            {MSG.dateOrder}
          </p>
        ) : null}
        <button type="button" className="btn btn--ghost" onClick={clearFilters}>
          مسح الفلاتر
        </button>
      </section>

      {isLoading ? (
        <div className="table-card flex flex-col items-center justify-center gap-3 py-16 text-[#6b7f80]">
          <HiOutlineRefresh size={28} className="animate-spin text-gold" aria-hidden />
          <p className="text-sm font-medium">جاري تحميل الجلسات...</p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="table-card flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <HiOutlineExclamationCircle size={28} aria-hidden />
          </span>
          <div>
            <p className="font-display text-base font-bold text-brand">تعذر تحميل البيانات</p>
            <p className="mt-1 text-sm text-[#6b7f80]">{error}</p>
          </div>
          <button
            type="button"
            className="btn btn--primary inline-flex items-center gap-2"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <HiOutlineRefresh size={18} className={isFetching ? 'animate-spin' : undefined} aria-hidden />
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {!isLoading && !error ? (
      <div className="table-card">
        <div className="table-wrap">
          <table className="data-table sessions-table">
            <thead>
              <tr>
                <th>رقم الجلسة</th>
                <th>القضية</th>
                <th>المحكمة</th>
                <th>القاضي</th>
                <th>التاريخ</th>
                <th>الوقت</th>
                <th>نوع الجلسة</th>
                <th>القرار</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="data-table__empty">
                    لا توجد جلسات مطابقة
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.sessionNumber}</td>
                    <td>
                      <div className="session-case-cell">
                        <strong>{item.caseTitle}</strong>
                        <small>{item.caseNumber}</small>
                      </div>
                    </td>
                    <td>{item.court}</td>
                    <td>{item.judge || '—'}</td>
                    <td>{formatDisplayDate(item.date)}</td>
                    <td>{item.time || '—'}</td>
                    <td>
                      <span className="session-type">
                        <Icon name={typeIcon(item.type)} size={14} />
                        {item.type}
                      </span>
                    </td>
                    <td>{item.decision || '—'}</td>
                    <td>
                      <span className={statusClass(item.status)}>{item.status}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="action-btn action-btn--view"
                          title="التفاصيل"
                          onClick={() => setDetailsId(item.id)}
                        >
                          <Icon name="eye" size={16} />
                        </button>
                        {!isClient && (
                          <>
                            <button
                              type="button"
                              className="action-btn action-btn--edit"
                              title="تعديل"
                              onClick={() => openEdit(item.id)}
                            >
                              <Icon name="edit" size={16} />
                            </button>
                            <button
                              type="button"
                              className="action-btn action-btn--postpone"
                              title="تأجيل الجلسة"
                              aria-label={`تأجيل جلسة ${item.sessionNumber}`}
                              onClick={() => setPostponeId(item.id)}
                            >
                              <Icon name="refresh" size={16} />
                            </button>
                          </>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            className="action-btn action-btn--delete"
                            title="حذف"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : null}

      <section className="sessions-calendar">
        <header className="sessions-calendar__head">
          <h3>التقويم الشهري للجلسات</h3>
          <div className="sessions-calendar__nav">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                setCalendarMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                )
              }
            >
              السابق
            </button>
            <strong>{monthLabel}</strong>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() =>
                setCalendarMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                )
              }
            >
              التالي
            </button>
          </div>
        </header>
        <div className="sessions-calendar__weekdays">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="sessions-calendar__grid">
          {calendarDays.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="sessions-calendar__cell is-empty" />
            const key = toKey(day)
            const daySessions = sessionsByDay[key] || []
            const isToday = key === todayKey
            return (
              <div
                key={key}
                className={`sessions-calendar__cell${isToday ? ' is-today' : ''}${daySessions.length ? ' has-sessions' : ''}`}
              >
                <span className="sessions-calendar__day">{day.getDate()}</span>
                {daySessions.slice(0, 2).map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    className="sessions-calendar__chip"
                    onClick={() => setDetailsId(session.id)}
                  >
                    #{session.sessionNumber} {session.caseTitle}
                  </button>
                ))}
                {daySessions.length > 2 ? (
                  <span className="sessions-calendar__more">+{daySessions.length - 2}</span>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>

      <SessionFormModal
        open={formOpen}
        session={editingSession}
        onClose={() => {
          setFormOpen(false)
          setEditingId(null)
        }}
        onSave={handleSave}
        caseOptions={caseOptionsForFilter}
        lawyerOptions={lawyerOptions}
        hideLawyer={isLawyer || isClient}
        submitting={submitting}
      />
      <SessionDetailsModal
        open={Boolean(detailsSession)}
        session={detailsSession}
        onClose={() => setDetailsId(null)}
      />
      <PostponeSessionModal
        open={Boolean(postponeSession)}
        session={postponeSession}
        onClose={() => setPostponeId(null)}
        onPostpone={handlePostpone}
      />
    </div>
  )
}
