import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'

function display(value) {
  if (value === 0) return '0'
  return value || '—'
}

function initials(name) {
  if (!name) return '؟'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

export function ClientDetailsModal({
  open,
  client,
  cases = [],
  onClose,
  onOpenCases,
}) {
  if (!client) return null

  const isActive = client.status === 'نشط'

  const stats = [
    { id: 'cases', label: 'القضايا', value: display(cases.length || client.casesCount), icon: 'cases' },
    {
      id: 'appointments',
      label: 'المواعيد',
      value: display(client.appointmentsCount),
      icon: 'calendar',
    },
    {
      id: 'balance',
      label: 'الرصيد',
      value: `${display(client.balance)} ج.م`,
      icon: 'invoices',
    },
  ]

  const contact = [
    { label: 'البريد الإلكتروني', value: client.email, icon: 'documents' },
    { label: 'رقم الجوال', value: display(client.phone), icon: 'bell' },
    { label: 'رقم الهوية', value: display(client.nationalId), icon: 'person' },
    { label: 'العنوان', value: display(client.address), icon: 'home' },
  ]

  const record = [
    { label: 'تاريخ التسجيل', value: display(client.registeredAt) },
    { label: 'رقم الملف', value: `CL-${client.id}` },
  ]

  const header = (
    <div className="details-header">
      <h2 className="details-header__title details-header__title--with-icon">
        <Icon name="person" size={22} />
        تفاصيل الموكل
      </h2>
      <div className="details-header__meta">
        <span>ملف الموكل الكامل وبياناته المسجلة في النظام</span>
      </div>
    </div>
  )

  return (
    <Modal
      open={open}
      title="تفاصيل الموكل"
      header={header}
      onClose={onClose}
      wide
    >
      <div className="client-profile">
        <div className="client-profile__avatar" aria-hidden>
          {initials(client.name)}
        </div>
        <div className="client-profile__info">
          <h3 className="client-profile__name">{client.name}</h3>
          <p className="client-profile__email">{client.email}</p>
        </div>
        <span
          className={`status-pill ${
            isActive ? 'status-pill--active' : 'status-pill--hold'
          }`}
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

      <section className="detail-card">
        <header className="detail-card__header">
          <span className="detail-card__icon">
            <Icon name="notes" />
          </span>
          <h3>بيانات الملف</h3>
        </header>
        <div className="meta-grid meta-grid--2">
          {record.map((row) => (
            <div key={row.label} className="meta-item">
              <span className="meta-item__label">{row.label}</span>
              <span className="meta-item__value">{row.value}</span>
            </div>
          ))}
        </div>
      </section>

      {cases.length > 0 ? (
        <section className="detail-card">
          <header className="detail-card__header">
            <span className="detail-card__icon">
              <Icon name="cases" />
            </span>
            <h3>قضايا الموكل</h3>
            {onOpenCases ? (
              <button type="button" className="btn btn--ghost" onClick={onOpenCases}>
                عرض الكل
              </button>
            ) : null}
          </header>
          <div className="client-cases-mini">
            {cases.slice(0, 3).map((item) => (
              <div key={item.id} className="client-cases-mini__row">
                <strong>{item.title}</strong>
                <span>{item.number}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </Modal>
  )
}
