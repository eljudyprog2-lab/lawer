import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { ValidationSummaryBox } from '../ui/ValidationSummaryBox'
import { apiRules } from '../../validation/apiRules'
import { validateLookupName } from '../../validation/validators'

export function OptionModal({
  open,
  onClose,
  onSubmit,
  initialValues = null,
  groupTitle = '',
  isLoading = false,
}) {
  const isEdit = Boolean(initialValues?.id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState(null)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initialValues?.name || '')
      setDescription(initialValues?.description || '')
      setIsActive(initialValues?.is_active ?? true)
      setError(null)
      setTouched(false)
    }
  }, [open, initialValues])

  const handleNameChange = (e) => {
    const val = e.target.value
    setName(val)
    if (touched) {
      setError(validateLookupName(val))
    }
  }

  const handleBlur = () => {
    setTouched(true)
    setError(validateLookupName(name))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    const validationError = validateLookupName(name)
    if (validationError) {
      setError(validationError)
      return
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      is_active: isActive,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `تعديل خيار: ${initialValues?.name || ''}` : `إضافة خيار جديد إلى: ${groupTitle}`}
      wide
    >
      <form onSubmit={handleSubmit} noValidate className="mgmt-modal-form">
        <div className="mgmt-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header context badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '0.65rem 0.9rem',
              fontSize: '0.82rem',
              color: '#475569',
            }}
          >
            <span>المجموعة التابعة: <strong>{groupTitle}</strong></span>
            <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
              {isEdit ? 'تعديل السجل الحالي' : 'إضافة سجل جديد للنظام'}
            </span>
          </div>

          {/* Option Name */}
          <div className="mgmt-input-wrap">
            <label htmlFor="lookup-option-name" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                اسم الخيار <strong style={{ color: '#dc2626' }}>*</strong>
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {name.length}/{apiRules.lookups.name.max}
              </span>
            </label>
            <input
              id="lookup-option-name"
              type="text"
              value={name}
              onChange={handleNameChange}
              onBlur={handleBlur}
              placeholder="مثال: قضايا الملكية الفكرية وبراءات الاختراع..."
              maxLength={apiRules.lookups.name.max}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'lookup-name-error' : undefined}
              autoFocus
              style={{
                borderColor: error ? '#dc2626' : undefined,
                background: error ? '#fef2f2' : '#ffffff',
              }}
            />
            {error ? (
              <span
                id="lookup-name-error"
                role="alert"
                style={{
                  fontSize: '0.78rem',
                  color: '#dc2626',
                  marginTop: '0.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontWeight: 600,
                }}
              >
                <Icon name="alert" size={14} />
                {error}
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                يظهر هذا الاسم مباشرة في القوائم المنسدلة عند إنشاء أو تعديل الملفات.
              </span>
            )}
          </div>

          {/* Description (Optional) */}
          <div className="mgmt-input-wrap">
            <label htmlFor="lookup-option-desc" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>الوصف المختصر والتوجيه المهني (اختياري)</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {description.length}/500
              </span>
            </label>
            <textarea
              id="lookup-option-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف إرشادي مختصر لمساعدة المحامين على اختيار التصنيف الدقيق..."
              maxLength={500}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                border: '1.5px solid #e2e8f0',
                borderRadius: '11px',
                background: '#ffffff',
                color: '#0f172a',
                font: 'inherit',
                fontSize: '0.88rem',
                direction: 'rtl',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Active status toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                تفعيل الخيار في القوائم المنسدلة
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '0.2rem' }}>
                عند التعطيل، لن يظهر الخيار في نماذج الإدخال الجديدة مع الحفاظ عليه في الملفات القديمة.
              </div>
            </div>
            <label
              style={{
                position: 'relative',
                display: 'inline-block',
                width: '46px',
                height: '24px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: isActive ? '#10b981' : '#cbd5e1',
                  borderRadius: '24px',
                  transition: '0.2s',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: isActive ? '24px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.2s',
                  }}
                />
              </span>
            </label>
          </div>
        </div>

        {/* صندوق ملخص أخطاء التحقق */}
        <ValidationSummaryBox errors={error} />

        {/* Footer actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={isLoading}
            style={{ minWidth: '110px', justifyContent: 'center' }}
          >
            {isLoading ? (
              <>
                <Icon name="refresh" size={16} className="animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Icon name="check" size={16} />
                {isEdit ? 'تحديث الخيار' : 'حفظ الخيار'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
