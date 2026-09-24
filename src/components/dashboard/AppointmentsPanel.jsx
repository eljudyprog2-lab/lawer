import { Icon } from '../ui/Icon'

export function AppointmentsPanel({ appointments }) {
  const empty = !appointments || appointments.length === 0

  return (
    <section className="panel">
      <div className="panel__header">
        <h2 className="panel__title">
          <span className="panel__title-icon">
            <Icon name="calendar" />
          </span>
          المواعيد القادمة
        </h2>
      </div>
      {empty ? (
        <div className="empty-state">
          <Icon name="calendar" className="empty-state__icon" />
          <p>لا توجد مواعيد قادمة</p>
        </div>
      ) : (
        <div className="panel__body">
          {appointments.map((item) => (
            <div key={item.id} className="list-row">
              <div className="list-row__main">
                <div className="list-row__title">{item.title}</div>
                <div className="list-row__meta">{item.date}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
