import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormSection, Field, FieldGrid, FormBanner } from '../ui/Form'
import { Icon } from '../ui/Icon'
import { DateField } from '../ui/DateField'
import { FilterSelect } from '../ui/FilterSelect'
import { useClients } from '../../hooks/useClients'
import { useCases } from '../../hooks/useCases'
import {
  emptyInvoiceForm,
  invoiceStatusOptions,
  paymentMethodOptions,
  deriveStatus,
  generateInvoiceNumber,
  invoiceToForm,
  validateInvoiceForm,
} from '../../api/invoices'

export function InvoiceFormModal({ open, invoice, onClose, onSave }) {
  const [form, setForm] = useState(emptyInvoiceForm)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [banner, setBanner] = useState('')
  const isEdit = Boolean(invoice)
  const { clients, isLoading: clientsLoading } = useClients()
  const { cases, isLoading: casesLoading } = useCases()

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    setBanner('')
    setForm(
      invoice
        ? invoiceToForm(invoice)
        : {
            ...emptyInvoiceForm,
            number: generateInvoiceNumber(),
            issueDate: new Date().toISOString().slice(0, 10),
          },
    )
  }, [open, invoice])

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))
    setBanner('')
  }

  const inputClass = (key) => `input${fieldErrors[key] ? ' is-invalid' : ''}`

  const itemsTotal = useMemo(
    () => (form.items || []).reduce((sum, it) => sum + (Number(it.amount) || 0), 0),
    [form.items],
  )

  const remainingAmount = Math.max(
    0,
    (Number(form.total) || 0) - (Number(form.paid) || 0),
  )

  const autoStatus = deriveStatus(form.total, form.paid)

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...(prev.items || []), { description: '', amount: '' }],
    }))
  }

  const updateItem = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) =>
        i === index ? { ...it, [key]: value } : it,
      ),
    }))
  }

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const validation = validateInvoiceForm(form)
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors)
      setBanner(validation.message)
      return
    }
    setFieldErrors({})
    setBanner('')
    setSubmitting(true)
    try {
      await onSave?.({ ...form, status: form.status || autoStatus })
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
      title={isEdit ? 'تعديل الفاتورة' : 'إضافة فاتورة جديدة'}
      onClose={onClose}
      wide
      footer={
        <>
          <button
            type="submit"
            form="invoice-form"
            className="btn btn--primary"
            disabled={submitting || clientsLoading || casesLoading}
          >
            حفظ
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            إلغاء
          </button>
        </>
      }
    >
      <form id="invoice-form" className="case-form" onSubmit={handleSubmit} noValidate>
        <FormBanner>{banner}</FormBanner>
        <FormSection icon={<Icon name="invoices" />} title="معلومات الفاتورة">
          <FieldGrid cols={2}>
            <Field label="رقم الفاتورة" required>
              <input className="input" value={form.number} onChange={set('number')} readOnly />
            </Field>
            <Field label="تاريخ الإصدار" required error={fieldErrors.issueDate}>
              <DateField
                value={form.issueDate}
                onChange={(value) => set('issueDate')({ target: { value } })}
                className={fieldErrors.issueDate ? 'is-invalid' : ''}
                aria-label="تاريخ الإصدار"
                required
              />
            </Field>
            <Field label="الموكل" required error={fieldErrors.clientId}>
              <FilterSelect
                value={form.clientId}
                onChange={(value) => set('clientId')({ target: { value } })}
                aria-label="الموكل"
                className={fieldErrors.clientId ? 'is-invalid' : ''}
                disabled={clientsLoading}
                options={[
                  { value: '', label: 'اختر الموكل' },
                  ...clients.map((item) => ({
                    value: String(item.id),
                    label: item.name,
                  })),
                ]}
              />
            </Field>
            <Field label="القضية (اختياري)">
              <FilterSelect
                value={form.caseId}
                onChange={(value) => set('caseId')({ target: { value } })}
                aria-label="القضية (اختياري)"
                disabled={casesLoading}
                options={[
                  { value: '', label: 'اختر القضية' },
                  ...cases.map((item) => ({
                    value: String(item.id),
                    label: `${item.title} (#${item.number})`,
                  })),
                ]}
              />
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection icon={<Icon name="cash" />} title="تفاصيل المبالغ">
          <FieldGrid cols={2}>
            <Field label="وصف الفاتورة" required full error={fieldErrors.description}>
              <textarea
                className={`input input--area${fieldErrors.description ? ' is-invalid' : ''}`}
                rows={3}
                value={form.description}
                onChange={set('description')}
                placeholder="أتعاب قانونية، استشارة، مصروفات قضائية..."
                required
              />
            </Field>
            <Field label="المبلغ الإجمالي" required error={fieldErrors.total}>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass('total')}
                value={form.total}
                onChange={set('total')}
                placeholder="0.00"
                required
              />
            </Field>
            <Field label="المبلغ المدفوع" error={fieldErrors.paid}>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass('paid')}
                value={form.paid}
                onChange={set('paid')}
                placeholder="0"
              />
            </Field>
            <Field label="المبلغ المتبقي">
              <input
                className="input"
                value={remainingAmount.toFixed(2)}
                readOnly
                tabIndex={-1}
              />
            </Field>
            <Field label="تاريخ الاستحقاق">
              <DateField
                value={form.dueDate}
                onChange={(value) => set('dueDate')({ target: { value } })}
                aria-label="تاريخ الاستحقاق"
              />
            </Field>
            <Field label="حالة الفاتورة" full>
              <FilterSelect
                value={form.status}
                onChange={(value) => set('status')({ target: { value } })}
                aria-label="حالة الفاتورة"
                className={`invoice-status-select invoice-status-select--${statusKey(form.status)}`}
                options={invoiceStatusOptions.map((opt) => ({
                  value: opt.label,
                  label: opt.label,
                }))}
              />
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection icon={<Icon name="notes" />} title="بنود الفاتورة (اختياري)">
          <div className="invoice-items">
            {(form.items || []).length === 0 ? (
              <p className="invoice-items__empty">لا توجد بنود</p>
            ) : (
              form.items.map((item, index) => (
                <div key={index} className="invoice-item-row">
                  <input
                    className="input"
                    placeholder="وصف البند"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    placeholder="المبلغ"
                    value={item.amount}
                    onChange={(e) => updateItem(index, 'amount', e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn--danger invoice-item-row__del"
                    onClick={() => removeItem(index)}
                    aria-label="حذف البند"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              ))
            )}
            <button type="button" className="btn btn--ghost" onClick={addItem}>
              <Icon name="plus" size={16} />
              إضافة بند
            </button>
            <div className="invoice-items__total">
              إجمالي البنود: {itemsTotal.toFixed(2)} جنيه
            </div>
          </div>
        </FormSection>

        <FormSection icon={<Icon name="payment" />} title="معلومات الدفع">
          <FieldGrid cols={1}>
            <Field label="طريقة الدفع المفضلة">
              <FilterSelect
                value={form.paymentMethod}
                onChange={(value) => set('paymentMethod')({ target: { value } })}
                aria-label="طريقة الدفع المفضلة"
                options={[
                  { value: '', label: 'غير محدد' },
                  ...paymentMethodOptions.map((opt) => ({
                    value: opt.label,
                    label: opt.label,
                  })),
                ]}
              />
            </Field>
            <Field label="ملاحظات إضافية">
              <textarea
                className="input input--area"
                rows={3}
                value={form.notes}
                onChange={set('notes')}
              />
            </Field>
          </FieldGrid>
        </FormSection>
      </form>
    </Modal>
  )
}

function statusKey(status) {
  if (status === 'مدفوعة') return 'paid'
  if (status === 'مدفوعة جزئياً') return 'partial'
  if (status === 'ملغاة') return 'cancelled'
  return 'unpaid'
}
