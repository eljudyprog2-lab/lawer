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

  const header = (
    <div className="details-header">
      <h2 className="details-header__title details-header__title--with-icon">
        <Icon name="lawyers" size={22} />
        تفاصيل المحامي
      </h2>
      <div className="details-header__meta">
        <span>ملف المحامي وبياناته المهنية المسجلة بالنظام</span>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Hero Card */}
        <section className="profile-hero" style={{ padding: '1.25rem 1.4rem' }}>
          <div className="profile-hero__right">
            <div className="profile-hero__avatar-box" style={{ width: '70px', height: '70px', fontSize: '1.65rem' }}>
              <span>{initials(lawyer.name)}</span>
              <span className="profile-hero__avatar-badge">
                <HiOutlineCheck size={12} />
              </span>
            </div>

            <div className="profile-hero__info">
              <div className="profile-hero__title-row">
                <h3 className="profile-hero__name" style={{ fontSize: '1.25rem' }}>{lawyer.name}</h3>
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
                  {lawyer.status || 'نشط'}
                </span>
                <span className="profile-hero__id-tag">ID: LW-{String(lawyer.id).padStart(6, '0')}</span>
              </div>

              <p className="profile-hero__subtitle" style={{ fontSize: '0.82rem' }}>
                {lawyer.specialization ? `تخصص: ${lawyer.specialization}` : 'محامي ومستشار قانوني'} •{' '}
                {lawyer.barNumber ? `رخصة رقم: ${lawyer.barNumber}` : 'عضو بنقابة المحامين'}
              </p>

              <div className="profile-hero__auth-row">
                <span className="profile-hero__nafath-pill">
                  <HiOutlineShieldCheck size={15} />
                  <span>محامي مرخص ومعتمد بالنظام</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
          <div className="profile-stat-card" style={{ padding: '0.9rem 1.15rem' }}>
            <span className="profile-stat-card__title">القضايا المكلف بها</span>
            <span className="profile-stat-card__number" style={{ fontSize: '1.65rem' }}>
              {display(lawyer.casesCount)}
            </span>
            <span className="profile-stat-card__badge profile-stat-card__badge--teal">قضية نشطة</span>
          </div>

          <div className="profile-stat-card" style={{ padding: '0.9rem 1.15rem' }}>
            <span className="profile-stat-card__title">المواعيد والاستشارات</span>
            <span className="profile-stat-card__number" style={{ fontSize: '1.65rem' }}>
              {display(lawyer.appointmentsCount)}
            </span>
            <span className="profile-stat-card__badge profile-stat-card__badge--gold">موعد مجدول</span>
          </div>

          <div className="profile-stat-card" style={{ padding: '0.9rem 1.15rem' }}>
            <span className="profile-stat-card__title">التخصص المهني</span>
            <span
              className="profile-stat-card__number"
              style={{ fontSize: '1.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              title={lawyer.specialization || 'قانون عام'}
            >
              {lawyer.specialization || 'قانون عام'}
            </span>
            <span className="profile-stat-card__badge profile-stat-card__badge--slate">مجال الترافع</span>
          </div>
        </div>

        {/* Panel: Personal & Bar Data */}
        <div className="profile-panel-card" style={{ marginBottom: 0, padding: '1.25rem 1.4rem' }}>
          <header className="profile-panel-card__head" style={{ marginBottom: '1rem', paddingBottom: '0.75rem' }}>
            <h3 className="profile-panel-card__title" style={{ fontSize: '0.98rem' }}>
              <span className="profile-panel-card__bullet" />
              <span>المعلومات الشخصية والمهنية</span>
            </h3>
            <span className="profile-panel-card__badge-sub">سجل موثق</span>
          </header>

          <div className="profile-fields-grid" style={{ gap: '0.85rem 1.25rem' }}>
            <div className="profile-field-item">
              <span className="profile-field-item__label">البريد الإلكتروني</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value" dir="ltr">{display(lawyer.email)}</span>
                {lawyer.email ? (
                  <span className="profile-field-item__badge profile-field-item__badge--teal">موثق</span>
                ) : null}
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">رقم الجوال الشخصي</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value" dir="ltr">{display(lawyer.phone)}</span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">رقم الهوية الوطنية</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value">{display(lawyer.nationalId)}</span>
                {lawyer.nationalId ? (
                  <span className="profile-field-item__badge profile-field-item__badge--emerald">سارية</span>
                ) : null}
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">رقم القيد برخصة المحاماة</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value">{display(lawyer.barNumber)}</span>
                {lawyer.barNumber ? (
                  <span className="profile-field-item__badge profile-field-item__badge--emerald">مرخص وممارس</span>
                ) : null}
              </div>
            </div>

            <div className="profile-field-item profile-field-item--full">
              <span className="profile-field-item__label">العنوان ومقر العمل</span>
              <div className="profile-field-item__value-wrap">
                <HiOutlineLocationMarker size={16} color="var(--brand-teal)" />
                <span className="profile-field-item__value">{display(lawyer.address)}</span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">تاريخ التسجيل</span>
              <div className="profile-field-item__value-wrap">
                <HiOutlineCalendar size={15} color="var(--brand-gold-dark, #9a7322)" />
                <span className="profile-field-item__value">{formatDisplayDate(lawyer.registeredAt)}</span>
              </div>
            </div>

            <div className="profile-field-item">
              <span className="profile-field-item__label">رقم الملف</span>
              <div className="profile-field-item__value-wrap">
                <span className="profile-field-item__value" style={{ fontFamily: 'monospace' }}>
                  LW-{lawyer.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {lawyer.notes ? (
          <div className="profile-panel-card" style={{ marginBottom: 0, padding: '1rem 1.25rem' }}>
            <header className="profile-panel-card__head" style={{ marginBottom: '0.65rem', paddingBottom: '0.5rem' }}>
              <h3 className="profile-panel-card__title" style={{ fontSize: '0.92rem' }}>
                <span className="profile-panel-card__bullet" />
                <span>الملاحظات</span>
              </h3>
            </header>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text)', lineHeight: 1.5 }}>
              {lawyer.notes}
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
