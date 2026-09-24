import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'

function display(value) {
  if (value === 0) return '0'
  return value || '—'
}

function initials(name) {
  if (!name) return '؟'
  return name
    .replace(/^أ\.\s*|^د\.\s*/u, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

export function LawyerDetailsModal({ open, lawyer, onClose }) {
  if (!lawyer) return null

  const isActive = lawyer.status === 'نشط'

  const stats = [
    { id: 'cases', label: 'القضايا', value: display(lawyer.casesCount), icon: 'cases' },
    {
      id: 'appointments',
      label: 'المواعيد',
      value: display(lawyer.appointmentsCount),
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

  const header = (
    <div className="details-header">
      <h2 className="details-header__title details-header__title--with-icon">
        <Icon name="lawyers" size={22} />
        تفاصيل المحامي
      </h2>
      <div className="details-header__meta">
        <span>ملف المحامي وبياناته المسجلة في النظام</span>
      </div>
    </div>
  )

  return (
    <Modal
      open={open}
      title="تفاصيل المحامي"
      header={header}
      onClose={onClose}
      wide
    >
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
          className={`status-pill ${
            isActive ? 'status-pill--active' : 'status-pill--hold'
          }`}
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
            <span className="meta-item__value">{display(lawyer.registeredAt)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-item__label">رقم الملف</span>
            <span className="meta-item__value">LW-{lawyer.id}</span>
          </div>
        </div>
      </section>
    </Modal>
  )
}
