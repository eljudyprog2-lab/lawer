import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Field, FieldGrid, FormBanner } from '../ui/Form'
import { Icon } from '../ui/Icon'
import { DateField } from '../ui/DateField'
import { TimeField } from '../ui/TimeField'
import { FilterSelect } from '../ui/FilterSelect'
import {
  appointmentTypeOptions,
  emptyAppointmentForm,
  appointmentToForm,
  validateAppointmentForm,
} from '../../api/appointments'

export function AppointmentFormModal({
  open,
  appointment,
  onClose,
  onSave,
  mode = 'admin',
  lockedClientId = '',
  clientOptions = [],
  lawyerOptions = [],
  caseOptions = [],
}) {
  const [form, setForm] = useState(emptyAppointmentForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [banner, setBanner] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isClient = mode === 'client'

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    setBanner('')
    setSubmitting(false)
    if (appointment) {
      setForm(appointmentToForm(appointment))
      return
    }
    setForm({
      ...emptyAppointmentForm,
      clientId: isClient ? lockedClientId : '',
    })
  }, [open, appointment, isClient, lockedClientId])

  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))
    setBanner('')
  }

  const inputClass = (key) => `input${fieldErrors[key] ? ' is-invalid' : ''}`

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    const clientId = isClient ? lockedClientId || form.clientId : form.clientId
    const validation = validateAppointmentForm(
      { ...form, clientId },
      { requireClient: !isClient },
    )
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors)
      setBanner(validation.message)
      return
    }
    setFieldErrors({})
    setBanner('')
    setSubmitting(true)
    try {
      await onSave?.({ ...form, clientId })
      onClose()
    } catch {
      /* parent may surface toast */
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title={appointment ? 'تعديل الموعد' : 'حجز موعد جديد'}
      onClose={onClose}
      wide
      footer={
        <>
          <button
            type="submit"
            form="appointment-form"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            إلغاء
          </button>
        </>
      }
    >
      <form id="appointment-form" className="appointment-form" onSubmit={handleSubmit} noValidate>
        <FormBanner>{banner}</FormBanner>
        <FieldGrid cols={2}>
          <Field label="التاريخ" required error={fieldErrors.date}>
            <DateField
              value={form.date}
              onChange={(value) => set('date')({ target: { value } })}
              className={fieldErrors.date ? 'is-invalid' : ''}
              aria-label="التاريخ"
              required
            />
          </Field>
          <Field label="الوقت" required error={fieldErrors.time}>
            <TimeField
              value={form.time}
              onChange={(value) => set('time')({ target: { value } })}
              className={fieldErrors.time ? 'is-invalid' : ''}
              aria-label="الوقت"
              required
            />
          </Field>
        </FieldGrid>

        <Field
          label={isClient ? 'المحامي (اختياري)' : 'المحامي'}
          full
          hint={
            isClient
              ? 'يمكنك ترك هذا الحقل فارغاً وسيتم تعيين محامي من قبل الإدارة'
              : undefined
          }
        >
          <FilterSelect
            value={form.lawyerId}
            onChange={(value) => set('lawyerId')({ target: { value } })}
            aria-label={isClient ? 'المحامي (اختياري)' : 'المحامي'}
            options={[
              {
                value: '',
                label: isClient ? '-- سيتم التعيين لاحقاً --' : '-- اختر محامي --',
              },
              ...lawyerOptions.map((lawyer) => ({
                value: lawyer.id,
                label: lawyer.name,
              })),
            ]}
          />
        </Field>

        {!isClient ? (
          <Field label="الموكل" required full error={fieldErrors.clientId}>
            <FilterSelect
              value={form.clientId}
              onChange={(value) => set('clientId')({ target: { value } })}
              aria-label="الموكل"
              className={fieldErrors.clientId ? 'is-invalid' : ''}
              options={[
                { value: '', label: '-- اختر الموكل --' },
                ...clientOptions.map((client) => ({
                  value: client.id,
                  label: client.name,
                })),
              ]}
            />
          </Field>
        ) : null}

        <Field label="القضية المرتبطة (اختياري)" full>
          <FilterSelect
            value={form.caseId}
            onChange={(value) => set('caseId')({ target: { value } })}
            aria-label="القضية المرتبطة (اختياري)"
            options={[
              { value: '', label: '-- بدون قضية (اختياري) --' },
              ...caseOptions.map((item) => ({
                value: item.id,
                label: `${item.title} (#${item.number})`,
              })),
            ]}
          />
        </Field>

        <Field label="نوع الموعد" full>
          <FilterSelect
            value={form.type}
            onChange={(value) => set('type')({ target: { value } })}
            aria-label="نوع الموعد"
            options={appointmentTypeOptions.map((type) => ({ value: type, label: type }))}
          />
        </Field>

        <Field label="ملاحظات" full>
          <textarea
            className="input input--area"
            rows={4}
            value={form.notes}
            onChange={set('notes')}
            placeholder="اكتب أي ملاحظات عن الموعد..."
          />
        </Field>

        {isClient ? (
          <div className="info-banner appointment-info-banner">
            <Icon name="info" size={18} />
            <p>
              يمكنك حجز موعد بدون تحديد محامي وسيتم تعيين محامي مناسب من قبل الإدارة
            </p>
          </div>
        ) : null}
      </form>
    </Modal>
  )
}
