import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

export function Modal({
  open,
  title,
  header,
  onClose,
  children,
  footer,
  wide,
  xwide,
  className = '',
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const sizeClass = xwide
    ? ' modal-dialog--xwide'
    : wide
      ? ' modal-dialog--wide'
      : ''

  return createPortal(
    <div className="modal-root" role="presentation">
      <button
        type="button"
        className="modal-backdrop"
        aria-label="إغلاق"
        onClick={onClose}
      />
      <div
        className={`modal-dialog${sizeClass} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'نافذة'}
      >
        <header className="modal-header">
          {header || <h2 className="modal-title">{title}</h2>}
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="إغلاق النافذة"
          >
            <Icon name="close" size={20} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  )
}
