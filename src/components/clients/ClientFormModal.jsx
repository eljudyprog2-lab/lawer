import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { FilterSelect } from '../ui/FilterSelect'
import { Field, FieldGrid, FormBanner } from '../ui/Form'
import {
  clientStatusOptions,
  emptyClientForm,
  parseApiError,
  validateClientForm,
} from '../../api/clients'
import { mapApiFieldErrors } from '../../utils/validation'

const CLIENT_API_FIELD_MAP = {
  full_name: 'name',
  national_id: 'nationalId',
}

export function ClientFormModal({
  open,
  mode = 'add',
  initialValues,
  onClose,
  onSave,
  submitting = false,
}) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(emptyClientForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    setBanner(null)
    if (isEdit && initialValues) {
      setForm({
        name: initialValues.name || '',
        email: initialValues.email || '',
        phone: initialValues.phone || '',
        nationalId: initialValues.nationalId || '',
        address: initialValues.address || '',
        password: '',
        status: initialValues.status || 'نشط',
        notes: initialValues.notes || '',
      })
    } else {
      setForm(emptyClientForm)
    }
  }, [open, isEdit, initialValues])

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))
    setBanner(null)
  }

  const handleClose = () => {
    if (submitting) return
    setForm(emptyClientForm)
    setFieldErrors({})
    setBanner(null)
    onClose()
  }

  const inputClass = (key) => `input${fieldErrors[key] ? ' is-invalid' : ''}`

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const validation = validateClientForm(form, { isUpdate: isEdit })
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
      if (parsed.fieldErrors && Object.keys(parsed.fieldErrors).length) {
        setFieldErrors(mapApiFieldErrors(parsed.fieldErrors, CLIENT_API_FIELD_MAP))
      }
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'تعديل الموكل' : 'إضافة موكل جديد'}
      onClose={handleClose}
      footer={
        <>
          <button
            type="submit"
            form="client-form"
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
      <form id="client-form" className="case-form" onSubmit={handleSubmit} noValidate>
        <FormBanner>{banner}</FormBanner>
        <FieldGrid cols={1}>
          <Field label="الاسم الكامل" required error={fieldErrors.name}>
            <input
              className={inputClass('name')}
              value={form.name}
              onChange={set('name')}
              required
              aria-invalid={Boolean(fieldErrors.name)}
            />
          </Field>
          <Field label="البريد الإلكتروني" required error={fieldErrors.email}>
            <input
              className={inputClass('email')}
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              aria-invalid={Boolean(fieldErrors.email)}
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
            />
          </Field>
          <Field label="العنوان">
            <input
              className={inputClass('address')}
              value={form.address}
              onChange={set('address')}
            />
          </Field>
          {!isEdit ? (
            <Field label="كلمة المرور" error={fieldErrors.password}>
              <input
                className={inputClass('password')}
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
              />
            </Field>
          ) : null}
          <Field label="الحالة">
            <FilterSelect
              value={form.status}
              onChange={(value) => set('status')({ target: { value } })}
              aria-label="الحالة"
              options={clientStatusOptions.map((opt) => ({ value: opt, label: opt }))}
            />
          </Field>
        </FieldGrid>
      </form>
    </Modal>
  )
}
