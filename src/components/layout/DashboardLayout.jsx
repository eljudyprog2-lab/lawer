import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../dashboard/Sidebar'
import { Topbar } from '../dashboard/Topbar'
import { navItems } from '../../data/dashboard'
import { dashboardTitles } from '../../data/roles'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../hooks/useNotifications'

const titles = {
  ...Object.fromEntries(navItems.map((item) => [item.path, item.label])),
  '/profile': 'الملف الشخصي',
  '/notifications': 'الإشعارات',
}

export function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { unreadCount } = useNotifications()

  const title =
    pathname === '/'
      ? dashboardTitles[user?.roleId] || dashboardTitles.admin
      : titles[pathname] || 'مكتب الدوسري'

  return (
    <div className="app-shell">
      <div
        className={`sidebar-overlay${menuOpen ? ' sidebar-overlay--visible' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="main-area">
        <Topbar
          title={title}
          onMenuClick={() => setMenuOpen(true)}
          unreadNotifications={unreadCount}
        />
        <main className="content page-enter">
          <Outlet />
        </main>
      </div>

      <div className="db-status" role="status">
        <span className="db-status__dot" />
        متصل بقاعدة البيانات
      </div>
    </div>
  )
}
