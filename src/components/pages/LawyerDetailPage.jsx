import { Link, useNavigate, useParams } from 'react-router-dom'
import { HiOutlineExclamationCircle, HiOutlineRefresh } from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { useLawyer } from '../../hooks/useLawyers'
import { useCases } from '../../hooks/useCases'
import { useAppointments } from '../../hooks/useAppointments'
import { caseStatusLabel } from '../../api/cases'
import { formatDisplayDate } from '../../utils/formatDisplay'

function display(value) {
  if (value === 0) return '0'
  return value || '—'
}

function initials(name) {
  if (!name || name === '—') return '؟'
  return String(name)
    .replace(/^أ\.\s*|^د\.\s*/u, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

/**
 * Dedicated lawyer profile page — GET /api/lawyers/:id + related API records.
 */
export default function LawyerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lawyer, isLoading, error, refetch } = useLawyer(id)
  const { cases } = useCases()
  const { appointments } = useAppointments()

  const lawyerCases = cases.filter((c) => String(c.lawyer_id) === String(id))
  const lawyerAppointments = appointments.filter(
    (a) => String(a.lawyerId) === String(id),
  )

  if (isLoading) {
    return (
      <div className="cases-page">
        <div className="table-card flex flex-col items-center justify-center gap-3 py-16 text-[#6b7f80]">
          <HiOutlineRefresh size={28} className="animate-spin text-gold" aria-hidden />
          <p className="text-sm font-medium">جاري تحميل بيانات المحامي...</p>
        </div>
      </div>
    )
  }

  if (error || !lawyer) {
    return (
      <div className="cases-page">
        <div className="table-card flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <HiOutlineExclamationCircle size={28} aria-hidden />
          </span>
          <div>
            <p className="font-display text-base font-bold text-brand">تعذر تحميل المحامي</p>
            <p className="mt-1 text-sm text-[#6b7f80]">{error || 'المحامي غير موجود'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn--primary" onClick={() => refetch()}>
              <HiOutlineRefresh size={18} aria-hidden />
              إعادة المحاولة
            </button>
            <Link to="/lawyers" className="btn btn--ghost">
              العودة للقائمة
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isActive = lawyer.status === 'نشط'
  const stats = [
    { id: 'cases', label: 'القضايا', value: display(lawyerCases.length), icon: 'cases' },
    {
      id: 'appointments',
      label: 'المواعيد',
      value: display(lawyerAppointments.length),
      icon: 'calendar',
    },
    {
      id: 'specialty',
      label: 'التخصص',
      value: display(lawyer.specialization),
      icon: 'tag',
    },
  ]

  const contact = [
    { label: 'البريد الإلكتروني', value: lawyer.email, icon: 'documents' },
    { label: 'رقم الجوال', value: display(lawyer.phone), icon: 'bell' },
    { label: 'رقم الهوية', value: display(lawyer.nationalId), icon: 'person' },
    { label: 'رقم القيد بالنقابة', value: display(lawyer.barNumber), icon: 'notes' },
    { label: 'العنوان', value: display(lawyer.address), icon: 'home' },
  ]

  return (
    <div className="cases-page">
      <div className="cases-toolbar">
        <div>
          <button
            type="button"
            className="btn btn--ghost mb-2 inline-flex items-center gap-2"
            onClick={() => navigate('/lawyers')}
          >
            ← المحامين
          </button>
          <h2 className="cases-toolbar__title">تفاصيل المحامي</h2>
        </div>
        <div className="cases-toolbar__actions">
          <button
            type="button"
            className="btn btn--ghost inline-flex items-center gap-2"
            onClick={() => refetch()}
          >
            <HiOutlineRefresh size={18} aria-hidden />
            تحديث
          </button>
        </div>
      </div>

      <div className="client-profile">
        <div className="client-profile__avatar" aria-hidden>
          {initials(lawyer.name)}
        </div>
        <div className="client-profile__info">
          <h3 className="client-profile__name">{lawyer.name}</h3>
          <p className="client-profile__email">
            {lawyer.specialization || lawyer.email}
          </p>
        </div>
        <span
          className={`status-pill ${isActive ? 'status-pill--active' : 'status-pill--hold'}`}
        >
          {lawyer.status}
        </span>
      </div>

      <div className="client-stats">
        {stats.map((stat) => (
          <article key={stat.id} className="client-stat">
            <span className="client-stat__icon">
              <Icon name={stat.icon} size={18} />
            </span>
            <div>
              <div className="client-stat__value">{stat.value}</div>
              <div className="client-stat__label">{stat.label}</div>
            </div>
          </article>
        ))}
      </div>

      <section className="detail-card">
        <header className="detail-card__header">
          <span className="detail-card__icon">
            <Icon name="person" />
          </span>
          <h3>بيانات التواصل والقيد</h3>
        </header>
        <div className="info-rows">
          {contact.map((row) => (
            <div key={row.label} className="info-row">
              <span className="info-row__icon">
                <Icon name={row.icon} size={16} />
              </span>
              <span className="info-row__label">{row.label}</span>
              <span className="info-row__value">{row.value}</span>
            </div>
          ))}
        </div>
      </section>

      {lawyer.notes ? (
        <section className="detail-card">
          <header className="detail-card__header">
            <span className="detail-card__icon">
              <Icon name="notes" />
            </span>
            <h3>الملاحظات</h3>
          </header>
          <div className="lawyer-notes">{lawyer.notes}</div>
        </section>
      ) : null}

      <section className="detail-card">
        <header className="detail-card__header">
          <span className="detail-card__icon">
            <Icon name="calendar" />
          </span>
          <h3>بيانات الملف</h3>
        </header>
        <div className="meta-grid meta-grid--2">
          <div className="meta-item">
            <span className="meta-item__label">تاريخ التسجيل</span>
            <span className="meta-item__value">{formatDisplayDate(lawyer.registeredAt)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-item__label">آخر تحديث</span>
            <span className="meta-item__value">{formatDisplayDate(lawyer.updatedAt)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-item__label">رقم الملف</span>
            <span className="meta-item__value">LW-{lawyer.id}</span>
          </div>
          <div className="meta-item">
            <span className="meta-item__label">معرف المستخدم</span>
            <span className="meta-item__value">{display(lawyer.user_id)}</span>
          </div>
        </div>
      </section>

      <section className="detail-card">
        <header className="detail-card__header">
          <span className="detail-card__icon">
            <Icon name="cases" />
          </span>
          <h3>قضايا المحامي</h3>
        </header>
        {lawyerCases.length === 0 ? (
          <p className="data-table__empty">لا توجد قضايا مرتبطة بهذا المحامي</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم القضية</th>
                  <th>العنوان</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {lawyerCases.map((item) => (
                  <tr key={item.id}>
                    <td>{item.case_number || item.number || '—'}</td>
                    <td>{item.title}</td>
                    <td>
                      <span className="status-pill status-pill--active">
                        {caseStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="detail-card">
        <header className="detail-card__header">
          <span className="detail-card__icon">
            <Icon name="appointments" />
          </span>
          <h3>المواعيد</h3>
        </header>
        {lawyerAppointments.length === 0 ? (
          <p className="data-table__empty">لا توجد مواعيد مرتبطة</p>
        ) : (
          <div className="client-cases-mini">
            {lawyerAppointments.map((item) => (
              <div key={item.id} className="client-cases-mini__row">
                <strong>{item.clientName || item.type || 'موعد'}</strong>
                <span>
                  {formatDisplayDate(item.date)} {item.time || ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
