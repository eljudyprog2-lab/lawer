import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Field, FieldGrid } from '../ui/Form'
import { DateField } from '../ui/DateField'
import { FilterSelect } from '../ui/FilterSelect'
import { ValidationSummaryBox } from '../ui/ValidationSummaryBox'
import { caseEventImportanceOptions, caseEventTypeOptions } from '../../api/cases'

const emptyEvent = {
  title: '',
  type: 'جلسة محكمة',
  date: '',
  importance: 'عادي',
  details: '',
  reminder: false,
}

export function AddEventModal({ open, onClose, onSave }) {
  const [form, setForm] = useState(emptyEvent)
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const handleClose = () => {
    setForm(emptyEvent)
    setErrors({})
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.title.trim()) {
      errs.title = 'من فضلك أدخل عنوان الحدث'
    }
    if (!form.date) {
      errs.date = 'من فضلك اختر تاريخ الحدث'
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    onSave({
      id: String(Date.now()),
      ...form,
    })
    setForm(emptyEvent)
    setErrors({})
    onClose()
  }

  return (
    <Modal
      open={open}
      title="إضافة حدث جديد"
      onClose={handleClose}
      footer={
        <>
          <button type="submit" form="add-event-form" className="btn btn--primary">
            حفظ
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleClose}>
            إلغاء
          </button>
        </>
      }
    >
      <form id="add-event-form" className="case-form" onSubmit={handleSubmit}>
        <ValidationSummaryBox errors={errors} />
        <FieldGrid cols={1}>
          <Field label="عنوان الحدث" required>
            <input
              className="input"
              value={form.title}
              onChange={set('title')}
              placeholder="مثال: جلسة استماع"
              required
            />
          </Field>
          <Field label="نوع الحدث">
            <FilterSelect
              value={form.type}
              onChange={(value) => set('type')({ target: { value } })}
              aria-label="نوع الحدث"
              options={caseEventTypeOptions.map((opt) => ({ value: opt, label: opt }))}
            />
          </Field>
          <Field label="تاريخ الحدث" required>
            <DateField
              value={form.date}
              onChange={(value) => set('date')({ target: { value } })}
              aria-label="تاريخ الحدث"
              required
            />
          </Field>
          <Field label="الأهمية">
            <FilterSelect
              value={form.importance}
              onChange={(value) => set('importance')({ target: { value } })}
              aria-label="الأهمية"
              options={caseEventImportanceOptions.map((opt) => ({
                value: opt,
                label: opt,
              }))}
            />
          </Field>
          <Field label="تفاصيل الحدث">
            <textarea
              className="input input--area"
              rows={4}
              value={form.details}
              onChange={set('details')}
              placeholder="اكتب تفاصيل ما حدث في هذا التاريخ..."
            />
          </Field>
          <label className="field-check">
            <input
              type="checkbox"
              checked={form.reminder}
              onChange={set('reminder')}
            />
            <span>إضافة تنبيه — تذكير قبل الموعد</span>
          </label>
        </FieldGrid>
      </form>
    </Modal>
  )
}
