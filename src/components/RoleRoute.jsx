import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getNavItems } from '../data/roles'

/** Blocks direct URL access to sections hidden from the current role. */
export function RoleRoute({ navId }) {
  const { user } = useAuth()
  const allowed = getNavItems(user?.roleId).some((item) => item.id === navId)

  if (!allowed) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
