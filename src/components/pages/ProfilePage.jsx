import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { isSamePerson } from '../../data/roles'
import { remaining, formatMoney } from '../../api/invoices'
import { useInvoices } from '../../hooks/useInvoices'
import { useClients } from '../../hooks/useClients'

function display(value) {
  if (value === 0) return '0'
  return value || '—'
}

function initialsFromName(name) {
  if (!name) return '—'
  return String(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { invoices } = useInvoices()
  const { clients } = useClients()

  const matchedClient = useMemo(
    () => clients.find((c) => isSamePerson(c.name, user?.name)) ?? null,
    [clients, user?.name],
  )

  const balance = useMemo(() => {
    if (user?.roleId !== 'client') return null
    const clientId = matchedClient?.id != null ? String(matchedClient.id) : null
    const scoped = invoices.filter((inv) => {
      if (clientId && inv.clientId) return inv.clientId === clientId
      return isSamePerson(inv.clientName, user?.name)
    })
    return scoped.reduce((sum, inv) => sum + remaining(inv), 0)
  }, [invoices, matchedClient, user?.name, user?.roleId])

  const profile = {
    name: user?.name ?? '—',
    email: user?.email ?? '—',
    role: user?.role ?? '—',
    type: user?.role ?? '—',
    status: user?.status || 'نشط',
    phone: user?.phone || matchedClient?.phone || '—',
    address: user?.address || matchedClient?.address || '',
    nationalId: user?.nationalId || matchedClient?.nationalId || '',
    initials: user?.initials || initialsFromName(user?.name),
    balance,
  }

  const rows = [
    { label: 'الاسم', value: profile.name },
    { label: 'البريد الإلكتروني', value: profile.email },
    { label: 'الهاتف', value: profile.phone },
    { label: 'العنوان', value: profile.address },
    { label: 'رقم الهوية', value: profile.nationalId },
    { label: 'النوع', value: profile.type },
    { label: 'الحالة', value: profile.status },
    {
      label: 'الرصيد',
      value:
        typeof profile.balance === 'number'
          ? formatMoney(profile.balance)
          : '—',
    },
  ]

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-hero__avatar" aria-hidden>
          {profile.initials}
        </div>
        <div>
          <h2 className="profile-hero__name">{profile.name}</h2>
          <p className="profile-hero__role">{profile.role}</p>
        </div>
        <span className="status-pill status-pill--active">{profile.status}</span>
        <button
          type="button"
          className="btn btn--ghost profile-logout"
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
        >
          تسجيل الخروج
        </button>
      </div>

      <section className="profile-card">
        <header className="profile-card__head">
          <Icon name="person" size={20} />
          <h3>الملف الشخصي</h3>
        </header>
        <dl className="profile-list">
          {rows.map((row) => (
            <div key={row.label} className="profile-list__row">
              <dt>{row.label}</dt>
              <dd>{display(row.value)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
