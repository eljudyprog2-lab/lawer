import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import {
  HiOutlineCheck,
  HiOutlineShieldCheck,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
} from 'react-icons/hi'
import { formatDisplayDate } from '../../utils/formatDisplay'

function display(value) {
  if (value === 0) return '0'
  return value || '—'
}

function initials(name) {
  if (!name) return 'م'
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

  const header = (
    <div className="details-header">
      <h2 className="details-header__title details-header__title--with-icon">
        <Icon name="person" size={22} />
        تفاصيل الموكل
      </h2>
      <div className="details-header__meta">
        <span>ملف الموكل وبياناته المسجلة بالنظام</span>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Hero Card */}
        <section className="profile-hero" style={{ padding: '1.25rem 1.4rem' }}>
          <div className="profile-hero__right">
            <div className="profile-hero__avatar-box" style={{ width: '70px', height: '70px', fontSize: '1.65rem' }}>
              <span>{initials(client.name)}</span>
              <span className="profile-hero__avatar-badge">
                <HiOutlineCheck size={12} />
              </span>
            </div>

            <div className="profile-hero__info">
              <div className="profile-hero__title-row">
                <h3 className="profile-hero__name" style={{ fontSize: '1.25rem' }}>{client.name}</h3>
                <span
                  className="profile-hero__status-tag"
                  style={{
                    background: isActive ? 'var(--success-bg, #e8f6ef)' : '#fef3c7',
                    color: isActive ? 'var(--success, #2d8a5e)' : '#b45309',
                    borderColor: isActive ? 'rgba(45, 138, 94, 0.2)' : 'rgba(180, 83, 9, 0.2)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: isActive ? 'var(--success, #2d8a5e)' : '#b45309',
                    }}
                  />
                  {client.status || 'نشط'}
                </span>
                <span className="profile-hero__id-tag">ID: CL-{String(client.id).padStart(6, '0')}</span>
              </div>

              <p className="profile-hero__subtitle" style={{ fontSize: '0.82rem' }}>
                {client.type ? `النوع: ${client.type}` : 'موكل معتمد'} •{' '}
                {client.phone ? `هاتف: ${client.phone}` : client.email || 'سجل رسمي'}
              </p>

              <div className="profile-hero__auth-row">
                <span className="profile-hero__nafath-pill">
                  <HiOutlineShieldCheck size={15} />
                  <span>ملف موكل مسجل ومعتمد بالنظام</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
          <div className="profile-stat-card" style={{ padding: '0.9rem 1.15rem' }}>
            <span className="profile-stat-card__title">إجمالي القضايا</span>
            <span className="profile-stat-card__number" style={{ fontSize: '1.65rem' }}>
              {display(cases.length || client.casesCount)}
            </span>
            <span className="profile-stat-card__badge profile-stat-card__badge--teal">قضية نشطة</span>
          </div>

          <div className="profile-stat-card" style={{ padding: '0.9rem 1.15rem' }}>
            <span className="profile-stat-card__title">المواعيد والاستشارات</span>
            <span className="profile-stat-card__number" style={{ fontSize: '1.65rem' }}>
              {display(client.appointmentsCount)}
            </span>
            <span className="profile-stat-card__badge profile-stat-card__badge--gold">موعد مجدول</span>
          </div>

          <div className="profile-stat-card" style={{ padding: '0.9rem 1.15rem' }}>
            <span className="profile-stat-card__title">الرصيد الحالي</span>
            <span className="profile-stat-card__number" style={{ fontSize: '1.35rem' }}>
              {display(client.balance)} ر.س
            </span>
            <span className="profile-stat-card__badge profile-stat-card__badge--slate">الرصيد المسجل</span>
          </div>
        </div>

        {/* Panel: Personal & Contact */}
        <div className="profile-panel-card" style={{ marginBottom: 0, padding: '1.25rem 1.4rem' }}>
          <header className="profile-panel-card__head" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
            <h3 className="profile-panel-card__title" style={{ fontSize: '0.98rem' }}>
              <span className="profile-panel-card__bullet" />
              <span>المعلومات الشخصية والاتصال</span>
            </h3>
            <span className="profile-panel-card__badge-sub">سجل موثق</span>
          </header>

          <div className="profile-fields-grid" style={{ gap: '0.85rem 1.25rem' }}>
            <div className="profile-field-item">
              <span className="profile-field-item__label">البريد الإلكتروني</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value" dir="ltr">{display(client.email)}</span>
                {client.email ? (
                  <span className="profile-field-item__badge profile-field-item__badge--teal">موثق</span>
                ) : null}
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">رقم الجوال الشخصي</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value" dir="ltr">{display(client.phone)}</span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">رقم الهوية الوطنية / السجل</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value">{display(client.nationalId)}</span>
                {client.nationalId ? (
                  <span className="profile-field-item__badge profile-field-item__badge--emerald">سارية</span>
                ) : null}
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">نوع وصفة الموكل</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value">{display(client.type || 'فرد / موكل')}</span>
              </div>
            </div>

            <div className="profile-field-item profile-field-item--full">
              <span className="profile-field-item__label">العنوان الوطني المعتمد</span>
              <div className="profile-field-item__value-wrap">
                <HiOutlineLocationMarker size={16} color="var(--brand-teal)" />
                <span className="profile-field-item__value">{display(client.address)}</span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">تاريخ التسجيل بالنظام</span>
              <div className="profile-field-item__value-wrap">
                <HiOutlineCalendar size={15} color="var(--brand-gold-dark, #9a7322)" />
                <span className="profile-field-item__value">{formatDisplayDate(client.registeredAt)}</span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">رقم الملف</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value" style={{ fontFamily: 'monospace' }}>
                  CL-{client.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick action to cases if any */}
        {cases.length > 0 && onOpenCases ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={onOpenCases}
              style={{ fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Icon name="cases" size={16} />
              <span>عرض قضايا الموكل ({cases.length})</span>
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
