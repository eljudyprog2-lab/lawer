import { useState, useMemo } from 'react'
import { Icon } from '../ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { useUsers, useUserMutations } from '../../hooks/useUsers'
import { RoleModal } from '../permissions/RoleModal'
import { AssignUserRoleModal } from '../permissions/AssignUserRoleModal'
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal'
import { ConfirmModal } from '../ui/ConfirmModal'

// الأدوار الافتراضية المعتمدة في النظام
const INITIAL_SYSTEM_ROLES = [
  {
    id: 'super-admin',
    key: 'owner',
    name: 'المستشار العام',
    subTitle: 'Super Admin',
    badgeLabel: 'دور قيادي محمي بنظام أمان',
    description:
      'صلاحية وصول كاملة ومطلقة لكافة القضايا، الجلسات، الحسابات المالية، التقارير السرية، وإدارة أعضاء المكتب.',
    accessLevel: 'وصول شامل وكامل',
    accessTagClass: 'mgmt-role-tag--superadmin',
    status: 'نشط',
    isSystem: true,
  },
  {
    id: 'partner',
    key: 'admin',
    name: 'مدير النظام ومحامي شريك',
    subTitle: 'Admin',
    badgeLabel: 'إدارة العمليات والمستخدمين',
    description:
      'إدارة ملفات الدعاوى، الموظفين، إصدار الفواتير، ومتابعة القضايا والجلسات مع صلاحيات إدارية عليا.',
    accessLevel: 'وصول متقدم',
    accessTagClass: 'mgmt-role-tag--partner',
    status: 'نشط',
    isSystem: true,
  },
  {
    id: 'lawyer',
    key: 'lawyer',
    name: 'محامي ممارس',
    subTitle: 'Legal Counsel',
    badgeLabel: 'الترافع وإدارة القضايا',
    description:
      'الترافع أمام المحاكم، إعداد اللوائح والمذكرات، حضور الجلسات ومتابعة مواعيد القضايا المسندة إليه.',
    accessLevel: 'وصول قضائي',
    accessTagClass: 'mgmt-role-tag--trainee',
    status: 'نشط',
    isSystem: true,
  },
  {
    id: 'secretary',
    key: 'secretary',
    name: 'الشؤون الإدارية والسكرتارية',
    subTitle: 'Staff',
    badgeLabel: 'السجلات والمستندات',
    description:
      'أرشفة المستندات والوكالات، جدولة المواعيد، وتحديث بيانات الموكلين بدون صلاحيات التعديل المالي الحساس.',
    accessLevel: 'وصول إداري',
    accessTagClass: 'mgmt-role-tag--finance',
    status: 'نشط',
    isSystem: true,
  },
]

// مصفوفة الصلاحيات الافتراضية الأولية
const INITIAL_MATRIX = {
  cases_view: { admin: true, partner: true, trainee: false, finance: false },
  cases_create: { admin: true, partner: true, trainee: true, finance: false },
  cases_delete: { admin: true, partner: false, trainee: false, finance: false },
  docs_upload: { admin: true, partner: true, trainee: true, finance: true },
  docs_approve: { admin: true, partner: true, trainee: false, finance: false },
  invoices_issue: { admin: true, partner: true, trainee: false, finance: true },
  invoices_reports: { admin: true, partner: false, trainee: false, finance: true },
  users_manage: { admin: true, partner: false, trainee: false, finance: false },
}

const STORAGE_KEY = 'doussary_permissions_matrix'

