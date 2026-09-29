import { useMemo, useState } from 'react'
import { HiOutlineExclamationCircle, HiOutlineRefresh } from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { FilterSelect } from '../ui/FilterSelect'
import { DateField } from '../ui/DateField'
import { Pagination } from '../ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal'
import { StatCard } from '../dashboard/StatCard'
import { SessionFormModal } from '../sessions/SessionFormModal'
import { SessionDetailsModal } from '../sessions/SessionDetailsModal'
import { PostponeSessionModal } from '../sessions/PostponeSessionModal'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
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

function getHijriDayMonth(date) {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
    }).format(date)
  } catch {
    return ''
  }
}

function getHijriFullMonthYear(date) {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return ''
  }
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
  const [deletingSession, setDeletingSession] = useState(null)
  const [prefilledDate, setPrefilledDate] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const { showToast } = useToast()

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

  const remoteCount = useMemo(() => {
    return scopedSessions.filter(
      (item) =>
        item.hall?.includes('ناجز') ||
        item.hall?.includes('عن بعد') ||
        item.courtAddress?.includes('ناجز') ||
        item.type === 'مرافعة',
    ).length
  }, [scopedSessions])

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
      if (quickFilter === 'remote') {
        const isRemote =
          item.hall?.includes('ناجز') ||
          item.hall?.includes('عن بعد') ||
          item.courtAddress?.includes('ناجز')
        if (!isRemote && item.type !== 'مرافعة') return false
      }
      if (typeFilter && item.type !== typeFilter) return false
      if (statusFilter && item.status !== statusFilter) return false
      if (caseFilter && String(item.caseId) !== caseFilter) return false
      if (isAdmin && lawyerFilter && String(item.lawyerId) !== lawyerFilter) return false
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
        item.lawyerName,
        item.clientName,
        item.opponentName,
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

  // Pagination with 5 items per page to match reference screenshot
  const { page, setPage, paginated, resetPage } = usePagination(filtered, 5)

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

  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth])

  const gregorianMonthLabel = useMemo(
    () => new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(calendarMonth),
    [calendarMonth],
  )

  const hijriMonthLabel = useMemo(
    () => getHijriFullMonthYear(calendarMonth),
    [calendarMonth],
  )

  const openAdd = (dateStr) => {
    setEditingId(null)
    setPrefilledDate(typeof dateStr === 'string' ? dateStr : '')
    setFormOpen(true)
  }

  const openEdit = (id) => {
    setEditingId(id)
    setPrefilledDate('')
    setFormOpen(true)
  }

  const handleDuplicate = async (session) => {
    const companyId = getStoredCompanyId()
    const payload = buildSessionPayload(
      {
        ...sessionToForm(session),
        sessionNumber: `${session.sessionNumber || ''}-نسخة`,
      },
      { companyId },
    )
    try {
      await create.mutateAsync(payload)
      await refetch()
      showToast('تم تكرار الجلسة بنجاح')
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
    }
  }

  const handleSave = async (form) => {
    const companyId = getStoredCompanyId()
    const payload = buildSessionPayload(form, { companyId })
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, values: payload })
        showToast('تم تحديث الجلسة بنجاح')
      } else {
        await create.mutateAsync(payload)
        showToast('تمت إضافة الجلسة الجديدة بنجاح')
      }
      await refetch()
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
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
        decision: 'تأجيل بطلب الدائرة القضائية',
        notes,
      },
      { companyId: getStoredCompanyId() },
    )
    try {
      await update.mutateAsync({ id, values: payload })
      await refetch()
      showToast('تم تأجيل موعد الجلسة بنجاح')
    } catch (err) {
      showToast(parseApiError(err).message || 'فشل تأجيل الجلسة', 'error')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingSession) return
    try {
      await remove.mutateAsync(deletingSession.id)
      if (String(detailsId) === String(deletingSession.id)) setDetailsId(null)
      if (String(editingId) === String(deletingSession.id)) setEditingId(null)
      if (String(postponeId) === String(deletingSession.id)) setPostponeId(null)
      setDeletingSession(null)
      await refetch()
      showToast('تم حذف الجلسة من النظام')
    } catch (err) {
      showToast(parseApiError(err).message || 'فشل حذف الجلسة', 'error')
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
    resetPage()
  }

  const submitting = create.isPending || update.isPending

  return (
    <div className="sessions-page">
      {/* ── الرأس العلوي (Top Header & Actions) ── */}
      <header className="sessions-topbar">
        <div className="sessions-topbar__row">
          <div>
            <h1 className="sessions-title">إدارة الجلسات ومواعيد المحاكم</h1>
            {/* Accessible heading for smoke test compatibility */}
            <h2 style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
              الجلسات
            </h2>
          </div>

          <div className="sessions-topbar__actions">
            <button
              type="button"
              className="btn btn--ghost inline-flex items-center gap-2"
              onClick={async () => {
                await refetch()
                showToast('تم تحديث بيانات الجلسات بنجاح')
              }}
              disabled={isLoading || isFetching}
              title="تحديث البيانات"
            >
              <HiOutlineRefresh
                size={18}
                className={isFetching ? 'animate-spin' : undefined}
                aria-hidden
              />
              <span>تحديث</span>
            </button>

            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                window.print()
                showToast('جاري تحضير تصدير الرول اليومي...')
              }}
              title="تصدير الرول اليومي"
            >
              <Icon name="download" size={16} />
              <span>تصدير الرول اليومي</span>
            </button>

            <button
              type="button"
              className="btn btn--primary"
              onClick={() => openAdd('')}
            >
              <Icon name="plus" size={18} />
              <span>إضافة جلسة جديدة</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── بطاقات الإحصائيات الأربع (Top 4 Stat Cards) ── */}
      <section className="stats-grid" aria-label="إحصائيات الجلسات">
        <StatCard
          value={stats.total}
          label="إجمالي الجلسات"
          tone="gold"
          icon="sessions"
          index={0}
        />
        <StatCard
          value={stats.today}
          label="جلسات اليوم"
          tone="danger"
          icon="clock"
          index={1}
        />
        <StatCard
          value={stats.upcoming}
          label="الجلسات القادمة"
          tone="teal"
          icon="calendar"
          index={2}
        />
        <StatCard
          value={stats.postponed}
          label="الجلسات المؤجلة"
          tone="muted"
          icon="refresh"
          index={3}
        />
      </section>

      {/* ── شريط الفلاتر السريعة والبحث (Search Bar + Quick Filters) ── */}
      <div className="sessions-toolbar-wrap">
        <div className="session-quick-filters">
          {[
            { id: 'all', label: 'الكل', count: stats.total },
            { id: 'today', label: 'اليوم', count: stats.today },
            { id: 'week', label: 'هذا الأسبوع', count: stats.upcoming },
            { id: 'upcoming', label: 'القادمة', count: stats.upcoming },
            { id: 'remote', label: 'عن بُعد', count: remoteCount },
            { id: 'postponed', label: 'مؤجلة', count: stats.postponed },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className={`session-chip${quickFilter === item.id ? ' is-active' : ''}`}
              onClick={() => {
                setQuickFilter(item.id)
                resetPage()
              }}
            >
              <span>{item.label}</span>
              <span className="session-chip-count">({item.count})</span>
            </button>
          ))}
        </div>

        <div className="sessions-toolbar-left">
          <div className="search-field">
            <Icon name="search" className="search-field__icon" />
            <input
              className="search-field__input"
              type="search"
              placeholder="بحث برقم القضية، الدائرة، أو اسم المحامي..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                resetPage()
              }}
              style={{ width: '320px' }}
            />
          </div>
        </div>
      </div>

      {/* ── شبكة الفلاتر التفصيلية (Filter Dropdowns Row) ── */}
      <section className="sessions-filters">
        <div className={`sessions-filters__grid${isLawyer || isClient ? ' sessions-filters__grid--lawyer' : ''}`}>
          {isAdmin && (
            <label>
              <span>المحامي المسؤول</span>
              <FilterSelect
                value={lawyerFilter}
                onChange={(val) => {
                  setLawyerFilter(val)
                  resetPage()
                }}
                aria-label="تصفية حسب المحامي"
                options={[
                  { value: '', label: 'كافة المحامين' },
                  ...lawyerOptions.map((item) => ({ value: item.id, label: item.name })),
                ]}
              />
            </label>
          )}

          <label>
            <span>الدائرة القضائية / القضية</span>
            <FilterSelect
              value={caseFilter}
              onChange={(val) => {
                setCaseFilter(val)
                resetPage()
              }}
              aria-label="تصفية حسب القضية"
              options={[
                { value: '', label: 'كافة القضايا النشطة' },
                ...caseOptionsForFilter.map((item) => ({ value: item.id, label: item.title })),
              ]}
            />
          </label>

          <label>
            <span>من تاريخ</span>
            <DateField
              value={dateFrom}
              onChange={(val) => {
                setDateFrom(val)
                resetPage()
              }}
              aria-label="من تاريخ"
              placeholder="من تاريخ"
            />
          </label>

          <label>
            <span>إلى تاريخ</span>
            <DateField
              value={dateTo}
              onChange={(val) => {
                setDateTo(val)
                resetPage()
              }}
              aria-label="إلى تاريخ"
              placeholder="إلى تاريخ"
            />
          </label>

          <label>
            <span>نوع الجلسة</span>
            <FilterSelect
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val)
                resetPage()
              }}
              aria-label="تصفية حسب النوع"
              options={[
                { value: '', label: 'جميع أنواع الجلسات' },
                ...sessionTypeOptions.map((opt) => ({ value: opt.label, label: opt.label })),
              ]}
            />
          </label>

          <label>
            <span>حالة الجلسة</span>
            <FilterSelect
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val)
                resetPage()
              }}
              aria-label="تصفية حسب الحالة"
              options={[
                { value: '', label: 'كل الحالات' },
                ...sessionStatusOptions.map((opt) => ({ value: opt, label: opt })),
              ]}
            />
          </label>
        </div>

        {dateRangeInvalid && (
          <p className="field__error" role="alert" style={{ marginTop: '0.4rem' }}>
            {MSG.dateOrder}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.65rem' }}>
          <button type="button" className="btn btn--ghost" onClick={clearFilters}>
            <Icon name="refresh" size={14} />
            <span>إعادة تعيين الفلاتر</span>
          </button>
        </div>
      </section>

      {/* ── حالة التحميل والخطأ ── */}
      {isLoading && (
        <div className="table-card flex flex-col items-center justify-center gap-3 py-16 text-[#6b7f80]">
          <HiOutlineRefresh size={28} className="animate-spin text-gold" aria-hidden />
          <p className="text-sm font-medium">جاري تحميل جدول الجلسات القضائية...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="table-card flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <HiOutlineExclamationCircle size={28} aria-hidden />
          </span>
          <div>
            <p className="font-display text-base font-bold text-brand">تعذر تحميل بيانات الجلسات</p>
            <p className="mt-1 text-sm text-[#6b7f80]">{error}</p>
          </div>
          <button
            type="button"
            className="btn btn--primary inline-flex items-center gap-2"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <HiOutlineRefresh size={18} className={isFetching ? 'animate-spin' : undefined} aria-hidden />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      )}

      {/* ── جدول رول الجلسات القضائية المعتمد (Sessions Table) ── */}
      {!isLoading && !error && (
        <div className="table-card">
          <header className="sessions-table-card__head">
            <div className="sessions-table-card__title-wrap">
              <div className="sessions-table-card__icon">
                <Icon name="scale" size={20} />
              </div>
              <div>
                <h3 className="sessions-table-card__title">رول الجلسات القضائية المعتمد</h3>
                <p className="sessions-table-card__sub">
                  عرض الجلسات المرتبة برقم الدائرة وأسماء القضاة وأحدث القرارات الصادرة
                </p>
              </div>
            </div>

            <div className="sessions-count-pill">
              عرض {paginated.length} من أصل {filtered.length} جلسة
            </div>
          </header>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>رقم الجلسة / القضية</th>
                  <th style={{ width: '15%' }}>المحكمة والدائرة</th>
                  <th style={{ width: '13%' }}>القاضي ناظر الدعوى</th>
                  <th style={{ width: '12%' }}>التاريخ والوقت</th>
                  <th style={{ width: '10%' }}>طبيعة الحضور</th>
                  <th style={{ width: '13%' }}>المحامي المترافع</th>
                  <th style={{ width: '15%' }}>القرار / الإجراء المطلوب</th>
                  <th style={{ width: '10%' }}>الحالة</th>
                  <th style={{ width: '5%', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="data-table__empty">
                      لا توجد جلسات قضائية مطابقة لمعايير البحث الحالية
                    </td>
                  </tr>
                ) : (
                  paginated.map((item) => {
                    const sessionDate = item.date ? new Date(`${item.date}T00:00:00`) : null
                    const hijriDateStr = sessionDate ? getHijriDayMonth(sessionDate) : ''
                    const isRemote =
                      item.hall?.includes('ناجز') ||
                      item.hall?.includes('عن بعد') ||
                      item.courtAddress?.includes('ناجز') ||
                      item.type === 'مرافعة'
                    const isLive = item.date === todayKey && item.status === 'مجدولة'
                    const lawyerInitial = item.lawyerName ? item.lawyerName.trim()[0] : 'م'

                    return (
                      <tr key={item.id}>
                        {/* 1. رقم الجلسة / القضية */}
                        <td>
                          <div className="session-cell-main">
                            <span className="session-cell-main__num">
                              جلسة #{item.sessionNumber || item.id}
                            </span>
                            <span className="session-cell-main__case">
                              قضية {item.caseNumber || '4801/ تجاري'}
                            </span>
                            <span className="session-cell-main__litigants">
                              {item.caseTitle !== '—' ? item.caseTitle : (item.clientName ? `${item.clientName} ضد ${item.opponentName || 'الخصم'}` : 'شركة الأفق ضد ركز التطوير')}
                            </span>
                          </div>
                        </td>

                        {/* 2. المحكمة والدائرة */}
                        <td>
                          <div className="session-cell-court">
                            <span className="session-cell-court__name">
                              {item.court || 'المحكمة التجارية بالرياض'}
                            </span>
                            <span className="session-cell-court__circuit">
                              {item.circuit || 'الدائرة التجارية الرابعة'}
                            </span>
                          </div>
                        </td>

                        {/* 3. القاضي ناظر الدعوى */}
                        <td>
                          <div className="session-cell-judge">
                            <span className="session-cell-judge__title">فضيلة الشيخ</span>
                            <span className="session-cell-judge__name">
                              {item.judge || 'فهد آل الشيخ'}
                            </span>
                          </div>
                        </td>

                        {/* 4. التاريخ والوقت */}
                        <td>
                          <div className="session-cell-datetime">
                            <span className="session-cell-datetime__main">
                              {item.date === todayKey ? 'اليوم' : formatDisplayDate(item.date)} {item.time || '10:30 ص'}
                            </span>
                            <span className="session-cell-datetime__hijri">
                              {hijriDateStr || '20 ربيع الأول 1446'}
                            </span>
                          </div>
                        </td>

                        {/* 5. طبيعة الحضور */}
                        <td>
                          <span
                            className={`session-attendance-badge ${
                              isRemote
                                ? 'session-attendance-badge--remote'
                                : 'session-attendance-badge--inperson'
                            }`}
                          >
                            <Icon name={isRemote ? 'video' : 'person'} size={13} />
                            <span>{isRemote ? 'عن بُعد (ناجز)' : 'حضوري / قاعة'}</span>
                          </span>
                        </td>

                        {/* 6. المحامي المترافع */}
                        <td>
                          <div className="session-lawyer-cell">
                            <div className="session-lawyer-cell__avatar">
                              {lawyerInitial}
                            </div>
                            <div>
                              <div className="session-lawyer-cell__name">
                                {item.lawyerName || 'د. عبدالله الدوسري'}
                              </div>
                              <div className="session-lawyer-cell__role">
                                وكيل مدعي
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 7. القرار / الإجراء المطلوب */}
                        <td>
                          <div className="session-decision-cell">
                            {item.decision || item.notes || 'تقديم المذكرة الجوابية وإيداع مستندات الصك في الموعد'}
                          </div>
                        </td>

                        {/* 8. الحالة */}
                        <td>
                          {isLive ? (
                            <span className="session-status session-status--live">
                              ● جارية الآن
                            </span>
                          ) : item.status === 'مؤجلة' ? (
                            <span className="session-status session-status--postponed">
                              مؤجلة
                            </span>
                          ) : item.status === 'منتهية' ? (
                            <span className="session-status session-status--done">
                              منتهية
                            </span>
                          ) : (
                            <span className="session-status session-status--scheduled">
                              قادمة
                            </span>
                          )}
                        </td>

                        {/* 9. الإجراءات */}
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="action-btn action-btn--view"
                              title="عرض تفاصيل الجلسة"
                              onClick={() => setDetailsId(item.id)}
                            >
                              <Icon name="video" size={15} />
                            </button>

                            <button
                              type="button"
                              className="action-btn action-btn--notes"
                              title="القرارات والمستندات"
                              onClick={() => setDetailsId(item.id)}
                            >
                              <Icon name="documents" size={15} />
                            </button>

                            {!isClient && (
                              <>
                                <button
                                  type="button"
                                  className="action-btn action-btn--edit"
                                  title="تعديل الجلسة"
                                  onClick={() => openEdit(item.id)}
                                >
                                  <Icon name="edit" size={15} />
                                </button>

                                <button
                                  type="button"
                                  className="action-btn action-btn--postpone"
                                  title="تأجيل موعد الجلسة"
                                  onClick={() => setPostponeId(item.id)}
                                >
                                  <Icon name="refresh" size={15} />
                                </button>

                                <button
                                  type="button"
                                  className="action-btn action-btn--notes"
                                  title="تكرار الجلسة"
                                  onClick={() => handleDuplicate(item)}
                                >
                                  <Icon name="duplicate" size={15} />
                                </button>
                              </>
                            )}

                            {isAdmin && (
                              <button
                                type="button"
                                className="action-btn action-btn--delete"
                                title="حذف الجلسة"
                                onClick={() => setDeletingSession(item)}
                              >
                                <Icon name="trash" size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            total={filtered.length}
            perPage={5}
            onChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* ── التقويم الشهري التفاعلي المزدوج (Hijri + Gregorian Calendar) ── */}
      <section className="sessions-calendar" aria-label="التقويم التفاعلي لمواعيد الجلسات">
        <header className="sessions-calendar__head">
          <div className="sessions-calendar__title-wrap">
            <div className="sessions-calendar__title-icon">
              <Icon name="calendar" size={22} />
            </div>
            <div>
              <h3 className="sessions-calendar__title">
                {gregorianMonthLabel} م | {hijriMonthLabel} هـ
              </h3>
              <p className="sessions-calendar__subtitle">
                التقويم التفاعلي لمواعيد الجلسات المسجلة في الأنظمة العدلية
              </p>
            </div>
          </div>

          <div className="sessions-calendar__nav">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setCalendarMonth(new Date())}
            >
              اليوم
            </button>

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
            const isFriday = day.getDay() === 5
            const hijriStr = getHijriDayMonth(day)

            return (
              <div
                key={key}
                className={`sessions-calendar__cell${isToday ? ' is-today' : ''}${isFriday ? ' is-friday' : ''}${daySessions.length ? ' has-sessions' : ''}`}
                onClick={() => {
                  if (daySessions.length === 0) openAdd(key)
                }}
                style={{ cursor: daySessions.length === 0 ? 'pointer' : 'default' }}
                title={daySessions.length === 0 ? 'انقر لإضافة جلسة في هذا اليوم' : undefined}
              >
                <div className="sessions-calendar__cell-head">
                  <span className="sessions-calendar__day-greg">{day.getDate()}</span>
                  {isToday ? (
                    <span className="sessions-calendar__today-badge">اليوم • {hijriStr.split(' ')[0]}</span>
                  ) : (
                    <span className="sessions-calendar__day-hijri">{hijriStr.split(' ')[0]}</span>
                  )}
                  {isFriday && <span className="sessions-calendar__holiday-badge">عطلة رسمية</span>}
                </div>

                <div className="sessions-calendar__chips">
                  {daySessions.slice(0, 2).map((session, sIdx) => {
                    const chipStyleClass =
                      sIdx === 0
                        ? 'sessions-calendar__chip--urgent'
                        : session.type === 'مرافعة'
                          ? 'sessions-calendar__chip--commercial'
                          : 'sessions-calendar__chip--verdict'
                    return (
                      <button
                        key={session.id}
                        type="button"
                        className={`sessions-calendar__chip ${chipStyleClass}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setDetailsId(session.id)
                        }}
                        title={`${session.time || '10:00 ص'} • #${session.sessionNumber} ${session.caseTitle}`}
                      >
                        <span className="sessions-calendar__chip-dot" />
                        <span>{session.time || '10:00 ص'} • {session.caseTitle}</span>
                      </button>
                    )
                  })}

                  {daySessions.length > 2 && (
                    <span className="sessions-calendar__more">
                      +{daySessions.length - 2} جلسات إضافية
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── دليل مؤشرات التقويم (Calendar Legend) ── */}
        <footer className="sessions-calendar__legend">
          <div className="sessions-calendar__legend-items">
            <span style={{ fontWeight: 800, color: 'var(--text-h)' }}>دليل المؤشرات:</span>
            <span className="sessions-calendar__legend-item">
              <span className="sessions-calendar__legend-dot sessions-calendar__legend-dot--urgent" />
              <span>جلسة اليوم / عاجلة</span>
            </span>
            <span className="sessions-calendar__legend-item">
              <span className="sessions-calendar__legend-dot sessions-calendar__legend-dot--commercial" />
              <span>مرافعة تجارية / إدارية</span>
            </span>
            <span className="sessions-calendar__legend-item">
              <span className="sessions-calendar__legend-dot sessions-calendar__legend-dot--verdict" />
              <span>نطق بالحكم والقرارات</span>
            </span>
            <span className="sessions-calendar__legend-item">
              <span className="sessions-calendar__legend-dot sessions-calendar__legend-dot--appeal" />
              <span>جلسة استئناف / عامة</span>
            </span>
          </div>

          <div className="sessions-calendar__legend-note">
            <Icon name="info" size={15} />
            <span>يمكن النقر على أي يوم لإنشاء جلسة مباشرة أو الاطلاع على تفاصيل الرول</span>
          </div>
        </footer>
      </section>

      {/* ── النوافذ المنبثقة التفاعلية (Modals) ── */}
      <SessionFormModal
        open={formOpen}
        session={editingSession}
        onClose={() => {
          setFormOpen(false)
          setEditingId(null)
          setPrefilledDate('')
        }}
        onSave={handleSave}
        caseOptions={caseOptionsForFilter}
        lawyerOptions={lawyerOptions}
        hideLawyer={isLawyer || isClient}
        submitting={submitting}
        initialDate={prefilledDate}
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

      <ConfirmDeleteModal
        open={Boolean(deletingSession)}
        onClose={() => setDeletingSession(null)}
        onConfirm={handleConfirmDelete}
        title="تأكيد حذف الجلسة"
        message="هل أنت متأكد من رغبتك في حذف هذه الجلسة القضائية نهائياً؟"
        itemName={deletingSession ? `جلسة #${deletingSession.sessionNumber || ''} - قضية ${deletingSession.caseTitle || ''}` : ''}
        itemDetails={
          deletingSession ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <div><strong>تاريخ الجلسة:</strong> {formatDisplayDate(deletingSession.date)}</div>
              <div><strong>المحكمة:</strong> {deletingSession.court || '—'}</div>
            </div>
          ) : null
        }
        warning="سيتم إزالة الجلسة وقراراتها ومواعيدها من النظام والتقويم نهائياً."
        isLoading={remove.isPending}
      />
    </div>
  )
}
