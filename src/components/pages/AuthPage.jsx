import { useState, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlinePhone, HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { ValidationSummaryBox } from '../ui/ValidationSummaryBox'
import { useAuth } from '../../context/AuthContext'
import { firm } from '../../data/dashboard'
import loginHeroImg from '../../assets/login.jpg'
import { apiRules } from '../../validation/apiRules'
import {
  validateLoginIdentifier,
  validateLoginPassword,
  validateLoginRole,
  enforceMaxLength,
} from '../../validation/validators'

// Role choices matching the provided UI design
const authRoleCards = [
  { id: 'client', label: 'موكل', icon: 'person' },
  { id: 'admin', label: 'إدارة', icon: 'cog' },
  { id: 'lawyer', label: 'محامي', icon: 'lawyers' },
]

const emptyLogin = { email: '', password: '' }

export default function AuthPage() {
  const { isAuthenticated, login, toast } = useAuth()
  const navigate = useNavigate()

  // Login form state
  const [role, setRole] = useState('admin')
  const [loginForm, setLoginForm] = useState(emptyLogin)
  const [loginTouched, setLoginTouched] = useState({ email: false, password: false })
  const [loginFieldErrors, setLoginFieldErrors] = useState({})
  const [loginSubmitError, setLoginSubmitError] = useState(null)
  const [loggingIn, setLoggingIn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeFocus, setActiveFocus] = useState(null)

  const loginInputRef = useRef(null)
  const passwordInputRef = useRef(null)

  // Redirect if already authenticated
  if (isAuthenticated) return <Navigate to="/" replace />

  const selectRole = (nextRole) => {
    setRole(nextRole)
    setLoginSubmitError(null)
    const roleErr = validateLoginRole(nextRole)
    setLoginFieldErrors((prev) => ({ ...prev, role: roleErr }))
  }

  // Physical input enforcement + live validation
  const handleLoginChange = (field, rawValue) => {
    const max = field === 'email' ? apiRules.login.login.max : apiRules.login.password.max
    // Enforce maxLength at input level so users physically cannot type past it
    const val = enforceMaxLength(rawValue, max)

    setLoginForm((prev) => ({ ...prev, [field]: val }))
    setLoginSubmitError(null)

    if (loginTouched[field]) {
      const err = field === 'email' ? validateLoginIdentifier(val) : validateLoginPassword(val)
      setLoginFieldErrors((prev) => ({ ...prev, [field]: err }))
    }
  }

  const handleLoginBlur = (field) => {
    setActiveFocus(null)
    setLoginTouched((prev) => ({ ...prev, [field]: true }))
    const val = loginForm[field]
    const err = field === 'email' ? validateLoginIdentifier(val) : validateLoginPassword(val)
    setLoginFieldErrors((prev) => ({ ...prev, [field]: err }))
  }

  const handleLoginFocus = (field) => {
    setActiveFocus(field)
  }

  const isLoginFormValid =
    !validateLoginIdentifier(loginForm.email) &&
    !validateLoginPassword(loginForm.password) &&
    !validateLoginRole(role)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (loggingIn) return

    setLoginTouched({ email: true, password: true })
    const emailErr = validateLoginIdentifier(loginForm.email)
    const passErr = validateLoginPassword(loginForm.password)
    const roleErr = validateLoginRole(role)

    if (emailErr || passErr || roleErr) {
      setLoginFieldErrors({ email: emailErr, password: passErr, role: roleErr })
      if (emailErr && loginInputRef.current) {
        loginInputRef.current.focus()
      } else if (passErr && passwordInputRef.current) {
        passwordInputRef.current.focus()
      }
      return
    }

    setLoggingIn(true)
    setLoginSubmitError(null)

    const res = await login({
      login: loginForm.email.trim(),
      password: loginForm.password,
      role,
    })

    setLoggingIn(false)

    if (res?.ok) {
      navigate('/', { replace: true })
    } else if (res?.error) {
      const err = res.error
      if (err.fieldErrors && Object.keys(err.fieldErrors).length) {
        setLoginFieldErrors((prev) => ({
          ...prev,
          email: err.fieldErrors.login || err.fieldErrors.email || prev.email,
          password: err.fieldErrors.password || prev.password,
          role: err.fieldErrors.role || prev.role,
        }))
      }
      setLoginSubmitError(err.message || 'بيانات تسجيل الدخول أو نوع الحساب غير صحيح')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__shell">

        {/* ══ يسار: نموذج تسجيل الدخول الحصري (Login-Only) ══ */}
        <main className="auth-panel">
          <motion.div
            className="auth-panel__inner"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            {/* رأس النموذج */}
            <header className="auth-panel__head">
              <h2>مرحباً بعودتك</h2>
              <p>سجل دخولك للوصول إلى لوحة التحكم</p>
            </header>

            {/* محدد الأدوار الثلاثة (موكل - إدارة - محامي) */}
            <div className="auth-roles" role="radiogroup" aria-label="نوع الحساب">
              {authRoleCards.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={role === item.id}
                  className={`auth-role${role === item.id ? ' is-active' : ''}`}
                  onClick={() => selectRole(item.id)}
                >
                  <Icon name={item.icon} size={22} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* رسالة الخطأ العامة من الخادم عند فشل الدخول */}
            {loginSubmitError && (
              <div className="form-banner" role="alert">
                {loginSubmitError}
              </div>
            )}

            {/* نموذج تسجيل الدخول */}
            <form className="auth-form" onSubmit={handleLogin} noValidate autoComplete="off">
              {/* حقل اسم المستخدم / البريد / الهاتف */}
              <label className="auth-field">
                <span>البريد الإلكتروني أو الهاتف</span>
                <input
                  ref={loginInputRef}
                  type="text"
                  value={loginForm.email}
                  placeholder="admin@test.com"
                  maxLength={apiRules.login.login.max}
                  autoComplete="off"
                  aria-invalid={Boolean(loginFieldErrors.email)}
                  className={loginFieldErrors.email ? 'is-invalid' : ''}
                  onChange={(e) => handleLoginChange('email', e.target.value)}
                  onFocus={() => handleLoginFocus('email')}
                  onBlur={() => handleLoginBlur('email')}
                />

                {loginFieldErrors.email ? (
                  <span className="auth-field__error" role="alert">
                    {loginFieldErrors.email}
                  </span>
                ) : activeFocus === 'email' ? (
                  <span className="auth-field__helper">
                    {apiRules.login.login.helperText}
                  </span>
                ) : null}
              </label>

              {/* حقل كلمة المرور */}
              <label className="auth-field">
                <span>كلمة المرور</span>
                <div className="auth-field__password">
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    placeholder="••••••••"
                    maxLength={apiRules.login.password.max}
                    autoComplete="new-password"
                    aria-invalid={Boolean(loginFieldErrors.password)}
                    className={loginFieldErrors.password ? 'is-invalid' : ''}
                    onChange={(e) => handleLoginChange('password', e.target.value)}
                    onFocus={() => handleLoginFocus('password')}
                    onBlur={() => handleLoginBlur('password')}
                  />
                  <button
                    type="button"
                    className="auth-field__toggle"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowPassword((v) => !v)
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                    }}
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                  </button>
                </div>

                {loginFieldErrors.password ? (
                  <span className="auth-field__error" role="alert">
                    {loginFieldErrors.password}
                  </span>
                ) : activeFocus === 'password' ? (
                  <span className="auth-field__helper">
                    {apiRules.login.password.helperText}
                  </span>
                ) : null}
              </label>

              {/* صندوق ملخص أخطاء التحقق */}
              <ValidationSummaryBox
                errors={{
                  ...loginFieldErrors,
                  submit: loginSubmitError,
                }}
              />

              {/* زر الدخول */}
              <button
                type="submit"
                className="auth-submit"
                disabled={!isLoginFormValid || loggingIn}
                aria-busy={loggingIn}
              >
                <span>{loggingIn ? 'جاري التحقق...' : 'دخول'}</span>
                {!loggingIn && <Icon name="login" size={18} />}
              </button>
            </form>

            {/* شارة الأمان السحابي المشفر */}
            <div className="auth-security-badge" aria-label="أمان الاتصال">
              <HiOutlineLockClosed size={14} style={{ color: '#d4af37' }} />
              <span>اتصال مشفر وآمن بالبوابة السحابية الموحدة</span>
            </div>
          </motion.div>
        </main>

        {/* ══ يمين: هوية مكتب الدوسري وصورة الخلفية ══ */}
        <aside className="auth-brand" aria-label="هوية مكتب الدوسري للمحاماة">
          <div className="auth-brand__bg" aria-hidden>
            <img src={loginHeroImg} alt="" />
            <div className="auth-brand__overlay" />
          </div>

          <motion.div
            className="auth-brand__content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* بادج المنصة */}
            <div className="auth-brand__badge">
              <Icon name="sessions" size={18} />
              <span>منصة المكاتب القانونية</span>
            </div>

            {/* العنوان الرئيسي */}
            <h1 className="auth-brand__title">مكتب الدوسري</h1>

            {/* الوصف التعريفي */}
            <p className="auth-brand__tagline">
              للمحاماة والاستشارات القانونية — إدارة القضايا والمواعيد والمستندات من مكان واحد.
            </p>

            {/* قائمة المزايا الثلاث */}
            <ul className="auth-brand__features">
              <li>
                <Icon name="cases" size={18} />
                <span>متابعة القضايا والجلسات</span>
              </li>
              <li>
                <Icon name="documents" size={18} />
                <span>أرشفة المستندات بأمان</span>
              </li>
              <li>
                <Icon name="invoices" size={18} />
                <span>الفواتير والمدفوعات</span>
              </li>
            </ul>

            {/* انعكاس مائي خلفي كما في الصورة المرفقة */}
            <div className="auth-brand__ghost" aria-hidden>
              <div className="auth-brand__ghost-title">مكتب الدوسري</div>
              <div className="auth-brand__ghost-tagline">
                للمحاماة والاستشارات القانونية — إدارة القضايا والمواعيد والمستندات من مكان واحد.
              </div>
              <ul className="auth-brand__ghost-features">
                <li>متابعة القضايا والجلسات</li>
                <li>أرشفة المستندات بأمان</li>
                <li>الفواتير والمدفوعات</li>
              </ul>
            </div>
          </motion.div>

          {/* تذييل جهات الاتصال */}
          <footer className="auth-brand__footer">
            <div className="auth-brand__footer-item">
              <HiOutlinePhone size={15} />
              <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>{firm.phone}</span>
            </div>
            <div className="auth-brand__footer-item">
              <HiOutlineMail size={15} />
              <span>{firm.email}</span>
            </div>
          </footer>
        </aside>
      </div>

      {/* تنبيهات النظام Toast */}
      <AnimatePresence>
        {toast ? (
          <motion.div
            className={`auth-toast auth-toast--${toast.tone}`}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Icon name={toast.tone === 'error' ? 'alert' : 'check'} size={18} />
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
