import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { formatDisplayDate } from '../../utils/formatDisplay'

function statusClass(status) {
  if (status === 'مجدولة') return 'session-status session-status--scheduled'
  if (status === 'مؤجلة') return 'session-status session-status--postponed'
  if (status === 'منتهية') return 'session-status session-status--done'
  return 'session-status session-status--cancelled'
}

export function SessionDetailsModal({ open, session, onClose }) {
  if (!session) return null

  const header = (
    <div className="details-header">
      <h2 className="details-header__title details-header__title--with-icon">
        <Icon name="sessions" size={22} />
        تفاصيل الجلسة
      </h2>
    </div>
  )

  return (
    <Modal
      open={open}
      title="تفاصيل الجلسة"
      header={header}
      onClose={onClose}
      wide
    >
      <div className="session-details">
        <section className="session-details__section">
          <h3>
            <Icon name="cases" size={18} />
            معلومات الجلسة
          </h3>
          <dl className="session-details__list">
            <div>
              <dt>رقم الجلسة</dt>
              <dd>#{session.sessionNumber}</dd>
            </div>
            <div>
              <dt>التاريخ</dt>
              <dd>{formatDisplayDate(session.date)}</dd>
            </div>
            <div>
              <dt>الوقت</dt>
              <dd>{session.time || '—'}</dd>
            </div>
            <div>
              <dt>النوع</dt>
              <dd>{session.type}</dd>
            </div>
            <div>
              <dt>الحالة</dt>
              <dd>
                <span className={statusClass(session.status)}>{session.status}</span>
              </dd>
            </div>
            <div>
              <dt>القرار</dt>
              <dd>{session.decision || '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="session-details__section">
          <h3>
            <Icon name="folder" size={18} />
            معلومات القضية
          </h3>
          <dl className="session-details__list">
            <div>
              <dt>القضية</dt>
              <dd>{session.caseTitle || '—'}</dd>
            </div>
            <div>
              <dt>رقم القضية</dt>
              <dd>{session.caseNumber || '—'}</dd>
            </div>
            <div>
              <dt>المحامي</dt>
              <dd>{session.lawyerName || '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="session-details__section">
          <h3>
            <Icon name="sessions" size={18} />
            معلومات المحكمة
          </h3>
          <dl className="session-details__list">
            <div>
              <dt>المحكمة</dt>
              <dd>{session.court || '—'}</dd>
            </div>
            <div>
              <dt>الدائرة</dt>
              <dd>{session.circuit || '—'}</dd>
            </div>
            <div>
              <dt>القاضي</dt>
              <dd>{session.judge || '—'}</dd>
            </div>
            <div>
              <dt>القاعة</dt>
              <dd>{session.hall || '—'}</dd>
            </div>
            <div>
              <dt>العنوان</dt>
              <dd>{session.courtAddress || '—'}</dd>
            </div>
          </dl>
        </section>

        {(session.notes || session.postponeReason) && (
          <section className="session-details__section">
            <h3>
              <Icon name="notes" size={18} />
              ملاحظات
            </h3>
            {session.notes ? <p>{session.notes}</p> : null}
            {session.postponeReason ? (
              <p className="session-details__postpone">
                سبب التأجيل: {session.postponeReason}
              </p>
            ) : null}
          </section>
        )}
      </div>
    </Modal>
  )
}
