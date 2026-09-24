import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormSection, Field, FieldGrid } from '../ui/Form'
import { Icon } from '../ui/Icon'
import { DateField } from '../ui/DateField'
import { FilterSelect } from '../ui/FilterSelect'
import {
  emptyPaymentForm,
  paymentMethodOptions,
  formatMoney,
  remaining,
} from '../../api/invoices'

export function RecordPaymentModal({ open, invoice, onClose, onSave }) {
  const [form, setForm] = useState(emptyPaymentForm)
  const [fileLabel, setFileLabel] = useState('اسحب الملف هنا أو انقر للاختيار')
  const [submitting, setSubmitting] = useState(false)

  const due = invoice ? remaining(invoice) : 0

  useEffect(() => {
    if (!open || !invoice) return
    setForm({
      ...emptyPaymentForm,
      amount: String(remaining(invoice)),
      date: new Date().toISOString().slice(0, 10),
    })
    setFileLabel('اسحب الملف هنا أو انقر للاختيار')
  }, [open, invoice])

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const afterPayment = useMemo(
    () => Math.max(0, due - (Number(form.amount) || 0)),
    [due, form.amount],
  )

  if (!invoice) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = Number(form.amount) || 0
    if (amount <= 0 || amount > due) return
    setSubmitting(true)
    try {
      await onSave?.(invoice.id, {
        amount,
        date: form.date,
        method: form.method,
        reference: form.reference.trim(),
        notes: form.notes.trim(),
        receiptName: form.receiptName,
      })
      onClose()
    } catch {
      /* parent surfaces error */
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title="تسجيل دفعة على الفاتورة"
      onClose={onClose}
      wide
      footer={
        <>
          <button
            type="submit"
            form="payment-form"
            className="btn btn--primary"
            disabled={submitting}
          >
            حفظ
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            إلغاء
          </button>
        </>
      }
    >
      <form id="payment-form" className="case-form" onSubmit={handleSubmit}>
        <section className="payment-summary">
          <h3>
            <Icon name="invoices" size={18} />
            معلومات الفاتورة
          </h3>
          <div className="payment-summary__grid">
            <div>
              <span>رقم الفاتورة:</span>
              <strong>#{invoice.number}</strong>
            </div>
            <div>
              <span>الموكل:</span>
              <strong>{invoice.clientName}</strong>
            </div>
            <div>
              <span>المبلغ الإجمالي:</span>
              <strong>{formatMoney(invoice.total)}</strong>
            </div>
            <div>
              <span>المدفوع سابقاً:</span>
              <strong className="payment-summary__paid">{formatMoney(invoice.paid)}</strong>
            </div>
          </div>
          <div className="payment-summary__due">
            <span>المبلغ المتبقي:</span>
            <strong>{formatMoney(due)}</strong>
          </div>
        </section>

        <FormSection icon={<Icon name="payment" />} title="بيانات الدفعة الجديدة">
          <FieldGrid cols={2}>
            <Field label="المبلغ المدفوع" required>
              <input
                type="number"
                min="0"
                step="0.01"
                max={due}
                className="input"
                value={form.amount}
                onChange={set('amount')}
                required
              />
              <p className="field__hint">الحد الأقصى للدفع: {formatMoney(due)}</p>
            </Field>
            <Field label="تاريخ الدفع">
              <DateField
                value={form.date}
                onChange={(value) => set('date')({ target: { value } })}
                aria-label="تاريخ الدفع"
              />
            </Field>
            <Field label="طريقة الدفع" required>
              <FilterSelect
                value={form.method}
                onChange={(value) => set('method')({ target: { value } })}
                aria-label="طريقة الدفع"
                options={paymentMethodOptions.map((opt) => ({
                  value: opt.label,
                  label: opt.label,
                }))}
              />
            </Field>
            <Field label="رقم المرجع">
              <input
                className="input"
                value={form.reference}
                onChange={set('reference')}
                placeholder="رقم الشيك / التحويل"
              />
            </Field>
          </FieldGrid>

          <Field label="رفع صورة/مستند الإيصال" full>
            <label className="upload-drop">
              <Icon name="upload" size={26} />
              <span>{fileLabel}</span>
              <small>الأنواع المسموحة: PDF, JPG, PNG, DOC (الحد الأقصى: 5 ميجا)</small>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="file-upload__input"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  setFileLabel(file ? file.name : 'اسحب الملف هنا أو انقر للاختيار')
                  setForm((prev) => ({ ...prev, receiptName: file?.name || '' }))
                }}
              />
            </label>
          </Field>

          <Field label="ملاحظات الدفع" full>
            <textarea
              className="input input--area"
              rows={3}
              value={form.notes}
              onChange={set('notes')}
              placeholder="أي تفاصيل إضافية عن هذه الدفعة..."
            />
          </Field>
        </FormSection>

        <div className="payment-result">
          <Icon name="cash" size={18} />
          <div>
            <strong>ملخص الدفعة</strong>
            <span>المبلغ المدفوع: {formatMoney(form.amount)}</span>
            <span>سيتبقى بعد الدفع: {formatMoney(afterPayment)}</span>
          </div>
        </div>
      </form>
    </Modal>
  )
}
