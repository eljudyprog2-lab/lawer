import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormSection, Field, FieldGrid, FormBanner } from '../ui/Form'
import { Icon } from '../ui/Icon'
import { DateField } from '../ui/DateField'
import { TimeField } from '../ui/TimeField'
import { FilterSelect } from '../ui/FilterSelect'
import {
  emptySessionForm,
  sessionTypeOptions,
  sessionImportanceOptions,
  sessionStatusOptions,
  sessionDecisionOptions,
  validateSessionForm,
} from '../../api/sessions'

export function SessionFormModal({
  open,
  session,
  onClose,
  onSave,
  caseOptions = [],
  lawyerOptions = [],
  hideLawyer = false,
  submitting = false,
}) {
  const [form, setForm] = useState(emptySessionForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [banner, setBanner] = useState('')
  const isEdit = Boolean(session)

  const inputClass = (key) => `input${fieldErrors[key] ? ' is-invalid' : ''}`

  const typeLabels = sessionTypeOptions.map((o) => o.label)
  const importanceLabels = sessionImportanceOptions.map((o) => o.label)

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    setBanner('')
    setForm(
      session
        ? {
            caseId: String(session.caseId || ''),
            sessionNumber: session.sessionNumber,
            date: session.date,
            time: session.time,
            type: session.type,
            court: session.court,
            circuit: session.circuit,
            judge: session.judge,
            hall: session.hall,
            courtAddress: session.courtAddress,
            notes: session.notes,
            importance: session.importance,
            status: session.status,
            decision: session.decision,
            lawyerId: String(session.lawyerId || ''),
          }
        : emptySessionForm,
    )
  }, [open, session])

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))
    setBanner('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validation = validateSessionForm(form)
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors)
      setBanner(validation.message)
      return
    }
    try {
      setFieldErrors({})
      setBanner('')
      await onSave(form)
      onClose()
    } catch (err) {
      setBanner(err?.message || 'تعذر حفظ الجلسة')
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'تعديل الجلسة' : 'إضافة جلسة قضائية'}
      onClose={submitting ? () => {} : onClose}
      wide
      footer={
        <>
          <button
            type="submit"
            form="session-form"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={submitting}>
            إلغاء
          </button>
        </>
      }
    >
      <form id="session-form" className="case-form" onSubmit={handleSubmit}>
        <FormBanner>{banner}</FormBanner>
        <FormSection icon={<Icon name="cases" />} title="معلومات الجلسة">
          <FieldGrid cols={2}>
            <Field label="القضية" required full error={fieldErrors.caseId}>
              <FilterSelect
                value={form.caseId}
                onChange={(value) => set('caseId')({ target: { value } })}
                aria-label="القضية"
                className={fieldErrors.caseId ? 'is-invalid' : ''}
                options={[
                  { value: '', label: '-- اختر القضية --' },
                  ...caseOptions.map((item) => ({
                    value: item.id,
                    label: `${item.number} - ${item.title}`,
                  })),
                ]}
              />
            </Field>
            <Field label="رقم الجلسة">
              <input
                className="input"
                value={isEdit ? form.sessionNumber : ''}
                readOnly={!isEdit}
                placeholder="تلقائي"
                onChange={set('sessionNumber')}
              />
              {!isEdit ? (
                <p className="field__hint">سيتم تعيينه تلقائياً</p>
              ) : null}
            </Field>
            <Field label="تاريخ الجلسة" required error={fieldErrors.date}>
              <DateField
                value={form.date}
                onChange={(value) => set('date')({ target: { value } })}
                className={fieldErrors.date ? 'is-invalid' : ''}
                aria-label="تاريخ الجلسة"
                required
              />
            </Field>
            <Field label="وقت الجلسة">
              <TimeField
                value={form.time}
                onChange={(value) => set('time')({ target: { value } })}
                aria-label="وقت الجلسة"
              />
            </Field>
            <Field label="نوع الجلسة">
              <FilterSelect
                value={form.type}
                onChange={(value) => set('type')({ target: { value } })}
                aria-label="نوع الجلسة"
                options={typeLabels.map((opt) => ({ value: opt, label: opt }))}
              />
            </Field>
            {!hideLawyer ? (
              <Field label="المحامي">
                <FilterSelect
                  value={form.lawyerId}
                  onChange={(value) => set('lawyerId')({ target: { value } })}
                  aria-label="المحامي"
                  options={[
                    { value: '', label: '-- اختر محامي --' },
                    ...lawyerOptions.map((item) => ({
                      value: item.id,
                      label: item.name,
                    })),
                  ]}
                />
              </Field>
            ) : null}
          </FieldGrid>
        </FormSection>

        <FormSection icon={<Icon name="sessions" />} title="معلومات المحكمة">
          <FieldGrid cols={2}>
            <Field label="المحكمة" required full error={fieldErrors.court}>
              <input
                className={inputClass('court')}
                value={form.court}
                onChange={set('court')}
                placeholder="مثال: محكمة القاهرة الابتدائية"
                required
              />
            </Field>
            <Field label="الدائرة">
              <input
                className="input"
                value={form.circuit}
                onChange={set('circuit')}
                placeholder="مثال: الدائرة الثالثة"
              />
            </Field>
            <Field label="القاضي">
              <input
                className="input"
                value={form.judge}
                onChange={set('judge')}
                placeholder="اسم القاضي"
              />
            </Field>
            <Field label="رقم القاعة">
              <input
                className="input"
                value={form.hall}
                onChange={set('hall')}
                placeholder="رقم أو اسم القاعة"
              />
            </Field>
            <Field label="عنوان المحكمة" full>
              <input
                className="input"
                value={form.courtAddress}
                onChange={set('courtAddress')}
                placeholder="عنوان المحكمة (اختياري)"
              />
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection icon={<Icon name="notes" />} title="معلومات إضافية">
          <FieldGrid cols={2}>
            <Field label="ملاحظات" full>
              <textarea
                className="input input--area"
                rows={3}
                value={form.notes}
                onChange={set('notes')}
                placeholder="أي ملاحظات إضافية..."
              />
            </Field>
            <Field label="الأهمية">
              <FilterSelect
                value={form.importance}
                onChange={(value) => set('importance')({ target: { value } })}
                aria-label="الأهمية"
                options={importanceLabels.map((opt) => ({ value: opt, label: opt }))}
              />
            </Field>
            {isEdit ? (
              <>
                <Field label="الحالة">
                  <FilterSelect
                    value={form.status}
                    onChange={(value) => set('status')({ target: { value } })}
                    aria-label="الحالة"
                    options={sessionStatusOptions.map((opt) => ({
                      value: opt,
                      label: opt,
                    }))}
                  />
                </Field>
                <Field label="القرار">
                  <FilterSelect
                    value={form.decision}
                    onChange={(value) => set('decision')({ target: { value } })}
                    aria-label="القرار"
                    options={sessionDecisionOptions.map((opt) => ({
                      value: opt,
                      label: opt,
                    }))}
                  />
                </Field>
              </>
            ) : null}
          </FieldGrid>
        </FormSection>

        {!isEdit ? (
          <div className="info-banner">
            <Icon name="info" size={20} />
            <div>
              <strong>
                ملاحظة: رقم الجلسة سيتم تعيينه تلقائياً بناءً على القضية المختارة
              </strong>
            </div>
          </div>
        ) : null}
      </form>
    </Modal>
  )
}
