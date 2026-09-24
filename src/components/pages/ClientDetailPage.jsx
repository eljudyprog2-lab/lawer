import { Link, useNavigate, useParams } from 'react-router-dom'
import { HiOutlineExclamationCircle, HiOutlineRefresh } from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { useClient } from '../../hooks/useClients'
import { useCases } from '../../hooks/useCases'
import { useAppointments } from '../../hooks/useAppointments'
import { useInvoices } from '../../hooks/useInvoices'
import { caseStatusLabel } from '../../api/cases'
import { remaining, formatMoney } from '../../api/invoices'
import { formatDisplayDate } from '../../utils/formatDisplay'

function display(value) {
  if (value === 0) return '0'
  return value || '—'
}

function initials(name) {
  if (!name || name === '—') return '؟'
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

/**
 * Dedicated client profile page — GET /api/clients/:id + related API records.
 * Reuses existing client-profile / detail-card styles (no redesign).
 */
export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { client, isLoading, error, refetch } = useClient(id)
  const { cases } = useCases()
  const { appointments } = useAppointments()
  const { invoices } = useInvoices()

  const clientCases = cases.filter((c) => String(c.client_id) === String(id))
  const clientAppointments = appointments.filter(
    (a) => String(a.clientId) === String(id),
  )
  const clientInvoices = invoices.filter((inv) => String(inv.clientId) === String(id))
  const balance = clientInvoices.reduce((sum, inv) => sum + remaining(inv), 0)

  if (isLoading) {
    return (
      <div className="cases-page">
        <div className="table-card flex flex-col items-center justify-center gap-3 py-16 text-[#6b7f80]">
          <HiOutlineRefresh size={28} className="animate-spin text-gold" aria-hidden />
          <p className="text-sm font-medium">جاري تحميل بيانات الموكل...</p>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="cases-page">
        <div className="table-card flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <HiOutlineExclamationCircle size={28} aria-hidden />
          </span>
          <div>
            <p className="font-display text-base font-bold text-brand">تعذر تحميل الموكل</p>
            <p className="mt-1 text-sm text-[#6b7f80]">{error || 'الموكل غير موجود'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn--primary" onClick={() => refetch()}>
              <HiOutlineRefresh size={18} aria-hidden />
              إعادة المحاولة
            </button>
            <Link to="/clients" className="btn btn--ghost">
              العودة للقائمة
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isActive = client.status === 'نشط'
  const stats = [
    { id: 'cases', label: 'القضايا', value: display(clientCases.length), icon: 'cases' },
    {
      id: 'appointments',
      label: 'المواعيد',
      value: display(clientAppointments.length),
      icon: 'calendar',
    },
    {
      id: 'balance',
      label: 'الرصيد المتبقي',
      value: formatMoney(balance),
      icon: 'invoices',
    },
  ]

  const contact = [
    { label: 'البريد الإلكتروني', value: client.email, icon: 'documents' },
    { label: 'رقم الجوال', value: display(client.phone), icon: 'bell' },
    { label: 'رقم الهوية', value: display(client.nationalId), icon: 'person' },
    { label: 'العنوان', value: display(client.address), icon: 'home' },
  ]

  return (
    <div className="cases-page">
      <div className="cases-toolbar">
        <div>
          <button
            type="button"
            className="btn btn--ghost mb-2 inline-flex items-center gap-2"
            onClick={() => navigate('/clients')}
          >
            ← الموكلين
          </button>
          <h2 className="cases-toolbar__title">تفاصيل الموكل</h2>
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
          {initials(client.name)}
        </div>
        <div className="client-profile__info">
          <h3 className="client-profile__name">{client.name}</h3>
          <p className="client-profile__email">{client.email}</p>
        </div>
        <span
          className={`status-pill ${isActive ? 'status-pill--active' : 'status-pill--hold'}`}
        >
          {client.status}
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
            <Icon name="clients" />
          </span>
          <h3>بيانات التواصل</h3>
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

      {client.notes ? (
        <section className="detail-card">
          <header className="detail-card__header">
            <span className="detail-card__icon">
              <Icon name="notes" />
            </span>
            <h3>الملاحظات</h3>
          </header>
          <p className="lawyer-notes">{client.notes}</p>
        </section>
      ) : null}

      <section className="detail-card">
        <header className="detail-card__header">
          <span className="detail-card__icon">
            <Icon name="notes" />
          </span>
          <h3>بيانات الملف</h3>
        </header>
        <div className="meta-grid meta-grid--2">
          <div className="meta-item">
            <span className="meta-item__label">تاريخ التسجيل</span>
            <span className="meta-item__value">{formatDisplayDate(client.registeredAt)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-item__label">آخر تحديث</span>
            <span className="meta-item__value">{formatDisplayDate(client.updatedAt)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-item__label">رقم الملف</span>
            <span className="meta-item__value">CL-{client.id}</span>
          </div>
          <div className="meta-item">
            <span className="meta-item__label">معرف الشركة</span>
            <span className="meta-item__value">{display(client.company_id)}</span>
          </div>
        </div>
      </section>

      <section className="detail-card">
        <header className="detail-card__header">
          <span className="detail-card__icon">
            <Icon name="cases" />
          </span>
          <h3>قضايا الموكل</h3>
          <Link to="/cases" className="btn btn--ghost">
            القضايا
          </Link>
        </header>
        {clientCases.length === 0 ? (
          <p className="data-table__empty">لا توجد قضايا مرتبطة بهذا الموكل</p>
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
                {clientCases.map((item) => (
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
        {clientAppointments.length === 0 ? (
          <p className="data-table__empty">لا توجد مواعيد مرتبطة</p>
        ) : (
          <div className="client-cases-mini">
            {clientAppointments.map((item) => (
              <div key={item.id} className="client-cases-mini__row">
                <strong>{item.type || 'موعد'}</strong>
                <span>
                  {formatDisplayDate(item.date)} {item.time || ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="detail-card">
        <header className="detail-card__header">
          <span className="detail-card__icon">
            <Icon name="invoices" />
          </span>
          <h3>الفواتير</h3>
        </header>
        {clientInvoices.length === 0 ? (
          <p className="data-table__empty">لا توجد فواتير مرتبطة</p>
        ) : (
          <div className="client-cases-mini">
            {clientInvoices.map((inv) => (
              <div key={inv.id} className="client-cases-mini__row">
                <strong>{inv.number || `فاتورة #${inv.id}`}</strong>
                <span>
                  {formatMoney(inv.total)} — {inv.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
