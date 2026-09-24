import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'

function statusClass(status) {
  if (status === 'منتهي') return 'status-pill status-pill--done'
  if (status === 'مؤجل') return 'status-pill status-pill--hold'
  return 'status-pill status-pill--active'
}

export function ClientCasesModal({ open, client, cases = [], onClose }) {
  if (!client) return null

  return (
    <Modal
      open={open}
      title="قضايا الموكل"
      onClose={onClose}
      wide
      header={
        <div className="details-header">
          <h2 className="details-header__title details-header__title--with-icon">
            <Icon name="cases" size={22} />
            قضايا الموكل
          </h2>
          <div className="details-header__meta">
            <span>{client.name}</span>
          </div>
        </div>
      }
    >
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم القضية</th>
              <th>العنوان</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {cases.length === 0 ? (
              <tr>
                <td colSpan={4} className="data-table__empty">
                  لا توجد قضايا لهذا الموكل
                </td>
              </tr>
            ) : (
              cases.map((item) => (
                <tr key={item.id}>
                  <td className="data-table__mono">{item.number}</td>
                  <td>{item.title}</td>
                  <td>
                    <span className={statusClass(item.status)}>
                      {item.status === 'منتهي' ? 'منتهي' : 'نشط'}
                    </span>
                  </td>
                  <td>
                    <span className="client-case-view">
                      <Icon name="clock" size={14} />
                      عرض
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}
