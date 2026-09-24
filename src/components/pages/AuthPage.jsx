import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '../ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { authRoles, demoAccounts } from '../../data/auth'
import { firm } from '../../data/dashboard'
import loginHeroImg from '../../assets/login.jpg'

const emptyLogin = { email: 'client@test.com', password: '123456' }
const emptyRegister = {
  name: '', email: '', phone: '',
  password: '', confirmPassword: '',
  nationalId: '', address: '',
}

export default function AuthPage() {
  const { isAuthenticated, login, register, registering, toast } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode]               = useState('login')
  const [role, setRole]               = useState('client')
  const [loginForm, setLoginForm]     = useState(emptyLogin)
  const [registerForm, setRegisterForm] = useState(emptyRegister)
  const [showPassword, setShowPassword] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  const selectRole = (nextRole) => {
    setRole(nextRole)
    const demo = demoAccounts[nextRole]
    if (demo && mode === 'login') setLoginForm({ email: demo.email, password: demo.password })
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    if (nextMode === 'login') {
      const demo = demoAccounts[role]
      if (demo) setLoginForm({ email: demo.email, password: demo.password })
    }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    const ok = login({ ...loginForm, role })
    if (ok) navigate('/', { replace: true })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (registering) return
    const ok = await register({ ...registerForm, role })
    if (ok) navigate('/', { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="auth-page__shell">

        {/* ══ يسار: فورم اللوجين ══ */}
        <main className="auth-panel">
          <motion.div className="auth-panel__inner"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}>

            <header className="auth-panel__head">
              <h2>{mode === 'login' ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}</h2>
              <p>{mode === 'login' ? 'سجّل دخولك للوصول إلى لوحة التحكم' : 'أدخل بياناتك لإنشاء حساب في النظام'}</p>
            </header>

            <div className="auth-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={mode === 'login'}
                className={mode === 'login' ? 'is-active' : ''} onClick={() => switchMode('login')}>
                تسجيل الدخول
              </button>
              <button type="button" role="tab" aria-selected={mode === 'register'}
                className={mode === 'register' ? 'is-active' : ''} onClick={() => switchMode('register')}>
                إنشاء حساب
              </button>
            </div>

            <div className="auth-roles" role="radiogroup" aria-label="نوع الحساب">
              {authRoles.map((item) => (
                <button key={item.id} type="button" role="radio"
                  aria-checked={role === item.id}
                  className={`auth-role${role === item.id ? ' is-active' : ''}`}
                  onClick={() => selectRole(item.id)}>
                  <Icon name={item.icon} size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.form key="login" className="auth-form" onSubmit={handleLogin}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <label className="auth-field">
                    <span>البريد الإلكتروني أو الهاتف</span>
                    <input type="text" value={loginForm.email} placeholder="admin@test.com"
                      required autoComplete="username"
                      onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))} />
                  </label>
                  <label className="auth-field">
                    <span>كلمة المرور</span>
                    <div className="auth-field__password">
                      <input type={showPassword ? 'text' : 'password'} value={loginForm.password}
                        placeholder="••••••••" required autoComplete="current-password"
                        onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))} />
                      <button type="button" className="auth-field__toggle"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'إخفاء' : 'إظهار'}>
                        <Icon name="eye" size={18} />
                      </button>
                    </div>
                  </label>
                  <button type="submit" className="auth-submit">
                    دخول <Icon name="login" size={18} />
                  </button>
                </motion.form>
              ) : (
                <motion.form key="register" className="auth-form" onSubmit={handleRegister}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <label className="auth-field">
                    <span>الاسم الكامل</span>
                    <input type="text" value={registerForm.name} required
                      onChange={(e) => setRegisterForm((p) => ({ ...p, name: e.target.value }))} />
                  </label>
                  <div className="auth-form__row">
                    <label className="auth-field">
                      <span>البريد الإلكتروني</span>
                      <input type="email" value={registerForm.email} required
                        onChange={(e) => setRegisterForm((p) => ({ ...p, email: e.target.value }))} />
                    </label>
                    <label className="auth-field">
                      <span>رقم الجوال</span>
                      <input type="tel" value={registerForm.phone} placeholder="05xxxxxxxx"
                        onChange={(e) => setRegisterForm((p) => ({ ...p, phone: e.target.value }))} />
                    </label>
                  </div>
                  <div className="auth-form__row">
                    <label className="auth-field">
                      <span>كلمة المرور</span>
                      <input type="password" value={registerForm.password} required
                        onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))} />
                    </label>
                    <label className="auth-field">
                      <span>تأكيد كلمة المرور</span>
                      <input type="password" value={registerForm.confirmPassword} required
                        onChange={(e) => setRegisterForm((p) => ({ ...p, confirmPassword: e.target.value }))} />
                    </label>
                  </div>
                  <label className="auth-field">
                    <span>رقم الهوية</span>
                    <input type="text" value={registerForm.nationalId}
                      onChange={(e) => setRegisterForm((p) => ({ ...p, nationalId: e.target.value }))} />
                  </label>
                  <label className="auth-field">
                    <span>العنوان</span>
                    <input type="text" value={registerForm.address}
                      onChange={(e) => setRegisterForm((p) => ({ ...p, address: e.target.value }))} />
                  </label>
                  <button type="submit" className="auth-submit" disabled={registering} aria-busy={registering}>
                    {registering ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
                    {!registering ? <Icon name="plus" size={18} /> : null}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </main>

        {/* ══ يمين: صورة المحاماة + الهوية ══ */}
        <aside className="auth-brand" aria-label="هوية المكتب">
          <div className="auth-brand__bg" aria-hidden>
            <img src={loginHeroImg} alt="" />
            <div className="auth-brand__overlay" />
          </div>

          <motion.div className="auth-brand__content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="auth-brand__badge">
              <Icon name="cases" size={20} />
              <span>منصة المكاتب القانونية</span>
            </div>
            <h1 className="auth-brand__title">مكتب الدوسري</h1>
            <p className="auth-brand__tagline">
              للمحاماة والاستشارات القانونية — إدارة القضايا والمواعيد والمستندات من مكان واحد.
            </p>
            <ul className="auth-brand__features">
              <li><Icon name="cases"     size={17} /><span>متابعة القضايا والجلسات</span></li>
              <li><Icon name="documents" size={17} /><span>أرشفة المستندات بأمان</span></li>
              <li><Icon name="invoices"  size={17} /><span>الفواتير والمدفوعات</span></li>
            </ul>
            <div className="auth-brand__contact">
              <span>{firm.phone}</span>
              <span aria-hidden>·</span>
              <span>{firm.email}</span>
            </div>
          </motion.div>

        </aside>
      </div>

      <AnimatePresence>
        {toast ? (
          <motion.div className={`auth-toast auth-toast--${toast.tone}`}
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Icon name={toast.tone === 'error' ? 'alert' : 'check'} size={18} />
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
