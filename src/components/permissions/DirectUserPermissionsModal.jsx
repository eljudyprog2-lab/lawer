import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import {
  useUserDirectPermissions,
  useUserDirectPermissionMutations,
  useAllPermissions,
} from '../../hooks/usePermissions'

export function DirectUserPermissionsModal({ open, user = null, onClose }) {
  const userId = user?.id || null
  const { directPermissions, isLoading, isFetching, refetch } = useUserDirectPermissions(userId, {
    enabled: Boolean(open && userId),
  })
  const { permissions: allPermissions, isLoading: permsLoading } = useAllPermissions()
  const { update } = useUserDirectPermissionMutations(userId)
  const [updatingId, setUpdatingId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  if (!open || !user) return null

  // Map user's direct permissions by permission_id
  const directMap = {}
  directPermissions.forEach((dp) => {
    directMap[dp.permission_id || dp.permission?.id] = dp.is_allowed
  })

  // Group all available permissions by section
  const sections = {}
  allPermissions.forEach((p) => {
    const sec = p.section || 'الصلاحيات العامة'
    if (!sections[sec]) sections[sec] = []
    sections[sec].push(p)
  })

  const handleToggle = async (permissionId, currentAllowed) => {
    setUpdatingId(permissionId)
    setErrorMsg('')
    try {
      await update.mutateAsync({
        permissionId,
        isAllowed: !currentAllowed,
      })
      await refetch()
    } catch (err) {
      setErrorMsg(err?.message || 'تعذر تحديث الصلاحية المباشرة للمستخدم')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`الصلاحيات المباشرة للمستخدم: ${user.name || user.full_name || ''}`}
      wide
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* User Info Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            background: 'var(--bg, #f5f8f8)',
            border: '1px solid var(--border, #d5e0e0)',
            borderRadius: '10px',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)' }}>المستخدم: </span>
            <strong style={{ color: 'var(--text-h)' }}>{user.name || user.full_name}</strong>
            <span style={{ color: 'var(--text-muted)', margin: '0 0.5rem' }}>•</span>
            <span style={{ color: 'var(--text-muted)' }}>{user.email}</span>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => refetch()}
            disabled={isFetching || isLoading}
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
          >
            <Icon name="refresh" size={14} className={isFetching ? 'animate-spin' : undefined} />
            تحديث
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              fontSize: '0.84rem',
              fontWeight: 600,
            }}
          >
            {errorMsg}
          </div>
        )}

        {isLoading || permsLoading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            <Icon name="refresh" size={24} className="animate-spin" />
            <p style={{ marginTop: '0.5rem' }}>جاري تحميل الصلاحيات المباشرة...</p>
          </div>
        ) : Object.keys(sections).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            لا توجد صلاحيات مسجلة في النظام
          </div>
        ) : (
          <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {Object.entries(sections).map(([sectionName, perms]) => (
              <div key={sectionName} style={{ marginBottom: '1.25rem' }}>
                <div
                  style={{
                    padding: '0.45rem 0.75rem',
                    background: '#f1f5f9',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    color: 'var(--text-h)',
                    marginBottom: '0.5rem',
                  }}
                >
                  {sectionName}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {perms.map((p) => {
                    const isAllowed = Boolean(directMap[p.id])
                    const isUpdating = updatingId === p.id

                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.55rem 0.85rem',
                          background: '#fff',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-h)' }}>
                            {p.name}
                          </div>
                        </div>

                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            cursor: isUpdating ? 'wait' : 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: isAllowed ? 'var(--success)' : 'var(--text-muted)',
                          }}
                        >
                          {isUpdating ? (
                            <Icon name="refresh" size={14} className="animate-spin" />
                          ) : (
                            <input
                              type="checkbox"
                              checked={isAllowed}
                              onChange={() => handleToggle(p.id, isAllowed)}
                              disabled={isUpdating}
                              style={{ width: '16px', height: '16px', accentColor: 'var(--brand-teal)' }}
                            />
                          )}
                          <span>{isAllowed ? 'مفعل مباشر' : 'غير مفعل'}</span>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button type="button" className="btn btn--primary" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  )
}
