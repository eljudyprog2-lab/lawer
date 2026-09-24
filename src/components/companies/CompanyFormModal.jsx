import { useEffect, useMemo, useRef, useState } from 'react'
import {
  HiOutlinePhotograph,
  HiOutlineExclamationCircle,
  HiOutlineRefresh,
  HiOutlineX,
} from 'react-icons/hi'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { DateField } from '../ui/DateField'
import { FilterSelect } from '../ui/FilterSelect'
import {
  companyStatusOptions,
  createCompany,
  parseApiError,
  subscriptionPlanOptions,
  toDateInputValue,
  updateCompany,
} from '../../api/companies'

const MAX_LOGO_BYTES = 2 * 1024 * 1024
const LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']

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
    address: '',
    subscription_plan: 'basic',
    subscription_start: isoDate(0),
    subscription_end: isoDate(1),
    status: 'active',
    logo: null,
  }
}

function companyToForm(company) {
  return {
    name: company?.name || '',
    email: company?.email || '',
    phone: company?.phone || '',
    address: company?.address || '',
    subscription_plan: company?.subscription_plan || 'basic',
    subscription_start: toDateInputValue(company?.subscription_start) || isoDate(0),
    subscription_end: toDateInputValue(company?.subscription_end) || isoDate(1),
    status: company?.status || 'active',
    logo: null,
  }
}

function fieldClass(hasError) {
  return [
    'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-[#3d4f50] outline-none transition',
    'placeholder:text-[#9aa9a9]',
    'focus:border-gold focus:ring-2 focus:ring-gold/20',
    hasError ? 'border-[#c44545] ring-2 ring-[#c44545]/15' : 'border-[#d5e0e0]',
  ].join(' ')
}

function Field({ label, required, hint, error, htmlFor, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-brand">
        {label}
        {required ? <span className="ms-1 text-[#c44545]">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-[#c44545]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[#6b7f80]">{hint}</p>
      ) : null}
    </div>
  )
}

/**
 * Shared Add / Edit modal.
 * - Add: POST multipart to /api/companies
 * - Edit: POST multipart to /api/companies/{id} with `_method=PUT`
 */
