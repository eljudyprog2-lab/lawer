import { Modal } from './Modal'
import { Icon } from './Icon'

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'تأكيد الإجراء',
  message,
  itemName,
  itemDetails,
  warning,
  isLoading = false,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء التراجع',
  variant = 'danger', // 'danger' | 'warning' | 'primary' | 'neutral'
  icon = null,
}) {
  if (!open) return null

  // Styles based on variant
  const isDanger = variant === 'danger'
  const isWarning = variant === 'warning'

  const iconBg = isDanger
    ? 'rgba(196, 69, 69, 0.1)'
    : isWarning
      ? 'rgba(196, 163, 90, 0.15)'
      : 'rgba(30, 58, 60, 0.1)'

  const iconColor = isDanger
    ? 'var(--danger, #c44545)'
    : isWarning
      ? 'var(--brand-gold-dark, #9a7322)'
      : 'var(--brand-teal, #1e3a3c)'

  const defaultIconName = isDanger ? 'trash' : 'alert'

  const confirmBtnBg = isDanger
    ? 'var(--danger, #c44545)'
    : isWarning
      ? 'var(--brand-gold, #c4a35a)'
      : 'var(--brand-teal, #1e3a3c)'

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Warning/Action Icon & Heading */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: iconBg,
              color: iconColor,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name={icon || defaultIconName} size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-h, #1e3a3c)' }}>
              {message || 'هل أنت متأكد من رغبتك في تنفيذ هذا الإجراء؟'}
            </h3>
            {itemName ? (
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.86rem', color: 'var(--text-muted, #6b7f80)', lineHeight: 1.5 }}>
                {isDanger ? 'سيتم إزالة' : 'العنصر المستهدف:'} <strong>«{itemName}»</strong> {isDanger ? 'نهائياً من النظام.' : ''}
              </p>
            ) : null}
          </div>
        </div>

        {/* Optional Item Details Card */}
        {itemDetails && (
          <div
            style={{
              background: 'var(--bg, #f5f8f8)',
              border: '1px solid var(--border, #d5e0e0)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              fontSize: '0.84rem',
              color: 'var(--text, #3d4f50)',
            }}
          >
            {itemDetails}
          </div>
        )}

        {/* Warning banner */}
        {warning && (
          <div
            style={{
              background: 'rgba(196, 163, 90, 0.12)',
              border: '1.5px solid var(--brand-gold, #c4a35a)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#9a7322', fontWeight: 800, fontSize: '0.86rem' }}>
              <Icon name="alert" size={16} />
              <span>تنبيه هام</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#7a5a14', lineHeight: 1.5 }}>
              {warning}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border, #d5e0e0)',
          }}
        >
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              background: confirmBtnBg,
              borderColor: confirmBtnBg,
              color: '#ffffff',
              minWidth: '120px',
              justifyContent: 'center',
            }}
          >
            {isLoading ? (
              <>
                <Icon name="refresh" size={16} className="animate-spin" />
                جاري المعالجة...
              </>
            ) : (
              <>
                <Icon name={icon || (isDanger ? 'trash' : 'check')} size={16} />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function ConfirmDeleteModal(props) {
  return (
    <ConfirmModal
      title={props.title || 'تأكيد الحذف'}
      confirmText={props.confirmText || 'تأكيد الحذف النهائي'}
      variant="danger"
      {...props}
    />
  )
}