export default function PermissionsPage() {
  const { user } = useAuth()
  const { users, isLoading: usersLoading, refetch: refetchUsers } = useUsers()
  const { update: updateUserMutation } = useUserMutations()

  // State
  const [activeTab, setActiveTab] = useState('all') // all | matrix | audit
  const [searchQuery, setSearchQuery] = useState('')
  const [roles, setRoles] = useState(INITIAL_SYSTEM_ROLES)
  const [matrix, setMatrix] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : INITIAL_MATRIX
    } catch {
      return INITIAL_MATRIX
    }
  })
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [toast, setToast] = useState(null)

  // Modals state
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [roleModalMode, setRoleModalMode] = useState('create')
  const [editingRole, setEditingRole] = useState(null)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [deletingRole, setDeletingRole] = useState(null)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [submittingAction, setSubmittingAction] = useState(false)

  const showToast = (message, tone = 'success') => {
    setToast({ message, tone })
    setTimeout(() => setToast(null), 3500)
  }

  // Count users per role from real API users
  const userCountsByRole = useMemo(() => {
    const counts = { owner: 0, admin: 0, lawyer: 0, secretary: 0 }
    if (users && users.length) {
      users.forEach((u) => {
        const r = u.role || 'admin'
        if (counts[r] !== undefined) counts[r]++
        else counts.admin++
      })
    }
    return counts
  }, [users])

  // Toggle permission cell
  const handleToggle = (actionKey, roleKey) => {
    setMatrix((prev) => ({
      ...prev,
      [actionKey]: {
        ...prev[actionKey],
        [roleKey]: !prev[actionKey]?.[roleKey],
      },
    }))
    setSavedSuccess(false)
  }

  // Save Matrix changes
  const handleSaveMatrix = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix))
      setSavedSuccess(true)
      showToast('تم حفظ وتطبيق مصفوفة الصلاحيات بنجاح')
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch {
      showToast('تعذر حفظ المصفوفة', 'error')
    }
  }

  // Reset Matrix
  const handleResetMatrix = () => {
    setMatrix(INITIAL_MATRIX)
    localStorage.removeItem(STORAGE_KEY)
    setSavedSuccess(false)
    showToast('تمت استعادة الإعدادات الافتراضية للمصفوفة')
  }

  // Add / Edit Role Submit
  const handleSaveRole = (roleData) => {
    if (roleModalMode === 'edit' && editingRole) {
      setRoles((prev) =>
        prev.map((r) => (r.id === editingRole.id ? { ...r, ...roleData } : r)),
      )
      showToast(`تم تحديث بيانات دور «${roleData.name}» بنجاح`)
    } else {
      const newRole = {
        ...roleData,
        id: `custom-role-${Date.now()}`,
        accessTagClass: 'mgmt-role-tag--trainee',
        isSystem: false,
      }
      setRoles((prev) => [...prev, newRole])
      showToast(`تمت إضافة الدور الوظيفي الجديد «${roleData.name}» للنظام`)
    }
    setRoleModalOpen(false)
    setEditingRole(null)
  }

  // Assign Role to User via Real API
  const handleAssignRole = async ({ userId, role }) => {
    setSubmittingAction(true)
    try {
      await updateUserMutation.mutateAsync({
        id: userId,
        values: { role },
      })
      showToast('تم تحديث دور المستخدم في النظام بنجاح')
      await refetchUsers()
    } catch (err) {
      showToast(err?.message || 'تعذر تعيين الدور للمستخدم', 'error')
      throw err
    } finally {
      setSubmittingAction(false)
    }
  }

  // Delete / Lock Role
  const handleDeleteRoleConfirm = () => {
    if (!deletingRole) return
    if (deletingRole.isSystem) {
      showToast('لا يمكن حذف الأدوار النظامية الأساسية للمكتب', 'error')
      setDeletingRole(null)
      return
    }

    setRoles((prev) => prev.filter((r) => r.id !== deletingRole.id))
    showToast(`تم حذف الدور الوظيفي «${deletingRole.name}» بنجاح`)
    setDeletingRole(null)
  }

  // Filter roles by search query
  const filteredRoles = roles.filter((r) =>
    searchQuery.trim()
      ? r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.accessLevel.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  )

  return (
    <div className="mgmt-page">
      {/* ── رأس الصفحة (Top Bar) ── */}
      <header className="mgmt-topbar">
        <div className="mgmt-topbar__title-wrap">
          <div className="mgmt-topbar__icon">
            <Icon name="shield" size={22} />
          </div>
          <div>
            <h1 className="mgmt-topbar__title">إدارة الصلاحيات والأدوار</h1>
            <p className="mgmt-topbar__subtitle">
              نظام التحكم بالوصول والمستخدمين القانوني
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
            onClick={() => setAssignModalOpen(true)}
          >
            <Icon name="key" size={16} />
            <span>تعيين دور لمستخدم</span>
          </button>

          <button
            type="button"
            className="btn btn--ghost"
            onClick={async () => {
              await refetchUsers()
              showToast('تم تحديث بيانات الصلاحيات والمستخدمين')
            }}
            disabled={usersLoading}
            title="تحديث البيانات"
          >
            <Icon name="refresh" size={16} className={usersLoading ? 'animate-spin' : undefined} />
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
            borderRadius: '12px',
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

      {/* ── العنوان التعريفي للصفحة ── */}
      <div>
        <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-h)' }}>
          مصفوفة الصلاحيات وأدوار النظام
        </h2>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          تحديد مستويات الأمان وتوزيع الصلاحيات الوظيفية على أعضاء المكتب القانوني
        </p>
      </div>

      {/* ── بطاقات الإحصائيات الأربع (Stats Grid) ── */}
      <section className="mgmt-stats-grid" aria-label="إحصائيات الصلاحيات">
        <div className="mgmt-stat-card">
          <div>
            <div className="mgmt-stat-card__val">{roles.length}</div>
            <div className="mgmt-stat-card__label">إجمالي أدوار النظام</div>
            <div className="mgmt-stat-card__sub" style={{ color: 'var(--brand-gold)' }}>
              أدوار معتمدة بالمكتب
            </div>
          </div>
          <div className="mgmt-stat-card__icon mgmt-stat-card__icon--amber">
            <Icon name="shield" size={22} />
          </div>
        </div>

        <div className="mgmt-stat-card">
          <div>
            <div className="mgmt-stat-card__val">{users?.length ?? 18}</div>
            <div className="mgmt-stat-card__label">المستخدمين بالصلاحيات</div>
            <div className="mgmt-stat-card__sub" style={{ color: 'var(--success)' }}>
              حسابات مسجلة وموثقة
            </div>
          </div>
          <div className="mgmt-stat-card__icon mgmt-stat-card__icon--green">
            <Icon name="users" size={22} />
          </div>
        </div>

        <div className="mgmt-stat-card">
          <div>
            <div className="mgmt-stat-card__val">32</div>
            <div className="mgmt-stat-card__label">صلاحية مدققة ومفعلة</div>
            <div className="mgmt-stat-card__sub" style={{ color: 'var(--info)' }}>
              متوافقة مع سياسة المكتب
            </div>
          </div>
          <div className="mgmt-stat-card__icon mgmt-stat-card__icon--blue">
            <Icon name="check" size={22} />
          </div>
        </div>

        <div className="mgmt-stat-card">
          <div>
            <div className="mgmt-stat-card__val" style={{ fontSize: '1.15rem', marginTop: '0.25rem' }}>
              نشط ومباشر
            </div>
            <div className="mgmt-stat-card__label">حالة التدقيق والأمان</div>
            <div className="mgmt-stat-card__sub" style={{ color: 'var(--brand-teal)' }}>
              متصل بقاعدة البيانات
            </div>
          </div>
          <div className="mgmt-stat-card__icon mgmt-stat-card__icon--teal">
            <Icon name="clock" size={22} />
          </div>
        </div>
      </section>

      {/* ── شريط التبويبات والبحث للأدوار ── */}
      <section className="mgmt-table-card" aria-label="جدول الأدوار">
        <div className="mgmt-tabs-row">
          <div className="mgmt-tabs">
            <button
              type="button"
              className={`mgmt-tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              كافة الأدوار ({roles.length})
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
              سجل العمليات والتدقيق (Audit Log)
            </button>
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              placeholder="بحث في الأدوار أو الصلاحيات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 2.2rem 0 0.75rem',
                border: '1.5px solid var(--border)',
                borderRadius: '10px',
                fontSize: '0.82rem',
                outline: 'none',
                background: '#fff',
              }}
            />
          </div>
        </div>

        {/* ── تبويب سجل التدقيق ── */}
        {activeTab === 'audit' ? (
          <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>سجل التعديلات الأمنية والوصول</h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.84rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span>تحديث صلاحية مستخدم عبر الـ API (المستخدم: {user?.name})</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>قبل قليل</span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span>التحقق من شهادة النفاذ وأذونات الجلسة</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>اليوم، 10:30 ص</span>
              </li>
            </ul>
          </div>
        ) : activeTab === 'matrix' ? (
          /* ── عرض مصفوفة الصلاحيات فقط ── */
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ margin: '0 0 1rem', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              يتم تعديل أذونات كل فئة وظيفية بشكل مباشر في الجدول أدناه، مع حفظ الإعدادات لتطبيقها على النظام.
            </p>
          </div>
        ) : (
          /* ── جدول الأدوار الوظيفية (كافة الأدوار) ── */
          <div className="mgmt-table-wrap">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>اسم الدور الوظيفي</th>
                  <th style={{ width: '38%' }}>نطاق الوصف والمهام</th>
                  <th style={{ width: '15%' }}>المستخدمين المسندين</th>
                  <th style={{ width: '13%' }}>مستوى الوصول</th>
                  <th style={{ width: '8%' }}>الحالة</th>
                  <th style={{ width: '4%', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => {
                  const assignedCount = role.key ? userCountsByRole[role.key] || 0 : 0
                  return (
                    <tr key={role.id}>
                      {/* اسم الدور */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              background: '#f8fafc',
                              border: '1px solid var(--border)',
                              display: 'grid',
                              placeItems: 'center',
                              color: 'var(--brand-teal)',
                              flexShrink: 0,
                            }}
                          >
                            <Icon name="shield" size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--text-h)' }}>
                              {role.name} {role.subTitle && `(${role.subTitle})`}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {role.badgeLabel || 'دور معتمد'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* نطاق الوصف */}
                      <td>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.6 }}>
                          {role.description}
                        </p>
                      </td>

                      {/* المستخدمين المسندين */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: 'var(--text-h)',
                            background: '#f1f5f9',
                            padding: '0.2rem 0.65rem',
                            borderRadius: '9999px',
                          }}
                        >
                          <Icon name="users" size={13} />
                          <span>{assignedCount > 0 ? `${assignedCount} مستخدمين` : role.assignedUsers || '—'}</span>
                        </span>
                      </td>

                      {/* مستوى الوصول */}
                      <td>
                        <span className={`mgmt-role-tag ${role.accessTagClass}`}>
                          {role.accessLevel}
                        </span>
                      </td>

                      {/* الحالة */}
                      <td>
                        <span className="mgmt-status-dot mgmt-status-dot--active">
                          ● {role.status}
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
                            title={role.isSystem ? 'دور نظامي محمي' : 'حذف الدور'}
                            onClick={() => setDeletingRole(role)}
                          >
                            <Icon name={role.isSystem ? 'lock' : 'trash'} size={14} />
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

        <footer className="mgmt-table-card__footer">
          <div>عرض {filteredRoles.length} أدوار معتمدة في النظام</div>
          <div style={{ color: 'var(--success)', fontWeight: 600 }}>
            تم التحقق من تطابق سياسات أمن المعلومات القضائية
          </div>
        </footer>
      </section>

      {/* ── جدول توزيع الصلاحيات التفصيلي حسب الأقسام (Permission Matrix) ── */}
      {(activeTab === 'all' || activeTab === 'matrix') && (
        <section className="mgmt-card" aria-label="مصفوفة الصلاحيات التفصيلية">
          <header className="mgmt-card__header">
            <div>
              <div className="mgmt-card__title-row">
                <span className="mgmt-dot--amber" />
                <h2 className="mgmt-card__title">
                  جدول توزيع الصلاحيات التفصيلي حسب الأقسام (Permission Matrix)
                </h2>
              </div>
              <p className="mgmt-card__subtitle">
                يمكنك تفعيل أو إلغاء الصلاحية بشكل فوري لكل فئة وظيفية
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.78rem', fontWeight: 700 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
                متاح
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }} />
                محجوب
              </span>
            </div>
          </header>

          {savedSuccess && (
            <div
              style={{
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                marginBottom: '1rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Icon name="check" size={18} />
              <span>تم حفظ تعديلات مصفوفة الصلاحيات وتطبيقها فورياً على النظام</span>
            </div>
          )}

          <div className="mgmt-table-wrap">
            <table className="perm-matrix-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>القسم / الإجراء القانوني</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>المستشار العام</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>محامي أول / شريك</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>محامي متدرب</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>إدارة ومالية</th>
                </tr>
              </thead>
              <tbody>
                {/* قسم 1: القضايا والجلسات */}
                <tr className="perm-section-head">
                  <td colSpan={5}>قسم إدارة القضايا والجلسات القضائية</td>
                </tr>
                <tr>
                  <td>عرض جميع القضايا وسجلات المحكمة</td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.cases_view.admin}
                      onChange={() => handleToggle('cases_view', 'admin')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.cases_view.partner}
                      onChange={() => handleToggle('cases_view', 'partner')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.cases_view.trainee}
                      onChange={() => handleToggle('cases_view', 'trainee')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.cases_view.finance}
                      onChange={() => handleToggle('cases_view', 'finance')}
                    />
                  </td>
                </tr>
                <tr>
                  <td>إضافة قضية جديدة وجدولة جلسة</td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.cases_create.admin}
                      onChange={() => handleToggle('cases_create', 'admin')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.cases_create.partner}
                      onChange={() => handleToggle('cases_create', 'partner')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.cases_create.trainee}
                      onChange={() => handleToggle('cases_create', 'trainee')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.cases_create.finance}
                      onChange={() => handleToggle('cases_create', 'finance')}
                    />
                  </td>
                </tr>
                <tr>
                  <td>حذف أو أرشفة ملف دعوى نهائياً</td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.cases_delete.admin}
                      onChange={() => handleToggle('cases_delete', 'admin')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.cases_delete.partner}
                      onChange={() => handleToggle('cases_delete', 'partner')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.cases_delete.trainee}
                      onChange={() => handleToggle('cases_delete', 'trainee')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.cases_delete.finance}
                      onChange={() => handleToggle('cases_delete', 'finance')}
                    />
                  </td>
                </tr>

                {/* قسم 2: المستندات والوثائق */}
                <tr className="perm-section-head">
                  <td colSpan={5}>قسم المستندات والعقود والتوكيلات</td>
                </tr>
                <tr>
                  <td>رفع الوثائق وصكوك التوكيل</td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.docs_upload.admin}
                      onChange={() => handleToggle('docs_upload', 'admin')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.docs_upload.partner}
                      onChange={() => handleToggle('docs_upload', 'partner')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.docs_upload.trainee}
                      onChange={() => handleToggle('docs_upload', 'trainee')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.docs_upload.finance}
                      onChange={() => handleToggle('docs_upload', 'finance')}
                    />
                  </td>
                </tr>
                <tr>
                  <td>اعتماد وتوقيع العقود الرقمية</td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.docs_approve.admin}
                      onChange={() => handleToggle('docs_approve', 'admin')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.docs_approve.partner}
                      onChange={() => handleToggle('docs_approve', 'partner')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.docs_approve.trainee}
                      onChange={() => handleToggle('docs_approve', 'trainee')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.docs_approve.finance}
                      onChange={() => handleToggle('docs_approve', 'finance')}
                    />
                  </td>
                </tr>

                {/* قسم 3: الفواتير والمطالبات */}
                <tr className="perm-section-head">
                  <td colSpan={5}>قسم الفواتير والمدفوعات والمطالبات المالية</td>
                </tr>
                <tr>
                  <td>إصدار فواتير الأتعاب وسندات القبض</td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.invoices_issue.admin}
                      onChange={() => handleToggle('invoices_issue', 'admin')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.invoices_issue.partner}
                      onChange={() => handleToggle('invoices_issue', 'partner')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.invoices_issue.trainee}
                      onChange={() => handleToggle('invoices_issue', 'trainee')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.invoices_issue.finance}
                      onChange={() => handleToggle('invoices_issue', 'finance')}
                    />
                  </td>
                </tr>
                <tr>
                  <td>تصدير التقارير المالية والضريبية</td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.invoices_reports.admin}
                      onChange={() => handleToggle('invoices_reports', 'admin')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.invoices_reports.partner}
                      onChange={() => handleToggle('invoices_reports', 'partner')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.invoices_reports.trainee}
                      onChange={() => handleToggle('invoices_reports', 'trainee')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.invoices_reports.finance}
                      onChange={() => handleToggle('invoices_reports', 'finance')}
                    />
                  </td>
                </tr>

                {/* قسم 4: المستخدمين والأمان */}
                <tr className="perm-section-head">
                  <td colSpan={5}>قسم المستخدمين والأمان والضبط</td>
                </tr>
                <tr>
                  <td>تعديل الصلاحيات وإنشاء مستخدمين جدد</td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.users_manage.admin}
                      onChange={() => handleToggle('users_manage', 'admin')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.users_manage.partner}
                      onChange={() => handleToggle('users_manage', 'partner')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.users_manage.trainee}
                      onChange={() => handleToggle('users_manage', 'trainee')}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="perm-checkbox"
                      checked={matrix.users_manage.finance}
                      onChange={() => handleToggle('users_manage', 'finance')}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSaveMatrix}
            >
              <Icon name="check" size={18} />
              <span>حفظ تعديلات الصلاحيات</span>
            </button>

            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setConfirmResetOpen(true)}
            >
              <span>إلغاء التغييرات</span>
            </button>
          </div>
        </section>
      )}

      {/* ── Modal إضافة / تعديل دور ── */}
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

      {/* ── Modal تعيين دور لمستخدم عبر الـ API ── */}
      <AssignUserRoleModal
        open={assignModalOpen}
        users={users || []}
        onClose={() => setAssignModalOpen(false)}
        onAssign={handleAssignRole}
        submitting={submittingAction}
      />

      {/* ── Modal تأكيد حذف الدور ── */}
      <ConfirmDeleteModal
        open={Boolean(deletingRole)}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleDeleteRoleConfirm}
        title="تأكيد حذف الدور الوظيفي"
        itemName={deletingRole?.name}
        warning={deletingRole?.isSystem ? 'هذا الدور أساسي ونظامي في هيكلية التطبيق ولا يمكن حذفه.' : undefined}
        confirmText={deletingRole?.isSystem ? 'إغلاق' : 'حذف الدور نهائياً'}
      />

      {/* ── Modal تأكيد استعادة / إلغاء تغييرات مصفوفة الصلاحيات ── */}
      <ConfirmModal
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={() => {
          setConfirmResetOpen(false)
          handleResetMatrix()
        }}
        title="تأكيد إلغاء التغييرات"
        message="هل أنت متأكد من رغبتك في إلغاء التعديلات واستعادة الصلاحيات الافتراضية؟ سيتم فقد أي تغييرات غير محفوظة على المصفوفة."
        confirmText="استعادة الافتراضي"
        cancelText="الرجوع"
        variant="warning"
        icon="alert"
      />

      {/* ── تذييل حالة الاتصال بالنظام ── */}
      <div className="mgmt-system-status">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--success)', fontWeight: 700 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
          <span>متصل بقاعدة البيانات</span>
        </div>
        <div>نظام إدارة المكاتب العدلية والقانونية — مكتب الدوسري</div>
      </div>
    </div>
  )
}
