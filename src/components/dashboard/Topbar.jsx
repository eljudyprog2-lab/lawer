import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { currentUser as fallbackUser } from '../../data/dashboard'
import { roleLabels } from '../../data/roles'

const pathIcons = {
  '/': 'home',
  '/cases': 'cases',
  '/sessions': 'sessions',
  '/appointments': 'calendar',
  '/documents': 'documents',
  '/lawyers': 'lawyers',
  '/clients': 'clients',
  '/companies': 'companies',
  '/invoices': 'invoices',
  '/accounts': 'clients',
  '/permissions': 'shield',
  '/manage-lists': 'cog',
  '/profile': 'user',
  '/notifications': 'bell',
}

const sectionCategories = {
  '/': 'لوحة المعلومات',
  '/cases': 'إدارة القضايا',
  '/sessions': 'الجلسات القضائية',
  '/appointments': 'المواعيد والاستشارات',
  '/documents': 'الأرشيف والمستندات',
  '/lawyers': 'فريق العمل',
  '/clients': 'الموكلين والشركات',
  '/companies': 'الموكلين والشركات',
  '/invoices': 'الإدارة المالية',
  '/accounts': 'إدارة النظام',
  '/permissions': 'إدارة النظام',
  '/manage-lists': 'إعدادات النظام',
  '/profile': 'حساب المستخدم',
  '/notifications': 'مركز التنبيهات',
}

export function Topbar({ title, onMenuClick, unreadNotifications = 0 }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const profile = user || fallbackUser

  // Determine current page icon dynamically based on pathname
  const currentIcon = useMemo(() => {
    if (pathname === '/') return 'home'
    const match = Object.keys(pathIcons).find(
      (path) => path !== '/' && pathname.startsWith(path),
    )
    return match ? pathIcons[match] : 'scale'
  }, [pathname])

  // Determine breadcrumb category dynamically
  const currentCategory = useMemo(() => {
    if (pathname === '/') return 'لوحة المعلومات'
    const match = Object.keys(sectionCategories).find(
      (path) => path !== '/' && pathname.startsWith(path),
    )
    return match ? sectionCategories[match] : 'إدارة النظام'
  }, [pathname])

  // Clean formatted user name and role
  const displayName = profile.name || profile.username || 'مدير النظام'
  const displayRole =
    roleLabels[profile.roleId] ||
    roleLabels[profile.role] ||
    (profile.role === 'admin' ? 'المستشار العام' : profile.role || 'عضو المكتب')

  const initials =
    profile.initials ||
    (displayName ? displayName.trim().slice(0, 2) : 'ما')

  // Live date in Arabic (e.g. الأحد، ٢٧ سبتمبر)
  const todayFormatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(new Date())
    } catch {
      return 'اليوم'
    }
  }, [])

  // Hijri year (e.g. ١٤٤٦هـ)
  const hijriYear = useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        year: 'numeric',
      }).formatToParts(new Date())
      const yearVal = parts.find((p) => p.type === 'year')?.value
      return yearVal ? `${yearVal}هـ` : '١٤٤٦هـ'
    } catch {
      return '١٤٤٦هـ'
    }
  }, [])

  return (
    <header className="topbar">
      {/* 1. الطرف الأيمن: زر القائمة للموبايل + أيقونة العنوان الفاخرة + المسار والعنوان */}
      <div className="topbar__title-block">
        <button
          type="button"
          className="mobile-toggle"
          onClick={onMenuClick}
          aria-label="فتح القائمة"
        >
          <Icon name="menu" size={20} />
        </button>

        <div className="topbar__title-icon" aria-hidden>
          <Icon name={currentIcon} size={22} />
        </div>

        <div className="topbar__title-meta">
          <nav className="topbar__breadcrumbs" aria-label="مسار التنقل">
            <span className="topbar__breadcrumb-root">نظام المحاماة</span>
            <span className="topbar__breadcrumb-sep" aria-hidden>/</span>
            <span className="topbar__breadcrumb-current">{currentCategory}</span>
          </nav>
          <div className="topbar__title-row">
            <h1 className="topbar__title">{title}</h1>
            <span className="topbar__section-badge">لوحة التحكم</span>
          </div>
        </div>
      </div>

      {/* 2. الطرف الأيسر: المؤشرات والملف الشخصي للمستخدم */}
      <div className="topbar__actions">
        {/* شارة الاتصال بقاعدة البيانات (ناجز / سحابي) مع نبض حي */}
        <div
          className="topbar__db-status"
          role="status"
          title="حالة الاتصال: متصل بقاعدة البيانات (ناجز / سحابي)"
        >
          <span className="db-status__dot-wrap" aria-hidden>
            <span className="db-status__ping" />
            <span className="db-status__dot" />
          </span>
          <span className="topbar__db-text">متصل بقاعدة البيانات (ناجز / سحابي)</span>
        </div>

        {/* تاريخ اليوم والتقويم الهجري/الميلادي */}
        <div className="topbar__date-pill" title="التاريخ الحالي">
          <Icon name="calendar" size={15} className="topbar__date-icon" />
          <span className="topbar__date-text">{todayFormatted}</span>
          <span className="topbar__hijri-badge">{hijriYear}</span>
        </div>

        {/* زر التنبيهات والإشعارات مع مؤشر تفاعلي حي */}
        <Link
          to="/notifications"
          className="topbar__icon-btn"
          aria-label="الإشعارات"
          title="الإشعارات والتنبيهات"
        >
          <Icon name="bell" size={19} />
          <span className="topbar__notif-ping" aria-hidden>
            <span className="topbar__notif-ping-ring" />
            <span className="topbar__notif-ping-dot" />
          </span>
          {unreadNotifications > 0 && (
            <span className="topbar__icon-badge">{unreadNotifications}</span>
          )}
        </Link>

        {/* بطاقة المستخدم الحالي الفاخرة (Current User Card) */}
        <Link to="/profile" className="user-chip" title="الملف الشخصي وإعدادات الحساب">
          <div className="user-chip__avatar-wrap">
            <div className="user-chip__avatar" aria-hidden>
              {initials}
            </div>
            <span className="user-chip__online-dot" title="متصل الآن" />
          </div>

          <div className="user-chip__meta">
            <div className="user-chip__name-row">
              <span className="user-chip__name" title={displayName}>
                {displayName}
              </span>
            </div>
            <span className="user-chip__role">{displayRole}</span>
          </div>
        </Link>
      </div>
    </header>
  )
}

