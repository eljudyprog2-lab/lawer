import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Field, FieldGrid } from '../ui/Form'
import { Icon } from '../ui/Icon'
import { DateField } from '../ui/DateField'
import { TimeField } from '../ui/TimeField'
import { formatDisplayDate } from '../../utils/formatDisplay'

const emptyForm = {
  date: '',
  time: '',
  reason: '',
}

export function RescheduleAppointmentModal({
  open,
  appointment,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!open) return
    setForm(emptyForm)
  }, [open, appointment])

  if (!appointment) return null

  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.date || !form.time) return
    onSubmit(appointment.id, {
      date: form.date,
      time: form.time,
      reason: form.reason.trim(),
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      title="طلب تغيير موعد"
      onClose={onClose}
      footer={
        <>
          <button type="submit" form="reschedule-form" className="btn btn--primary">
            حفظ
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            إلغاء
          </button>
        </>
      }
    >
      <form id="reschedule-form" className="appointment-form" onSubmit={handleSubmit}>
        <section className="appointment-details__section">
          <h3>
            <Icon name="calendar" size={18} />
            الموعد الحالي
          </h3>
          <div className="appointment-details__grid">
            <div>
              <span>التاريخ:</span>
              <strong>{formatDisplayDate(appointment.date)}</strong>
            </div>
            <div>
              <span>الوقت:</span>
              <strong>{appointment.time}</strong>
            </div>
            <div>
              <span>المحامي:</span>
              <strong>{appointment.lawyerName || 'بانتظار التعيين'}</strong>
            </div>
            <div>
              <span>النوع:</span>
              <strong>{appointment.type}</strong>
            </div>
          </div>
        </section>

        <FieldGrid cols={2}>
          <Field label="التاريخ الجديد المقترح" required>
            <DateField
              value={form.date}
              onChange={(value) => set('date')({ target: { value } })}
              aria-label="التاريخ الجديد المقترح"
              required
            />
          </Field>
          <Field label="الوقت الجديد المقترح" required>
            <TimeField
              value={form.time}
              onChange={(value) => set('time')({ target: { value } })}
              aria-label="الوقت الجديد المقترح"
              required
            />
          </Field>
        </FieldGrid>

        <Field label="سبب التغيير" full>
          <textarea
            className="input input--area"
            rows={4}
            value={form.reason}
            onChange={set('reason')}
            placeholder="اكتب سبب طلب تغيير الموعد..."
          />
        </Field>
      </form>
    </Modal>
  )
}
