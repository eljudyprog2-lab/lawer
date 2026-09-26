import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Field, FieldGrid, FormBanner, FormSection } from '../ui/Form'
import { FilterSelect } from '../ui/FilterSelect'
import { Icon } from '../ui/Icon'
import { ValidationSummaryBox } from '../ui/ValidationSummaryBox'
import { apiRules } from '../../validation/apiRules'
import { validateField } from '../../validation/validators'
import { userRoleOptions, userStatusOptions } from '../../api/users'

export function UserFormModal({
  open,
  mode = 'create',
  initialValues = null,
  onClose,
  onSave,
  submitting = false,
}) {
  const isEdit = mode === 'edit'

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'admin',
    status: 'active',
    password: '',
    confirmPassword: '',
  })

  const [fieldErrors, setFieldErrors] = useState({})
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    setBanner(null)

    if (isEdit && initialValues) {
      setForm({
        full_name: initialValues.full_name || initialValues.name || '',
        email: initialValues.email || '',
        phone: initialValues.phone || '',
        role: initialValues.role || 'admin',
        status: initialValues.status || 'active',
        password: '',
        confirmPassword: '',
      })
    } else {
      setForm({
        full_name: '',
        email: '',
        phone: '',
        role: 'admin',
        status: 'active',
        password: '',
        confirmPassword: '',
      })
    }
  }, [open, isEdit, initialValues])

  const set = (key) => (e) => {
    const val = e.target.value
    setForm((prev) => ({ ...prev, [key]: val }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))
    setBanner(null)
  }

  const validate = () => {
    const errors = {}

    // Name
    const nameErr = validateField(form.full_name, apiRules.users.full_name)
    if (nameErr) errors.full_name = nameErr

    // Email
    if (!isEdit || form.email) {
      const emailErr = validateField(form.email, apiRules.users.email)
      if (emailErr) errors.email = emailErr
    }

    // Role
    const roleErr = validateField(form.role, apiRules.users.role)
    if (roleErr) errors.role = roleErr

    // Status
    const statusErr = validateField(form.status, apiRules.users.status)
    if (statusErr) errors.status = statusErr

    // Password
    if (!isEdit) {
      const passErr = validateField(form.password, apiRules.users.password)
      if (passErr) errors.password = passErr
      if (form.password && form.password !== form.confirmPassword) {
        errors.confirmPassword = 'كلمتا المرور غير متطابقتين'
      }
    } else if (form.password) {
      const passErr = validateField(form.password, apiRules.users.password)
      if (passErr) errors.password = passErr
      if (form.password !== form.confirmPassword) {
        errors.confirmPassword = 'كلمتا المرور غير متطابقتين'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        role: form.role,
        status: form.status,
      }

      if (form.password) {
        payload.password = form.password
        payload.password_confirmation = form.confirmPassword || form.password
      }

      await onSave(payload)
    } catch (err) {
      setBanner(err?.message || 'تعذر حفظ الحساب، يرجى التحقق من الحقول')
      if (err?.fieldErrors) {
        setFieldErrors(err.fieldErrors)
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `تعديل حساب المستخدم: ${initialValues?.full_name || initialValues?.name || ''}` : 'إنشاء حساب مستخدم جديد'}
      wide
    >
      <form onSubmit={handleSubmit} noValidate>
        {banner && <FormBanner>{banner}</FormBanner>}

        <FormSection
          icon={<Icon name="user" size={18} />}
          title="البيانات الأساسية للمستخدم"
        >
          <FieldGrid cols={2}>
            <Field
              label="الاسم الكامل"
              required
              error={fieldErrors.full_name}
            >
              <input
                type="text"
                className="input"
                value={form.full_name}
                onChange={set('full_name')}
                placeholder="مثال: د. عبدالله بن فهد الدوسري"
                maxLength={apiRules.users.full_name.max}
                autoFocus
              />
            </Field>

            <Field
              label="البريد الإلكتروني"
              required={!isEdit}
              error={fieldErrors.email}
            >
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={set('email')}
                placeholder="name@example.com"
                maxLength={apiRules.users.email.max}
                dir="ltr"
              />
            </Field>
          </FieldGrid>

          <FieldGrid cols={2}>
            <Field
              label="رقم الهاتف"
              error={fieldErrors.phone}
            >
              <input
                type="tel"
                className="input"
                value={form.phone}
                onChange={set('phone')}
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
            </Field>

            <Field
              label="الدور الوظيفي والصلاحية"
              required
              error={fieldErrors.role}
            >
              <FilterSelect
                value={form.role}
                onChange={(value) => set('role')({ target: { value } })}
                aria-label="الدور الوظيفي والصلاحية"
                className={fieldErrors.role ? 'is-invalid' : ''}
                options={userRoleOptions.map((opt) => ({
                  value: opt.value,
                  label: `${opt.label} (${opt.value})`,
                }))}
              />
            </Field>
          </FieldGrid>

          <FieldGrid cols={2}>
            <Field
              label="حالة الحساب"
              required
              error={fieldErrors.status}
            >
              <FilterSelect
                value={form.status}
                onChange={(value) => set('status')({ target: { value } })}
                aria-label="حالة الحساب"
                className={fieldErrors.status ? 'is-invalid' : ''}
                options={userStatusOptions.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection
          icon={<Icon name="key" size={18} />}
          title={isEdit ? 'كلمة المرور (اتركها فارغة للإبقاء على الحالية)' : 'كلمة المرور والحماية'}
        >
          <FieldGrid cols={2}>
            <Field
              label="كلمة المرور"
              required={!isEdit}
              error={fieldErrors.password}
              hint={isEdit ? 'أدخل كلمة مرور جديدة فقط إذا أردت تغييرها' : '6 أحرف على الأقل'}
            >
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                maxLength={apiRules.users.password.max}
              />
            </Field>

            <Field
              label="تأكيد كلمة المرور"
              required={!isEdit && Boolean(form.password)}
              error={fieldErrors.confirmPassword}
            >
              <input
                type="password"
                className="input"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                placeholder="••••••••"
                maxLength={apiRules.users.password.max}
              />
            </Field>
          </FieldGrid>
        </FormSection>

        {/* صندوق ملخص أخطاء التحقق */}
        <ValidationSummaryBox errors={{ ...fieldErrors, banner }} />

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border, #d5e0e0)',
          }}
        >
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={submitting}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
            style={{ minWidth: '120px', justifyContent: 'center' }}
          >
            {submitting ? (
              <>
                <Icon name="refresh" size={16} className="animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Icon name="check" size={16} />
                {isEdit ? 'حفظ التعديلات' : 'إنشاء وتفعيل الحساب'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
