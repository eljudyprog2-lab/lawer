import { Icon } from '../ui/Icon'

export function CaseUpdatesPanel({ cases = [] }) {
  const list = Array.isArray(cases) ? cases : []
  return (
    <section className="panel">
      <div className="panel__header">
        <h2 className="panel__title">
          <span className="panel__title-icon">
            <Icon name="cases" />
          </span>
          آخر تحديثات القضايا
        </h2>
        <span className="panel__title-icon" aria-hidden>
          <Icon name="cog" />
        </span>
      </div>
      <div className="panel__body">
        {list.map((item) => (
          <div key={item.id} className="list-row">
            <div className="list-row__main">
              <div className="list-row__title">{item.title}</div>
              <div className="list-row__meta">الجلسة: {item.sessionDate}</div>
            </div>
            <span className="badge badge--success">{item.status}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
