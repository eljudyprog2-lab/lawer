import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Field, FieldGrid, FormBanner, FormSection } from '../ui/Form'
import { FilterSelect } from '../ui/FilterSelect'
import { Icon } from '../ui/Icon'
import { ValidationSummaryBox } from '../ui/ValidationSummaryBox'

export function RoleModal({
  open,
  mode = 'create',
  initialValues = null,
  onClose,
  onSave,
  submitting = false,
}) {
  const isEdit = mode === 'edit'

  const [form, setForm] = useState({
    name: '',
    subTitle: '',
    description: '',
    accessLevel: 'وصول مخصص ومقيد',
    status: 'نشط',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    setErrors({})
    if (isEdit && initialValues) {
      setForm({
        name: initialValues.name || '',
        subTitle: initialValues.subTitle || '',
        description: initialValues.description || '',
        accessLevel: initialValues.accessLevel || 'وصول مخصص ومقيد',
        status: initialValues.status || 'نشط',
      })
    } else {
      setForm({
        name: '',
        subTitle: '',
        description: '',
        accessLevel: 'وصول مخصص ومقيد',
        status: 'نشط',
      })
    }
  }, [open, isEdit, initialValues])

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) {
      errs.name = 'اسم الدور الوظيفي مطلوب'
    }
    if (!form.description.trim()) {
      errs.description = 'نطاق الوصف والمهام مطلوب'
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    onSave({
      name: form.name.trim(),
      subTitle: form.subTitle.trim(),
      description: form.description.trim(),
      accessLevel: form.accessLevel,
      status: form.status,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `تعديل الدور الوظيفي: ${initialValues?.name || ''}` : 'إضافة دور وظيفي جديد للنظام'}
      wide
    >
      <form onSubmit={handleSubmit} noValidate>
        <ValidationSummaryBox errors={errors} />

        <FormSection
          icon={<Icon name="shield" size={18} />}
          title="معلومات الدور والصلاحيات"
        >
          <FieldGrid cols={2}>
            <Field label="اسم الدور الوظيفي" required>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={set('name')}
                placeholder="مثال: محامي استئناف ومحكم"
                autoFocus
              />
            </Field>

            <Field label="المسمى الإنجليزي / التصنيف">
              <input
                type="text"
                className="input"
                value={form.subTitle}
                onChange={set('subTitle')}
                placeholder="مثال: Senior Litigator"
              />
            </Field>
          </FieldGrid>

          <Field label="نطاق الوصف والمهام القانونية" required>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={set('description')}
              placeholder="توضيح المسؤوليات الموكلة لهذا الدور..."
              style={{ resize: 'vertical' }}
            />
          </Field>

          <FieldGrid cols={2}>
            <Field label="مستوى الوصول في النظام">
              <FilterSelect
                value={form.accessLevel}
                onChange={(value) => set('accessLevel')({ target: { value } })}
                aria-label="مستوى الوصول في النظام"
                options={[
                  { value: 'وصول شامل وكامل', label: 'وصول شامل وكامل' },
                  { value: 'وصول متقدم', label: 'وصول متقدم' },
                  { value: 'وصول مخصص ومقيد', label: 'وصول مخصص ومقيد' },
                  { value: 'وصول مالي وإداري', label: 'وصول مالي وإداري' },
                ]}
              />
            </Field>

            <Field label="حالة الدور">
              <FilterSelect
                value={form.status}
                onChange={(value) => set('status')({ target: { value } })}
                aria-label="حالة الدور"
                options={[
                  { value: 'نشط', label: 'نشط' },
                  { value: 'معلق', label: 'معلق' },
                ]}
              />
            </Field>
          </FieldGrid>
        </FormSection>

        {/* صندوق ملخص أخطاء التحقق */}
        <ValidationSummaryBox errors={errors} />

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border, #d5e0e0)',
          }}
        >
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={submitting}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
            style={{ minWidth: '120px', justifyContent: 'center' }}
          >
            {submitting ? (
              <>
                <Icon name="refresh" size={16} className="animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Icon name="check" size={16} />
                {isEdit ? 'حفظ تعديلات الدور' : 'إضافة الدور للنظام'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
