import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormSection, Field, FieldGrid, FormBanner } from '../ui/Form'
import { Icon } from '../ui/Icon'
import { DateField } from '../ui/DateField'
import { FilterSelect } from '../ui/FilterSelect'
import {
  buildCasePayload,
  casePriorityUiOptions,
  caseStageUiOptions,
  caseStatusUiOptions,
  emptyCaseForm,
  parseApiError,
  validateCaseForm,
} from '../../api/cases'
import { getStoredCompanyId } from '../../api/client'
import { mapApiFieldErrors } from '../../utils/validation'

const CASE_API_FIELD_MAP = {
  case_number: 'number',
  case_type_id: 'type',
  client_id: 'client',
  lawyer_id: 'lawyer',
  court_name: 'courtName',
  next_session_date: 'nextSession',
}

export function AddCaseModal({
  open,
  onClose,
  onSave,
  caseTypes = [],
  caseCategories = [],
  clients = [],
  lawyers = [],
}) {
  const [form, setForm] = useState(() => ({ ...emptyCaseForm }))
  const [filesLabel, setFilesLabel] = useState('لم يتم اختيار ملف')
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [banner, setBanner] = useState('')

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [key]: '' }))
    setBanner('')
  }

  const inputClass = (key) => `input${fieldErrors[key] ? ' is-invalid' : ''}`

  const reset = () => {
    setForm({ ...emptyCaseForm })
    setFilesLabel('لم يتم اختيار ملف')
    setSubmitting(false)
    setFieldErrors({})
    setBanner('')
  }

  useEffect(() => {
    if (open) {
      setForm({ ...emptyCaseForm })
      setFilesLabel('لم يتم اختيار ملف')
      setSubmitting(false)
      setFieldErrors({})
      setBanner('')
    }
  }, [open])

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validation = validateCaseForm(form)
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors)
      setBanner(validation.message)
      return
    }
    setFieldErrors({})
    setBanner('')
    setSubmitting(true)
    try {
      await onSave(buildCasePayload(form, { companyId: getStoredCompanyId() }))
      reset()
    } catch (err) {
      const parsed = parseApiError(err)
      setBanner(parsed.message)
      if (parsed.fieldErrors && Object.keys(parsed.fieldErrors).length) {
        setFieldErrors(mapApiFieldErrors(parsed.fieldErrors, CASE_API_FIELD_MAP))
      }
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title="إضافة قضية جديدة"
      onClose={handleClose}
      wide
      footer={
        <>
          <button
            type="submit"
            form="add-case-form"
            className="btn btn--primary"
            disabled={submitting}
          >
            {submitting ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleClose}>
            إلغاء
          </button>
        </>
      }
    >
      <form id="add-case-form" className="case-form" onSubmit={handleSubmit}>
        <FormBanner>{banner}</FormBanner>
        <FormSection icon={<Icon name="info" />} title="المعلومات الأساسية">
          <FieldGrid>
            <Field label="رقم القضية" required error={fieldErrors.number}>
              <input
                className={inputClass('number')}
                value={form.number}
                onChange={set('number')}
                placeholder="مثال: 2024/1234"
                required
              />
            </Field>
            <Field label="عنوان القضية" required error={fieldErrors.title}>
              <input
                className={inputClass('title')}
                value={form.title}
                onChange={set('title')}
                placeholder="وصف مختصر للقضية"
                required
              />
            </Field>
            <Field label="نوع القضية" required error={fieldErrors.type}>
              <FilterSelect
                value={form.type}
                onChange={(value) => set('type')({ target: { value } })}
                aria-label="نوع القضية"
                className={fieldErrors.type ? 'is-invalid' : ''}
                options={[
                  { value: '', label: 'اختر النوع' },
                  ...caseTypes.map((opt) => ({
                    value: String(opt.id),
                    label: opt.name,
                  })),
                ]}
              />
            </Field>
            <Field label="حالة القضية" required>
              <FilterSelect
                value={form.status}
                onChange={(value) => set('status')({ target: { value } })}
                aria-label="حالة القضية"
                options={caseStatusUiOptions.map((opt) => ({ value: opt, label: opt }))}
              />
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection icon={<Icon name="cases" />} title="معلومات المحكمة">
          <FieldGrid>
            <Field label="اسم المحكمة" required error={fieldErrors.courtName}>
              <input
                className={inputClass('courtName')}
                value={form.courtName}
                onChange={set('courtName')}
                placeholder="مثال: محكمة الرياض العامة"
                required
              />
            </Field>
            <Field label="الدائرة">
              <input
                className="input"
                value={form.circuit}
                onChange={set('circuit')}
                placeholder="مثال: الدائرة الثالثة"
              />
            </Field>
            <Field label="اسم القاضي">
              <input
                className="input"
                value={form.judgeName}
                onChange={set('judgeName')}
                placeholder="اسم القاضي المسؤول"
              />
            </Field>
            <Field label="رقم الدعوى بالمحكمة">
              <input
                className="input"
                value={form.courtCaseNumber}
                onChange={set('courtCaseNumber')}
                placeholder="رقم القضية في المحكمة"
              />
            </Field>
            <Field label="تاريخ أول جلسة">
              <DateField
                value={form.firstSession}
                onChange={(value) => set('firstSession')({ target: { value } })}
                aria-label="تاريخ أول جلسة"
              />
            </Field>
            <Field label="الجلسة القادمة" error={fieldErrors.nextSession}>
              <DateField
                value={form.nextSession}
                onChange={(value) => set('nextSession')({ target: { value } })}
                className={fieldErrors.nextSession ? 'is-invalid' : ''}
                aria-label="الجلسة القادمة"
              />
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection icon={<Icon name="clients" />} title="الأطراف">
          <FieldGrid>
            <Field label="الموكل" required full error={fieldErrors.client}>
              <FilterSelect
                value={form.client}
                onChange={(value) => set('client')({ target: { value } })}
                aria-label="الموكل"
                className={fieldErrors.client ? 'is-invalid' : ''}
                options={[
                  { value: '', label: 'اختر الموكل' },
                  ...clients.map((opt) => ({
                    value: String(opt.id),
                    label: opt.full_name ?? opt.name,
                  })),
                ]}
              />
            </Field>
            <Field label="المحامي المسؤول" required full error={fieldErrors.lawyer}>
              <FilterSelect
                value={form.lawyer}
                onChange={(value) => set('lawyer')({ target: { value } })}
                aria-label="المحامي المسؤول"
                className={fieldErrors.lawyer ? 'is-invalid' : ''}
                options={[
                  { value: '', label: 'اختر المحامي' },
                  ...lawyers.map((opt) => ({
                    value: String(opt.id),
                    label: opt.name,
                  })),
                ]}
              />
            </Field>
            <Field label="الخصم (الطرف الآخر)" full>
              <input
                className="input"
                value={form.opponent}
                onChange={set('opponent')}
                placeholder="اسم الخصم في القضية"
              />
            </Field>
            <Field label="محامي الخصم">
              <input
                className="input"
                value={form.opponentLawyer}
                onChange={set('opponentLawyer')}
                placeholder="اسم محامي الطرف الآخر"
              />
            </Field>
            <Field label="هاتف محامي الخصم">
              <input
                className="input"
                value={form.opponentLawyerPhone}
                onChange={set('opponentLawyerPhone')}
                placeholder="رقم التواصل"
              />
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection icon={<Icon name="documents" />} title="المستندات والوصف">
          <FieldGrid cols={1}>
            <Field label="وصف تفصيلي للقضية" full>
              <textarea
                className="input input--area"
                rows={3}
                value={form.description}
                onChange={set('description')}
                placeholder="اكتب وصف تفصيلي للقضية وملابساتها..."
              />
            </Field>
            <Field label="الملاحظات الداخلية" full>
              <textarea
                className="input input--area"
                rows={3}
                value={form.internalNotes}
                onChange={set('internalNotes')}
                placeholder="ملاحظات خاصة للفريق القانوني..."
              />
            </Field>
            <Field label="المستندات المطلوبة" full>
              <textarea
                className="input input--area"
                rows={2}
                value={form.requiredDocuments}
                onChange={set('requiredDocuments')}
                placeholder="قائمة بالمستندات المطلوبة من الموكل..."
              />
            </Field>
            <Field label="رفع مستندات القضية" full>
              <div className="file-upload">
                <label className="file-upload__btn">
                  اختيار ملفات
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,image/*"
                    className="file-upload__input"
                    onChange={(e) => {
                      const count = e.target.files?.length || 0
                      setFilesLabel(
                        count === 0
                          ? 'لم يتم اختيار ملف'
                          : count === 1
                            ? e.target.files[0].name
                            : `${count} ملفات مختارة`,
                      )
                    }}
                  />
                </label>
                <span className="file-upload__name">{filesLabel}</span>
              </div>
              <p className="field__hint">يمكنك رفع عدة ملفات (PDF, Word, صور)</p>
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection icon={<Icon name="calendar" />} title="التواريخ المهمة">
          <FieldGrid>
            <Field label="تاريخ الواقعة">
              <DateField
                value={form.incidentDate}
                onChange={(value) => set('incidentDate')({ target: { value } })}
                aria-label="تاريخ الواقعة"
              />
            </Field>
            <Field label="تاريخ التوكيل">
              <DateField
                value={form.powerOfAttorneyDate}
                onChange={(value) => set('powerOfAttorneyDate')({ target: { value } })}
                aria-label="تاريخ التوكيل"
              />
            </Field>
            <Field label="تاريخ انتهاء التقادم">
              <DateField
                value={form.limitationExpiry}
                onChange={(value) => set('limitationExpiry')({ target: { value } })}
                aria-label="تاريخ انتهاء التقادم"
              />
            </Field>
            <Field label="الموعد النهائي للحكم">
              <DateField
                value={form.judgmentDeadline}
                onChange={(value) => set('judgmentDeadline')({ target: { value } })}
                aria-label="الموعد النهائي للحكم"
              />
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection icon={<Icon name="alert" />} title="الأولوية والتصنيف">
          <FieldGrid>
            <Field label="مستوى الأولوية">
              <FilterSelect
                value={form.priority}
                onChange={(value) => set('priority')({ target: { value } })}
                aria-label="مستوى الأولوية"
                options={casePriorityUiOptions.map((opt) => ({ value: opt, label: opt }))}
              />
            </Field>
            <Field label="التصنيف">
              <FilterSelect
                value={form.classification}
                onChange={(value) => set('classification')({ target: { value } })}
                aria-label="التصنيف"
                options={[
                  { value: '', label: 'اختر التصنيف' },
                  ...caseCategories.map((opt) => ({
                    value: String(opt.id),
                    label: opt.name,
                  })),
                ]}
              />
            </Field>
            <Field label="المرحلة الحالية" full>
              <FilterSelect
                value={form.stage}
                onChange={(value) => set('stage')({ target: { value } })}
                aria-label="المرحلة الحالية"
                options={caseStageUiOptions.map((opt) => ({ value: opt, label: opt }))}
              />
            </Field>
          </FieldGrid>
        </FormSection>
      </form>
    </Modal>
  )
}
