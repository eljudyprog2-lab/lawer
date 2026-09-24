import { NavLink } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { FirmBrand } from '../ui/FirmBrand'
import { firm } from '../../data/dashboard'
import { getNavItems } from '../../data/roles'
import { useAuth } from '../../context/AuthContext'

export function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const items = getNavItems(user?.roleId)

  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} aria-label="القائمة الرئيسية">
      <div className="sidebar__brand">
        <FirmBrand variant="sidebar" />
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `nav-link${isActive ? ' nav-link--active' : ''}`
            }
            onClick={onClose}
          >
            <span className="nav-link__icon">
              <Icon name={item.icon} />
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div>{firm.name}</div>
        <div style={{ marginTop: '0.35rem', color: 'rgba(212, 184, 110, 0.75)' }}>
          {firm.phone}
        </div>
      </div>
    </aside>
  )
}
