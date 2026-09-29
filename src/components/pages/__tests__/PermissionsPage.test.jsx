import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PermissionsPage from '../PermissionsPage'
import * as permissionsApi from '../../../api/permissions'
import * as usersApi from '../../../api/users'

vi.mock('../../../api/permissions')
vi.mock('../../../api/users')
vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 2, name: 'Admin', role: 'admin' },
  }),
}))

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <PermissionsPage />
    </QueryClientProvider>
  )
}

describe('PermissionsPage Feature Tests', () => {
  const mockRoles = [
    {
      id: 1,
      name: 'محامي استئناف',
      english_title: 'Appeals Lawyer',
      description: 'مسؤول عن القضايا الاستئنافية',
      access_level: 'وصول متقدم',
      status: 'نشط',
    },
  ]

  const mockUserRoles = [
    {
      id: 10,
      user_id: 2,
      job_role_id: 1,
      application_scope: 'وصول مخصص ومقيد',
      created_at: '2026-09-28T05:00:00Z',
      user: { id: 2, name: 'أحمد محمود', full_name: 'أحمد محمود', email: 'ahmed@test.com' },
      job_role: { id: 1, name: 'محامي استئناف' },
    },
  ]

  const mockDashboard = {
    total_roles: 1,
    total_permissions: 8,
    users_with_permissions: 1,
    users_with_roles: 1,
  }

  const mockMatrix = {
    roles: [{ id: 1, name: 'محامي استئناف', english_title: 'Appeals Lawyer' }],
    permissions: {
      'قسم إدارة القضايا': [
        {
          id: 1,
          name: 'عرض جميع القضايا',
          key: 'cases.view_all',
          roles: { 1: true },
        },
      ],
    },
  }

  const mockAudit = {
    current_page: 1,
    last_page: 1,
    total: 1,
    data: [
      {
        id: 1,
        action: 'update_user_permission',
        target_type: 'user',
        target_id: 2,
        permission_key: 'cases.view_all',
        description: 'تعديل صلاحية مباشرة لمستخدم',
        created_at: '2026-09-28T07:00:00Z',
      },
    ],
  }

  const mockUsersList = [
    { id: 2, name: 'أحمد محمود', email: 'ahmed@test.com', role: 'admin' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    permissionsApi.getPermissionsDashboard.mockResolvedValue(mockDashboard)
    permissionsApi.getJobRoles.mockResolvedValue(mockRoles)
    permissionsApi.getUserJobRoles.mockResolvedValue(mockUserRoles)
    permissionsApi.getPermissionMatrix.mockResolvedValue(mockMatrix)
    permissionsApi.getAllPermissions.mockResolvedValue([
      { id: 1, section: 'قسم إدارة القضايا', name: 'عرض جميع القضايا', key: 'cases.view_all' },
    ])
    permissionsApi.getAuditLogs.mockResolvedValue(mockAudit)
    usersApi.fetchUsers.mockResolvedValue(mockUsersList)
    usersApi.normalizeUser.mockImplementation((u) => u)
  })

  it('renders topbar, stat cards, and job roles table from real API', async () => {
    renderComponent()

    expect(screen.getByText('إدارة الصلاحيات والأدوار')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('محامي استئناف')).toBeInTheDocument()
    })
    expect(screen.getByText('Appeals Lawyer')).toBeInTheDocument()
    expect(screen.getByText('مسؤول عن القضايا الاستئنافية')).toBeInTheDocument()
  })

  it('switches to user job roles assignments tab and displays assignments', async () => {
    const user = userEvent.setup()
    renderComponent()

    const assignTab = screen.getByRole('button', { name: /تعيينات أدوار المستخدمين/i })
    await user.click(assignTab)

    await waitFor(() => {
      expect(screen.getByText('أحمد محمود')).toBeInTheDocument()
    })
    expect(screen.getByText('ahmed@test.com')).toBeInTheDocument()
  })

  it('switches to matrix tab and displays sections and checkboxes', async () => {
    const user = userEvent.setup()
    renderComponent()

    const matrixTab = screen.getByRole('button', { name: /مصفوفة الصلاحيات المباشرة/i })
    await user.click(matrixTab)

    await waitFor(() => {
      expect(screen.getByText('قسم إدارة القضايا')).toBeInTheDocument()
    })
    expect(screen.getByText('عرض جميع القضايا')).toBeInTheDocument()

    const checkbox = screen.getByLabelText('عرض جميع القضايا - محامي استئناف')
    expect(checkbox).toBeChecked()

    // Toggle checkbox
    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
    expect(screen.getByText(/توجد تعديلات غير محفوظة/i)).toBeInTheDocument()
  })

  it('switches to audit log tab and displays audit events', async () => {
    const user = userEvent.setup()
    renderComponent()

    const auditTab = screen.getByRole('button', { name: /سجل العمليات والتدقيق/i })
    await user.click(auditTab)

    await waitFor(() => {
      expect(screen.getByText('تعديل صلاحية مباشرة لمستخدم')).toBeInTheDocument()
    })
    expect(screen.getByText('تعديل صلاحية مستخدم')).toBeInTheDocument()
  })

  it('opens add role modal and submits new role to API', async () => {
    const user = userEvent.setup()
    permissionsApi.createJobRole.mockResolvedValueOnce({ id: 99, name: 'مستشار دستوري' })

    renderComponent()

    const addBtn = screen.getByRole('button', { name: /إضافة دور جديد/i })
    await user.click(addBtn)

    expect(screen.getByText('إضافة دور وظيفي جديد للنظام')).toBeInTheDocument()

    const nameInput = screen.getByPlaceholderText('مثال: محامي استئناف ومحكم')
    await user.type(nameInput, 'مستشار دستوري')

    const descInput = screen.getByPlaceholderText('توضيح المسؤوليات الموكلة لهذا الدور...')
    await user.type(descInput, 'إعداد اللوائح الدستورية')

    const submitBtn = screen.getByRole('button', { name: /إضافة الدور للنظام/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(permissionsApi.createJobRole).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'مستشار دستوري',
          description: 'إعداد اللوائح الدستورية',
        })
      )
    })
  })
})
