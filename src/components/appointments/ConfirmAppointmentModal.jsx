import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { formatDisplayDate } from '../../utils/formatDisplay'

export function ConfirmAppointmentModal({ open, appointment, onClose, onConfirm }) {
  if (!appointment) return null

  return (
    <Modal
      open={open}
      title="تأكيد الموعد"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="btn btn--success"
            onClick={() => {
              onConfirm(appointment.id)
              onClose()
            }}
          >
            <Icon name="check" size={18} />
            نعم، تأكيد الموعد
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            تراجع
          </button>
        </>
      }
    >
      <div className="confirm-appointment">
        <span className="confirm-appointment__icon">
          <Icon name="calendarCheck" size={34} />
        </span>
        <h3>هل تريد تأكيد هذا الموعد؟</h3>
        <p>
          موعد <strong>{appointment.clientName}</strong> يوم{' '}
          <strong>{formatDisplayDate(appointment.date)}</strong> الساعة{' '}
          <strong>{appointment.time}</strong>.
        </p>
        {appointment.status === 'مؤكد' ? (
          <span className="confirm-appointment__current">الموعد مؤكد بالفعل</span>
        ) : null}
      </div>
    </Modal>
  )
}
