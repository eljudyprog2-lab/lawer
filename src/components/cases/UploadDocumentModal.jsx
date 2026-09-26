import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { FormSection, Field, FieldGrid } from '../ui/Form'
import { ValidationSummaryBox } from '../ui/ValidationSummaryBox'
import { Icon } from '../ui/Icon'
import { FilterSelect } from '../ui/FilterSelect'
import { documentTypeOptions } from '../../api/documents'

const emptyDoc = {
  name: '',
  type: '',
  notes: '',
  fileName: '',
  file: null,
}

export function UploadDocumentModal({ open, onClose, onSave, caseLabel }) {
  const [form, setForm] = useState(emptyDoc)
  const [fileLabel, setFileLabel] = useState('لم يتم اختيار ملف')
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const handleClose = () => {
    setForm(emptyDoc)
    setErrors({})
    setFileLabel('لم يتم اختيار ملف')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.fileName && (!form.files || !form.files.length)) {
      errs.file = 'من فضلك اختر ملفاً للرفع'
    }
    if (!form.name.trim()) {
      errs.name = 'من فضلك أدخل اسم أو وصف المستند'
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    try {
      await onSave({
        name: form.name,
        type: form.type || 'أخرى',
        notes: form.notes,
        fileName: form.fileName,
        file: form.file,
        files: form.files || (form.file ? [form.file] : []),
      })
      setForm(emptyDoc)
      setErrors({})
      setFileLabel('لم يتم اختيار ملف')
      onClose()
    } catch (err) {
      setErrors({ submit: err?.message || 'تعذر رفع المستند، يرجى المحاولة مرة أخرى' })
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
          <button type="submit" form="upload-doc-form" className="btn btn--primary">
            حفظ
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleClose}>
            إلغاء
          </button>
        </>
      }
    >
      <form id="upload-doc-form" className="case-form" onSubmit={handleSubmit}>
        <ValidationSummaryBox errors={errors} />
        <FormSection icon={<Icon name="documents" />} title="معلومات المستند">
          <FieldGrid cols={1}>
            <Field label="اختر الملفات" required>
              <div className="file-upload">
                <label className="file-upload__btn">
                  اختيار ملفات
                  <input
                    type="file"
                    multiple
                    accept="*/*"
                    className="file-upload__input"
                    required
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      const count = files.length
                      setFileLabel(
                        count === 0
                          ? 'لم يتم اختيار ملف'
                          : count === 1
                            ? files[0].name
                            : `${count} ملفات مختارة`,
                      )
                      setForm((prev) => ({
                        ...prev,
                        name: prev.name || (count === 1 ? files[0].name.replace(/\.[^/.]+$/, '') : prev.name),
                        fileName: count === 1 ? files[0].name : count > 1 ? `${count} ملفات مختارة` : '',
                        file: files[0] || null,
                        files,
                      }))
                      if (errors.file) {
                        setErrors((prev) => {
                          const next = { ...prev }
                          delete next.file
                          return next
                        })
                      }
                    }}
                  />
                </label>
                <span className="file-upload__name">{fileLabel}</span>
              </div>
              <p className="field__hint">
                يمكنك رفع ملف أو عدة ملفات (بجميع الصيغ)
              </p>
            </Field>
            <Field label="اسم/وصف المستند" required>
              <input
                className="input"
                value={form.name}
                onChange={set('name')}
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
              <input
                className="input"
                value={caseLabel || ''}
                readOnly
              />
            </Field>
            <Field label="نوع المستند">
              <FilterSelect
                value={form.type}
                onChange={(value) => set('type')({ target: { value } })}
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
              <li>سيتم إشعار الأطراف المرتبطين بالقضية عند رفع المستند.</li>
              <li>يمكنك تنزيل المستند لاحقاً من قائمة المستندات.</li>
            </ul>
          </div>
        </div>
      </form>
    </Modal>
  )
}
