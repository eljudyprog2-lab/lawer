import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { FormSection, Field, FieldGrid } from '../ui/Form'
import { ValidationSummaryBox } from '../ui/ValidationSummaryBox'

export function EditProfileModal({ open, onClose, user, onSave, submitting }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    nationalId: '',
    address: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open && user) {
      setFormData({
        name: user.name || user.full_name || '',
        phone: user.phone || '',
        nationalId: user.nationalId || '',
        address: user.address || '',
      })
      setErrors({})
    }
  }, [open, user])

  const updateField = (key, value) => {
    setFormData((p) => ({ ...p, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const validate = () => {
    const errs = {}
    if (!formData.name.trim()) errs.name = 'الاسم الكامل مطلوب'
    if (formData.phone && !/^[0-9+ ]{9,16}$/.test(formData.phone.trim())) {
      errs.phone = 'رقم الجوال غير صحيح'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave(formData)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تعديل بيانات الملف الشخصي"
      wide
      footer={
        <>
          <button
            type="submit"
            form="edit-profile-form"
            className="btn btn--primary"
            disabled={submitting}
          >
            <Icon name="check" size={18} />
            {submitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={submitting}
          >
            إلغاء
          </button>
        </>
      }
    >
      <form id="edit-profile-form" onSubmit={handleSubmit} className="case-form">
        <ValidationSummaryBox errors={errors} />

        <FormSection icon={<Icon name="user" size={18} />} title="المعلومات الشخصية">
          <FieldGrid cols={1}>
            <Field
              label="الاسم الكامل (المعتمد قضائياً)"
              required
              error={errors.name}
            >
              <input
                id="profile-name"
                type="text"
                className={`input${errors.name ? ' input--error' : ''}`}
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="د. فلان بن فلان..."
              />
            </Field>
          </FieldGrid>

          <FieldGrid cols={2}>
            <Field
              label="رقم الجوال المعتمد"
              error={errors.phone}
            >
              <input
                id="profile-phone"
                type="tel"
                className={`input${errors.phone ? ' input--error' : ''}`}
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+966 500000000"
                dir="ltr"
              />
            </Field>

            <Field label="رقم الهوية الوطنية">
              <input
                id="profile-nationalId"
                type="text"
                className="input"
                value={formData.nationalId}
                onChange={(e) => setFormData((p) => ({ ...p, nationalId: e.target.value }))}
                placeholder="10XXXXXXXX"
                maxLength={10}
                dir="ltr"
              />
            </Field>
          </FieldGrid>
        </FormSection>

        <FormSection icon={<Icon name="info" size={18} />} title="بيانات التواصل">
          <Field label="العنوان الوطني المعتمد للمراسلات" full>
            <textarea
              id="profile-address"
              className="input input--area"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
              placeholder="المملكة العربية السعودية، الرياض، حي..."
            />
          </Field>
        </FormSection>
      </form>
    </Modal>
  )
}
