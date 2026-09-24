const AUTH_KEY = 'doussary_auth'

export const authRoles = [
  { id: 'client', label: 'موكل', icon: 'clients' },
  { id: 'admin', label: 'إدارة', icon: 'cog' },
  { id: 'lawyer', label: 'محامي', icon: 'lawyers' },
]

export const demoAccounts = {
  admin: { email: 'admin@test.com', password: '123456', name: 'مدير النظام', role: 'المستشار العام' },
  lawyer: { email: 'lawyer@test.com', password: '123456', name: 'د. سارة محمود', role: 'محامي' },
  client: {
    email: 'client@test.com',
    password: '123456',
    name: 'محمد اشرف',
    role: 'موكل',
    phone: '01234567890',
  },
}

export function readAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeAuthSession(session) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_KEY)
}

export function authenticate({ email, password, role }) {
  const account = demoAccounts[role]
  const normalized = String(email || '').trim().toLowerCase()

  if (account && normalized === account.email && password === account.password) {
    return {
      name: account.name,
      email: account.email,
      phone: account.phone || '',
      role: account.role,
      roleId: role,
      status: 'نشط',
      initials: account.name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join(''),
    }
  }

  // Allow any credentials for demo if matching role label flow
  if (normalized && password && password.length >= 4) {
    const fallbackName = account?.name || 'مستخدم النظام'
    return {
      name: fallbackName,
      email: normalized,
      phone: account?.phone || '',
      role:
        role === 'admin' ? 'المستشار العام' : role === 'lawyer' ? 'محامي' : 'موكل',
      roleId: role,
      status: 'نشط',
      initials: fallbackName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join(''),
    }
  }

  return null
}

export function registerUser(form) {
  if (!form.name.trim() || !form.email.trim() || form.password.length < 4) {
    return { ok: false, message: 'تحقق من البيانات المدخلة' }
  }
  if (form.password !== form.confirmPassword) {
    return { ok: false, message: 'كلمتا المرور غير متطابقتين' }
  }

  const session = {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    nationalId: form.nationalId.trim(),
    address: form.address.trim(),
    role:
      form.role === 'admin'
        ? 'المستشار العام'
        : form.role === 'lawyer'
          ? 'محامي'
          : 'موكل',
    roleId: form.role,
    status: 'نشط',
    initials: form.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join(''),
  }

  writeAuthSession(session)
  return { ok: true, session }
}
