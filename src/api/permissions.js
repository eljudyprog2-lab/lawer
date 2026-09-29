import { apiClient } from './client'

const JOB_ROLES_PATH = '/job-roles'
const USER_JOB_ROLES_PATH = '/user-job-roles'
const PERMS_MGMT_PATH = '/permissions-management'

/**
 * Normalizes API error message into a human-readable Arabic string.
 */
export function parseApiError(error, defaultMsg = 'حدث خطأ غير متوقع أثناء معالجة الطلب') {
  if (!error) return defaultMsg
  const data = error.response?.data
  if (data?.message) return data.message
  if (data?.error) return data.error
  if (data?.errors) {
    const firstKey = Object.keys(data.errors)[0]
    if (firstKey && data.errors[firstKey]?.length) {
      return data.errors[firstKey][0]
    }
  }
  return error.message || defaultMsg
}

/* =========================================================================
   1. JOB ROLES API (/api/job-roles)
   ========================================================================= */

/** Fetch all job roles */
export async function getJobRoles() {
  const res = await apiClient.get(JOB_ROLES_PATH)
  return res.data?.data || []
}

/** Fetch a single job role by ID */
export async function getJobRole(id) {
  const res = await apiClient.get(`${JOB_ROLES_PATH}/${id}`)
  return res.data?.data || res.data
}

/**
 * Create a new job role
 * @param {Object} data { name, english_title, description, access_level, status }
 */
export async function createJobRole(data) {
  const payload = {
    name: data.name?.trim(),
    english_title: data.english_title?.trim() || data.subTitle?.trim() || null,
    description: data.description?.trim() || null,
    access_level: data.access_level || data.accessLevel || 'وصول مخصص ومقيد',
    status: data.status || 'نشط',
  }
  const res = await apiClient.post(JOB_ROLES_PATH, payload)
  return res.data?.data || res.data
}

/**
 * Update an existing job role
 * @param {number|string} id
 * @param {Object} data
 */
export async function updateJobRole(id, data) {
  const payload = {
    name: data.name?.trim(),
    english_title: data.english_title?.trim() || data.subTitle?.trim() || null,
    description: data.description?.trim() || null,
    access_level: data.access_level || data.accessLevel || 'وصول مخصص ومقيد',
    status: data.status || 'نشط',
  }
  const res = await apiClient.put(`${JOB_ROLES_PATH}/${id}`, payload)
  return res.data?.data || res.data
}

/** Delete a job role */
export async function deleteJobRole(id) {
  const res = await apiClient.delete(`${JOB_ROLES_PATH}/${id}`)
  return res.data
}

/* =========================================================================
   2. USER JOB ROLES API (/api/user-job-roles)
   ========================================================================= */

/** Fetch all user job role assignments */
export async function getUserJobRoles() {
  const res = await apiClient.get(USER_JOB_ROLES_PATH)
  return res.data?.data || []
}

/** Fetch a single user job role assignment */
export async function getUserJobRole(id) {
  const res = await apiClient.get(`${USER_JOB_ROLES_PATH}/${id}`)
  return res.data?.data || res.data
}

/**
 * Assign a job role to a user
 * @param {Object} data { user_id, job_role_id, application_scope }
 */
export async function createUserJobRole(data) {
  const payload = {
    user_id: Number(data.user_id),
    job_role_id: Number(data.job_role_id),
    application_scope: data.application_scope || 'وصول مخصص ومقيد',
  }
  const res = await apiClient.post(USER_JOB_ROLES_PATH, payload)
  return res.data?.data || res.data
}

/**
 * Update an existing user job role assignment
 * Note: Uses HTTP PUT as validated with the backend.
 * @param {number|string} id
 * @param {Object} data { job_role_id, application_scope }
 */
export async function updateUserJobRole(id, data) {
  const payload = {
    job_role_id: Number(data.job_role_id),
    application_scope: data.application_scope || 'وصول مخصص ومقيد',
    _method: 'PUT',
  }
  const res = await apiClient.put(`${USER_JOB_ROLES_PATH}/${id}`, payload)
  return res.data?.data || res.data
}

/** Unassign / delete a user job role */
export async function deleteUserJobRole(id) {
  const res = await apiClient.delete(`${USER_JOB_ROLES_PATH}/${id}`)
  return res.data
}

/* =========================================================================
   3. PERMISSIONS MANAGEMENT & DASHBOARD (/api/permissions-management)
   ========================================================================= */

/** Fetch Permissions KPIs Dashboard */
export async function getPermissionsDashboard() {
  const res = await apiClient.get(`${PERMS_MGMT_PATH}/dashboard`)
  return res.data?.data || {
    total_roles: 0,
    total_permissions: 0,
    users_with_permissions: 0,
    users_with_roles: 0,
  }
}

/** Fetch all registered system permissions */
export async function getAllPermissions() {
  const res = await apiClient.get(`${PERMS_MGMT_PATH}/permissions`)
  return res.data?.data || []
}

/** Fetch complete Permission Matrix (roles & permissions grouped by section) */
export async function getPermissionMatrix() {
  const res = await apiClient.get(`${PERMS_MGMT_PATH}/matrix`)
  return res.data?.data || { roles: [], permissions: {} }
}

/**
 * Instant toggle of a single role permission
 * PUT /permissions-management/roles/{roleId}/permissions/{permissionId}
 * @param {number|string} roleId
 * @param {number|string} permissionId
 * @param {boolean} isAllowed
 */
export async function updateSingleRolePermission(roleId, permissionId, isAllowed) {
  const res = await apiClient.put(
    `${PERMS_MGMT_PATH}/roles/${roleId}/permissions/${permissionId}`,
    { is_allowed: Boolean(isAllowed) }
  )
  return res.data?.data || res.data
}

/**
 * Bulk save of all role permissions
 * PUT /permissions-management/roles/{roleId}/permissions
 * @param {number|string} roleId
 * @param {Array<{ permission_id: number, is_allowed: boolean }>} permissions
 */
export async function bulkUpdateRolePermissions(roleId, permissions) {
  const res = await apiClient.put(
    `${PERMS_MGMT_PATH}/roles/${roleId}/permissions`,
    {
      permissions: permissions.map((p) => ({
        permission_id: Number(p.permission_id),
        is_allowed: Boolean(p.is_allowed),
      })),
    }
  )
  return res.data
}

/**
 * Fetch direct permissions for a specific user
 * GET /permissions-management/users/{userId}/permissions
 * @param {number|string} userId
 */
export async function getUserDirectPermissions(userId) {
  const res = await apiClient.get(`${PERMS_MGMT_PATH}/users/${userId}/permissions`)
  return res.data?.data || []
}

/**
 * Update a direct permission for a specific user
 * PUT /permissions-management/users/{userId}/permissions/{permissionId}
 * @param {number|string} userId
 * @param {number|string} permissionId
 * @param {boolean} isAllowed
 */
export async function updateUserDirectPermission(userId, permissionId, isAllowed) {
  const res = await apiClient.put(
    `${PERMS_MGMT_PATH}/users/${userId}/permissions/${permissionId}`,
    { is_allowed: Boolean(isAllowed) }
  )
  return res.data?.data || res.data
}

/**
 * Fetch audit logs with optional pagination
 * GET /permissions-management/audit-logs
 * @param {Object} [params]
 */
export async function getAuditLogs(params = {}) {
  const res = await apiClient.get(`${PERMS_MGMT_PATH}/audit-logs`, { params })
  return res.data?.data || { data: [], current_page: 1, total: 0 }
}
