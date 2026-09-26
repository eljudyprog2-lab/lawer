import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import { loginApi } from '../api/auth'
import {
  clearAuthSession,
  readAuthSession,
  writeAuthSession,
} from '../data/auth'
import { parseApiError, registerUserViaApi } from '../api/users'
import { queryClient } from '../lib/queryClient'
import { userKeys } from '../hooks/queryKeys'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readAuthSession())
  const [toast, setToast] = useState(null)
  const [registering, setRegistering] = useState(false)

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 2800)
  }, [])

  const login = useCallback(
    async (payload) => {
      try {
        const loginIdentifier = payload.login || payload.email || ''
        const data = await loginApi({
          login: loginIdentifier,
          password: payload.password,
          role: payload.role || 'admin',
        })
        const userObj = data?.data?.user || data?.user || {}
        const companyId = data?.data?.company_id || data?.company_id || userObj.company_id || 2
        const sessionWithCompany = {
          token: data?.data?.token || data?.token || data?.access_token || '',
          id: userObj.id,
          name: userObj.full_name || userObj.name || loginIdentifier,
          email: userObj.email || loginIdentifier,
          phone: userObj.phone || '',
          role: userObj.role || payload.role || 'admin',
          roleId: payload.role || userObj.role || 'admin',
          company_id: companyId,
          company_name: userObj.company?.name || 'Law Office',
          status: userObj.status || 'نشط',
          raw: userObj,
        }
        writeAuthSession(sessionWithCompany)
        setUser(sessionWithCompany)
        showToast('تم تسجيل الدخول بنجاح', 'success')
        return { ok: true, data: sessionWithCompany }
      } catch (err) {
        const parsed = parseApiError(err)
        showToast(parsed.message, 'error')
        return { ok: false, error: parsed }
      }
    },
    [showToast],
  )

  /**
   * Create account via POST /api/users — backend is the source of truth.
   * Returns true on success, false on validation/API failure.
   */
  const register = useCallback(
    async (form) => {
      if (registering) return false
      setRegistering(true)
      try {
        const session = await registerUserViaApi(form, {
          companyId: form.company_id ?? 2,
        })
        const sessionWithCompany = {
          ...session,
          company_id: session.company_id ?? 2,
          company_name: session.company_name ?? 'Law Office',
        }
        writeAuthSession(sessionWithCompany)
        setUser(sessionWithCompany)
        await queryClient.invalidateQueries({ queryKey: userKeys.all })
        showToast('تم إنشاء الحساب بنجاح', 'success')
        return true
      } catch (err) {
        if (err?.isValidation) {
          showToast(err.message, 'error')
        } else {
          showToast(parseApiError(err).message, 'error')
        }
        return false
      } finally {
        setRegistering(false)
      }
    },
    [registering, showToast],
  )

  const logout = useCallback(() => {
    clearAuthSession()
    setUser(null)
    showToast('تم تسجيل الخروج', 'success')
  }, [showToast])

  /**
   * Switch the active company context at runtime.
   * Persists company_id into localStorage session so the axios interceptor
   * can inject ?company_id=X into every subsequent API request automatically.
   */
  const setCompany = useCallback((company) => {
    setUser((prev) => {
      const updated = {
        ...(prev ?? {}),
        company_id: company.id,
        company_name: company.name,
        company_logo: company.logo ?? null,
      }
      writeAuthSession(updated)
      return updated
    })
  }, [])

  const updateUserProfile = useCallback((patch) => {
    setUser((prev) => {
      const updated = {
        ...(prev ?? {}),
        ...patch,
      }
      writeAuthSession(updated)
      return updated
    })
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      company_id: user?.company_id ?? null,
      login,
      register,
      registering,
      logout,
      setCompany,
      updateUserProfile,
      toast,
    }),
    [user, login, register, registering, logout, setCompany, updateUserProfile, toast],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
