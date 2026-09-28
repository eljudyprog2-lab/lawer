import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Icon } from '../components/ui/Icon'

const ToastContext = createContext(null)

// Fallback singleton state for safe execution outside of React render tree or in tests
let globalToastEmitter = null

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (message, tone = 'success', customDuration = null) => {
      if (!message) return null
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

      // Determine duration & persistence
      // success / info: auto-dismiss ~3.5s
      // warning: auto-dismiss ~5s
      // error: keep visible until dismissed (or longer duration e.g. 12s with close button)
      let duration = customDuration
      let isPersistent = false

      if (duration === null || duration === undefined) {
        if (tone === 'error') {
          isPersistent = true
          duration = 12000 // 12 seconds or until closed
        } else if (tone === 'warning') {
          duration = 5000
        } else {
          duration = 3500
        }
      }

      const newToast = {
        id,
        message: typeof message === 'string' ? message : String(message),
        tone: ['success', 'error', 'warning', 'info'].includes(tone) ? tone : 'success',
        duration,
        isPersistent,
        timestamp: Date.now(),
      }

      setToasts((prev) => [...prev, newToast])

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id)
        }, duration)
        timersRef.current.set(id, timer)
      }

      return id
    },
    [dismissToast],
  )

  // Attach global emitter
  useEffect(() => {
    globalToastEmitter = showToast
    return () => {
      globalToastEmitter = null
    }
  }, [showToast])

  // Cleanup timers on unmount
  useEffect(() => {
    const currentTimers = timersRef.current
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer))
      currentTimers.clear()
    }
  }, [])

  const toastHelpers = useMemo(
    () => ({
      success: (msg, dur) => showToast(msg, 'success', dur),
      error: (msg, dur) => showToast(msg, 'error', dur),
      warning: (msg, dur) => showToast(msg, 'warning', dur),
      info: (msg, dur) => showToast(msg, 'info', dur),
    }),
    [showToast],
  )

  const contextValue = useMemo(
    () => ({
      toasts,
      showToast,
      toast: toastHelpers,
      dismissToast,
    }),
    [toasts, showToast, toastHelpers, dismissToast],
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

/**
 * Hook to access the unified toast system.
 * If used outside ToastProvider, provides safe fallback functions to avoid crashing tests.
 */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (ctx) return ctx

  // Fallback if rendered outside ToastProvider (e.g. in test suites)
  return {
    toasts: [],
    showToast: (msg, tone = 'success') => {
      if (globalToastEmitter) return globalToastEmitter(msg, tone)
      return `fallback-${Date.now()}`
    },
    toast: {
      success: (msg) => (globalToastEmitter ? globalToastEmitter(msg, 'success') : null),
      error: (msg) => (globalToastEmitter ? globalToastEmitter(msg, 'error') : null),
      warning: (msg) => (globalToastEmitter ? globalToastEmitter(msg, 'warning') : null),
      info: (msg) => (globalToastEmitter ? globalToastEmitter(msg, 'info') : null),
    },
    dismissToast: () => {},
  }
}

/**
 * Unified Toast Container
 * Fixed position: bottom-left of the screen, on every page, every time — never top, never centered, never scrolls.
 */
export function ToastContainer() {
  const ctx = useContext(ToastContext)
  if (!ctx || !ctx.toasts || ctx.toasts.length === 0) return null

  const { toasts, dismissToast } = ctx

  return (
    <div
      className="unified-toast-container"
      role="region"
      aria-label="الإشعارات والتنبيهات"
      aria-live="polite"
    >
      {toasts.map((item) => {
        const isError = item.tone === 'error'
        const isWarning = item.tone === 'warning'
        const isInfo = item.tone === 'info'

        let iconName = 'check'
        let badgeLabel = 'تم بنجاح'
        if (isError) {
          iconName = 'alert'
          badgeLabel = 'تنبيه خطأ'
        } else if (isWarning) {
          iconName = 'alert'
          badgeLabel = 'تنبيه نظام'
        } else if (isInfo) {
          iconName = 'info'
          badgeLabel = 'إشعار'
        }

        return (
          <div
            key={item.id}
            className={`unified-toast unified-toast--${item.tone}`}
            role="alert"
            aria-live={isError ? 'assertive' : 'polite'}
          >
            <div className="unified-toast__icon-wrap">
              <Icon name={iconName} size={18} />
            </div>

            <div className="unified-toast__content">
              <div className="unified-toast__header">
                <span className="unified-toast__badge">{badgeLabel}</span>
                <span className="unified-toast__time">الآن</span>
              </div>
              <span className="unified-toast__message">{item.message}</span>
            </div>

            <button
              type="button"
              className="unified-toast__close"
              onClick={() => dismissToast(item.id)}
              aria-label="إغلاق التنبيه"
              title="إغلاق"
            >
              <Icon name="close" size={14} />
            </button>

            {item.duration > 0 && (
              <div
                className="unified-toast__progress"
                style={{ animationDuration: `${item.duration}ms` }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
