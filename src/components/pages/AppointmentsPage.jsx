import { useEffect, useMemo, useState } from 'react'
import { HiOutlineExclamationCircle, HiOutlineRefresh } from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { FilterSelect } from '../ui/FilterSelect'
import { DateField } from '../ui/DateField'
import { AppointmentFormModal } from '../appointments/AppointmentFormModal'
import { AppointmentDetailsModal } from '../appointments/AppointmentDetailsModal'
import { AssignLawyerModal } from '../appointments/AssignLawyerModal'
import { ConfirmAppointmentModal } from '../appointments/ConfirmAppointmentModal'
import { RescheduleAppointmentModal } from '../appointments/RescheduleAppointmentModal'
import { useAuth } from '../../context/AuthContext'
import { isSamePerson } from '../../data/roles'
import { useAppointments, useAppointmentMutations } from '../../hooks/useAppointments'
import { useClients } from '../../hooks/useClients'
import { useLawyers } from '../../hooks/useLawyers'
import { useCases } from '../../hooks/useCases'
import {
  appointmentStatusOptions,
  appointmentTypeOptions,
  appointmentToForm,
  buildAppointmentPayload,
  parseApiError,
} from '../../api/appointments'
import { getStoredCompanyId } from '../../api/client'
import { formatDisplayDate } from '../../utils/formatDisplay'
import { isValidDateOrder, MSG } from '../../utils/validation'

