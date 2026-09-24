import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { formatDisplayDate } from '../../utils/formatDisplay'

export function AppointmentDetailsModal({ open, appointment, onClose }) {
  if (!appointment) return null

  return (
    <Modal
      open={open}
      title="تفاصيل الموعد"
      onClose={onClose}
      wide
      className="modal-dialog--details"
    >
      <div className="appointment-details">
        <section className="appointment-details__section">
          <h3>
            <Icon name="info" size={19} />
            معلومات الموعد
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
              <span>النوع:</span>
              <strong>{appointment.type}</strong>
            </div>
            <div>
              <span>الحالة:</span>
              <strong className={`appointment-status appointment-status--${statusKey(appointment.status)}`}>
                {appointment.status}
              </strong>
            </div>
          </div>
        </section>

        <section className="appointment-details__section">
          <h3>
            <Icon name="clients" size={19} />
            الأطراف
          </h3>
          <div className="appointment-details__stack">
            <div>
              <span>الموكل:</span>
              <strong>{appointment.clientName || '—'}</strong>
              {appointment.clientPhone ? <small>{appointment.clientPhone}</small> : null}
            </div>
            <div>
              <span>المحامي:</span>
              <strong>{appointment.lawyerName || 'لم يتم التعيين'}</strong>
            </div>
            <div>
              <span>القضية المرتبطة:</span>
              <strong>{appointment.caseTitle || 'بدون قضية'}</strong>
            </div>
          </div>
        </section>

        {appointment.notes ? (
          <section className="appointment-details__section">
            <h3>
              <Icon name="notes" size={19} />
              الملاحظات
            </h3>
            <p className="appointment-details__notes">{appointment.notes}</p>
          </section>
        ) : null}
      </div>
    </Modal>
  )
}

function statusKey(status) {
  if (status === 'مؤكد') return 'confirmed'
  if (status === 'ملغي') return 'cancelled'
  if (status === 'قيد الانتظار') return 'waiting'
  return 'pending'
}
