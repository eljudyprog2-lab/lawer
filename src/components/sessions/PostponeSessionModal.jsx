import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Field } from '../ui/Form'
import { ValidationSummaryBox } from '../ui/ValidationSummaryBox'
import { DateField } from '../ui/DateField'
import { formatDisplayDate } from '../../utils/formatDisplay'

export function PostponeSessionModal({ open, session, onClose, onPostpone }) {
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open || !session) return
    setErrors({})
    setDate(session.date || '')
    setReason('')
  }, [open, session])

  if (!session) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!date.trim()) errs.date = 'تاريخ الجلسة الجديد مطلوب'
    if (!reason.trim()) errs.reason = 'سبب تأجيل الجلسة مطلوب'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    onPostpone(session.id, { date: date.trim(), reason: reason.trim() })
    onClose()
  }

  return (
    <Modal
      open={open}
      title="تأجيل الجلسة"
      onClose={onClose}
      footer={
        <>
          <button type="submit" form="postpone-session-form" className="btn btn--primary">
            تأكيد التأجيل
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            إلغاء
          </button>
        </>
      }
    >
      <form id="postpone-session-form" className="postpone-form" onSubmit={handleSubmit}>
        <ValidationSummaryBox errors={errors} />
        <div className="postpone-form__summary">
          <Icon name="calendar" size={18} />
          <div>
            <strong>جلسة #{session.sessionNumber}</strong>
            <span>
              {session.caseTitle} — التاريخ الحالي: {formatDisplayDate(session.date)}
            </span>
          </div>
        </div>

        <Field label="التاريخ الجديد" required full>
          <DateField
            value={date}
            onChange={(val) => {
              setDate(val)
              setErrors((prev) => ({ ...prev, date: '' }))
            }}
            aria-label="التاريخ الجديد"
            required
          />
          <p className="field__hint">أدخل التاريخ الجديد للجلسة</p>
        </Field>

        <Field label="سبب التأجيل" required full>
          <textarea
            className="input input--area"
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setErrors((prev) => ({ ...prev, reason: '' }))
            }}
            placeholder="اكتب سبب تأجيل الجلسة..."
            required
          />
        </Field>
      </form>
    </Modal>
  )
}
