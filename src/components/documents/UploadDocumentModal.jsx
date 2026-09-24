import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormSection, Field, FieldGrid } from '../ui/Form'
import { Icon } from '../ui/Icon'
import { FilterSelect } from '../ui/FilterSelect'
import { emptyDocumentForm, documentTypeOptions } from '../../api/documents'

export function UploadDocumentModal({
  open,
  onClose,
  onSave,
  caseOptions = [],
}) {
  const [form, setForm] = useState(emptyDocumentForm)
  const [fileLabel, setFileLabel] = useState('لم يتم اختيار ملف')
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleClose = () => {
    setForm(emptyDocumentForm)
    setFileLabel('لم يتم اختيار ملف')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fileName || !form.description.trim() || !form.file) return
    setSubmitting(true)
    try {
      await onSave?.(form)
      setForm(emptyDocumentForm)
      setFileLabel('لم يتم اختيار ملف')
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
      title="رفع مستند جديد"
      onClose={handleClose}
      wide
      footer={
        <>
          <button
            type="submit"
            form="docs-upload-form"
            className="btn btn--primary"
            disabled={submitting}
          >
            <Icon name="upload" size={18} />
            رفع المستند
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleClose}>
            إلغاء
          </button>
        </>
      }
    >
      <form id="docs-upload-form" className="case-form" onSubmit={handleSubmit}>
        <FormSection icon={<Icon name="documents" />} title="معلومات المستند">
          <FieldGrid cols={1}>
            <Field label="اختر الملف" required>
              <div className="file-upload">
                <label className="file-upload__btn">
                  اختيار ملف
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                    className="file-upload__input"
                    required
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      setFileLabel(file ? file.name : 'لم يتم اختيار ملف')
                      setForm((prev) => ({
                        ...prev,
                        file: file || null,
                        fileName: file?.name || '',
                        sizeBytes: file?.size || 0,
                        mimeType: file?.type || '',
                      }))
                    }}
                  />
                </label>
                <span className="file-upload__name">{fileLabel}</span>
              </div>
              <p className="field__hint">
                الأنواع المسموحة: PDF, Word, Excel, صور (الحد الأقصى: 10 ميجا)
              </p>
            </Field>
            <Field label="اسم/وصف المستند" required>
              <input
                className="input"
                value={form.description}
                onChange={set('description')}
                placeholder="مثال: عقد الإيجار، صورة البطاقة، محضر الجلسة..."
                required
              />
              <p className="field__hint">
                هذا الوصف سيساعدك في التعرف على المستند لاحقاً
              </p>
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection icon={<Icon name="link" />} title="ربط بقضية">
          <FieldGrid cols={1}>
            <Field label="القضية المرتبطة">
              <FilterSelect
                value={form.caseId}
                onChange={(value) => set('caseId')({ target: { value } })}
                aria-label="القضية المرتبطة"
                options={[
                  { value: '', label: '-- بدون قضية (اختياري) --' },
                  ...caseOptions.map((item) => ({
                    value: String(item.id),
                    label: `${item.title} (#${item.number})`,
                  })),
                ]}
              />
            </Field>
            <Field label="نوع المستند">
              <FilterSelect
                value={form.docType}
                onChange={(value) => set('docType')({ target: { value } })}
                aria-label="نوع المستند"
                options={[
                  { value: '', label: '-- اختر النوع --' },
                  ...documentTypeOptions.map((opt) => ({ value: opt, label: opt })),
                ]}
              />
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection icon={<Icon name="notes" />} title="ملاحظات إضافية">
          <Field label="ملاحظات" full>
            <textarea
              className="input input--area"
              rows={3}
              value={form.notes}
              onChange={set('notes')}
              placeholder="أي ملاحظات إضافية عن المستند..."
            />
          </Field>
        </FormSection>

        <div className="info-banner">
          <Icon name="info" size={20} />
          <div>
            <strong>معلومات هامة</strong>
            <ul>
              <li>سيتم حفظ المستند بشكل آمن في النظام.</li>
              <li>يمكنك ربط المستند بقضية أو تركه بدون قضية.</li>
              <li>يمكنك تنزيل المستند لاحقاً من قائمة المستندات.</li>
            </ul>
          </div>
        </div>
      </form>
    </Modal>
  )
}
