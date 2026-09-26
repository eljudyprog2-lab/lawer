import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Field, FieldGrid, FormBanner, FormSection } from '../ui/Form'
import { FilterSelect } from '../ui/FilterSelect'
import { Icon } from '../ui/Icon'
import { ValidationSummaryBox } from '../ui/ValidationSummaryBox'
import { userRoleOptions } from '../../api/users'

export function AssignUserRoleModal({
  open,
  users = [],
  onClose,
  onAssign,
  submitting = false,
}) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('lawyer')
  const [error, setError] = useState('')

  const selectedUser = users.find((u) => String(u.id) === String(selectedUserId)) || null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedUserId) {
      setError('يرجى اختيار المستخدم أولاً')
      return
    }

    try {
      await onAssign({
        userId: selectedUserId,
        role: selectedRole,
      })
      onClose()
    } catch (err) {
      setError(err?.message || 'تعذر تعيين الصلاحية للمستخدم')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تعيين صلاحية ودور وظيفي لمستخدم"
      wide
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && <FormBanner>{error}</FormBanner>}

        <FormSection
          icon={<Icon name="key" size={18} />}
          title="تحديد المستخدم والدور الجديد"
        >
          <Field label="اختر المستخدم من النظام" required>
            <FilterSelect
              value={selectedUserId}
              onChange={(value) => {
                setSelectedUserId(value)
                setError('')
              }}
              aria-label="اختر المستخدم من النظام"
              options={[
                { value: '', label: '-- اختر المستخدم من القائمة --' },
                ...users.map((u) => ({
                  value: u.id,
                  label: `${u.name || u.full_name} (${u.email}) — الحالي: ${u.roleLabel || u.role}`,
                })),
              ]}
            />
          </Field>

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
                marginBottom: '0.5rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted, #6b7f80)', fontSize: '0.76rem' }}>الاسم:</span>
                <div style={{ fontWeight: 700 }}>{selectedUser.name}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted, #6b7f80)', fontSize: '0.76rem' }}>البريد:</span>
                <div style={{ fontWeight: 700 }}>{selectedUser.email}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted, #6b7f80)', fontSize: '0.76rem' }}>الدور الحالي:</span>
                <div style={{ fontWeight: 700, color: 'var(--brand-teal, #1e3a3c)' }}>
                  {selectedUser.roleLabel || selectedUser.role}
                </div>
              </div>
            </div>
          )}

          <FieldGrid cols={2}>
            <Field label="الدور والصلاحية الجديدة" required>
              <FilterSelect
                value={selectedRole}
                onChange={(value) => setSelectedRole(value)}
                aria-label="الدور والصلاحية الجديدة"
                options={userRoleOptions.map((opt) => ({
                  value: opt.value,
                  label: `${opt.label} (${opt.value})`,
                }))}
              />
            </Field>

            <Field label="نطاق التطبيق">
              <input
                type="text"
                className="input"
                value="تطبيق فوري على كافة العمليات"
                disabled
                style={{ background: '#f8fafc', color: '#64748b' }}
              />
            </Field>
          </FieldGrid>
        </FormSection>

        {/* صندوق ملخص أخطاء التحقق */}
        <ValidationSummaryBox errors={error} />

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
                جاري التعيين...
              </>
            ) : (
              <>
                <Icon name="check" size={16} />
                تأكيد تعيين الدور
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
