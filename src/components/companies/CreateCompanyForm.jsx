import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineRefresh,
  HiOutlineUpload,
  HiOutlineX,
} from 'react-icons/hi'
import { createCompany, parseApiError } from '../../api/companies'

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const LOGO_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']

const STEPS = [
  { id: 1, label: 'بيانات المكتب' },
  { id: 2, label: 'بيانات المسؤول' },
  { id: 3, label: 'تأكيد' },
]

const PLANS = [
  { value: 'basic', label: 'أساسية', price: 199 },
  { value: 'professional', label: 'احترافية', price: 499, popular: true },
  { value: 'enterprise', label: 'مؤسسية', price: 799 },
]

function isoDate(offsetYears = 0) {
  const date = new Date()
  date.setFullYear(date.getFullYear() + offsetYears)
  return date.toISOString().slice(0, 10)
}

function emptyForm() {
  return {
    name: '',
    email: '',
    phone: '',
    city: '',
    subscription_plan: 'professional',
    logo: null,
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    password: '',
    confirmPassword: '',
  }
}

function planMeta(value) {
  return PLANS.find((p) => p.value === value) || PLANS[1]
}

export function CreateCompanyForm({ onSuccess }) {
  const fileInputRef = useRef(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)

  const logoPreview = useMemo(() => {
    if (!(form.logo instanceof File)) return null
    return URL.createObjectURL(form.logo)
  }, [form.logo])

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

  const setField = (key) => (event) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
    setBanner(null)
  }

  const applyLogoFile = (file) => {
    setBanner(null)
    if (!file) return

    if (file.type && !LOGO_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, logo: 'يُسمح بملفات PNG أو JPG أو SVG فقط' }))
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      setErrors((prev) => ({ ...prev, logo: 'حجم الشعار يجب ألا يتجاوز 2 ميجابايت' }))
      return
    }

    setForm((prev) => ({ ...prev, logo: file }))
    setErrors((prev) => ({ ...prev, logo: '' }))
  }

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      setForm((prev) => ({ ...prev, logo: null }))
      return
    }
    applyLogoFile(file)
  }

  const clearLogo = () => {
    setForm((prev) => ({ ...prev, logo: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validateStep1 = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'اسم المكتب مطلوب'
    if (!form.email.trim()) next.email = 'البريد الإلكتروني مطلوب'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'صيغة البريد الإلكتروني غير صحيحة'
    }
    if (!form.phone.trim()) next.phone = 'رقم الجوال مطلوب'
    if (!form.city.trim()) next.city = 'المدينة مطلوبة'
    if (!form.subscription_plan) next.subscription_plan = 'اختر الباقة'
    return next
  }

  const validateStep2 = () => {
    const next = {}
    if (!form.adminName.trim()) next.adminName = 'اسم المسؤول مطلوب'
    if (!form.adminEmail.trim()) next.adminEmail = 'البريد الإلكتروني مطلوب'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail.trim())) {
      next.adminEmail = 'صيغة البريد الإلكتروني غير صحيحة'
    }
    if (!form.adminPhone.trim()) next.adminPhone = 'رقم الجوال مطلوب'
    if (!form.password) next.password = 'كلمة المرور مطلوبة'
    else if (form.password.length < 6) next.password = 'كلمة المرور يجب ألا تقل عن 6 أحرف'
    if (!form.confirmPassword) next.confirmPassword = 'تأكيد كلمة المرور مطلوب'
    else if (form.password !== form.confirmPassword) {
      next.confirmPassword = 'كلمتا المرور غير متطابقتين'
    }
    return next
  }

  const goNext = () => {
    const nextErrors = step === 1 ? validateStep1() : validateStep2()
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      setBanner({ tone: 'error', text: 'يرجى استكمال الحقول المطلوبة قبل المتابعة' })
      return
    }
    setErrors({})
    setBanner(null)
    setStep((s) => Math.min(3, s + 1))
  }

  const goBack = () => {
    setBanner(null)
    setErrors({})
    setStep((s) => Math.max(1, s - 1))
  }

  const handleSubmit = async () => {
    const step1 = validateStep1()
    const step2 = validateStep2()
    const nextErrors = { ...step1, ...step2 }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      setBanner({ tone: 'error', text: 'يرجى مراجعة البيانات قبل التأكيد' })
      setStep(Object.keys(step1).length ? 1 : 2)
      return
    }

    setLoading(true)
    setBanner(null)

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.city.trim(),
        subscription_plan: form.subscription_plan,
        subscription_start: isoDate(0),
        subscription_end: isoDate(1),
        status: 'active',
        logo: form.logo,
      }
      const result = await createCompany(payload)
      const created = result?.data
      setDone(true)
      setBanner({
        tone: 'success',
        text: result?.message || `تم تسجيل مكتب «${created?.name || form.name}» بنجاح`,
      })
      onSuccess?.(created || result)
    } catch (error) {
      const parsed = parseApiError(error)
      setErrors(parsed.fieldErrors || {})
      setBanner({ tone: 'error', text: parsed.message })
    } finally {
      setLoading(false)
    }
  }

  const selectedPlan = planMeta(form.subscription_plan)

  return (
    <div className="register-wizard">
      <nav className="register-steps" aria-label="خطوات التسجيل">
        {STEPS.map((item, index) => {
          const active = step === item.id
          const complete = step > item.id || done
          return (
            <div key={item.id} className="register-steps__item">
              {index > 0 ? (
                <span
                  className={`register-steps__line${complete || active ? ' is-on' : ''}`}
                  aria-hidden
                />
              ) : null}
              <div
                className={`register-steps__node${active ? ' is-active' : ''}${complete ? ' is-done' : ''}`}
              >
                <span className="register-steps__num" aria-hidden>
                  {complete && !active ? <HiOutlineCheckCircle size={22} /> : item.id}
                </span>
                <span className="register-steps__label">{item.label}</span>
              </div>
            </div>
          )
        })}
      </nav>

      <div className="register-card" aria-busy={loading}>
        {banner ? (
          <div
            role="status"
            aria-live="polite"
            className={`register-banner register-banner--${banner.tone}`}
          >
            {banner.tone === 'success' ? (
              <HiOutlineCheckCircle size={20} className="shrink-0" />
            ) : (
              <HiOutlineExclamationCircle size={20} className="shrink-0" />
            )}
            <p>{banner.text}</p>
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              className="register-done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <span className="register-done__icon" aria-hidden>
                <HiOutlineCheckCircle size={40} />
              </span>
              <h2>تم تسجيل مكتبك بنجاح</h2>
              <p>تجربتك المجانية لمدة 14 يوماً جاهزة. يمكنك الآن تسجيل الدخول إلى لوحة التحكم.</p>
              <Link to="/login" className="register-btn register-btn--primary">
                تسجيل الدخول
              </Link>
            </motion.div>
          ) : step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28 }}
            >
              <header className="register-card__head">
                <h2>بيانات المكتب</h2>
                <p>هذه المعلومات ستظهر في فواتيرك ويمكن تعديلها لاحقاً</p>
              </header>

              <div className="register-fields">
                <label className="register-field">
                  <span>اسم المكتب</span>
                  <input
                    value={form.name}
                    onChange={setField('name')}
                    placeholder="مكتب الدوسري للمحاماة"
                    autoComplete="organization"
                    className={errors.name ? 'is-invalid' : ''}
                  />
                  {errors.name ? <em>{errors.name}</em> : null}
                </label>

                <div className="register-fields__row">
                  <label className="register-field">
                    <span>البريد الإلكتروني</span>
                    <input
                      type="email"
                      dir="ltr"
                      value={form.email}
                      onChange={setField('email')}
                      placeholder="info@office.com"
                      autoComplete="email"
                      className={errors.email ? 'is-invalid' : ''}
                    />
                    {errors.email ? <em>{errors.email}</em> : null}
                  </label>
                  <label className="register-field">
                    <span>رقم الجوال</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={setField('phone')}
                      placeholder="05xxxxxxxx"
                      autoComplete="tel"
                      className={errors.phone ? 'is-invalid' : ''}
                    />
                    {errors.phone ? <em>{errors.phone}</em> : null}
                  </label>
                </div>

                <label className="register-field">
                  <span>المدينة</span>
                  <input
                    value={form.city}
                    onChange={setField('city')}
                    placeholder="الرياض"
                    autoComplete="address-level2"
                    className={errors.city ? 'is-invalid' : ''}
                  />
                  {errors.city ? <em>{errors.city}</em> : null}
                </label>

                <div className="register-field">
                  <span>شعار المكتب (اختياري)</span>
                  <div
                    className={`register-upload${dragOver ? ' is-drag' : ''}${logoPreview ? ' has-file' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOver(true)
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOver(false)
                      applyLogoFile(e.dataTransfer.files?.[0])
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      id="office-logo"
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="sr-only"
                      onChange={handleLogoChange}
                    />
                    {logoPreview ? (
                      <div className="register-upload__preview">
                        <img src={logoPreview} alt="معاينة الشعار" />
                        <div className="register-upload__meta">
                          <strong>{form.logo?.name}</strong>
                          <button type="button" onClick={clearLogo}>
                            <HiOutlineX size={16} />
                            إزالة
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="office-logo" className="register-upload__empty">
                        <HiOutlineUpload size={28} aria-hidden />
                        <strong>اسحب الشعار هنا أو اضغط للرفع</strong>
                        <small>PNG أو JPG أو SVG — بحد أقصى 2 ميجابايت</small>
                      </label>
                    )}
                  </div>
                  {errors.logo ? <em className="register-field__error">{errors.logo}</em> : null}
                </div>

                <fieldset className="register-plans">
                  <legend>اختر الباقة</legend>
                  <div className="register-plans__grid" role="radiogroup" aria-label="اختر الباقة">
                    {PLANS.map((plan) => {
                      const selected = form.subscription_plan === plan.value
                      return (
                        <button
                          key={plan.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          className={`register-plan${selected ? ' is-selected' : ''}${plan.popular ? ' is-popular' : ''}`}
                          onClick={() => {
                            setForm((prev) => ({ ...prev, subscription_plan: plan.value }))
                            setErrors((prev) => ({ ...prev, subscription_plan: '' }))
                          }}
                        >
                          <span className="register-plan__name">{plan.label}</span>
                          <span className="register-plan__price">
                            <strong>{plan.price}</strong> ر.س / شهر
                          </span>
                          {plan.popular ? (
                            <span className="register-plan__badge">الأكثر طلباً</span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                  {errors.subscription_plan ? (
                    <em className="register-field__error">{errors.subscription_plan}</em>
                  ) : null}
                </fieldset>
              </div>

              <button type="button" className="register-btn register-btn--primary" onClick={goNext}>
                متابعة — بيانات المسؤول
                <HiOutlineArrowLeft size={18} aria-hidden />
              </button>
              <p className="register-note">تجربة مجانية 14 يوم — لن يتم خصم أي مبالغ الآن</p>
              <p className="register-legal">
                بالمتابعة، أنت توافق على{' '}
                <a href="#terms">شروط الاستخدام</a> و<a href="#privacy">سياسة الخصوصية</a>
              </p>
            </motion.div>
          ) : step === 2 ? (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28 }}
            >
              <header className="register-card__head">
                <h2>بيانات المسؤول</h2>
                <p>حساب المسؤول الرئيسي لإدارة المكتب على المنصة</p>
              </header>

              <div className="register-fields">
                <label className="register-field">
                  <span>الاسم الكامل</span>
                  <input
                    value={form.adminName}
                    onChange={setField('adminName')}
                    placeholder="أحمد الدوسري"
                    autoComplete="name"
                    className={errors.adminName ? 'is-invalid' : ''}
                  />
                  {errors.adminName ? <em>{errors.adminName}</em> : null}
                </label>

                <div className="register-fields__row">
                  <label className="register-field">
                    <span>البريد الإلكتروني</span>
                    <input
                      type="email"
                      dir="ltr"
                      value={form.adminEmail}
                      onChange={setField('adminEmail')}
                      placeholder="admin@office.com"
                      autoComplete="email"
                      className={errors.adminEmail ? 'is-invalid' : ''}
                    />
                    {errors.adminEmail ? <em>{errors.adminEmail}</em> : null}
                  </label>
                  <label className="register-field">
                    <span>رقم الجوال</span>
                    <input
                      type="tel"
                      value={form.adminPhone}
                      onChange={setField('adminPhone')}
                      placeholder="05xxxxxxxx"
                      autoComplete="tel"
                      className={errors.adminPhone ? 'is-invalid' : ''}
                    />
                    {errors.adminPhone ? <em>{errors.adminPhone}</em> : null}
                  </label>
                </div>

                <div className="register-fields__row">
                  <label className="register-field">
                    <span>كلمة المرور</span>
                    <div className="register-field__password">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={setField('password')}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={errors.password ? 'is-invalid' : ''}
                      />
                      <button
                        type="button"
                        className="register-field__toggle"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                      </button>
                    </div>
                    {errors.password ? <em>{errors.password}</em> : null}
                  </label>
                  <label className="register-field">
                    <span>تأكيد كلمة المرور</span>
                    <div className="register-field__password">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={setField('confirmPassword')}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className={errors.confirmPassword ? 'is-invalid' : ''}
                      />
                      <button
                        type="button"
                        className="register-field__toggle"
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label={showConfirm ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showConfirm ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword ? <em>{errors.confirmPassword}</em> : null}
                  </label>
                </div>
              </div>

              <div className="register-actions">
                <button type="button" className="register-btn register-btn--ghost" onClick={goBack}>
                  <HiOutlineArrowRight size={18} aria-hidden />
                  رجوع
                </button>
                <button type="button" className="register-btn register-btn--primary" onClick={goNext}>
                  متابعة — التأكيد
                  <HiOutlineArrowLeft size={18} aria-hidden />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28 }}
            >
              <header className="register-card__head">
                <h2>تأكيد التسجيل</h2>
                <p>راجع بياناتك ثم أكّد لإنشاء المكتب وبدء التجربة المجانية</p>
              </header>

              <div className="register-summary">
                <section>
                  <h3>المكتب</h3>
                  <dl>
                    <div>
                      <dt>الاسم</dt>
                      <dd>{form.name}</dd>
                    </div>
                    <div>
                      <dt>البريد</dt>
                      <dd dir="ltr">{form.email}</dd>
                    </div>
                    <div>
                      <dt>الجوال</dt>
                      <dd>{form.phone}</dd>
                    </div>
                    <div>
                      <dt>المدينة</dt>
                      <dd>{form.city}</dd>
                    </div>
                    <div>
                      <dt>الباقة</dt>
                      <dd>
                        {selectedPlan.label} — {selectedPlan.price} ر.س / شهر
                      </dd>
                    </div>
                  </dl>
                </section>
                <section>
                  <h3>المسؤول</h3>
                  <dl>
                    <div>
                      <dt>الاسم</dt>
                      <dd>{form.adminName}</dd>
                    </div>
                    <div>
                      <dt>البريد</dt>
                      <dd dir="ltr">{form.adminEmail}</dd>
                    </div>
                    <div>
                      <dt>الجوال</dt>
                      <dd>{form.adminPhone}</dd>
                    </div>
                  </dl>
                </section>
              </div>

              <div className="register-actions">
                <button
                  type="button"
                  className="register-btn register-btn--ghost"
                  onClick={goBack}
                  disabled={loading}
                >
                  <HiOutlineArrowRight size={18} aria-hidden />
                  رجوع
                </button>
                <button
                  type="button"
                  className="register-btn register-btn--primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <HiOutlineRefresh size={18} className="animate-spin" aria-hidden />
                      جاري التسجيل...
                    </>
                  ) : (
                    <>
                      تأكيد وبدء التجربة
                      <HiOutlineCheckCircle size={18} aria-hidden />
                    </>
                  )}
                </button>
              </div>
              <p className="register-note">تجربة مجانية 14 يوم — لن يتم خصم أي مبالغ الآن</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
