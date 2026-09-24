import { useEffect, useMemo, useState } from 'react'
import { HiOutlineExclamationCircle, HiOutlineRefresh } from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { FilterSelect } from '../ui/FilterSelect'
import { StatCard } from '../dashboard/StatCard'
import { InvoiceFormModal } from '../invoices/InvoiceFormModal'
import { InvoiceDetailsModal } from '../invoices/InvoiceDetailsModal'
import { RecordPaymentModal } from '../invoices/RecordPaymentModal'
import { useAuth } from '../../context/AuthContext'
import {
  useInvoices,
  useInvoiceMutations,
  useInvoiceDashboard,
} from '../../hooks/useInvoices'
import { getStoredCompanyId } from '../../api/client'
import {
  invoiceStatusOptions,
  formatMoney,
  formatInvoiceDate,
  remaining,
  deriveStatusValue,
  buildInvoicePayload,
  calcInvoiceStats,
  mapInvoiceDashboardStats,
  parseApiError,
} from '../../api/invoices'

function statusPill(status) {
  if (status === 'مدفوعة') return 'invoice-pill invoice-pill--paid'
  if (status === 'مدفوعة جزئياً') return 'invoice-pill invoice-pill--partial'
  if (status === 'ملغاة') return 'invoice-pill invoice-pill--cancelled'
  return 'invoice-pill invoice-pill--unpaid'
}

