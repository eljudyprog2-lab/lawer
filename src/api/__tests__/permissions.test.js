import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../client'
import {
  getJobRoles,
  getJobRole,
  createJobRole,
  updateJobRole,
  deleteJobRole,
  getUserJobRoles,
  getUserJobRole,
  createUserJobRole,
  updateUserJobRole,
  deleteUserJobRole,
  getPermissionsDashboard,
  getAllPermissions,
  getPermissionMatrix,
  updateSingleRolePermission,
  bulkUpdateRolePermissions,
  getUserDirectPermissions,
  updateUserDirectPermission,
  getAuditLogs,
  parseApiError,
} from '../permissions'

vi.mock('../client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Permissions API Service Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Job Roles', () => {
    it('fetches all job roles', async () => {
      const mockRoles = [{ id: 1, name: 'محامي', status: 'نشط' }]
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: mockRoles } })

      const res = await getJobRoles()
      expect(apiClient.get).toHaveBeenCalledWith('/job-roles')
      expect(res).toEqual(mockRoles)
    })

    it('creates a job role with normalized payload', async () => {
      const newRole = { id: 2, name: 'مستشار' }
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: newRole } })

      const res = await createJobRole({
        name: 'مستشار',
        subTitle: 'Legal Consultant',
        description: 'استشارات قانونية',
        accessLevel: 'وصول متقدم',
        status: 'نشط',
      })

      expect(apiClient.post).toHaveBeenCalledWith('/job-roles', {
        name: 'مستشار',
        english_title: 'Legal Consultant',
        description: 'استشارات قانونية',
        access_level: 'وصول متقدم',
        status: 'نشط',
      })
      expect(res).toEqual(newRole)
    })

    it('updates a job role', async () => {
      apiClient.put.mockResolvedValueOnce({ data: { success: true, data: { id: 1, name: 'محامي رئيسي' } } })

      const res = await updateJobRole(1, {
        name: 'محامي رئيسي',
        english_title: 'Lead Counsel',
        description: 'ترافع ومتابعة',
        access_level: 'وصول شامل وكامل',
        status: 'نشط',
      })

      expect(apiClient.put).toHaveBeenCalledWith('/job-roles/1', {
        name: 'محامي رئيسي',
        english_title: 'Lead Counsel',
        description: 'ترافع ومتابعة',
        access_level: 'وصول شامل وكامل',
        status: 'نشط',
      })
      expect(res.name).toBe('محامي رئيسي')
    })

    it('deletes a job role', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { success: true, message: 'deleted' } })
      const res = await deleteJobRole(1)
      expect(apiClient.delete).toHaveBeenCalledWith('/job-roles/1')
      expect(res.success).toBe(true)
    })
  })

  describe('User Job Roles', () => {
    it('fetches all user job roles', async () => {
      const mockUserRoles = [{ id: 1, user_id: 2, job_role_id: 1 }]
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: mockUserRoles } })

      const res = await getUserJobRoles()
      expect(apiClient.get).toHaveBeenCalledWith('/user-job-roles')
      expect(res).toEqual(mockUserRoles)
    })

    it('creates a user job role assignment', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true, data: { id: 10 } } })

      const res = await createUserJobRole({
        user_id: 2,
        job_role_id: 1,
        application_scope: 'وصول مخصص ومقيد',
      })

      expect(apiClient.post).toHaveBeenCalledWith('/user-job-roles', {
        user_id: 2,
        job_role_id: 1,
        application_scope: 'وصول مخصص ومقيد',
      })
      expect(res.id).toBe(10)
    })

    it('updates a user job role assignment using PUT with _method', async () => {
      apiClient.put.mockResolvedValueOnce({ data: { success: true, data: { id: 1 } } })

      const res = await updateUserJobRole(1, {
        job_role_id: 3,
        application_scope: 'وصول متقدم',
      })

      expect(apiClient.put).toHaveBeenCalledWith('/user-job-roles/1', {
        job_role_id: 3,
        application_scope: 'وصول متقدم',
        _method: 'PUT',
      })
      expect(res.id).toBe(1)
    })

    it('deletes a user job role assignment', async () => {
      apiClient.delete.mockResolvedValueOnce({ data: { success: true } })
      await deleteUserJobRole(1)
      expect(apiClient.delete).toHaveBeenCalledWith('/user-job-roles/1')
    })
  })

  describe('Permissions Dashboard & Matrix', () => {
    it('fetches permissions KPIs dashboard', async () => {
      const mockDash = { total_roles: 3, total_permissions: 8 }
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: mockDash } })

      const res = await getPermissionsDashboard()
      expect(apiClient.get).toHaveBeenCalledWith('/permissions-management/dashboard')
      expect(res.total_roles).toBe(3)
    })

    it('fetches permission matrix', async () => {
      const mockMatrix = { roles: [], permissions: {} }
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: mockMatrix } })

      const res = await getPermissionMatrix()
      expect(apiClient.get).toHaveBeenCalledWith('/permissions-management/matrix')
      expect(res).toEqual(mockMatrix)
    })

    it('toggles single role permission', async () => {
      apiClient.put.mockResolvedValueOnce({ data: { success: true } })
      await updateSingleRolePermission(2, 3, true)
      expect(apiClient.put).toHaveBeenCalledWith(
        '/permissions-management/roles/2/permissions/3',
        { is_allowed: true }
      )
    })

    it('bulk updates role permissions', async () => {
      apiClient.put.mockResolvedValueOnce({ data: { success: true } })
      await bulkUpdateRolePermissions(2, [
        { permission_id: 1, is_allowed: true },
        { permission_id: 2, is_allowed: false },
      ])
      expect(apiClient.put).toHaveBeenCalledWith(
        '/permissions-management/roles/2/permissions',
        {
          permissions: [
            { permission_id: 1, is_allowed: true },
            { permission_id: 2, is_allowed: false },
          ],
        }
      )
    })

    it('fetches and updates direct user permissions', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: [{ id: 1, is_allowed: true }] } })
      const list = await getUserDirectPermissions(2)
      expect(apiClient.get).toHaveBeenCalledWith('/permissions-management/users/2/permissions')
      expect(list.length).toBe(1)

      apiClient.put.mockResolvedValueOnce({ data: { success: true } })
      await updateUserDirectPermission(2, 1, false)
      expect(apiClient.put).toHaveBeenCalledWith(
        '/permissions-management/users/2/permissions/1',
        { is_allowed: false }
      )
    })

    it('fetches audit logs with pagination params', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: { current_page: 1, data: [] } } })
      await getAuditLogs({ page: 2 })
      expect(apiClient.get).toHaveBeenCalledWith('/permissions-management/audit-logs', { params: { page: 2 } })
    })
  })

  describe('parseApiError', () => {
    it('returns custom message when available in response', () => {
      const err = { response: { data: { message: 'رسالة خطأ مخصصة' } } }
      expect(parseApiError(err)).toBe('رسالة خطأ مخصصة')
    })

    it('returns first validation error when errors map exists', () => {
      const err = { response: { data: { errors: { name: ['اسم الدور مستخدم مسبقاً'] } } } }
      expect(parseApiError(err)).toBe('اسم الدور مستخدم مسبقاً')
    })
  })
})
