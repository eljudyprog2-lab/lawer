import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
} from '../api/permissions'
import { jobRoleKeys, userJobRoleKeys, permissionKeys } from './queryKeys'

/* =========================================================================
   1. JOB ROLES HOOKS
   ========================================================================= */

export function useJobRoles(params = {}) {
  const query = useQuery({
    queryKey: jobRoleKeys.list(params),
    queryFn: getJobRoles,
  })

  return {
    jobRoles: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error) : null,
    refetch: query.refetch,
    query,
  }
}

export function useJobRole(id, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: jobRoleKeys.detail(id),
    queryFn: () => getJobRole(id),
    enabled: Boolean(id) && enabled,
  })

  return {
    jobRole: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error) : null,
    refetch: query.refetch,
    query,
  }
}

export function useJobRoleMutations() {
  const qc = useQueryClient()

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: jobRoleKeys.all })
    qc.invalidateQueries({ queryKey: permissionKeys.matrix() })
    qc.invalidateQueries({ queryKey: permissionKeys.dashboard() })
  }

  const create = useMutation({
    mutationFn: createJobRole,
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }) => updateJobRole(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: deleteJobRole,
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

/* =========================================================================
   2. USER JOB ROLES HOOKS
   ========================================================================= */

export function useUserJobRoles(params = {}) {
  const query = useQuery({
    queryKey: userJobRoleKeys.list(params),
    queryFn: getUserJobRoles,
  })

  return {
    userJobRoles: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error) : null,
    refetch: query.refetch,
    query,
  }
}

export function useUserJobRole(id, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: userJobRoleKeys.detail(id),
    queryFn: () => getUserJobRole(id),
    enabled: Boolean(id) && enabled,
  })

  return {
    userJobRole: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error) : null,
    refetch: query.refetch,
    query,
  }
}

export function useUserJobRoleMutations() {
  const qc = useQueryClient()

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: userJobRoleKeys.all })
    qc.invalidateQueries({ queryKey: permissionKeys.dashboard() })
    qc.invalidateQueries({ queryKey: permissionKeys.all })
  }

  const create = useMutation({
    mutationFn: createUserJobRole,
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }) => updateUserJobRole(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: deleteUserJobRole,
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

/* =========================================================================
   3. PERMISSION MANAGEMENT DASHBOARD & MATRIX HOOKS
   ========================================================================= */

export function usePermissionsDashboard() {
  const query = useQuery({
    queryKey: permissionKeys.dashboard(),
    queryFn: getPermissionsDashboard,
  })

  return {
    dashboard: query.data ?? {
      total_roles: 0,
      total_permissions: 0,
      users_with_permissions: 0,
      users_with_roles: 0,
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error) : null,
    refetch: query.refetch,
    query,
  }
}

export function useAllPermissions() {
  const query = useQuery({
    queryKey: permissionKeys.list(),
    queryFn: getAllPermissions,
  })

  return {
    permissions: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error) : null,
    refetch: query.refetch,
    query,
  }
}

export function usePermissionMatrix() {
  const query = useQuery({
    queryKey: permissionKeys.matrix(),
    queryFn: getPermissionMatrix,
  })

  return {
    matrix: query.data ?? { roles: [], permissions: {} },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error) : null,
    refetch: query.refetch,
    query,
  }
}

export function usePermissionMatrixMutations() {
  const qc = useQueryClient()

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: permissionKeys.matrix() })
    qc.invalidateQueries({ queryKey: permissionKeys.dashboard() })
    qc.invalidateQueries({ queryKey: permissionKeys.auditLogs() })
  }

  const toggleSingle = useMutation({
    mutationFn: ({ roleId, permissionId, isAllowed }) =>
      updateSingleRolePermission(roleId, permissionId, isAllowed),
    onSuccess: invalidate,
  })

  const bulkSave = useMutation({
    mutationFn: ({ roleId, permissions }) =>
      bulkUpdateRolePermissions(roleId, permissions),
    onSuccess: invalidate,
  })

  return { toggleSingle, bulkSave }
}

/* =========================================================================
   4. USER DIRECT PERMISSIONS HOOKS
   ========================================================================= */

export function useUserDirectPermissions(userId, { enabled = true } = {}) {
  const query = useQuery({
    queryKey: permissionKeys.userPermissions(userId),
    queryFn: () => getUserDirectPermissions(userId),
    enabled: Boolean(userId) && enabled,
  })

  return {
    directPermissions: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error) : null,
    refetch: query.refetch,
    query,
  }
}

export function useUserDirectPermissionMutations(userId) {
  const qc = useQueryClient()

  const invalidate = () => {
    if (userId) {
      qc.invalidateQueries({ queryKey: permissionKeys.userPermissions(userId) })
    }
    qc.invalidateQueries({ queryKey: permissionKeys.dashboard() })
    qc.invalidateQueries({ queryKey: permissionKeys.auditLogs() })
  }

  const update = useMutation({
    mutationFn: ({ permissionId, isAllowed }) =>
      updateUserDirectPermission(userId, permissionId, isAllowed),
    onSuccess: invalidate,
  })

  return { update }
}

/* =========================================================================
   5. AUDIT LOGS HOOKS
   ========================================================================= */

export function useAuditLogs(params = {}) {
  const query = useQuery({
    queryKey: permissionKeys.auditLogs(params),
    queryFn: () => getAuditLogs(params),
  })

  return {
    auditData: query.data ?? { data: [], current_page: 1, total: 0 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? parseApiError(query.error) : null,
    refetch: query.refetch,
    query,
  }
}
