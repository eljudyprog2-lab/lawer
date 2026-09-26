import { HiOutlineExclamationCircle } from 'react-icons/hi'

/**
 * Reusable Validation Summary Box component.
 * Displays a styled red-tinted alert box listing validation errors as bullet points
 * above the submit button or at the top of any form/modal across the app.
 *
 * @param {Object|Array|string} errors - Object of field errors, array of messages, or single string.
 * @param {string} [title] - Optional title heading.
 * @param {string} [className] - Optional extra CSS class.
 * @param {Object} [style] - Optional extra styles.
 */
export function ValidationSummaryBox({
  errors,
  title = 'يرجى تصحيح الأخطاء التالية للمتابعة:',
  className = '',
  style = {},
}) {
  if (!errors) return null

  let list = []
  if (Array.isArray(errors)) {
    list = errors.filter(Boolean).map((e) => (typeof e === 'string' ? e : e?.message || String(e)))
  } else if (typeof errors === 'object') {
    list = Object.values(errors)
      .filter(Boolean)
      .map((e) => (typeof e === 'string' ? e : e?.message || String(e)))
  } else if (typeof errors === 'string' && errors.trim()) {
    list = [errors.trim()]
  }

  // Deduplicate and filter empty strings
  list = Array.from(new Set(list.filter((msg) => typeof msg === 'string' && msg.trim() !== '')))

  if (list.length === 0) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`validation-summary-box ${className}`.trim()}
      style={{
        background: 'rgba(196, 69, 69, 0.08)',
        border: '1px solid rgba(196, 69, 69, 0.3)',
        borderRadius: '12px',
        padding: '0.85rem 1.1rem',
        margin: '0.75rem 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        textAlign: 'right',
        direction: 'rtl',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger, #c44545)' }}>
        <HiOutlineExclamationCircle size={20} style={{ flexShrink: 0 }} aria-hidden />
        <span style={{ fontSize: '0.86rem', fontWeight: 800 }}>{title}</span>
      </div>

      {list.length === 1 ? (
        <p style={{ margin: 0, paddingRight: '1.75rem', fontSize: '0.82rem', color: 'var(--danger, #c44545)', fontWeight: 600 }}>
          {list[0]}
        </p>
      ) : (
        <ul
          style={{
            margin: '0.2rem 0 0',
            paddingRight: '1.75rem',
            paddingLeft: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem',
            fontSize: '0.82rem',
            color: 'var(--danger, #c44545)',
            fontWeight: 600,
            listStyleType: 'disc',
          }}
        >
          {list.map((item, idx) => (
            <li key={idx} style={{ lineHeight: 1.4 }}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
