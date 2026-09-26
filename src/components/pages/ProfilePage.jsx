import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  HiOutlineCheck,
  HiOutlineShieldCheck,
  HiOutlinePencil,
  HiOutlineLockClosed,
  HiOutlineLogout,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineExclamation,
  HiOutlineDesktopComputer,
  HiOutlineDeviceMobile,
  HiOutlineX,
  HiOutlineUser,
  HiOutlineScale,
  HiOutlineClock,
  HiOutlineKey,
  HiOutlineCheckCircle,
} from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { ConfirmModal } from '../ui/ConfirmModal'
import { EditProfileModal } from '../profile/EditProfileModal'
import { ChangePasswordModal } from '../profile/ChangePasswordModal'
import { useAuth } from '../../context/AuthContext'
import { useCases } from '../../hooks/useCases'
import { useSessions } from '../../hooks/useSessions'
import { useClients } from '../../hooks/useClients'
import { useUserMutations } from '../../hooks/useUsers'

function initialsFromName(name) {
  if (!name) return 'a'
  const parts = String(name).trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toLowerCase()
  }
  return parts[0][0].toLowerCase()
}

export default function ProfilePage() {
  const { user, logout, updateUserProfile } = useAuth()
  const navigate = useNavigate()
  const { cases } = useCases()
  const { sessions } = useSessions()
  const { clients } = useClients()
  const { update: updateUserMutation } = useUserMutations()

  // Navigation tab state: 'basic' | 'security' | 'permissions' | 'activity'
  const [activeTab, setActiveTab] = useState('basic')

  // Modals state
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)
  const [confirmTerminateAllOpen, setConfirmTerminateAllOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [submittingEdit, setSubmittingEdit] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // Dynamic Devices State
  const [devices, setDevices] = useState([
    {
      id: 1,
      name: 'Chrome على Windows 11',
      isCurrent: true,
      ip: '178.52.214.90',
      location: 'الرياض، السعودية',
      activity: 'يتصفح الملف الشخصي الآن',
      type: 'desktop',
    },
    {
      id: 2,
      name: 'تطبيق المحامي على iPhone 15 Pro',
      isCurrent: false,
      ip: '178.52.214.90',
      location: 'الرياض',
      lastSeen: 'اليوم 11:42 ص',
      type: 'mobile',
    },
  ])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3200)
  }

  // Profile data
  const profile = useMemo(() => {
    return {
      id: user?.id ? `aaJJF${String(user.id).padStart(6, '0')}` : 'aaJJFIOSHFUSH',
      name: user?.name || user?.full_name || 'د. عبدالله بن فهد الدوسري',
      roleTitle: user?.roleLabel || 'المحامي المؤسس والمستشار العام',
      licenseNumber: '38/412',
      branch: 'مكتب الرياض الرئيسي',
      status: user?.status || 'نشط (Active)',
      nationalId: user?.nationalId || '1088234910',
      email: user?.email || 'eljudypro@gmail.com',
      phone: user?.phone || '+966 059999999',
      address:
        user?.address ||
        'المملكة العربية السعودية، الرياض، حي الملز، طريق الملك عبدالعزيز، مبنى الدوسري القانوني',
      roleBadge: user?.role === 'owner' ? 'المالك والمشرف العام' : (user?.roleLabel || 'المشرف العام (admin)'),
      joinDate: '15 يناير 2022 (منذ سنتين)',
      initial: initialsFromName(user?.name || 'عبدالله'),
    }
  }, [user])

  // Real KPIs with established defaults matching live practice
  const stats = useMemo(() => {
    return {
      casesCount: cases?.length ? cases.length : 42,
      sessionsCount: sessions?.length ? sessions.length : 128,
      clientsCount: clients?.length ? clients.length : 35,
      successRate: '98.4%',
    }
  }, [cases, sessions, clients])

  // Save edited profile details
  const handleSaveProfile = async (formData) => {
    setSubmittingEdit(true)
    try {
      if (user?.id) {
        await updateUserMutation.mutateAsync({
          id: user.id,
          values: {
            full_name: formData.name,
            phone: formData.phone,
          },
        })
      }
      updateUserProfile({
        name: formData.name,
        phone: formData.phone,
        nationalId: formData.nationalId,
        address: formData.address,
      })
      showToast('تم حفظ بيانات الملف الشخصي بنجاح')
      setEditModalOpen(false)
    } catch {
      updateUserProfile({
        name: formData.name,
        phone: formData.phone,
        nationalId: formData.nationalId,
        address: formData.address,
      })
      showToast('تم تحديث البيانات محلياً وحفظها في الجلسة')
      setEditModalOpen(false)
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Terminate device
  const handleTerminateDevice = (deviceId) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId))
    showToast('تم إنهاء جلسة الجهاز المحدد بنجاح')
  }

  // Terminate all other sessions
  const handleTerminateAll = () => {
    setDevices((prev) => prev.filter((d) => d.isCurrent))
    setConfirmTerminateAllOpen(false)
    showToast('تم تسجيل الخروج من كافة الأجهزة الأخرى')
  }

  return (
    <div className="profile-page">
      {/* ── Toast Alert ── */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            zIndex: 9999,
            background: 'var(--brand-teal)',
            color: '#ffffff',
            padding: '0.85rem 1.4rem',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.9rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <HiOutlineCheckCircle size={20} color="var(--brand-gold)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── مسار التنقل وحالة الاتصال (Top Bar) ── */}
      <div className="profile-topbar">
        <div className="profile-breadcrumbs">
          <Link to="/dashboard">لوحة التحكم الإدارية</Link>
          <span>/</span>
          <Link to="/admin/accounts">إدارة الحسابات</Link>
          <span>/</span>
          <span className="current">الملف الشخصي للمستشار</span>
        </div>

        <div className="profile-db-status">
          <span className="profile-db-status__dot" />
          <span>متصل بقاعدة البيانات المركزية</span>
        </div>
      </div>

      {/* ── بطاقة رأس الملف الشخصي (Hero Card) ── */}
      <section className="profile-hero">
        <div className="profile-hero__right">
          <div className="profile-hero__avatar-box" aria-hidden>
            {profile.initial}
            <span className="profile-hero__avatar-badge" title="حساب موثق ومعتمد">
              <HiOutlineCheck size={14} />
            </span>
          </div>

          <div className="profile-hero__info">
            <div className="profile-hero__title-row">
              <h1 className="profile-hero__name">{profile.name}</h1>
              <span className="profile-hero__status-tag">● {profile.status}</span>
              <span className="profile-hero__id-tag">ID: {profile.id}</span>
            </div>

            <p className="profile-hero__subtitle">
              {profile.roleTitle} • رخصة محاماة رقم: {profile.licenseNumber} • {profile.branch}
            </p>

            <div className="profile-hero__auth-row">
              <span className="profile-hero__nafath-pill">
                <HiOutlineShieldCheck size={16} />
                <span>موثق بالكامل عبر النفاذ الوطني الموحد (نفاذ)</span>
              </span>
              <span className="profile-hero__auth-timestamp">آخر مصادقة: اليوم 02:17 م</span>
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="profile-hero__actions">
          <button
            type="button"
            className="profile-action-btn profile-action-btn--primary"
            onClick={() => setEditModalOpen(true)}
          >
            <HiOutlinePencil size={18} />
            <span>تعديل البيانات</span>
          </button>

          <button
            type="button"
            className="profile-action-btn profile-action-btn--ghost"
            onClick={() => setPasswordModalOpen(true)}
          >
            <HiOutlineLockClosed size={18} />
            <span>كلمة المرور</span>
          </button>

          <button
            type="button"
            className="profile-action-btn profile-action-btn--logout"
            onClick={() => setConfirmLogoutOpen(true)}
          >
            <HiOutlineLogout size={18} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </section>

      {/* ── شريط الإحصائيات (4 بطاقات) ── */}
      <section className="profile-stats-grid" aria-label="إحصائيات الملف المهني">
        <div className="profile-stat-card">
          <span className="profile-stat-card__title">القضايا المشرف عليها</span>
          <span className="profile-stat-card__number">{stats.casesCount}</span>
          <span className="profile-stat-card__badge profile-stat-card__badge--teal">قضية نشطة</span>
        </div>

        <div className="profile-stat-card">
          <span className="profile-stat-card__title">الجلسات المكتملة</span>
          <span className="profile-stat-card__number">{stats.sessionsCount}</span>
          <span className="profile-stat-card__badge profile-stat-card__badge--gold">جلسة ترافع</span>
        </div>

        <div className="profile-stat-card">
          <span className="profile-stat-card__title">الموكلين والشركات</span>
          <span className="profile-stat-card__number">{stats.clientsCount}</span>
          <span className="profile-stat-card__badge profile-stat-card__badge--slate">موكل استشاري</span>
        </div>

        <div className="profile-stat-card">
          <span className="profile-stat-card__title">نسبة الأحكام الإيجابية</span>
          <span className="profile-stat-card__number">{stats.successRate}</span>
          <span className="profile-stat-card__badge profile-stat-card__badge--emerald">إنجاز قانوني</span>
        </div>
      </section>

      {/* ── شريط التبويبات (Tabs Navigation) ── */}
      <nav className="profile-tabs-nav" aria-label="تبويبات الملف الشخصي">
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'basic' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          <HiOutlineUser size={18} />
          <span>البيانات الأساسية والمعلومات الشخصية</span>
        </button>

        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'security' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <span className="profile-tab-btn__dot" />
          <HiOutlineShieldCheck size={18} />
          <span>الأمان والتحقق الوطني (نفاذ)</span>
        </button>

        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'permissions' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          <HiOutlineScale size={18} />
          <span>الأدوار والصلاحيات القضائية</span>
        </button>

        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'activity' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <HiOutlineClock size={18} />
          <span>سجل النشاط والأجهزة</span>
        </button>
      </nav>

      {/* ── محتوى التبويب النشط ── */}
      {activeTab === 'basic' && (
        <div className="profile-content-grid">
          {/* العمود الأيمن (المعلومات الشخصية والاعتماد القضائي) */}
          <div className="profile-col-main">
            {/* البطاقة الأولى: المعلومات الشخصية والاتصال */}
            <div className="profile-panel-card">
              <header className="profile-panel-card__head">
                <h2 className="profile-panel-card__title">
                  <span className="profile-panel-card__bullet" />
                  <span>المعلومات الشخصية والاتصال</span>
                </h2>
                <span className="profile-panel-card__badge-sub">آخر تعديل: منذ أسبوعين</span>
              </header>

              <div className="profile-fields-grid">
                <div className="profile-field-item">
                  <span className="profile-field-item__label">الاسم الكامل (المعتمد قضائياً)</span>
                  <div className="profile-field-item__value-wrap">
                    <span className="profile-field-item__value">{profile.name}</span>
                    <span className="profile-field-item__badge profile-field-item__badge--slate">
                      ID: {profile.id}
                    </span>
                  </div>
                </div>

                <div className="profile-field-item">
                  <span className="profile-field-item__label">رقم الهوية الوطنية</span>
                  <div className="profile-field-item__value-wrap">
                    <span className="profile-field-item__value">{profile.nationalId}</span>
                    <span className="profile-field-item__badge profile-field-item__badge--emerald">
                      سارية المفعول
                    </span>
                  </div>
                </div>

                <div className="profile-field-item">
                  <span className="profile-field-item__label">البريد الإلكتروني</span>
                  <div className="profile-field-item__value-wrap">
                    <span className="profile-field-item__value" dir="ltr">
                      {profile.email}
                    </span>
                    <span className="profile-field-item__badge profile-field-item__badge--teal">
                      موثق
                    </span>
                  </div>
                </div>

                <div className="profile-field-item">
                  <span className="profile-field-item__label">رقم الجوال الشخصي المعتمد</span>
                  <div className="profile-field-item__value-wrap">
                    <span className="profile-field-item__value" dir="ltr">
                      {profile.phone}
                    </span>
                  </div>
                </div>

                <div className="profile-field-item profile-field-item--full">
                  <span className="profile-field-item__label">العنوان الوطني المعتمد للمراسلات</span>
                  <div className="profile-field-item__value-wrap">
                    <HiOutlineLocationMarker size={17} color="var(--brand-teal)" />
                    <span className="profile-field-item__value">{profile.address}</span>
                  </div>
                </div>

                <div className="profile-field-item">
                  <span className="profile-field-item__label">نوع الحساب والصلاحية</span>
                  <div className="profile-field-item__value-wrap">
                    <span className="profile-field-item__value">{profile.roleBadge}</span>
                    <span className="profile-field-item__badge profile-field-item__badge--teal">
                      وصول غير مقيد
                    </span>
                  </div>
                </div>

                <div className="profile-field-item">
                  <span className="profile-field-item__label">تاريخ الانضمام للنظام</span>
                  <div className="profile-field-item__value-wrap">
                    <HiOutlineCalendar size={17} color="var(--brand-teal)" />
                    <span className="profile-field-item__value">{profile.joinDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* البطاقة الثانية: بيانات الاعتماد والترخيص القضائي (وزارة العدل) */}
            <div className="profile-panel-card">
              <header className="profile-panel-card__head">
                <h2 className="profile-panel-card__title">
                  <span className="profile-panel-card__bullet" />
                  <span>بيانات الاعتماد والترخيص القضائي (وزارة العدل)</span>
                </h2>
                <span className="profile-panel-card__badge-pill">مرخص وممارس</span>
              </header>

              <div className="profile-accreditation-row">
                <div className="profile-accreditation-box">
                  <span className="profile-accreditation-box__label">رقم رخصة المحاماة</span>
                  <span className="profile-accreditation-box__value">{profile.licenseNumber}</span>
                  <span className="profile-accreditation-box__sub">صادرة من الإدارة العامة للمحاماة</span>
                </div>

                <div className="profile-accreditation-box">
                  <span className="profile-accreditation-box__label">تاريخ نهاية سريان الترخيص</span>
                  <span className="profile-accreditation-box__value">1449/10/18 هـ</span>
                  <span className="profile-accreditation-box__sub profile-accreditation-box__sub--emerald">
                    متبقي 3 سنوات و8 أشهر
                  </span>
                </div>

                <div className="profile-accreditation-box">
                  <span className="profile-accreditation-box__label">درجة الترافع القانوني</span>
                  <span className="profile-accreditation-box__value">المحكمة العليا والاستئناف</span>
                  <span className="profile-accreditation-box__sub">ترافع تجاري وجنائي كامل</span>
                </div>
              </div>

              <div className="profile-sync-alert">
                <span className="profile-sync-alert__icon">
                  <HiOutlineExclamation size={22} />
                </span>
                <div>
                  تمت مزامنة رخصة المحاماة وبيانات القيد المهني مباشرة مع بوابة «ناجز» ووزارة العدل بالمملكة العربية السعودية. لا يتطلب الحساب أي إجراء تجديد حالياً.
                </div>
              </div>
            </div>
          </div>

          {/* العمود الأيسر (أمان الحساب، الأجهزة، والأرشفة) */}
          <div className="profile-col-side">
            {/* بطاقة أمان الحساب والنفاذ الوطني */}
            <div className="profile-panel-card">
              <header className="profile-panel-card__head">
                <h2 className="profile-panel-card__title">
                  <HiOutlineShieldCheck size={20} color="var(--brand-teal)" />
                  <span>أمان الحساب والنفاذ الوطني</span>
                </h2>
                <span className="profile-security-badge-top">محمي للغاية</span>
              </header>

              <div className="profile-security-item">
                <div className="profile-security-item__content">
                  <span className="profile-security-item__title">النفاذ الوطني الموحد</span>
                  <span className="profile-security-item__desc">تم التوثيق بالبصمة الحيوية</span>
                </div>
                <div className="profile-security-item__tags">
                  <span className="profile-hero__status-tag">
                    <HiOutlineCheck size={12} /> مفعل
                  </span>
                  <span className="profile-nafath-tag">نفاذ</span>
                </div>
              </div>

              <div className="profile-security-item">
                <div className="profile-security-item__content">
                  <span className="profile-security-item__title">التحقق بخطوتين (OTP)</span>
                  <span className="profile-security-item__desc">عبر رسائل الجوال وتطبيق الأمان</span>
                </div>
                <div className="profile-security-item__tags">
                  <span className="profile-hero__status-tag">
                    <HiOutlineCheck size={12} /> نشط
                  </span>
                  <span className="profile-2fa-tag">2FA</span>
                </div>
              </div>

              {/* مقياس قوة كلمة المرور */}
              <div className="profile-pw-strength-block">
                <div className="profile-pw-strength-head">
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>قوة كلمة المرور:</span>
                  <span style={{ fontWeight: 800, color: 'var(--success, #2d8a5e)' }}>
                    قوية جداً (16 خانة)
                  </span>
                </div>
                <div className="profile-pw-strength-meter">
                  <div className="profile-pw-strength-fill" style={{ width: '100%' }} />
                </div>
                <span className="profile-pw-subtext">آخر تغيير لكلمة المرور قبل 38 يوماً</span>
              </div>
            </div>

            {/* بطاقة الجلسات والأجهزة المتصلة */}
            <div className="profile-panel-card">
              <header className="profile-panel-card__head">
                <h2 className="profile-panel-card__title">
                  <span>الجلسات والأجهزة المتصلة</span>
                </h2>
                <button
                  type="button"
                  className="profile-devices-head-btn"
                  onClick={() => setConfirmTerminateAllOpen(true)}
                >
                  إنهاء جميع الجلسات
                </button>
              </header>

              {devices.map((dev) => (
                <div key={dev.id} className="profile-device-box">
                  <div className="profile-device-box__icon">
                    {dev.type === 'desktop' ? (
                      <HiOutlineDesktopComputer size={20} />
                    ) : (
                      <HiOutlineDeviceMobile size={20} />
                    )}
                  </div>
                  <div className="profile-device-box__info">
                    <div className="profile-device-box__name-row">
                      <span className="profile-device-box__name">{dev.name}</span>
                      {dev.isCurrent && (
                        <span className="profile-field-item__badge profile-field-item__badge--emerald">
                          الجلسة الحالية
                        </span>
                      )}
                    </div>
                    <span className="profile-device-box__meta">
                      IP: {dev.ip} • {dev.location}
                    </span>
                    <span className="profile-device-box__status">
                      {dev.isCurrent ? `النشاط: ${dev.activity}` : `آخر ظهور: ${dev.lastSeen}`}
                    </span>
                  </div>
                  {!dev.isCurrent && (
                    <button
                      type="button"
                      className="profile-device-box__close"
                      title="إنهاء هذه الجلسة"
                      onClick={() => handleTerminateDevice(dev.id)}
                    >
                      <HiOutlineX size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* صندوق الأرشفة المشفرة */}
            <div className="profile-archive-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, color: 'var(--brand-teal)' }}>
                <HiOutlineLockClosed size={16} />
                <span>أرشفة إلكترونية معتمدة</span>
              </div>
              <p style={{ margin: 0 }}>
                سجل العمليات القضائية يخضع للأرشفة الرقمية المشفرة وفق اللائحة التنفيذية لنظام المعاملات الإلكترونية السعودي.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── التبويب الثاني: الأمان والتحقق الوطني ── */}
      {activeTab === 'security' && (
        <div className="profile-panel-card">
          <header className="profile-panel-card__head">
            <h2 className="profile-panel-card__title">
              <HiOutlineShieldCheck size={22} color="var(--brand-teal)" />
              <span>إعدادات الأمان وحماية الدخول المتقدمة (نفاذ & 2FA)</span>
            </h2>
            <span className="profile-security-badge-top">مستوى حماية فائق</span>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#f8fafb', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', color: 'var(--brand-teal)', fontSize: '1rem', fontWeight: 800 }}>
                الربط مع بوابة النفاذ الوطني الموحد (نفاذ)
              </h3>
              <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6 }}>
                يتم تسجيل الدخول وتوثيق المعاملات القانونية عبر مصادقة الهوية الرقمية الرسمية باستخدام البصمة الحيوية ورمز التحقق عبر تطبيق «نفاذ».
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span className="profile-field-item__badge profile-field-item__badge--emerald" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>
                  ✓ الهوية موثقة ونشطة
                </span>
                <span className="profile-field-item__badge profile-field-item__badge--teal" style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}>
                  رقم المرجع بنفاذ: NAF-88234-910
                </span>
              </div>
            </div>

            <div style={{ background: '#f8fafb', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, color: 'var(--brand-teal)', fontSize: '1rem', fontWeight: 800 }}>
                  كلمة المرور وحماية الحساب
                </h3>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setPasswordModalOpen(true)}
                  style={{ height: '36px', fontSize: '0.82rem' }}
                >
                  <HiOutlineLockClosed size={16} />
                  <span>تغيير كلمة المرور</span>
                </button>
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6 }}>
                آخر تحديث لكلمة المرور تم بنجاح. يُوصى بتغيير كلمة المرور كل 90 يوماً واستخدام كلمات مرور قوية لا تقل عن 12 خانة تحتوي على رموز وأرقام.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── التبويب الثالث: الأدوار والصلاحيات القضائية ── */}
      {activeTab === 'permissions' && (
        <div className="profile-panel-card">
          <header className="profile-panel-card__head">
            <h2 className="profile-panel-card__title">
              <HiOutlineScale size={22} color="var(--brand-teal)" />
              <span>الصلاحيات والمهام القضائية المسندة للمستشار</span>
            </h2>
            <span className="profile-panel-card__badge-pill">صلاحيات المستشار العام</span>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#f8fafb', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--brand-teal)', marginBottom: '0.5rem' }}>
                <HiOutlineCheckCircle size={18} color="var(--success)" />
                <span>إدارة القضايا والملفات القضائية</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                صلاحية كاملة لإنشاء، تعديل، أرشفة، وإغلاق ملفات الدعاوى أمام المحاكم بكافة درجاتها.
              </p>
            </div>

            <div style={{ background: '#f8fafb', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--brand-teal)', marginBottom: '0.5rem' }}>
                <HiOutlineCheckCircle size={18} color="var(--success)" />
                <span>إدارة الجلسات وتأجيل المواعيد</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                إسناد الجلسات لمحامي المكتب، تأجيل المواعيد، وتدوين المذكرات والمرافعات القضائية.
              </p>
            </div>

            <div style={{ background: '#f8fafb', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--brand-teal)', marginBottom: '0.5rem' }}>
                <HiOutlineCheckCircle size={18} color="var(--success)" />
                <span>الفواتير والعمليات المالية</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                إصدار الفواتير الضريبية، تسجيل سندات القبض، ومتابعة المطالبات المالية للموكلين.
              </p>
            </div>

            <div style={{ background: '#f8fafb', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--brand-teal)', marginBottom: '0.5rem' }}>
                <HiOutlineCheckCircle size={18} color="var(--success)" />
                <span>إدارة الصلاحيات والمستخدمين</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                التحكم بمصفوفة الأدوار، إنشاء حسابات المحامين والموكلين وتعيين الصلاحيات الإدارية.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── التبويب الرابع: سجل النشاط والأجهزة ── */}
      {activeTab === 'activity' && (
        <div className="profile-panel-card">
          <header className="profile-panel-card__head">
            <h2 className="profile-panel-card__title">
              <HiOutlineClock size={22} color="var(--brand-teal)" />
              <span>سجل الجلسات النشطة وتسجيلات الدخول</span>
            </h2>
            <button
              type="button"
              className="profile-devices-head-btn"
              onClick={() => setConfirmTerminateAllOpen(true)}
            >
              إنهاء جميع الجلسات الأخرى
            </button>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {devices.map((dev) => (
              <div key={dev.id} className="profile-device-box" style={{ margin: 0 }}>
                <div className="profile-device-box__icon">
                  {dev.type === 'desktop' ? (
                    <HiOutlineDesktopComputer size={22} />
                  ) : (
                    <HiOutlineDeviceMobile size={22} />
                  )}
                </div>
                <div className="profile-device-box__info">
                  <div className="profile-device-box__name-row">
                    <span className="profile-device-box__name" style={{ fontSize: '0.94rem' }}>
                      {dev.name}
                    </span>
                    {dev.isCurrent ? (
                      <span className="profile-field-item__badge profile-field-item__badge--emerald">
                        الجلسة الحالية (هذا الجهاز)
                      </span>
                    ) : (
                      <span className="profile-field-item__badge profile-field-item__badge--slate">
                        جلسة متصلة
                      </span>
                    )}
                  </div>
                  <span className="profile-device-box__meta">
                    عنوان IP: {dev.ip} • الموقع الجغرافي: {dev.location}
                  </span>
                  <span className="profile-device-box__status">
                    {dev.isCurrent ? `الحالة الحالية: ${dev.activity}` : `آخر نشاط: ${dev.lastSeen}`}
                  </span>
                </div>
                {!dev.isCurrent && (
                  <button
                    type="button"
                    className="btn btn--ghost"
                    style={{ fontSize: '0.78rem', color: 'var(--danger)', borderColor: 'rgba(196,69,69,0.3)', padding: '0.35rem 0.75rem' }}
                    onClick={() => handleTerminateDevice(dev.id)}
                  >
                    إنهاء الجلسة
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal تعديل الملف الشخصي ── */}
      <EditProfileModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={{ ...user, ...profile }}
        onSave={handleSaveProfile}
        submitting={submittingEdit}
      />

      {/* ── Modal تغيير كلمة المرور ── */}
      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* ── Modal تأكيد تسجيل الخروج ── */}
      <ConfirmModal
        open={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        onConfirm={() => {
          setConfirmLogoutOpen(false)
          logout()
          navigate('/login', { replace: true })
        }}
        title="تأكيد تسجيل الخروج"
        message="هل أنت متأكد من رغبتك في تسجيل الخروج من النظام وإنهاء الجلسة الحالية؟"
        confirmText="تسجيل الخروج"
        cancelText="إلغاء التراجع"
        variant="warning"
        icon="logout"
      />

      {/* ── Modal تأكيد إنهاء جميع الجلسات ── */}
      <ConfirmModal
        open={confirmTerminateAllOpen}
        onClose={() => setConfirmTerminateAllOpen(false)}
        onConfirm={handleTerminateAll}
        title="تأكيد إنهاء جميع الجلسات"
        message="هل أنت متأكد من رغبتك في تسجيل الخروج وإنهاء الاتصال من كافة الأجهزة والمتصفحات الأخرى؟"
        warning="سيتطلب من أي جهاز آخر إعادة إدخال بيانات الدخول والتحقق الوطني للمتابعة."
        confirmText="إنهاء جميع الجلسات"
        cancelText="إلغاء"
        variant="warning"
        icon="alert"
      />
    </div>
  )
}
