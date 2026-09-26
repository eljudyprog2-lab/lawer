import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { ValidationSummaryBox } from '../ui/ValidationSummaryBox'

export function ChangePasswordModal({ open, onClose, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getStrength = (pwd) => {
    if (!pwd) return { score: 0, text: 'غير مدخلة', color: '#cbd5e1', percent: 0 }
    if (pwd.length < 6) return { score: 1, text: 'ضعيفة جداً', color: '#c44545', percent: 25 }
    if (pwd.length < 8) return { score: 2, text: 'متوسطة', color: '#c4a35a', percent: 50 }
    if (pwd.length < 12) return { score: 3, text: 'قوية', color: '#1e3a3c', percent: 75 }
    return { score: 4, text: 'قوية جداً', color: '#2d8a5e', percent: 100 }
  }

  const strength = getStrength(newPassword)
  const clearError = () => { if (error) setError(null) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!currentPassword) { setError('يرجى إدخال كلمة المرور الحالية'); return }
    if (newPassword.length < 6) { setError('كلمة المرور الجديدة يجب أن تتكون من 6 خانات على الأقل'); return }
    if (newPassword !== confirmPassword) { setError('كلمتا المرور الجديدتان غير متطابقتين'); return }

    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 600))
      onSuccess?.('تم تحديث كلمة المرور بنجاح')
      handleClose()
    } catch {
      setError('تعذر تحديث كلمة المرور، يرجى التحقق من كلمة المرور الحالية')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrent(false)
    setShowNew(false)
    setShowConfirm(false)
    setError(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="تغيير كلمة المرور"
      footer={
        <>
          <button type="submit" form="change-password-form" className="btn btn--primary" disabled={loading}>
            <Icon name="check" size={18} />
            {loading ? 'جاري الحفظ...' : 'تحديث كلمة المرور'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleClose} disabled={loading}>
            إلغاء
          </button>
        </>
      }
    >
      <form
        id="change-password-form"
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
      >
        <ValidationSummaryBox errors={error} />

        {/* ── كلمة المرور الحالية ── */}
        <div className="chpwd-group">
          <p className="chpwd-group__label">
            <Icon name="lock" size={14} />
            كلمة المرور الحالية
            <span className="field__req"> *</span>
          </p>
          <div className="chpwd-input-wrap">
            <input
              id="current-pwd"
              type={showCurrent ? 'text' : 'password'}
              className="input"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); clearError() }}
              placeholder="••••••••"
              dir="ltr"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="chpwd-eye"
              onClick={() => setShowCurrent((s) => !s)}
              tabIndex={-1}
              aria-label={showCurrent ? 'إخفاء' : 'إظهار'}
            >
              <Icon name={showCurrent ? 'eye-off' : 'eye'} size={16} />
            </button>
          </div>
        </div>

        {/* ── كلمة المرور الجديدة ── */}
        <div className="chpwd-group">
          <p className="chpwd-group__label">
            <Icon name="key" size={14} />
            كلمة المرور الجديدة
            <span className="field__req"> *</span>
          </p>
          <div className="chpwd-input-wrap">
            <input
              id="new-pwd"
              type={showNew ? 'text' : 'password'}
              className="input"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); clearError() }}
              placeholder="••••••••"
              dir="ltr"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="chpwd-eye"
              onClick={() => setShowNew((s) => !s)}
              tabIndex={-1}
              aria-label={showNew ? 'إخفاء' : 'إظهار'}
            >
              <Icon name={showNew ? 'eye-off' : 'eye'} size={16} />
            </button>
          </div>

          {newPassword && (
            <div className="chpwd-strength">
              <span>مستوى القوة:</span>
              <div className="chpwd-strength__bar">
                <div
                  className="chpwd-strength__fill"
                  style={{ width: `${strength.percent}%`, background: strength.color }}
                />
              </div>
              <span style={{ color: strength.color, fontWeight: 700, fontSize: '0.8rem' }}>
                {strength.text}
              </span>
            </div>
          )}
        </div>

        {/* ── تأكيد كلمة المرور ── */}
        <div className="chpwd-group">
          <p className="chpwd-group__label">
            <Icon name="check" size={14} />
            تأكيد كلمة المرور الجديدة
            <span className="field__req"> *</span>
          </p>
          <div className="chpwd-input-wrap">
            <input
              id="confirm-pwd"
              type={showConfirm ? 'text' : 'password'}
              className="input"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); clearError() }}
              placeholder="••••••••"
              dir="ltr"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="chpwd-eye"
              onClick={() => setShowConfirm((s) => !s)}
              tabIndex={-1}
              aria-label={showConfirm ? 'إخفاء' : 'إظهار'}
            >
              <Icon name={showConfirm ? 'eye-off' : 'eye'} size={16} />
            </button>
          </div>
          {confirmPassword && newPassword && confirmPassword === newPassword && (
            <p className="chpwd-match">✓ كلمتا المرور متطابقتان</p>
          )}
        </div>

        {/* بنر المعلومات */}
        <div className="info-banner" style={{ fontSize: '0.84rem', marginTop: '0.25rem' }}>
          <Icon name="info" size={18} />
          <span>بعد تغيير كلمة المرور ستحتاج إلى تسجيل الدخول من جديد على جميع الأجهزة.</span>
        </div>
      </form>
    </Modal>
  )
}
