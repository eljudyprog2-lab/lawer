import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormSection, Field, FieldGrid, FormBanner } from '../ui/Form'
import { Icon } from '../ui/Icon'
import { FilterSelect } from '../ui/FilterSelect'
import {
  lawyerStatusOptions,
  specializationOptions,
  emptyLawyerForm,
  parseApiError,
  validateLawyerForm,
} from '../../api/lawyers'
import { mapApiFieldErrors } from '../../utils/validation'

const LAWYER_API_FIELD_MAP = {
  full_name: 'name',
  national_id: 'nationalId',
  bar_number: 'barNumber',
}

export function LawyerFormModal({
  open,
  mode = 'add',
  initialValues,
  onClose,
  onSave,
  submitting = false,
}) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(emptyLawyerForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    setBanner(null)
    if (isEdit && initialValues) {
      setForm({
        name: initialValues.name === '—' ? '' : initialValues.name || '',
        email: initialValues.email === '—' ? '' : initialValues.email || '',
        phone: initialValues.phone === '—' ? '' : initialValues.phone || '',
        nationalId: initialValues.nationalId || '',
        barNumber: initialValues.barNumber || '',
        address: initialValues.address || '',
        password: '',
        status: initialValues.status || 'نشط',
        specialization: initialValues.specialization || '',
        notes: initialValues.notes || '',
      })
    } else {
      setForm({ ...emptyLawyerForm })
    }
  }, [open, isEdit, initialValues])

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))
    setBanner(null)
  }

  const handleClose = () => {
    if (submitting) return
    setForm({ ...emptyLawyerForm })
    setFieldErrors({})
    setBanner(null)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const validation = validateLawyerForm(form, { isUpdate: isEdit })
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors)
      setBanner(validation.message)
      return
    }
    try {
      await onSave({ ...form })
    } catch (err) {
      const parsed = parseApiError(err)
      setBanner(parsed.message || 'تعذر الحفظ')
      const apiFields = parsed.fieldErrors || err?.fieldErrors
      if (apiFields && Object.keys(apiFields).length) {
        setFieldErrors(mapApiFieldErrors(apiFields, LAWYER_API_FIELD_MAP))
      }
    }
  }

  const inputClass = (key) => `input${fieldErrors[key] ? ' is-invalid' : ''}`

  return (
    <Modal
      open={open}
      title={isEdit ? 'تعديل المحامي' : 'إضافة محامي جديد'}
      onClose={handleClose}
      wide
      footer={
        <>
          <button
            type="submit"
            form="lawyer-form"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleClose}
            disabled={submitting}
          >
            إلغاء
          </button>
        </>
      }
    >
      <form id="lawyer-form" className="case-form" onSubmit={handleSubmit} noValidate>
        <FormBanner>{banner}</FormBanner>
        <FormSection icon={<Icon name="lawyers" />} title="معلومات المحامي">
          <FieldGrid>
            <Field label="الاسم الكامل" required full error={fieldErrors.name}>
              <input
                className={inputClass('name')}
                value={form.name}
                onChange={set('name')}
                placeholder="اسم المحامي بالكامل"
                required
              />
            </Field>
            <Field label="البريد الإلكتروني" required error={fieldErrors.email}>
              <input
                className={inputClass('email')}
                type="email"
                value={form.email}
                onChange={set('email')}
                required
              />
            </Field>
            <Field label="رقم الجوال" error={fieldErrors.phone}>
              <input
                className={inputClass('phone')}
                value={form.phone}
                onChange={set('phone')}
                placeholder="05xxxxxxxx"
              />
            </Field>
            <Field label="رقم الهوية" error={fieldErrors.nationalId}>
              <input
                className={inputClass('nationalId')}
                value={form.nationalId}
                onChange={set('nationalId')}
                placeholder="رقم الهوية للمحامي"
              />
            </Field>
            <Field label="رقم القيد بالنقابة" error={fieldErrors.barNumber}>
              <input
                className={inputClass('barNumber')}
                value={form.barNumber}
                onChange={set('barNumber')}
              />
            </Field>
            <Field label="العنوان" full>
              <input
                className={inputClass('address')}
                value={form.address}
                onChange={set('address')}
              />
            </Field>
            <Field
              label={isEdit ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'}
              full
              error={fieldErrors.password}
            >
              <input
                className={inputClass('password')}
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
              />
              {!isEdit ? (
                <p className="field__hint">
                  سيتم إرسال كلمة المرور للمحامي عبر البريد الإلكتروني
                </p>
              ) : null}
            </Field>
            <Field label="الحالة" full>
              <FilterSelect
                value={form.status}
                onChange={(value) => set('status')({ target: { value } })}
                aria-label="الحالة"
                options={lawyerStatusOptions.map((opt) => ({ value: opt, label: opt }))}
              />
            </Field>
            <Field label="التخصص" full>
              <FilterSelect
                value={form.specialization}
                onChange={(value) => set('specialization')({ target: { value } })}
                aria-label="التخصص"
                options={[
                  { value: '', label: 'اختر التخصص' },
                  ...(form.specialization &&
                  !specializationOptions.includes(form.specialization)
                    ? [{ value: form.specialization, label: form.specialization }]
                    : []),
                  ...specializationOptions.map((opt) => ({ value: opt, label: opt })),
                ]}
              />
            </Field>
            <Field label="ملاحظات" full>
              <textarea
                className="input input--area"
                rows={3}
                value={form.notes}
                onChange={set('notes')}
                placeholder="أي ملاحظات إضافية عن المحامي"
              />
            </Field>
          </FieldGrid>
        </FormSection>
      </form>
    </Modal>
  )
}
