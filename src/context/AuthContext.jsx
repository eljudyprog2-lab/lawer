import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import {
  authenticate,
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
    (payload) => {
      const session = authenticate(payload)
      if (!session) {
        showToast('بيانات الدخول غير صحيحة', 'error')
        return false
      }
      // Assign default company_id=2 on login so the axios interceptor
      // automatically injects ?company_id=2 in every API request.
      const sessionWithCompany = {
        ...session,
        company_id: session.company_id ?? 2,
        company_name: session.company_name ?? 'Law Office',
      }
      writeAuthSession(sessionWithCompany)
      setUser(sessionWithCompany)
      showToast('تم تسجيل الدخول بنجاح', 'success')
      return true
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
      toast,
    }),
    [user, login, register, registering, logout, setCompany, toast],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
