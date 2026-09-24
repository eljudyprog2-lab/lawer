import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { formatMoney, formatInvoiceDate, remaining } from '../../api/invoices'

function statusPill(status) {
  if (status === 'مدفوعة') return 'invoice-pill invoice-pill--paid'
  if (status === 'مدفوعة جزئياً') return 'invoice-pill invoice-pill--partial'
  if (status === 'ملغاة') return 'invoice-pill invoice-pill--cancelled'
  return 'invoice-pill invoice-pill--unpaid'
}

export function InvoiceDetailsModal({ open, invoice, onClose, onPrintReceipt }) {
  if (!invoice) return null

  const total = Number(invoice.total) || 0
  const paid = Number(invoice.paid) || 0
  const due = remaining(invoice)
  const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0

  const header = (
    <div className="details-header">
      <h2 className="details-header__title details-header__title--with-icon">
        <Icon name="invoices" size={22} />
        تفاصيل الفاتورة الكاملة
      </h2>
    </div>
  )

  return (
    <Modal open={open} title="تفاصيل الفاتورة" header={header} onClose={onClose} wide>
      <div className="invoice-details">
        <section className="invoice-details__card">
          <h3>
            <Icon name="info" size={18} />
            المعلومات الأساسية
          </h3>
          <div className="invoice-details__grid">
            <div>
              <span>رقم الفاتورة:</span>
              <strong className="invoice-details__num">#{invoice.number}</strong>
            </div>
            <div>
              <span>تاريخ الإصدار:</span>
              <strong>{formatInvoiceDate(invoice.issueDate)}</strong>
            </div>
            <div>
              <span>تاريخ الاستحقاق:</span>
              <strong>{formatInvoiceDate(invoice.dueDate)}</strong>
            </div>
            <div>
              <span>الحالة:</span>
              <span className={statusPill(invoice.status)}>{invoice.status}</span>
            </div>
          </div>
        </section>

        <section className="invoice-details__card">
          <h3>
            <Icon name="clients" size={18} />
            الأطراف المعنية
          </h3>
          <div className="invoice-details__grid">
            <div>
              <span>الموكل:</span>
              <strong>{invoice.clientName || '—'}</strong>
            </div>
            {invoice.caseTitle ? (
              <div>
                <span>القضية:</span>
                <strong>{invoice.caseTitle}</strong>
              </div>
            ) : null}
          </div>
        </section>

        <section className="invoice-details__card invoice-details__card--finance">
          <h3>
            <Icon name="cash" size={18} />
            التفاصيل المالية
          </h3>
          <div className="invoice-progress">
            <div className="invoice-progress__head">
              <span>نسبة السداد</span>
              <strong>{percent}%</strong>
            </div>
            <div className="invoice-progress__bar">
              <span style={{ width: `${percent}%` }} />
            </div>
          </div>
          <div className="invoice-finance">
            <div className="invoice-finance__box invoice-finance__box--total">
              <Icon name="receipt" size={20} />
              <span>المبلغ الإجمالي</span>
              <strong>{formatMoney(total)}</strong>
            </div>
            <div className="invoice-finance__box invoice-finance__box--paid">
              <Icon name="check" size={20} />
              <span>المدفوع</span>
              <strong>{formatMoney(paid)}</strong>
            </div>
            <div className="invoice-finance__box invoice-finance__box--due">
              <Icon name="cash" size={20} />
              <span>المتبقي</span>
              <strong>{formatMoney(due)}</strong>
            </div>
          </div>
        </section>

        <section className="invoice-details__card">
          <h3>
            <Icon name="notes" size={18} />
            التفاصيل
          </h3>
          <div className="invoice-details__desc">
            <span>وصف الفاتورة:</span>
            <p>{invoice.description || '—'}</p>
          </div>
        </section>

        <section className="invoice-details__card">
          <h3>
            <Icon name="clock" size={18} />
            سجل المدفوعات ({(invoice.payments || []).length} دفعة)
          </h3>
          {(invoice.payments || []).length === 0 ? (
            <p className="invoice-details__empty">لا توجد مدفوعات مسجلة</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table invoice-payments-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>الطريقة</th>
                    <th>المرجع</th>
                    <th>الملاحظات</th>
                    <th>الإيصال</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((payment, index) => (
                    <tr key={payment.id}>
                      <td>{index + 1}</td>
                      <td>{formatInvoiceDate(payment.date)}</td>
                      <td className="invoice-payments-table__amount">
                        {formatMoney(payment.amount)}
                      </td>
                      <td>{payment.method}</td>
                      <td>{payment.reference || '—'}</td>
                      <td>{payment.notes || '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="action-btn action-btn--view"
                          title="طباعة الإيصال"
                          onClick={() => onPrintReceipt?.(invoice, payment)}
                        >
                          <Icon name="print" size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="invoice-payments-table__total">
                    <td colSpan={2}>الإجمالي</td>
                    <td className="invoice-payments-table__amount">
                      {formatMoney(paid)}
                    </td>
                    <td colSpan={4} />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Modal>
  )
}
