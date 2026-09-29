import { useState, useMemo, useEffect } from 'react'
import { Icon } from '../ui/Icon'
import { StatCard } from '../dashboard/StatCard'
import { RoleModal } from '../permissions/RoleModal'
import { AssignUserRoleModal } from '../permissions/AssignUserRoleModal'
import { DirectUserPermissionsModal } from '../permissions/DirectUserPermissionsModal'
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal'
import { ConfirmModal } from '../ui/ConfirmModal'
import { Pagination } from '../ui/Pagination'
import { useUsers } from '../../hooks/useUsers'
import {
  useJobRoles,
  useJobRoleMutations,
  useUserJobRoles,
  useUserJobRoleMutations,
  usePermissionsDashboard,
  usePermissionMatrix,
  usePermissionMatrixMutations,
  useAuditLogs,
} from '../../hooks/usePermissions'

// خريطة لترجمة مسميات إجراءات سجل التدقيق إلى مسميات واضحة ومفهومة للعميل
const AUDIT_ACTION_MAP = {
  update_user_permission: 'تعديل صلاحية مستخدم',
  update_role_permission: 'تعديل صلاحيات الدور',
  create_job_role: 'إنشاء دور وظيفي',
  update_job_role: 'تعديل دور وظيفي',
  delete_job_role: 'حذف دور وظيفي',
  create_role: 'إنشاء دور وظيفي',
  update_role: 'تعديل دور وظيفي',
  delete_role: 'حذف دور وظيفي',
  assign_user_role: 'تعيين دور لمستخدم',
  update_user_role: 'تعديل تعيين الدور',
  delete_user_role: 'إلغاء تعيين الدور',
}

// خريطة مدمجة لترجمة رموز الصلاحيات إلى مسميات عربية صريحة
const SYSTEM_PERMISSION_LABELS = {
  // القضايا
  'cases.create': 'إضافة قضية جديدة',
  'cases.view_all': 'عرض كافة القضايا',
  'cases.view_assigned': 'عرض القضايا المعين عليها',
  'cases.edit': 'تعديل القضايا',
  'cases.delete': 'حذف القضايا',
  'cases.archive': 'أرشفة القضايا',
  'cases.export': 'تصدير بيانات القضايا',

  // الموكلون
  'clients.create': 'إضافة موكل جديد',
  'clients.view': 'عرض بيانات الموكلين',
  'clients.view_all': 'عرض كافة الموكلين',
  'clients.edit': 'تعديل بيانات الموكلين',
  'clients.delete': 'حذف الموكلين',

  // الجلسات
  'sessions.create': 'جدولة جلسة جديدة',
  'sessions.view': 'عرض الجلسات',
  'sessions.view_all': 'عرض كافة الجلسات',
  'sessions.edit': 'تعديل بيانات الجلسة',
  'sessions.delete': 'حذف الجلسة',

  // المهام
  'tasks.create': 'إنشاء مهمة عمل',
  'tasks.view': 'عرض المهام',
  'tasks.view_all': 'عرض كافة المهام',
  'tasks.edit': 'تعديل المهام',
  'tasks.delete': 'حذف المهام',

  // الفواتير والمالية
  'invoices.create': 'إنشاء فاتورة',
  'invoices.view': 'عرض الفواتير والمدفوعات',
  'invoices.view_all': 'عرض السجلات المالية الكاملة',
  'invoices.edit': 'تعديل الفواتير',
  'invoices.delete': 'حذف الفواتير',

  // المستندات
  'documents.upload': 'رفع المستندات والملفات',
  'documents.view': 'عرض المستندات',
  'documents.delete': 'حذف المستندات',

  // الإعدادات والمستخدمين
  'users.manage': 'إدارة المستخدمين',
  'roles.manage': 'إدارة الأدوار والصلاحيات',
  'settings.general': 'إدارة إعدادات النظام',
  'audit.view': 'الاطلاع على سجل العمليات',
}

function formatAuditAction(action) {
  if (!action) return '—'
  if (AUDIT_ACTION_MAP[action]) return AUDIT_ACTION_MAP[action]
  return action
    .replace(/^update_/, 'تعديل ')
    .replace(/^create_/, 'إنشاء ')
    .replace(/^delete_/, 'حذف ')
    .replace(/_/g, ' ')
}

function parseAuditValue(val) {
  if (val === null || val === undefined) return null
  if (typeof val === 'object') return val
  try {
    return JSON.parse(val)
  } catch {
    return val
  }
}

function toBoolean(v) {
  return v === true || v === 'true' || v === 1 || v === '1'
}