export default function AppointmentsPage() {
  const { user } = useAuth()
  const isLawyer = user?.roleId === 'lawyer'
  const isClient = user?.roleId === 'client'
  const isAdmin = !isLawyer && !isClient

  const { appointments, isLoading, isFetching, error, refetch } = useAppointments()
  const { clients } = useClients()
  const { lawyers } = useLawyers()
  const { cases } = useCases()
  const { create, update, remove } = useAppointmentMutations()

  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [lawyerId, setLawyerId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [detailsId, setDetailsId] = useState(null)
  const [assignId, setAssignId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [rescheduleId, setRescheduleId] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const id = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(id)
  }, [toast])

  const showToast = (text, tone = 'success') => setToast({ text, tone })

  const clientOptions = useMemo(
    () => clients.map((item) => ({ id: String(item.id), name: item.name })),
    [clients],
  )

  const lawyerOptions = useMemo(
    () => lawyers.map((item) => ({ id: String(item.id), name: item.name })),
    [lawyers],
  )

  const caseOptions = useMemo(
    () =>
      cases.map((item) => ({
        id: String(item.id),
        title: item.title,
        number: item.number || item.case_number || '',
      })),
    [cases],
  )

  const clientRecord = useMemo(
    () => clients.find((item) => isSamePerson(item.name, user?.name)) || null,
    [clients, user?.name],
  )

  const clientCaseOptions = useMemo(() => {
    if (!isClient) return caseOptions
    return caseOptions.filter((item) => {
      const legalCase = cases.find((c) => String(c.id) === item.id)
      if (!legalCase) return false
      if (clientRecord && legalCase.client_id === clientRecord.id) return true
      return isSamePerson(legalCase.client?.full_name, user?.name)
    })
  }, [isClient, clientRecord, caseOptions, cases, user?.name])

  const scoped = useMemo(() => {
    if (isLawyer) {
      return appointments.filter((item) => isSamePerson(item.lawyerName, user?.name))
    }
    if (isClient) {
      return appointments.filter((item) => isSamePerson(item.clientName, user?.name))
    }
    return appointments
  }, [appointments, isLawyer, isClient, user?.name])

  const dateRangeInvalid = useMemo(
    () => Boolean(dateFrom && dateTo && !isValidDateOrder(dateFrom, dateTo)),
    [dateFrom, dateTo],
  )

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return scoped.filter((item) => {
      if (type && item.type !== type) return false
      if (status && item.status !== status) return false
      if (isAdmin) {
        if (lawyerId === 'none' && item.lawyerId) return false
        if (lawyerId && lawyerId !== 'none' && item.lawyerId !== lawyerId) {
          return false
        }
      }
      if (!dateRangeInvalid) {
        if (dateFrom && item.date < dateFrom) return false
        if (dateTo && item.date > dateTo) return false
      }
      if (!normalized) return true
      return [
        item.clientName,
        item.clientPhone,
        item.lawyerName,
        item.caseTitle,
        item.notes,
        item.type,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    })
  }, [scoped, query, type, status, lawyerId, dateFrom, dateTo, dateRangeInvalid, isAdmin])

  const editingAppointment =
    appointments.find((item) => item.id === editingId) || null
  const detailsAppointment =
    appointments.find((item) => item.id === detailsId) || null
  const assignAppointment =
    appointments.find((item) => item.id === assignId) || null
  const confirmAppointment =
    appointments.find((item) => item.id === confirmId) || null
  const rescheduleAppointment =
    appointments.find((item) => item.id === rescheduleId) || null

  const openNew = () => {
    setEditingId(null)
    setFormOpen(true)
  }

  const openEdit = (id) => {
    setEditingId(id)
    setFormOpen(true)
  }

  const companyId = getStoredCompanyId()

  const handleSave = async (form) => {
    const selfLawyer = lawyers.find((item) => isSamePerson(item.name, user?.name))
    let formWithDefaults = form
    if (isLawyer && selfLawyer) {
      formWithDefaults = { ...form, lawyerId: String(selfLawyer.id) }
    }
    if (isClient && clientRecord) {
      formWithDefaults = {
        ...formWithDefaults,
        clientId: String(clientRecord.id),
      }
    }

    const payload = buildAppointmentPayload(formWithDefaults, { companyId })

    try {
      if (!editingId) {
        if (!payload.status) payload.status = isClient ? 'قيد الانتظار' : 'معلق'
        await create.mutateAsync(payload)
        showToast('تم حجز الموعد بنجاح')
      } else {
        const existing = appointments.find((item) => item.id === editingId)
        await update.mutateAsync({
          id: editingId,
          values: {
            ...payload,
            status: existing?.status,
          },
        })
        showToast('تم تحديث الموعد بنجاح')
      }
      await refetch()
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
    }
  }

  const handleAssign = async (id, selectedLawyerId) => {
    const appointment = appointments.find((item) => item.id === id)
    if (!appointment) return
    const form = {
      ...appointmentToForm(appointment),
      lawyerId: selectedLawyerId,
    }
    const payload = buildAppointmentPayload(form, { companyId })
    try {
      await update.mutateAsync({ id, values: payload })
      showToast('تم تعيين المحامي بنجاح')
      await refetch()
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
    }
  }

  const handleReschedule = async (id, { date, time, reason }) => {
    const appointment = appointments.find((item) => item.id === id)
    if (!appointment) return
    const notes = reason
      ? `طلب تغيير: ${reason}${appointment.notes ? ` | ${appointment.notes}` : ''}`
      : appointment.notes
    const form = {
      ...appointmentToForm(appointment),
      date,
      time,
    }
    const payload = {
      ...buildAppointmentPayload(form, { companyId }),
      status: 'قيد الانتظار',
      notes,
    }
    try {
      await update.mutateAsync({ id, values: payload })
      showToast('تم إرسال طلب تغيير الموعد')
      await refetch()
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
    }
  }

  const handleConfirm = async (id) => {
    try {
      await update.mutateAsync({ id, values: { status: 'مؤكد' } })
      showToast('تم تأكيد الموعد')
      await refetch()
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      await remove.mutateAsync(id)
      if (detailsId === id) setDetailsId(null)
      if (editingId === id) {
        setEditingId(null)
        setFormOpen(false)
      }
      showToast('تم حذف الموعد بنجاح')
      await refetch()
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
    }
  }

  const clearFilters = () => {
    setQuery('')
    setType('')
    setStatus('')
    setLawyerId('')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="appointments-page">
      <div className="cases-toolbar appointments-titlebar">
        <h2 className="cases-toolbar__title">المواعيد</h2>
        <button type="button" className="btn btn--primary" onClick={openNew}>
          <Icon name="plus" size={18} />
          حجز موعد
        </button>
      </div>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={
            toast.tone === 'success'
              ? 'mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
              : 'mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800'
          }
        >
          <p className="font-medium">{toast.text}</p>
        </div>
      ) : null}

      <section className="appointments-filters">
        <div className="appointments-filters__grid">
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
              value={type}
              onChange={setType}
              aria-label="تصفية حسب النوع"
              options={[
                { value: '', label: 'كل الأنواع' },
                ...appointmentTypeOptions.map((option) => ({ value: option, label: option })),
              ]}
            />
          </label>
          <label>
            <span>الحالة</span>
            <FilterSelect
              value={status}
              onChange={setStatus}
              aria-label="تصفية حسب الحالة"
              options={[
                { value: '', label: 'كل الحالات' },
                ...appointmentStatusOptions.map((option) => ({ value: option, label: option })),
              ]}
            />
          </label>
          {isAdmin && (
            <label>
              <span>المحامي</span>
              <FilterSelect
                value={lawyerId}
                onChange={setLawyerId}
                aria-label="تصفية حسب المحامي"
                options={[
                  { value: '', label: 'كل المحامين' },
                  { value: 'none', label: 'بدون محامي' },
                  ...lawyerOptions.map((lawyer) => ({ value: lawyer.id, label: lawyer.name })),
                ]}
              />
            </label>
          )}
          <label className="appointments-filters__search">
            <span>بحث</span>
            <div className="search-field">
              <Icon name="search" className="search-field__icon" />
              <input
                className="search-field__input"
                type="search"
                placeholder={
                  isClient
                    ? 'بحث في المواعيد...'
                    : 'اسم الموكل، الهاتف، القضية...'
                }
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
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
          <p className="text-sm font-medium">جاري تحميل المواعيد...</p>
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
          <table className="data-table appointments-table">
            <thead>
              <tr>
                <th>النوع</th>
                <th>التاريخ</th>
                <th>الوقت</th>
                <th>{isClient ? 'المحامي' : 'الموكل'}</th>
                <th>الملاحظات</th>
                <th>القضية</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="data-table__empty">
                    لا توجد مواعيد مطابقة
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="appointment-type">
                        <Icon name="calendar" size={15} />
                        {item.type}
                      </span>
                    </td>
                    <td>{formatDisplayDate(item.date)}</td>
                    <td>
                      <span className="appointment-time">
                        <Icon name="clock" size={14} />
                        {item.time}
                      </span>
                    </td>
                    <td>
                      <div className="appointment-client">
                        <strong>
                          {isClient
                            ? item.lawyerName || 'بانتظار التعيين'
                            : item.clientName}
                        </strong>
                        {!isClient ? (
                          <small>{item.clientPhone || '—'}</small>
                        ) : null}
                      </div>
                    </td>
                    <td>{item.notes || 'لا توجد ملاحظات'}</td>
                    <td>{item.caseTitle || 'بدون قضية'}</td>
                    <td>
                      <span className={`appointment-status appointment-status--${statusKey(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {!isClient && (
                          <button
                            type="button"
                            className="action-btn action-btn--confirm"
                            title="تأكيد الموعد"
                            aria-label={`تأكيد موعد ${item.clientName}`}
                            onClick={() => setConfirmId(item.id)}
                          >
                            <Icon name="check" size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="action-btn action-btn--view"
                          title="عرض التفاصيل"
                          onClick={() => setDetailsId(item.id)}
                        >
                          <Icon name="eye" size={16} />
                        </button>
                        {isClient ? (
                          <button
                            type="button"
                            className="action-btn action-btn--edit"
                            title="طلب تغيير موعد"
                            onClick={() => setRescheduleId(item.id)}
                          >
                            <Icon name="refresh" size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="action-btn action-btn--edit"
                            title="تعديل الموعد"
                            onClick={() => openEdit(item.id)}
                          >
                            <Icon name="edit" size={16} />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            className="action-btn action-btn--assign"
                            title="تعيين محامي"
                            onClick={() => setAssignId(item.id)}
                          >
                            <Icon name="lawyers" size={16} />
                          </button>
                        )}
                        {!isClient && (
                          <button
                            type="button"
                            className="action-btn action-btn--delete"
                            title="حذف الموعد"
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

      <AppointmentFormModal
        open={formOpen}
        appointment={editingAppointment}
        onClose={() => {
          setFormOpen(false)
          setEditingId(null)
        }}
        onSave={handleSave}
        mode={isClient ? 'client' : 'admin'}
        lockedClientId={clientRecord ? String(clientRecord.id) : ''}
        clientOptions={clientOptions}
        lawyerOptions={lawyerOptions}
        caseOptions={clientCaseOptions}
      />
      <AppointmentDetailsModal
        open={Boolean(detailsAppointment)}
        appointment={detailsAppointment}
        onClose={() => setDetailsId(null)}
      />
      <AssignLawyerModal
        open={Boolean(assignAppointment)}
        appointment={assignAppointment}
        onClose={() => setAssignId(null)}
        onAssign={handleAssign}
        lawyerOptions={lawyerOptions}
      />
      <ConfirmAppointmentModal
        open={Boolean(confirmAppointment)}
        appointment={confirmAppointment}
        onClose={() => setConfirmId(null)}
        onConfirm={handleConfirm}
      />
      <RescheduleAppointmentModal
        open={Boolean(rescheduleAppointment)}
        appointment={rescheduleAppointment}
        onClose={() => setRescheduleId(null)}
        onSubmit={handleReschedule}
      />
    </div>
  )
}

function statusKey(status) {
  if (status === 'مؤكد') return 'confirmed'
  if (status === 'ملغي') return 'cancelled'
  if (status === 'قيد الانتظار') return 'waiting'
  return 'pending'
}