export function CompanyFormModal({ open, mode = 'add', company = null, onClose, onSuccess }) {
  const isEdit = mode === 'edit'
  const fileInputRef = useRef(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState(null)

  // Existing remote logo URL (edit mode) until the user picks a new file.
  const existingLogo = isEdit ? company?.logo || null : null

  const logoPreview = useMemo(() => {
    if (form.logo instanceof File) return URL.createObjectURL(form.logo)
    return null
  }, [form.logo])

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

  // Reset form whenever the modal opens or the target company changes.
  useEffect(() => {
    if (!open) return
    setForm(isEdit && company ? companyToForm(company) : emptyForm())
    setErrors({})
    setBanner(null)
    setLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [open, isEdit, company])

  const setField = (key) => (event) => {
    const value = event.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
    setBanner(null)
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'اسم الشركة مطلوب'
    if (!form.email.trim()) next.email = 'البريد الإلكتروني مطلوب'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'صيغة البريد الإلكتروني غير صحيحة'
    }
    if (!form.phone.trim()) next.phone = 'رقم الهاتف مطلوب'
    if (!form.address.trim()) next.address = 'العنوان مطلوب'
    if (!form.subscription_plan) next.subscription_plan = 'اختر خطة الاشتراك'
    if (!form.subscription_start) next.subscription_start = 'حدد تاريخ البداية'
    if (!form.subscription_end) next.subscription_end = 'حدد تاريخ النهاية'
    if (
      form.subscription_start &&
      form.subscription_end &&
      form.subscription_end < form.subscription_start
    ) {
      next.subscription_end = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
    }
    if (!form.status) next.status = 'اختر حالة الاشتراك'
    return next
  }

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0]
    setBanner(null)

    if (!file) {
      setForm((prev) => ({ ...prev, logo: null }))
      setErrors((prev) => ({ ...prev, logo: '' }))
      return
    }

    if (file.type && !LOGO_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, logo: 'يُسمح بملفات الصور فقط' }))
      event.target.value = ''
      return
    }

    if (file.size > MAX_LOGO_BYTES) {
      setErrors((prev) => ({ ...prev, logo: 'حجم الشعار يجب ألا يتجاوز 2 ميجابايت' }))
      event.target.value = ''
      return
    }

    setForm((prev) => ({ ...prev, logo: file }))
    setErrors((prev) => ({ ...prev, logo: '' }))
  }

  const clearLogo = () => {
    setForm((prev) => ({ ...prev, logo: null }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    if (loading) return
    onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      setBanner({ tone: 'error', text: 'يرجى استكمال الحقول المطلوبة قبل الإرسال' })
      return
    }

    setLoading(true)
    setBanner(null)
    setErrors({})

    try {
      const result =
        isEdit && company?.id
          ? await updateCompany(company.id, form)
          : await createCompany(form)

      const saved = result?.data || result
      onSuccess?.(saved, isEdit ? 'edit' : 'add')
      onClose()
    } catch (error) {
      const parsed = parseApiError(error)
      setErrors(parsed.fieldErrors)
      setBanner({ tone: 'error', text: parsed.message })
    } finally {
      setLoading(false)
    }
  }

  const previewSrc = logoPreview || existingLogo

  return (
    <Modal
      open={open}
      title={isEdit ? 'تعديل الشركة' : 'إضافة شركة جديدة'}
      onClose={handleClose}
      wide
      footer={
        <>
          <button
            type="submit"
            form="company-form"
            disabled={loading}
            className="btn btn--primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <HiOutlineRefresh size={18} className="animate-spin" aria-hidden />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Icon name="check" size={18} />
                {isEdit ? 'حفظ التعديلات' : 'إنشاء الشركة'}
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleClose}
            disabled={loading}
          >
            إلغاء
          </button>
        </>
      }
    >
      <form id="company-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
        <div className="space-y-6">
          {banner ? (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-3 rounded-xl border border-[#c44545]/25 bg-[#fdeeee] px-4 py-3 text-sm text-[#8a2b2b]"
            >
              <HiOutlineExclamationCircle size={20} className="mt-0.5 shrink-0" />
              <p className="font-medium">{banner.text}</p>
            </div>
          ) : null}

          {/* Logo upload */}
          <section>
            <h3 className="!mb-3 font-display text-base font-bold text-brand">شعار الشركة</h3>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-dashed border-gold/60 bg-gold-pale">
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt="معاينة شعار الشركة"
                    className="size-full object-cover"
                  />
                ) : (
                  <HiOutlinePhotograph size={28} className="text-gold" aria-hidden />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-soft">
                    {isEdit ? 'تغيير الشعار' : 'اختيار صورة'}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleLogoChange}
                    />
                  </label>
                  {form.logo ? (
                    <button
                      type="button"
                      onClick={clearLogo}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#d5e0e0] bg-white px-3 py-2.5 text-sm font-semibold text-[#6b7f80] transition hover:border-[#c44545]/40 hover:text-[#c44545]"
                    >
                      <HiOutlineX size={16} />
                      إزالة
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 truncate text-sm text-[#3d4f50]">
                  {form.logo
                    ? form.logo.name
                    : isEdit
                      ? 'اترك الحقل فارغاً للإبقاء على الشعار الحالي'
                      : 'لم يتم اختيار ملف'}
                </p>
                <p className="mt-1 text-xs text-[#6b7f80]">
                  PNG أو JPG أو WEBP — الحد الأقصى 2 ميجابايت
                </p>
                {errors.logo ? (
                  <p className="mt-1 text-xs font-medium text-[#c44545]">{errors.logo}</p>
                ) : null}
              </div>
            </div>
          </section>

          {/* Company info */}
          <section>
            <h3 className="!mb-3 font-display text-base font-bold text-brand">معلومات الشركة</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="اسم الشركة" required htmlFor="modal-company-name" error={errors.name}>
                <input
                  id="modal-company-name"
                  className={fieldClass(Boolean(errors.name))}
                  value={form.name}
                  onChange={setField('name')}
                  placeholder="مثال: مكتب النور للمحاماة"
                  autoComplete="organization"
                />
              </Field>
              <Field
                label="البريد الإلكتروني"
                required
                htmlFor="modal-company-email"
                error={errors.email}
              >
                <input
                  id="modal-company-email"
                  type="email"
                  dir="ltr"
                  className={`${fieldClass(Boolean(errors.email))} text-start`}
                  value={form.email}
                  onChange={setField('email')}
                  placeholder="company@example.com"
                  autoComplete="email"
                />
              </Field>
              <Field label="رقم الهاتف" required htmlFor="modal-company-phone" error={errors.phone}>
                <input
                  id="modal-company-phone"
                  className={fieldClass(Boolean(errors.phone))}
                  value={form.phone}
                  onChange={setField('phone')}
                  placeholder="05xxxxxxxx"
                  autoComplete="tel"
                />
              </Field>
              <Field
                label="العنوان"
                required
                htmlFor="modal-company-address"
                error={errors.address}
              >
                <input
                  id="modal-company-address"
                  className={fieldClass(Boolean(errors.address))}
                  value={form.address}
                  onChange={setField('address')}
                  placeholder="المدينة — الحي — الشارع"
                  autoComplete="street-address"
                />
              </Field>
            </div>
          </section>

          {/* Subscription */}
          <section>
            <h3 className="!mb-3 font-display text-base font-bold text-brand">الاشتراك</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="خطة الاشتراك"
                required
                htmlFor="modal-company-plan"
                error={errors.subscription_plan}
              >
                <FilterSelect
                  value={form.subscription_plan}
                  onChange={(value) =>
                    setField('subscription_plan')({ target: { value } })
                  }
                  aria-label="خطة الاشتراك"
                  className={errors.subscription_plan ? 'is-invalid' : ''}
                  options={subscriptionPlanOptions.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                />
              </Field>
              <Field
                label="حالة الاشتراك"
                required
                htmlFor="modal-company-status"
                error={errors.status}
              >
                <FilterSelect
                  value={form.status}
                  onChange={(value) => setField('status')({ target: { value } })}
                  aria-label="حالة الاشتراك"
                  className={errors.status ? 'is-invalid' : ''}
                  options={companyStatusOptions.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                />
              </Field>
              <Field
                label="بداية الاشتراك"
                required
                htmlFor="modal-company-start"
                error={errors.subscription_start}
              >
                <DateField
                  value={form.subscription_start}
                  onChange={(value) => setField('subscription_start')({ target: { value } })}
                  className={errors.subscription_start ? 'is-invalid' : ''}
                  aria-label="بداية الاشتراك"
                  required
                />
              </Field>
              <Field
                label="نهاية الاشتراك"
                required
                htmlFor="modal-company-end"
                error={errors.subscription_end}
              >
                <DateField
                  value={form.subscription_end}
                  onChange={(value) => setField('subscription_end')({ target: { value } })}
                  className={errors.subscription_end ? 'is-invalid' : ''}
                  aria-label="نهاية الاشتراك"
                  required
                />
              </Field>
            </div>
          </section>
        </div>
      </form>
    </Modal>
  )
}
