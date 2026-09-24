import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { FilterSelect } from '../ui/FilterSelect'
import { Icon } from '../ui/Icon'
import { formatDisplayDate } from '../../utils/formatDisplay'

export function AssignLawyerModal({
  open,
  appointment,
  onClose,
  onAssign,
  lawyerOptions = [],
}) {
  const [lawyerId, setLawyerId] = useState('')

  useEffect(() => {
    if (open) setLawyerId(appointment?.lawyerId || '')
  }, [open, appointment])

  if (!appointment) return null

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!lawyerId) return
    onAssign(appointment.id, lawyerId)
    onClose()
  }

  return (
    <Modal
      open={open}
      title="تعيين محامي للموعد"
      onClose={onClose}
      wide
      footer={
        <>
          <button type="submit" form="assign-lawyer-form" className="btn btn--primary">
            حفظ
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            إلغاء
          </button>
        </>
      }
    >
      <form id="assign-lawyer-form" onSubmit={handleSubmit}>
        <section className="appointment-summary">
          <h3>
            <Icon name="calendar" size={19} />
            تفاصيل الموعد
          </h3>
          <p><b>الموكل:</b> {appointment.clientName}</p>
          <p><b>التاريخ:</b> {formatDisplayDate(appointment.date)}</p>
          <p><b>الوقت:</b> {appointment.time}</p>
          <p><b>النوع:</b> {appointment.type}</p>
        </section>

        <label className="field field--full appointment-lawyer-field">
          <span className="field__label">
            اختر المحامي <span className="field__req">*</span>
          </span>
          <FilterSelect
            value={lawyerId}
            onChange={setLawyerId}
            aria-label="اختر المحامي"
            options={[
              { value: '', label: '-- اختر محامي --' },
              ...lawyerOptions.map((lawyer) => ({
                value: lawyer.id,
                label: lawyer.name,
              })),
            ]}
          />
        </label>

        <div className="info-banner appointment-info-banner">
          <Icon name="info" size={20} />
          <strong>سيتم إشعار المحامي والموكل بعد التعيين.</strong>
        </div>
      </form>
    </Modal>
  )
}
