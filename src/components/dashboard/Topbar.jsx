import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { currentUser as fallbackUser } from '../../data/dashboard'

export function Topbar({ title, onMenuClick, unreadNotifications = 0 }) {
  const { user } = useAuth()
  const profile = user || fallbackUser

  return (
    <header className="topbar">
      <div className="topbar__title-block">
        <button
          type="button"
          className="mobile-toggle"
          onClick={onMenuClick}
          aria-label="فتح القائمة"
        >
          <Icon name="menu" />
        </button>
        <div className="topbar__title-icon">
          <Icon name="user" />
        </div>
        <h1 className="topbar__title">{title}</h1>
      </div>

      <div className="topbar__actions">
        <Link
          to="/notifications"
          className="icon-btn"
          aria-label="الإشعارات"
          title="الإشعارات"
        >
          <Icon name="bell" />
          {unreadNotifications > 0 && (
            <span className="icon-btn__badge">{unreadNotifications}</span>
          )}
        </Link>

        <Link to="/profile" className="user-chip" title="الملف الشخصي">
          <div className="user-chip__meta">
            <span className="user-chip__name">{profile.name}</span>
            <span className="user-chip__role">{profile.role}</span>
          </div>
          <div className="user-chip__avatar" aria-hidden>
            {profile.initials}
          </div>
        </Link>
      </div>
    </header>
  )
}