function renderAuditDiff(oldRaw, newRaw) {
  const oldVal = parseAuditValue(oldRaw)
  const newVal = parseAuditValue(newRaw)

  if (!oldVal && !newVal) return null

  // في حال تعديل حالة الصلاحية (is_allowed)
  if (
    oldVal &&
    typeof oldVal === 'object' &&
    newVal &&
    typeof newVal === 'object' &&
    ('is_allowed' in oldVal || 'is_allowed' in newVal)
  ) {
    const wasAllowed = toBoolean(oldVal.is_allowed)
    const isNowAllowed = toBoolean(newVal.is_allowed)

    if (wasAllowed !== isNowAllowed) {
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', fontSize: '0.78rem' }}>
          <span
            style={{
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              background: wasAllowed ? '#dcfce7' : '#fee2e2',
              color: wasAllowed ? '#15803d' : '#b91c1c',
              fontWeight: 600,
            }}
          >
            {wasAllowed ? 'مسموح' : 'غير مسموح'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>➔</span>
          <span
            style={{
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              background: isNowAllowed ? '#dcfce7' : '#fee2e2',
              color: isNowAllowed ? '#15803d' : '#b91c1c',
              fontWeight: 700,
            }}
          >
            {isNowAllowed ? 'مسموح' : 'غير مسموح'}
          </span>
        </div>
      )
    }

    return (
      <div style={{ marginTop: '0.35rem', fontSize: '0.78rem' }}>
        <span
          style={{
            padding: '0.15rem 0.45rem',
            borderRadius: '4px',
            background: isNowAllowed ? '#dcfce7' : '#fee2e2',
            color: isNowAllowed ? '#15803d' : '#b91c1c',
            fontWeight: 600,
          }}
        >
          الحالة الحالية: {isNowAllowed ? 'مسموح' : 'غير مسموح'}
        </span>
      </div>
    )
  }

  // في حال وجود حقول أخرى بصيغة كائن، عرضها بشكل مفهوم بدون صيغة JSON
  if (typeof oldVal === 'object' && typeof newVal === 'object') {
    const allKeys = Array.from(new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]))
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.35rem', fontSize: '0.75rem' }}>
        {allKeys.map((k) => (
          <div key={k} style={{ color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{k}: </span>
            <span>{String(oldVal?.[k] ?? '—')}</span>
            <span style={{ margin: '0 0.3rem' }}>➔</span>
            <span style={{ fontWeight: 600, color: 'var(--brand-teal)' }}>{String(newVal?.[k] ?? '—')}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
      من: {String(oldVal)} ➔ إلى: {String(newVal)}
    </div>
  )
}

export default function PermissionsPage() {
  // Tabs: 'roles' (Job Roles) | 'assignments' (User Job Roles) | 'matrix' (Matrix) | 'audit' (Audit Log)
  const [activeTab, setActiveTab] = useState('roles')
  const [searchQuery, setSearchQuery] = useState('')
  const [auditPage, setAuditPage] = useState(1)
  const [rolesPage, setRolesPage] = useState(1)
  const [userRolesPage, setUserRolesPage] = useState(1)

  // Real Queries
  const { dashboard, isLoading: dashLoading, isFetching: dashFetching, refetch: refetchDash } =
    usePermissionsDashboard()
  const { jobRoles, isLoading: rolesLoading, isFetching: rolesFetching, error: rolesError, refetch: refetchRoles } =
    useJobRoles()
  const { userJobRoles, isLoading: userRolesLoading, isFetching: userRolesFetching, error: userRolesError, refetch: refetchUserRoles } =
    useUserJobRoles()
  const { users, isLoading: usersLoading, refetch: refetchUsers } = useUsers()
  const { matrix, isLoading: matrixLoading, isFetching: matrixFetching, error: matrixError, refetch: refetchMatrix } =
    usePermissionMatrix()
  const { auditData, isLoading: auditLoading, isFetching: auditFetching, error: auditError, refetch: refetchAudit } =
    useAuditLogs({ page: auditPage })

  // Mutations
  const { create: createRoleMut, update: updateRoleMut, remove: removeRoleMut } = useJobRoleMutations()
  const { create: createUserRoleMut, update: updateUserRoleMut, remove: removeUserRoleMut } = useUserJobRoleMutations()
  const { toggleSingle: toggleSinglePermMut, bulkSave: bulkSavePermsMut } = usePermissionMatrixMutations()

  // Local Matrix edits state: { [roleId]: { [permissionId]: boolean } }
  const [localMatrix, setLocalMatrix] = useState({})
  const [hasUnsavedMatrix, setHasUnsavedMatrix] = useState(false)
  const [savingMatrix, setSavingMatrix] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Modals state
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [roleModalMode, setRoleModalMode] = useState('create')
  const [editingRole, setEditingRole] = useState(null)
  const [deletingRole, setDeletingRole] = useState(null)

  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignModalMode, setAssignModalMode] = useState('create')
  const [editingUserRole, setEditingUserRole] = useState(null)
  const [deletingUserRole, setDeletingUserRole] = useState(null)

  const [directPermsUser, setDirectPermsUser] = useState(null)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [submittingAction, setSubmittingAction] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, tone = 'success') => {
    setToast({ message, tone })
    setTimeout(() => setToast(null), 3500)
  }

  // خريطة لتجميع أسماء الصلاحيات بالعربية من المصفوفة والقاموس المدمج
  const permissionNamesMap = useMemo(() => {
    const map = { ...SYSTEM_PERMISSION_LABELS }
    if (matrix && matrix.permissions) {
      Object.values(matrix.permissions).forEach((list) => {
        list.forEach((p) => {
          if (p.key && p.name) {
            map[p.key] = p.name
          }
        })
      })
    }
    return map
  }, [matrix])

  // Initialize localMatrix from API matrix whenever matrix changes
  useEffect(() => {
    if (matrix && matrix.permissions) {
      const initial = {}
      const rolesList = matrix.roles || []
      rolesList.forEach((r) => {
        initial[r.id] = {}
      })
      Object.values(matrix.permissions).forEach((permList) => {
        permList.forEach((p) => {
          rolesList.forEach((r) => {
            const allowed = p.roles ? Boolean(p.roles[r.id]) : false
            if (!initial[r.id]) initial[r.id] = {}
            initial[r.id][p.id] = allowed
          })
        })
      })
      setLocalMatrix(initial)
      setHasUnsavedMatrix(false)
    }
  }, [matrix])

  // Refresh all data
  const handleRefreshAll = async () => {
    await Promise.all([
      refetchDash(),
      refetchRoles(),
      refetchUserRoles(),
      refetchUsers(),
      refetchMatrix(),
      refetchAudit(),
    ])
    showToast('تم تحديث كافة بيانات الأدوار والصلاحيات بنجاح')
  }

  // Handle matrix cell toggle locally
  const handleMatrixToggle = (roleId, permissionId) => {
    setLocalMatrix((prev) => {
      const current = prev[roleId]?.[permissionId] ?? false
      return {
        ...prev,
        [roleId]: {
          ...(prev[roleId] || {}),
          [permissionId]: !current,
        },
      }
    })
    setHasUnsavedMatrix(true)
    setSavedSuccess(false)
  }

  // Save Matrix changes via real bulk API per modified role
  const handleSaveMatrix = async () => {
    setSavingMatrix(true)
    try {
      const rolesList = matrix.roles || []
      const promises = rolesList.map(async (r) => {
        const permsForRole = localMatrix[r.id]
        if (!permsForRole) return
        const formatted = Object.entries(permsForRole).map(([pId, allowed]) => ({
          permission_id: Number(pId),
          is_allowed: Boolean(allowed),
        }))
        if (formatted.length > 0) {
          await bulkSavePermsMut.mutateAsync({
            roleId: r.id,
            permissions: formatted,
          })
        }
      })
      await Promise.all(promises)
      await refetchMatrix()
      setHasUnsavedMatrix(false)
      setSavedSuccess(true)
      showToast('تم حفظ وتطبيق مصفوفة الصلاحيات بنجاح على الخادم')
      setTimeout(() => setSavedSuccess(false), 3500)
    } catch (err) {
      showToast(err?.message || 'تعذر حفظ تعديلات مصفوفة الصلاحيات', 'error')
    } finally {
      setSavingMatrix(false)
    }
  }

  // Reset matrix edits back to API state
  const handleResetMatrix = () => {
    refetchMatrix()
    setHasUnsavedMatrix(false)
    showToast('تمت استعادة الإعدادات السابقة للمصفوفة من الخادم')
  }

  // Add / Edit Job Role Submit
  const handleSaveRole = async (roleData) => {
    setSubmittingAction(true)
    try {
      if (roleModalMode === 'edit' && editingRole) {
        await updateRoleMut.mutateAsync({
          id: editingRole.id,
          data: roleData,
        })
        showToast(`تم تحديث بيانات دور «${roleData.name}» بنجاح`)
      } else {
        await createRoleMut.mutateAsync(roleData)
        showToast(`تمت إضافة الدور الوظيفي الجديد «${roleData.name}» للنظام`)
      }
      setRoleModalOpen(false)
      setEditingRole(null)
    } catch (err) {
      showToast(err?.message || 'تعذر حفظ الدور الوظيفي', 'error')
    } finally {
      setSubmittingAction(false)
    }
  }

  // Delete Job Role Confirm
  const handleDeleteRoleConfirm = async () => {
    if (!deletingRole) return
    setSubmittingAction(true)
    try {
      await removeRoleMut.mutateAsync(deletingRole.id)
      showToast(`تم حذف الدور الوظيفي «${deletingRole.name}» بنجاح`)
      setDeletingRole(null)
    } catch (err) {
      showToast(err?.message || 'تعذر حذف الدور الوظيفي', 'error')
    } finally {
      setSubmittingAction(false)
    }
  }

  // Assign / Edit User Job Role Submit
  const handleSaveUserRole = async ({ id, user_id, job_role_id, application_scope }) => {
    setSubmittingAction(true)
    try {
      if (assignModalMode === 'edit' && id) {
        await updateUserRoleMut.mutateAsync({
          id,
          data: { job_role_id, application_scope },
        })
        showToast('تم تحديث تعيين الدور للمستخدم بنجاح')
      } else {
        await createUserRoleMut.mutateAsync({
          user_id,
          job_role_id,
          application_scope,
        })
        showToast('تم تعيين الدور الوظيفي للمستخدم بنجاح')
      }
      setAssignModalOpen(false)
      setEditingUserRole(null)
    } catch (err) {
      showToast(err?.message || 'تعذر تعيين الدور للمستخدم', 'error')
    } finally {
      setSubmittingAction(false)
    }
  }

  // Delete / Unassign User Job Role Confirm
  const handleDeleteUserRoleConfirm = async () => {
    if (!deletingUserRole) return
    setSubmittingAction(true)
    try {
      await removeUserRoleMut.mutateAsync(deletingUserRole.id)
      showToast('تم إلغاء تعيين الدور الوظيفي عن المستخدم بنجاح')
      setDeletingUserRole(null)
    } catch (err) {
      showToast(err?.message || 'تعذر إلغاء تعيين الدور', 'error')
    } finally {
      setSubmittingAction(false)
    }
  }

  // Filter Job Roles
  const filteredRoles = useMemo(() => {
    return jobRoles.filter((r) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        r.name?.toLowerCase().includes(q) ||
        r.english_title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.access_level?.toLowerCase().includes(q)
      )
    })
  }, [jobRoles, searchQuery])

  // Filter User Job Roles
  const filteredUserRoles = useMemo(() => {
    return userJobRoles.filter((ur) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const userName = ur.user?.name || ur.user?.full_name || ''
      const userEmail = ur.user?.email || ''
      const roleName = ur.job_role?.name || ''
      return (
        userName.toLowerCase().includes(q) ||
        userEmail.toLowerCase().includes(q) ||
        roleName.toLowerCase().includes(q) ||
        ur.application_scope?.toLowerCase().includes(q)
      )
    })
  }, [userJobRoles, searchQuery])

  // Pagination for Job Roles (10 per page)
  const rolesPerPage = 10
  const paginatedRoles = useMemo(() => {
    const start = (rolesPage - 1) * rolesPerPage
    return filteredRoles.slice(start, start + rolesPerPage)
  }, [filteredRoles, rolesPage])

  // Pagination for User Roles (10 per page)
  const userRolesPerPage = 10
  const paginatedUserRoles = useMemo(() => {
    const start = (userRolesPage - 1) * userRolesPerPage
    return filteredUserRoles.slice(start, start + userRolesPerPage)
  }, [filteredUserRoles, userRolesPage])

  const isBusy =
    dashFetching ||
    rolesFetching ||
    userRolesFetching ||
    matrixFetching ||
    auditFetching ||
    savingMatrix ||
    submittingAction

  return (
    <div className="mgmt-page">
      {/* ── رأس الصفحة (Top Bar) ── */}
      <header className="mgmt-topbar">
        <div className="mgmt-topbar__title-wrap">
          <div className="mgmt-topbar__icon">
            <Icon name="shield" size={24} />
          </div>
          <div>
            <h1 className="mgmt-topbar__title">إدارة الصلاحيات والأدوار</h1>
            <p className="mgmt-topbar__subtitle">
              إدارة الأدوار الوظيفية، تعيين الصلاحيات للمستخدمين، والتحكم في مصفوفة الوصول القضائي
            </p>
          </div>
        </div>

        <div className="mgmt-topbar__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setRoleModalMode('create')
              setEditingRole(null)
              setRoleModalOpen(true)
            }}
          >
            <Icon name="plus" size={16} />
            <span>إضافة دور جديد</span>
          </button>

          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setAssignModalMode('create')
              setEditingUserRole(null)
              setAssignModalOpen(true)
            }}
          >
            <Icon name="key" size={16} />
            <span>تعيين دور لمستخدم</span>
          </button>

          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleRefreshAll}
            disabled={isBusy}
            title="تحديث البيانات من الخادم"
          >
            <Icon name="refresh" size={16} className={isBusy ? 'animate-spin' : undefined} />
            <span>تحديث</span>
          </button>
        </div>
      </header>

      {/* ── Toast Alert ── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.75rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            background: toast.tone === 'error' ? '#fef2f2' : '#ecfdf5',
            color: toast.tone === 'error' ? '#991b1b' : '#065f46',
            border: `1px solid ${toast.tone === 'error' ? '#fecaca' : '#a7f3d0'}`,
            fontSize: '0.88rem',
            fontWeight: 700,
          }}
        >
          <Icon name={toast.tone === 'error' ? 'alert' : 'check'} size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── بطاقات الإحصائيات الأربع (Stats Grid من API الـ Dashboard) ── */}
      <section className="stats-grid" aria-label="إحصائيات الصلاحيات">
        <StatCard
          value={dashLoading ? '...' : dashboard?.total_roles ?? jobRoles.length}
          label="إجمالي أدوار النظام"
          tone="gold"
          icon="shield"
          index={0}
        />
        <StatCard
          value={dashLoading ? '...' : dashboard?.users_with_roles ?? userJobRoles.length}
          label="مستخدمين بأدوار وظيفية"
          tone="teal"
          icon="users"
          index={1}
        />
        <StatCard
          value={dashLoading ? '...' : dashboard?.total_permissions ?? 8}
          label="إجمالي صلاحيات النظام"
          tone="muted"
          icon="check"
          index={2}
        />
        <StatCard
          value={dashLoading ? '...' : dashboard?.users_with_permissions ?? 0}
          label="صلاحيات مستخدمين مباشرة"
          tone="success"
          icon="clock"
          index={3}
        />
      </section>

      {/* ── شريط التبويبات الرئيسي ── */}
      <section className="mgmt-table-card" aria-label="قسم إدارة الصلاحيات">
        <div className="mgmt-tabs-row">
          <div className="mgmt-tabs">
            <button
              type="button"
              className={`mgmt-tab-btn ${activeTab === 'roles' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('roles')}
            >
              كافة الأدوار الوظيفية ({jobRoles.length})
            </button>
            <button
              type="button"
              className={`mgmt-tab-btn ${activeTab === 'assignments' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('assignments')}
            >
              تعيينات أدوار المستخدمين ({userJobRoles.length})
            </button>
            <button
              type="button"
              className={`mgmt-tab-btn ${activeTab === 'matrix' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('matrix')}
            >
              مصفوفة الصلاحيات المباشرة
            </button>
            <button
              type="button"
              className={`mgmt-tab-btn ${activeTab === 'audit' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              سجل العمليات والتدقيق
            </button>
          </div>

          {(activeTab === 'roles' || activeTab === 'assignments') && (
            <div style={{ position: 'relative', width: '260px' }}>
              <span
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              >
                <Icon name="search" size={16} />
              </span>
              <input
                type="text"
                placeholder={
                  activeTab === 'roles'
                    ? 'بحث في الأدوار الوظيفية...'
                    : 'بحث في تعيينات المستخدمين...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 2.2rem 0 0.75rem',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  outline: 'none',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                }}
              />
            </div>
          )}
        </div>

        {/* ── 1. تبويب الأدوار الوظيفية (Job Roles) ── */}
        {activeTab === 'roles' && (
          <div>
            {rolesError ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
                <p>{rolesError}</p>
                <button type="button" className="btn btn--ghost" onClick={() => refetchRoles()}>
                  إعادة المحاولة
                </button>
              </div>
            ) : rolesLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Icon name="refresh" size={28} className="animate-spin" />
                <p style={{ marginTop: '0.75rem' }}>جاري تحميل الأدوار الوظيفية من الخادم...</p>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Icon name="shield" size={36} />
                <p style={{ marginTop: '0.5rem', fontWeight: 700 }}>لا توجد أدوار وظيفية مسجلة</p>
                <button
                  type="button"
                  className="btn btn--primary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => {
                    setRoleModalMode('create')
                    setEditingRole(null)
                    setRoleModalOpen(true)
                  }}
                >
                  إضافة دور وظيفي جديد
                </button>
              </div>
            ) : (
              <div className="mgmt-table-wrap">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>اسم الدور الوظيفي</th>
                      <th style={{ width: '40%' }}>نطاق الوصف والمهام</th>
                      <th style={{ width: '18%' }}>مستوى الوصول</th>
                      <th style={{ width: '10%' }}>الحالة</th>
                      <th style={{ width: '7%', textAlign: 'center' }}>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRoles.map((role) => (
                      <tr key={role.id}>
                        {/* اسم الدور */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--bg)',
                                border: '1px solid var(--border)',
                                display: 'grid',
                                placeItems: 'center',
                                color: 'var(--brand-teal)',
                                flexShrink: 0,
                              }}
                            >
                              <Icon name="shield" size={18} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: 'var(--text-h)' }}>
                                {role.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* نطاق الوصف */}
                        <td>
                          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.6 }}>
                            {role.description || '—'}
                          </p>
                        </td>

                        {/* مستوى الوصول */}
                        <td>
                          <span
                            className="mgmt-role-tag"
                            style={{
                              background: 'var(--bg)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-h)',
                              padding: '0.25rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                            }}
                          >
                            {role.access_level || 'وصول مخصص ومقيد'}
                          </span>
                        </td>

                        {/* الحالة */}
                        <td>
                          <span
                            className="mgmt-status-dot"
                            style={{
                              color: role.status === 'نشط' ? 'var(--success)' : 'var(--text-muted)',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                            }}
                          >
                            ● {role.status || 'نشط'}
                          </span>
                        </td>

                        {/* الإجراءات */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                            <button
                              type="button"
                              className="action-btn action-btn--edit"
                              title="تعديل الدور"
                              onClick={() => {
                                setEditingRole(role)
                                setRoleModalMode('edit')
                                setRoleModalOpen(true)
                              }}
                            >
                              <Icon name="edit" size={14} />
                            </button>
                            <button
                              type="button"
                              className="action-btn action-btn--delete"
                              title="حذف الدور"
                              onClick={() => setDeletingRole(role)}
                            >
                              <Icon name="trash" size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              page={rolesPage}
              total={filteredRoles.length}
              perPage={rolesPerPage}
              onChange={setRolesPage}
            />

            <footer className="mgmt-table-card__footer">
              <div>عرض {filteredRoles.length} من أصل {jobRoles.length} أدوار مسجلة</div>
              <div style={{ color: 'var(--success)', fontWeight: 600 }}>
                متصل بخادم الأدوار الوظيفية
              </div>
            </footer>
          </div>
        )}

        {/* ── 2. تبويب تعيينات أدوار المستخدمين (User Job Roles) ── */}
        {activeTab === 'assignments' && (
          <div>
            {userRolesError ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
                <p>{userRolesError}</p>
                <button type="button" className="btn btn--ghost" onClick={() => refetchUserRoles()}>
                  إعادة المحاولة
                </button>
              </div>
            ) : userRolesLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Icon name="refresh" size={28} className="animate-spin" />
                <p style={{ marginTop: '0.75rem' }}>جاري تحميل تعيينات الأدوار للمستخدمين...</p>
              </div>
            ) : filteredUserRoles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Icon name="users" size={36} />
                <p style={{ marginTop: '0.5rem', fontWeight: 700 }}>لا توجد تعيينات أدوار للمستخدمين</p>
                <button
                  type="button"
                  className="btn btn--primary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => {
                    setAssignModalMode('create')
                    setEditingUserRole(null)
                    setAssignModalOpen(true)
                  }}
                >
                  تعيين دور وظيفي لمستخدم
                </button>
              </div>
            ) : (
              <div className="mgmt-table-wrap">
                <table className="mgmt-table">
                  <thead>
                    <tr>
                      <th style={{ width: '28%' }}>المستخدم</th>
                      <th style={{ width: '22%' }}>الدور الوظيفي المسند</th>
                      <th style={{ width: '22%' }}>نطاق التطبيق</th>
                      <th style={{ width: '15%' }}>تاريخ التعيين</th>
                      <th style={{ width: '13%', textAlign: 'center' }}>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUserRoles.map((ur) => {
                      const userObj = ur.user || {}
                      const roleObj = ur.job_role || {}
                      return (
                        <tr key={ur.id}>
                          {/* المستخدم */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '50%',
                                  background: 'var(--brand-teal)',
                                  color: '#fff',
                                  display: 'grid',
                                  placeItems: 'center',
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                }}
                              >
                                {(userObj.full_name || userObj.name || 'م')[0]}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: 'var(--text-h)' }}>
                                  {userObj.full_name || userObj.name || `مستخدم #${ur.user_id}`}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                  {userObj.email || '—'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* الدور الوظيفي */}
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(30, 58, 60, 0.08)',
                                color: 'var(--brand-teal)',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                              }}
                            >
                              <Icon name="shield" size={14} />
                              {roleObj.name || `دور #${ur.job_role_id}`}
                            </span>
                          </td>

                          {/* نطاق التطبيق */}
                          <td>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text)' }}>
                              {ur.application_scope || 'وصول مخصص ومقيد'}
                            </span>
                          </td>

                          {/* تاريخ التعيين */}
                          <td>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {ur.created_at ? new Date(ur.created_at).toLocaleDateString('ar-EG') : '—'}
                            </span>
                          </td>

                          {/* الإجراءات */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                              <button
                                type="button"
                                className="action-btn action-btn--edit"
                                title="تعديل تعيين الدور"
                                onClick={() => {
                                  setEditingUserRole(ur)
                                  setAssignModalMode('edit')
                                  setAssignModalOpen(true)
                                }}
                              >
                                <Icon name="edit" size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn--ghost"
                                title="الصلاحيات المباشرة لهذا المستخدم"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => setDirectPermsUser(userObj.id ? userObj : { id: ur.user_id, name: userObj.full_name || userObj.name })}
                              >
                                <Icon name="key" size={13} />
                                <span>صلاحيات</span>
                              </button>
                              <button
                                type="button"
                                className="action-btn action-btn--delete"
                                title="إلغاء التعيين"
                                onClick={() => setDeletingUserRole(ur)}
                              >
                                <Icon name="trash" size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              page={userRolesPage}
              total={filteredUserRoles.length}
              perPage={userRolesPerPage}
              onChange={setUserRolesPage}
            />

            <footer className="mgmt-table-card__footer">
              <div>عرض {filteredUserRoles.length} من أصل {userJobRoles.length} تعيينات مسجلة</div>
              <div style={{ color: 'var(--brand-teal)', fontWeight: 600 }}>
                تحديث فوري لصلاحيات المستخدمين في النظام
              </div>
            </footer>
          </div>
        )}

        {/* ── 3. تبويب مصفوفة الصلاحيات (Permission Matrix) ── */}
        {activeTab === 'matrix' && (
          <div style={{ padding: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-h)' }}>
                  مصفوفة الصلاحيات المباشرة حسب الأدوار والأقسام
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  قم بتعديل الصلاحيات الممنوحة لكل دور وظيفي ثم اضغط حفظ التعديلات لتطبيقها
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {hasUnsavedMatrix && (
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--warning)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    ● توجد تعديلات غير محفوظة
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleSaveMatrix}
                  disabled={savingMatrix || !hasUnsavedMatrix}
                >
                  <Icon name={savingMatrix ? 'refresh' : 'check'} size={16} className={savingMatrix ? 'animate-spin' : undefined} />
                  <span>{savingMatrix ? 'جاري الحفظ...' : 'حفظ تعديلات الصلاحيات'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setConfirmResetOpen(true)}
                  disabled={savingMatrix || !hasUnsavedMatrix}
                >
                  إلغاء التغييرات
                </button>
              </div>
            </div>

            {savedSuccess && (
              <div
                style={{
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Icon name="check" size={18} />
                <span>تم حفظ تعديلات مصفوفة الصلاحيات وتطبيقها فورياً على الخادم</span>
              </div>
            )}

            {matrixError ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
                <p>{matrixError}</p>
                <button type="button" className="btn btn--ghost" onClick={() => refetchMatrix()}>
                  إعادة المحاولة
                </button>
              </div>
            ) : matrixLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Icon name="refresh" size={28} className="animate-spin" />
                <p style={{ marginTop: '0.75rem' }}>جاري تحميل مصفوفة الصلاحيات...</p>
              </div>
            ) : !matrix.roles || matrix.roles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                لا توجد أدوار وظيفية مسجلة لعرض المصفوفة
              </div>
            ) : (
              <div className="mgmt-table-wrap">
                <table className="perm-matrix-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>القسم / الإجراء القانوني</th>
                      {(matrix.roles || []).map((role) => (
                        <th key={role.id} style={{ textAlign: 'center' }}>
                          <div>{role.name}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  {Object.entries(matrix.permissions || {}).map(([sectionName, permList]) => (
                    <tbody key={sectionName}>
                      <tr className="perm-section-head">
                        <td colSpan={1 + (matrix.roles || []).length}>{sectionName}</td>
                      </tr>
                      {permList.map((perm) => (
                        <tr key={perm.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-h)' }}>{perm.name}</div>
                          </td>
                          {(matrix.roles || []).map((role) => {
                            const isChecked = Boolean(localMatrix[role.id]?.[perm.id])
                            return (
                              <td key={role.id} style={{ textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  className="perm-checkbox"
                                  checked={isChecked}
                                  onChange={() => handleMatrixToggle(role.id, perm.id)}
                                  aria-label={`${perm.name} - ${role.name}`}
                                />
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 4. تبويب سجل العمليات والتدقيق ── */}
        {activeTab === 'audit' && (
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-h)' }}>
                  سجل التعديلات الأمنية والوصول
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  سجل مدقق لكل التغييرات التي تمت على الأدوار والصلاحيات
                </p>
              </div>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => refetchAudit()}
                disabled={auditFetching || auditLoading}
              >
                <Icon name="refresh" size={14} className={auditFetching ? 'animate-spin' : undefined} />
                تحديث السجل
              </button>
            </div>

            {auditError ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
                <p>{auditError}</p>
                <button type="button" className="btn btn--ghost" onClick={() => refetchAudit()}>
                  إعادة المحاولة
                </button>
              </div>
            ) : auditLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Icon name="refresh" size={28} className="animate-spin" />
                <p style={{ marginTop: '0.75rem' }}>جاري تحميل سجل العمليات والتدقيق...</p>
              </div>
            ) : !auditData.data || auditData.data.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Icon name="clock" size={36} />
                <p style={{ marginTop: '0.5rem', fontWeight: 700 }}>لا توجد عمليات مسجلة في سجل التدقيق حتى الآن</p>
              </div>
            ) : (
              <div>
                <div className="mgmt-table-wrap">
                  <table className="mgmt-table">
                    <thead>
                      <tr>
                        <th style={{ width: '18%' }}>التاريخ والوقت</th>
                        <th style={{ width: '18%' }}>نوع الإجراء</th>
                        <th style={{ width: '18%' }}>الجهة المستهدفة</th>
                        <th style={{ width: '22%' }}>الصلاحية المتأثرة</th>
                        <th style={{ width: '24%' }}>الوصف والتفاصيل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditData.data.map((log) => {
                        const permDisplayName =
                          permissionNamesMap[log.permission_key] ||
                          (log.permission_key ? log.permission_key.replace(/\./g, ' › ') : '—')

                        let targetContent = null
                        if (log.target_type === 'user') {
                          const targetUser = (users || []).find((u) => Number(u.id) === Number(log.target_id))
                          const userName = targetUser?.name || targetUser?.full_name
                          targetContent = (
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: '0.84rem' }}>
                                {userName || `مستخدم رقم #${log.target_id}`}
                              </div>
                              {userName && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  مستخدم #{log.target_id}
                                </div>
                              )}
                            </div>
                          )
                        } else if (log.target_type === 'role') {
                          const targetRole = (jobRoles || []).find((r) => Number(r.id) === Number(log.target_id))
                          targetContent = (
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: '0.84rem' }}>
                                {targetRole?.name || `دور رقم #${log.target_id}`}
                              </div>
                              {targetRole?.name && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  دور وظيفي #{log.target_id}
                                </div>
                              )}
                            </div>
                          )
                        } else {
                          targetContent = (
                            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                              {log.target_type} #{log.target_id}
                            </span>
                          )
                        }

                        return (
                          <tr key={log.id}>
                            <td>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {log.created_at ? new Date(log.created_at).toLocaleString('ar-EG') : '—'}
                              </span>
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: '6px',
                                  background: 'var(--bg, #f1f5f9)',
                                  color: 'var(--brand-teal)',
                                  border: '1px solid var(--border, #e2e8f0)',
                                  display: 'inline-block',
                                }}
                              >
                                {formatAuditAction(log.action)}
                              </span>
                            </td>
                            <td>{targetContent}</td>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-h)' }}>
                                {permDisplayName}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500 }}>
                                {log.description || '—'}
                              </div>
                              {renderAuditDiff(log.old_values, log.new_values)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={auditData.current_page}
                  totalPages={auditData.last_page}
                  total={auditData.total}
                  perPage={auditData.per_page || 10}
                  onChange={(page) => setAuditPage(page)}
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Modal إضافة / تعديل دور وظيفي ── */}
      <RoleModal
        open={roleModalOpen}
        mode={roleModalMode}
        initialValues={editingRole}
        onClose={() => {
          setRoleModalOpen(false)
          setEditingRole(null)
        }}
        onSave={handleSaveRole}
        submitting={submittingAction}
      />

      {/* ── Modal تعيين دور وظيفي لمستخدم ── */}
      <AssignUserRoleModal
        open={assignModalOpen}
        mode={assignModalMode}
        initialValues={editingUserRole}
        users={users || []}
        jobRoles={jobRoles || []}
        onClose={() => {
          setAssignModalOpen(false)
          setEditingUserRole(null)
        }}
        onAssign={handleSaveUserRole}
        submitting={submittingAction}
      />

      {/* ── Modal إدارة الصلاحيات المباشرة لمستخدم ── */}
      <DirectUserPermissionsModal
        open={Boolean(directPermsUser)}
        user={directPermsUser}
        onClose={() => setDirectPermsUser(null)}
      />

      {/* ── Modal تأكيد حذف الدور الوظيفي ── */}
      <ConfirmDeleteModal
        open={Boolean(deletingRole)}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleDeleteRoleConfirm}
        title="تأكيد حذف الدور الوظيفي"
        itemName={deletingRole?.name}
        confirmText="تأكيد الحذف النهائي"
      />

      {/* ── Modal تأكيد إلغاء تعيين الدور للمستخدم ── */}
      <ConfirmDeleteModal
        open={Boolean(deletingUserRole)}
        onClose={() => setDeletingUserRole(null)}
        onConfirm={handleDeleteUserRoleConfirm}
        title="تأكيد إلغاء تعيين الدور"
        itemName={deletingUserRole?.user?.name || deletingUserRole?.user?.full_name || `المستخدم #${deletingUserRole?.user_id}`}
        confirmText="تأكيد إلغاء التعيين"
      />

      {/* ── Modal تأكيد إلغاء تغييرات مصفوفة الصلاحيات ── */}
      <ConfirmModal
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={() => {
          setConfirmResetOpen(false)
          handleResetMatrix()
        }}
        title="تأكيد إلغاء التغييرات"
        message="هل أنت متأكد من رغبتك في إلغاء التعديلات واستعادة الصلاحيات السابقة من الخادم؟"
        confirmText="استعادة الافتراضي"
        cancelText="الرجوع"
        variant="warning"
        icon="alert"
      />

      {/* ── تذييل حالة الاتصال بالنظام ── */}
      <div className="mgmt-system-status">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--success)', fontWeight: 700 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
          <span>متصل بنظام إدارة الصلاحيات والأدوار</span>
        </div>
        <div>نظام إدارة المكاتب العدلية والقانونية — مكتب الدوسري</div>
      </div>
    </div>
  )
}
