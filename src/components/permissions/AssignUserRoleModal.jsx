import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Field, FieldGrid, FormBanner, FormSection } from '../ui/Form'
import { FilterSelect } from '../ui/FilterSelect'
import { Icon } from '../ui/Icon'
import { ValidationSummaryBox } from '../ui/ValidationSummaryBox'

const APPLICATION_SCOPE_OPTIONS = [
  { value: 'وصول مخصص ومقيد', label: 'وصول مخصص ومقيد' },
  { value: 'وصول متقدم', label: 'وصول متقدم' },
  { value: 'وصول شامل وكامل', label: 'وصول شامل وكامل' },
  { value: 'وصول مالي وإداري', label: 'وصول مالي وإداري' },
]

export function AssignUserRoleModal({
  open,
  mode = 'create',
  initialValues = null,
  users = [],
  jobRoles = [],
  onClose,
  onAssign,
  submitting = false,
}) {
  const isEdit = mode === 'edit'
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedJobRoleId, setSelectedJobRoleId] = useState('')
  const [applicationScope, setApplicationScope] = useState('وصول مخصص ومقيد')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    setErrors({})
    if (isEdit && initialValues) {
      setSelectedUserId(String(initialValues.user_id || initialValues.user?.id || ''))
      setSelectedJobRoleId(String(initialValues.job_role_id || initialValues.job_role?.id || ''))
      setApplicationScope(initialValues.application_scope || 'وصول مخصص ومقيد')
    } else {
      setSelectedUserId('')
      setSelectedJobRoleId(jobRoles.length > 0 ? String(jobRoles[0].id) : '')
      setApplicationScope('وصول مخصص ومقيد')
    }
  }, [open, isEdit, initialValues, jobRoles])

  const selectedUser = users.find((u) => String(u.id) === String(selectedUserId)) || initialValues?.user || null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!isEdit && !selectedUserId) {
      errs.user_id = 'يرجى اختيار المستخدم من النظام'
    }
    if (!selectedJobRoleId) {
      errs.job_role_id = 'يرجى تحديد الدور الوظيفي'
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    try {
      await onAssign({
        id: initialValues?.id,
        user_id: Number(selectedUserId),
        job_role_id: Number(selectedJobRoleId),
        application_scope: applicationScope,
      })
      onClose()
    } catch (err) {
      setErrors({ form: err?.message || 'تعذر حفظ تعيين الدور للمستخدم' })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'تعديل تعيين الدور الوظيفي للمستخدم' : 'تعيين دور وظيفي جديد لمستخدم'}
      wide
    >
      <form onSubmit={handleSubmit} noValidate>
        {errors.form && <FormBanner>{errors.form}</FormBanner>}

        <FormSection
          icon={<Icon name="key" size={18} />}
          title="معلومات المستخدم والدور الوظيفي"
        >
          {!isEdit ? (
            <Field label="اختر المستخدم من النظام" required error={errors.user_id}>
              <FilterSelect
                value={selectedUserId}
                onChange={(value) => {
                  setSelectedUserId(value)
                  setErrors((prev) => ({ ...prev, user_id: '' }))
                }}
                aria-label="اختر المستخدم من النظام"
                options={[
                  { value: '', label: '-- اختر المستخدم من القائمة --' },
                  ...users.map((u) => ({
                    value: String(u.id),
                    label: `${u.name || u.full_name} (${u.email})`,
                  })),
                ]}
              />
            </Field>
          ) : (
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>المستخدم المحدد:</span>
              <div style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                {selectedUser?.name || selectedUser?.full_name} ({selectedUser?.email})
              </div>
            </div>
          )}

          {selectedUser && (
            <div
              style={{
                background: 'var(--bg, #f5f8f8)',
                border: '1px solid var(--border, #d5e0e0)',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                fontSize: '0.84rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted, #6b7f80)', fontSize: '0.76rem' }}>الاسم:</span>
                <div style={{ fontWeight: 700 }}>{selectedUser.name || selectedUser.full_name}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted, #6b7f80)', fontSize: '0.76rem' }}>البريد:</span>
                <div style={{ fontWeight: 700 }}>{selectedUser.email}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted, #6b7f80)', fontSize: '0.76rem' }}>الهاتف:</span>
                <div style={{ fontWeight: 700 }}>{selectedUser.phone || '—'}</div>
              </div>
            </div>
          )}

          <FieldGrid cols={2}>
            <Field label="الدور الوظيفي" required error={errors.job_role_id}>
              <FilterSelect
                value={selectedJobRoleId}
                onChange={(value) => {
                  setSelectedJobRoleId(value)
                  setErrors((prev) => ({ ...prev, job_role_id: '' }))
                }}
                aria-label="الدور الوظيفي"
                options={[
                  { value: '', label: '-- اختر الدور الوظيفي --' },
                  ...jobRoles.map((r) => ({
                    value: String(r.id),
                    label: r.name,
                  })),
                ]}
              />
            </Field>

            <Field label="نطاق التطبيق">
              <FilterSelect
                value={applicationScope}
                onChange={(value) => setApplicationScope(value)}
                aria-label="نطاق التطبيق"
                options={APPLICATION_SCOPE_OPTIONS}
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
            style={{ minWidth: '130px', justifyContent: 'center' }}
          >
            {submitting ? (
              <>
                <Icon name="refresh" size={16} className="animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Icon name="check" size={16} />
                {isEdit ? 'تحديث تعيين الدور' : 'تأكيد تعيين الدور'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
