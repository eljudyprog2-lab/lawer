import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { StatCard } from '../dashboard/StatCard'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useUsers, useUserMutations } from '../../hooks/useUsers'
import { UserFormModal } from '../users/UserFormModal'
import { ConfirmDeleteModal } from '../ui/ConfirmDeleteModal'
import { ConfirmModal } from '../ui/ConfirmModal'
import { Pagination } from '../ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import { parseApiError } from '../../api/client'

export default function AccountsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // API Integration
  const { users, isLoading, error, refetch } = useUsers()
  const { create: createUserMutation, update: updateUserMutation, remove: deleteUserMutation } = useUserMutations()

  // State
  const [activeTab, setActiveTab] = useState('all') // all | lawyers | clients | admin
  const [searchQuery, setSearchQuery] = useState('')
  const { showToast } = useToast()

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userModalMode, setUserModalMode] = useState('create') // create | edit
  const [selectedUser, setSelectedUser] = useState(null)
  const [deletingUser, setDeletingUser] = useState(null)
  const [deactivatingUser, setDeactivatingUser] = useState(null)
  const [submittingAction, setSubmittingAction] = useState(false)

  // User Counts
  const { totalCount, lawyersCount, clientsCount, adminCount } = useMemo(() => {
    if (!users || !users.length) return { totalCount: 0, lawyersCount: 0, clientsCount: 0, adminCount: 0 }
    return {
      totalCount: users.length,
      lawyersCount: users.filter((u) => u.role === 'lawyer').length,
      clientsCount: users.filter((u) => u.role === 'secretary' || u.role === 'client').length,
      adminCount: users.filter((u) => u.role === 'admin' || u.role === 'owner').length,
    }
  }, [users])

  // Filter users by tab & search query
  const filteredUsers = useMemo(() => {
    if (!users) return []
    return users.filter((u) => {
      // Tab filter
      if (activeTab === 'lawyers' && u.role !== 'lawyer') return false
      if (activeTab === 'clients' && u.role !== 'secretary' && u.role !== 'client') return false
      if (activeTab === 'admin' && u.role !== 'admin' && u.role !== 'owner') return false

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const text = `${u.full_name || u.name || ''} ${u.email || ''} ${u.phone || ''} ${u.roleLabel || u.role || ''}`.toLowerCase()
        return text.includes(q)
      }
      return true
    })
  }, [users, activeTab, searchQuery])

  const { page, setPage, paginated, resetPage } = usePagination(filteredUsers)

  // Save User (Create or Update) via Real API
  const handleSaveUser = async (payload) => {
    setSubmittingAction(true)
    try {
      if (userModalMode === 'edit' && selectedUser?.id) {
        await updateUserMutation.mutateAsync({
          id: selectedUser.id,
          values: payload,
        })
        showToast('تم تحديث بيانات المستخدم بنجاح')
      } else {
        await createUserMutation.mutateAsync(payload)
        showToast('تم إنشاء وتفعيل حساب المستخدم بنجاح')
      }
      setUserModalOpen(false)
      setSelectedUser(null)
      await refetch()
    } catch (err) {
      const parsed = parseApiError(err)
      showToast(parsed.message || 'تعذر حفظ الحساب', 'error')
      throw parsed
    } finally {
      setSubmittingAction(false)
    }
  }

  // Delete User Confirmation via Real API
  const handleDeleteConfirm = async () => {
    if (!deletingUser?.id) return
    setSubmittingAction(true)
    try {
      await deleteUserMutation.mutateAsync(deletingUser.id)
      showToast(`تم حذف حساب «${deletingUser.full_name || deletingUser.name}» بنجاح`)
      setDeletingUser(null)
      await refetch()
    } catch (err) {
      showToast(parseApiError(err).message || 'تعذر حذف الحساب', 'error')
    } finally {
      setSubmittingAction(false)
    }
  }

  // Execute status change via API
  const executeStatusChange = async (targetUser, newStatus) => {
    try {
      await updateUserMutation.mutateAsync({
        id: targetUser.id,
        values: { status: newStatus },
      })
      showToast(`تم تغيير حالة الحساب إلى ${newStatus === 'active' ? 'نشط' : 'معطل'}`)
      await refetch()
    } catch (err) {
      showToast(parseApiError(err).message || 'تعذر تحديث حالة الحساب', 'error')
    }
  }

  // Toggle user status active/inactive via API
  const handleToggleStatus = (targetUser) => {
    if (targetUser.status === 'active') {
      setDeactivatingUser(targetUser)
      return
    }
    executeStatusChange(targetUser, 'active')
  }

  return (
    <div className="mgmt-page">
      {/* ── رأس الصفحة (Top Bar) ── */}
      <header className="mgmt-topbar">
        <div className="mgmt-topbar__title-wrap">
          <h1 className="mgmt-topbar__title">إدارة الحسابات والمستخدمين</h1>
        </div>

        <div className="mgmt-topbar__actions">
          {/* حقل البحث السريع */}
          <div className="search-field" style={{ width: '280px' }}>
            <Icon name="search" className="search-field__icon" />
            <input
              type="search"
              className="search-field__input"
              placeholder="بحث بالاسم أو البريد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="بحث في المستخدمين والحسابات"
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="button"
            className="btn btn--ghost"
            onClick={async () => {
              await refetch()
              showToast('تم تحديث قائمة الحسابات')
            }}
            disabled={isLoading}
            title="تحديث الحسابات"
          >
            <Icon name="refresh" size={16} className={isLoading ? 'animate-spin' : undefined} />
            <span>تحديث</span>
          </button>

          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setSelectedUser(null)
              setUserModalMode('create')
              setUserModalOpen(true)
            }}
          >
            <Icon name="plus" size={16} />
            <span>إنشاء حساب جديد</span>
          </button>
        </div>
      </header>


      {/* ── بطاقة المستخدم الحالي المعتمد (Current User Banner) ── */}
      <section className="mgmt-user-banner" aria-label="المستخدم الحالي">
        <div className="mgmt-user-banner__right">
          <div className="mgmt-avatar-badge">
            <span>{user?.name ? user.name.slice(0, 2) : 'د.ع'}</span>
            <span className="mgmt-avatar-badge__dot" />
          </div>

          <div className="mgmt-user-banner__info">
            <h3>
              <span>المستخدم الحالي:</span>
              <strong style={{ color: 'var(--text-h)' }}>
                {user?.name || 'د. عبدالله بن فهد الدوسري (المستشار العام والمؤسس)'}
              </strong>
              <span className="mgmt-role-pill">
                {user?.role || 'المستشار العام'}
              </span>
            </h3>
            <div className="mgmt-user-banner__meta">
              <span>{user?.email || 'admin@test.com'}</span>
              <span>•</span>
              <span className="mgmt-code-badge">ID: #{user?.id || 1}</span>
            </div>
          </div>
        </div>

        <div className="mgmt-user-banner__left">
          <div className="mgmt-session-badge">
            <Icon name="check" size={15} />
            <span>جلسة نشطة وموثقة (نظامية)</span>
          </div>

          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => navigate('/profile')}
          >
            <Icon name="cog" size={16} />
            <span>إعدادات الحساب</span>
          </button>
        </div>
      </section>

      {/* ── بطاقات الإحصائيات الأربع (Stats Grid) ── */}
      <section className="stats-grid" aria-label="إحصائيات الحسابات">
        <StatCard
          value={totalCount}
          label="إجمالي الحسابات المسجلة"
          tone="gold"
          icon="users"
          index={0}
        />
        <StatCard
          value={lawyersCount}
          label="حسابات المحامين"
          tone="teal"
          icon="sessions"
          index={1}
        />
        <StatCard
          value={clientsCount}
          label="الموظفين والمساعدين"
          tone="muted"
          icon="user"
          index={2}
        />
        <StatCard
          value={adminCount}
          label="حسابات الإدارة والملاك"
          tone="success"
          icon="shield"
          index={3}
        />
      </section>

      {/* ── جدول الحسابات والمستخدمين المسجلين ── */}
      <section className="mgmt-table-card" aria-label="جدول الحسابات">
        <div className="mgmt-tabs-row">
          <div className="mgmt-tabs">
            <button
              type="button"
              className={`mgmt-tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              كافة الحسابات ({totalCount})
            </button>
            <button
              type="button"
              className={`mgmt-tab-btn ${activeTab === 'lawyers' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('lawyers')}
            >
              المحامين ({lawyersCount})
            </button>
            <button
              type="button"
              className={`mgmt-tab-btn ${activeTab === 'clients' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('clients')}
            >
              السكرتارية والموظفين ({clientsCount})
            </button>
            <button
              type="button"
              className={`mgmt-tab-btn ${activeTab === 'admin' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              الإدارة والملاك ({adminCount})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="mgmt-counter-pill">المعروض: {filteredUsers.length}</span>
          </div>
        </div>

        {/* جدول الحسابات */}
        <div className="mgmt-table-wrap">
          <table className="mgmt-table">
            <thead>
              <tr>
                <th style={{ width: '28%' }}>المستخدم والاسم الكامل</th>
                <th style={{ width: '22%' }}>البريد الإلكتروني والهاتف</th>
                <th style={{ width: '18%' }}>الدور والصلاحية</th>
                <th style={{ width: '14%' }}>الحالة (انقر للتغيير)</th>
                <th style={{ width: '18%', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <Icon name="refresh" size={24} className="animate-spin" />
                      <span>جاري تحميل بيانات المستخدمين...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    لم يتم العثور على مستخدمين مطابقين
                  </td>
                </tr>
              ) : (
                paginated.map((u) => {
                  const roleBadgeClass =
                    u.role === 'owner'
                      ? 'mgmt-role-tag--superadmin'
                      : u.role === 'admin'
                        ? 'mgmt-role-tag--partner'
                        : u.role === 'lawyer'
                          ? 'mgmt-role-tag--trainee'
                          : 'mgmt-role-tag--finance'

                  const isActive = u.status === 'active'

                  return (
                    <tr key={u.id}>
                      {/* المستخدم */}
                      <td>
                        <div className="mgmt-user-cell">
                          <div className="mgmt-user-cell__avatar">
                            {u.full_name ? u.full_name.slice(0, 2) : 'م'}
                          </div>
                          <div>
                            <div className="mgmt-user-cell__name">{u.full_name || u.name}</div>
                            <div className="mgmt-user-cell__code">USR-{String(u.id).padStart(3, '0')}</div>
                          </div>
                        </div>
                      </td>

                      {/* التواصل */}
                      <td>
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-h)' }}>{u.email || '—'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', direction: 'ltr', textAlign: 'right' }}>
                          {u.phone || '—'}
                        </div>
                      </td>

                      {/* الدور */}
                      <td>
                        <span className={`mgmt-role-tag ${roleBadgeClass}`}>
                          {u.roleLabel || u.role}
                        </span>
                      </td>

                      {/* الحالة (قابلة للتغيير الفوري عبر الـ API) */}
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          title="انقر لتغيير حالة الحساب فورياً"
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                          }}
                        >
                          <span className={`mgmt-status-dot ${isActive ? 'mgmt-status-dot--active' : 'mgmt-status-dot--pending'}`}>
                            ● {isActive ? 'نشط' : 'معطل'}
                          </span>
                        </button>
                      </td>

                      {/* الإجراءات */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
                          <button
                            type="button"
                            className="action-btn action-btn--edit"
                            title="تعديل بيانات المستخدم"
                            onClick={() => {
                              setSelectedUser(u)
                              setUserModalMode('edit')
                              setUserModalOpen(true)
                            }}
                          >
                            <Icon name="edit" size={15} />
                          </button>

                          <button
                            type="button"
                            className="action-btn action-btn--delete"
                            title="حذف المستخدم نهائياً"
                            onClick={() => setDeletingUser(u)}
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          total={filteredUsers.length}
          perPage={10}
          onChange={(p) => setPage(p)}
        />

        <footer className="mgmt-table-card__footer">
          <div>إجمالي الحسابات المطابقة: {filteredUsers.length}</div>
          <div style={{ color: 'var(--success)', fontWeight: 600 }}>
            متصل بواجهة المستخدمين المعتمدة (Live Users API)
          </div>
        </footer>
      </section>

      {/* ── Modal إنشاء / تعديل مستخدم ── */}
      <UserFormModal
        open={userModalOpen}
        mode={userModalMode}
        initialValues={selectedUser}
        onClose={() => {
          setUserModalOpen(false)
          setSelectedUser(null)
        }}
        onSave={handleSaveUser}
        submitting={submittingAction}
      />

      {/* ── Modal تأكيد حذف مستخدم ── */}
      <ConfirmDeleteModal
        open={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteConfirm}
        title="تأكيد حذف حساب المستخدم"
        message="هل أنت متأكد من رغبتك في حذف هذا الحساب نهائياً من النظام؟"
        itemName={deletingUser?.full_name || deletingUser?.name}
        itemDetails={
          deletingUser ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <div>
                <strong>البريد:</strong> {deletingUser.email}
              </div>
              <div>
                <strong>الدور:</strong> {deletingUser.roleLabel || deletingUser.role}
              </div>
            </div>
          ) : null
        }
        warning="سيتم إلغاء وصول هذا المستخدم فوراً وتعطيل كافة الصلاحيات والجلسات المرتبطة به."
        isLoading={submittingAction}
      />

      {/* ── Modal تأكيد تعطيل مستخدم ── */}
      <ConfirmModal
        open={Boolean(deactivatingUser)}
        onClose={() => setDeactivatingUser(null)}
        onConfirm={async () => {
          const userToDeactivate = deactivatingUser
          setDeactivatingUser(null)
          await executeStatusChange(userToDeactivate, 'inactive')
        }}
        title="تأكيد تعطيل حساب المستخدم"
        message="هل أنت متأكد من رغبتك في تعطيل هذا الحساب؟ لن يتمكن المستخدم من تسجيل الدخول إلى النظام حتى تتم إعادة تفعيله."
        itemName={deactivatingUser?.full_name || deactivatingUser?.name}
        variant="warning"
        icon="alert"
        confirmText="تعطيل الحساب"
        cancelText="إلغاء التراجع"
      />
    </div>
  )
}