function printInvoice(invoice, payment) {
  const win = window.open('', '_blank', 'width=780,height=900')
  if (!win) return
  const rows = payment
    ? `<tr><td>${formatInvoiceDate(payment.date)}</td><td>${formatMoney(payment.amount)}</td><td>${payment.method}</td><td>${payment.reference || '—'}</td></tr>`
    : (invoice.payments || [])
        .map(
          (p) =>
            `<tr><td>${formatInvoiceDate(p.date)}</td><td>${formatMoney(p.amount)}</td><td>${p.method}</td><td>${p.reference || '—'}</td></tr>`,
        )
        .join('')
  win.document.write(`
    <html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${payment ? 'إيصال' : 'فاتورة'} ${invoice.number}</title>
    <style>
      body{font-family:'Segoe UI',Tahoma,sans-serif;padding:28px;color:#1e3a3c}
      h1{color:#8b775e;margin:0 0 4px}
      .muted{color:#777;margin:0 0 20px}
      table{width:100%;border-collapse:collapse;margin-top:14px}
      th,td{border:1px solid #ddd;padding:8px;text-align:right;font-size:14px}
      th{background:#f4f1ea}
      .totals{margin-top:16px;font-size:16px}
      .totals div{display:flex;justify-content:space-between;padding:4px 0}
    </style></head><body>
      <h1>مكتب الدوسري للمحاماة</h1>
      <p class="muted">${payment ? 'إيصال سداد' : 'فاتورة'} رقم ${invoice.number}</p>
      <p><b>الموكل:</b> ${invoice.clientName || '—'}</p>
      <p><b>الوصف:</b> ${invoice.description || '—'}</p>
      <p><b>تاريخ الإصدار:</b> ${formatInvoiceDate(invoice.issueDate)}</p>
      <table><thead><tr><th>التاريخ</th><th>المبلغ</th><th>الطريقة</th><th>المرجع</th></tr></thead><tbody>${rows || '<tr><td colspan="4">لا توجد مدفوعات</td></tr>'}</tbody></table>
      <div class="totals">
        <div><span>الإجمالي</span><b>${formatMoney(invoice.total)}</b></div>
        <div><span>المدفوع</span><b>${formatMoney(invoice.paid)}</b></div>
        <div><span>المتبقي</span><b>${formatMoney(remaining(invoice))}</b></div>
      </div>
      <script>window.onload=function(){window.print()}</script>
    </body></html>`)
  win.document.close()
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const isLawyer = user?.roleId === 'lawyer'
  const isClient = user?.roleId === 'client'
  const isAdmin = !isLawyer && !isClient
  const { invoices, isLoading, error, refetch, isFetching } = useInvoices()
  const { data: dashRaw } = useInvoiceDashboard()
  const { create, update, remove } = useInvoiceMutations()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [detailsId, setDetailsId] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const id = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(id)
  }, [toast])

  const showToast = (text, tone = 'success') => setToast({ text, tone })

  const stats = useMemo(() => {
    const fromDash = mapInvoiceDashboardStats(dashRaw)
    if (fromDash) return fromDash
    return calcInvoiceStats(invoices)
  }, [dashRaw, invoices])

  const hasActiveFilters = Boolean(query.trim() || statusFilter)

  const clearFilters = () => {
    setQuery('')
    setStatusFilter('')
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices.filter((inv) => {
      if (statusFilter && inv.status !== statusFilter) return false
      if (!q) return true
      return [inv.number, inv.clientName, inv.caseTitle, inv.description, inv.status]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [invoices, query, statusFilter])

  const editingInvoice = invoices.find((item) => item.id === editingId) || null
  const detailsInvoice = invoices.find((item) => item.id === detailsId) || null
  const paymentInvoice = invoices.find((item) => item.id === paymentId) || null

  const openAdd = () => {
    setEditingId(null)
    setFormOpen(true)
  }

  const handleSave = async (form) => {
    const companyId = getStoredCompanyId()
    const payload = buildInvoicePayload(form, { companyId })
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, values: payload })
        showToast('تم تحديث الفاتورة')
      } else {
        await create.mutateAsync(payload)
        showToast('تم إضافة الفاتورة')
      }
      setFormOpen(false)
      setEditingId(null)
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
      throw err
    }
  }

  const handleAddPayment = async (id, payment) => {
    const invoice = invoices.find((item) => item.id === id)
    if (!invoice) return
    const newPaid = (Number(invoice.paid) || 0) + (Number(payment.amount) || 0)
    const total = Number(invoice.total) || 0
    try {
      await update.mutateAsync({
        id,
        values: {
          paid_amount: newPaid,
          status: deriveStatusValue(total, newPaid),
        },
      })
      showToast('تم تسجيل الدفعة')
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
      throw err
    }
  }

  const handleDelete = async (id) => {
    try {
      await remove.mutateAsync(id)
      if (detailsId === id) setDetailsId(null)
      if (editingId === id) setEditingId(null)
      if (paymentId === id) setPaymentId(null)
      showToast('تم حذف الفاتورة')
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
    }
  }

  return (
    <div className="invoices-page">
      {toast ? (
        <div
          className={`toast toast--${toast.tone === 'error' ? 'error' : 'success'}`}
          role="status"
        >
          {toast.text}
        </div>
      ) : null}

      <div className="stats-grid">
        <StatCard value={formatMoney(stats.total)} label="إجمالي الفواتير" tone="gold" icon="invoices" index={0} />
        <StatCard value={formatMoney(stats.collected)} label="المحصّل" tone="success" icon="check" index={1} />
        <StatCard value={formatMoney(stats.due)} label="المستحق" tone="teal" icon="cash" index={2} />
        <StatCard value={stats.overdue} label="فواتير متأخرة السداد" tone="muted" icon="alert" index={3} />
      </div>

      <div className="cases-toolbar invoices-toolbar">
        <h2 className="cases-toolbar__title">الفواتير والمدفوعات</h2>
        <div className="cases-toolbar__actions invoices-toolbar__actions">
          <button
            type="button"
            className="btn btn--ghost inline-flex items-center gap-2"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            title="تحديث"
          >
            <HiOutlineRefresh
              size={18}
              className={isFetching ? 'animate-spin' : undefined}
              aria-hidden
            />
            تحديث
          </button>
          <div className="search-field invoices-toolbar__search">
            <Icon name="search" className="search-field__icon" />
            <input
              className="search-field__input"
              type="search"
              placeholder="بحث في الفواتير..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="بحث في الفواتير"
            />
          </div>
          <FilterSelect
            className="invoices-toolbar__filter"
            value={statusFilter}
            onChange={setStatusFilter}
            aria-label="تصفية حسب الحالة"
            options={[
              { value: '', label: 'كل الفواتير' },
              ...invoiceStatusOptions.map((opt) => ({
                value: opt.label,
                label: opt.label,
              })),
            ]}
          />
          {hasActiveFilters ? (
            <button type="button" className="btn btn--ghost" onClick={clearFilters}>
              مسح الفلاتر
            </button>
          ) : null}
          {isAdmin && (
            <button type="button" className="btn btn--primary" onClick={openAdd}>
              <Icon name="plus" size={18} />
              إضافة فاتورة
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="table-card flex flex-col items-center gap-4 px-6 py-12 text-center">
          <HiOutlineRefresh size={28} className="animate-spin text-gold" aria-hidden />
          <p>جاري تحميل الفواتير...</p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="table-card flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <HiOutlineExclamationCircle size={28} aria-hidden />
          </span>
          <div>
            <p className="font-display text-base font-bold text-brand">تعذر تحميل الفواتير</p>
            <p className="mt-1 text-sm text-[#6b7f80]">{error}</p>
          </div>
          <button
            type="button"
            className="btn btn--primary inline-flex items-center gap-2"
            onClick={() => refetch()}
          >
            <HiOutlineRefresh size={18} aria-hidden />
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="table-card">
          <div className="table-wrap">
            <table className="data-table invoices-table">
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>القضية/الموكل</th>
                  <th>الوصف</th>
                  <th>المبلغ</th>
                  <th>المدفوع</th>
                  <th>المتبقي</th>
                  <th>تاريخ الاستحقاق</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="data-table__empty">
                      لا توجد فواتير
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => {
                    const due = remaining(inv)
                    const isPayable = due > 0 && inv.status !== 'ملغاة'
                    return (
                      <tr key={inv.id}>
                        <td className="invoices-table__num">{inv.number}</td>
                        <td>
                          <div className="invoice-party">
                            <strong>{inv.clientName || '—'}</strong>
                            {inv.caseTitle ? <small>{inv.caseTitle}</small> : null}
                          </div>
                        </td>
                        <td>{inv.description || '—'}</td>
                        <td>{formatMoney(inv.total)}</td>
                        <td className="invoices-table__paid">{formatMoney(inv.paid)}</td>
                        <td className="invoices-table__due">{formatMoney(due)}</td>
                        <td>{formatInvoiceDate(inv.dueDate)}</td>
                        <td>
                          <span className={statusPill(inv.status)}>{inv.status}</span>
                        </td>
                        <td>
                          <div className="row-actions">
                            {isPayable && !isClient ? (
                              <button
                                type="button"
                                className="action-btn action-btn--pay"
                                title="تسجيل دفعة"
                                onClick={() => setPaymentId(inv.id)}
                              >
                                <Icon name="cash" size={16} />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="action-btn action-btn--view"
                              title="عرض التفاصيل"
                              onClick={() => setDetailsId(inv.id)}
                            >
                              <Icon name="eye" size={16} />
                            </button>
                            <button
                              type="button"
                              className="action-btn action-btn--print"
                              title="طباعة"
                              onClick={() => printInvoice(inv)}
                            >
                              <Icon name="print" size={16} />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  className="action-btn action-btn--edit"
                                  title="تعديل"
                                  onClick={() => {
                                    setEditingId(inv.id)
                                    setFormOpen(true)
                                  }}
                                >
                                  <Icon name="edit" size={16} />
                                </button>
                                <button
                                  type="button"
                                  className="action-btn action-btn--delete"
                                  title="حذف"
                                  onClick={() => handleDelete(inv.id)}
                                >
                                  <Icon name="trash" size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <InvoiceFormModal
        open={formOpen}
        invoice={editingInvoice}
        onClose={() => {
          setFormOpen(false)
          setEditingId(null)
        }}
        onSave={handleSave}
      />
      <InvoiceDetailsModal
        open={Boolean(detailsInvoice)}
        invoice={detailsInvoice}
        onClose={() => setDetailsId(null)}
        onPrintReceipt={printInvoice}
      />
      <RecordPaymentModal
        open={Boolean(paymentInvoice)}
        invoice={paymentInvoice}
        onClose={() => setPaymentId(null)}
        onSave={handleAddPayment}
      />
    </div>
  )
}
