import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HiOutlineClock } from 'react-icons/hi'
import { toTimeInputValue } from '../../utils/formatDisplay'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

function parseTime(value) {
  const text = toTimeInputValue(value)
  if (!/^\d{2}:\d{2}$/.test(text)) return { hour: '', minute: '' }
  const [hour, minute] = text.split(':')
  const snapped = String(Math.round(Number(minute) / 5) * 5).padStart(2, '0')
  return {
    hour,
    minute: snapped === '60' ? '55' : snapped,
  }
}

function panelStyle(coords) {
  if (!coords) return { display: 'none' }
  return {
    position: 'fixed',
    top: coords.top,
    left: coords.left,
    width: coords.width,
    zIndex: 2200,
  }
}

/**
 * Custom time picker — HH:mm, same design language as DateField / FilterSelect.
 */
export function TimeField({
  value = '',
  onChange,
  'aria-label': ariaLabel,
  placeholder = 'اختر الوقت',
  className = '',
  disabled = false,
  required = false,
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState(null)
  const parsed = parseTime(value)
  const rootRef = useRef(null)
  const panelRef = useRef(null)
  const panelId = useId()
  const hourListRef = useRef(null)
  const minuteListRef = useRef(null)
  const label = value ? toTimeInputValue(value) : placeholder

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return undefined
    const update = () => {
      const rect = rootRef.current.getBoundingClientRect()
      const width = Math.max(rect.width, 220)
      let left = rect.right - width
      if (left < 8) left = 8
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8
      setCoords({ top: rect.bottom + 6, left, width })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      const t = event.target
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const scrollSelected = (list, sel) => {
      const el = list?.querySelector(`[data-value="${sel}"]`)
      el?.scrollIntoView({ block: 'center' })
    }
    requestAnimationFrame(() => {
      scrollSelected(hourListRef.current, parsed.hour)
      scrollSelected(minuteListRef.current, parsed.minute)
    })
  }, [open, parsed.hour, parsed.minute])

  const setPart = (part, next) => {
    const hour = part === 'hour' ? next : parsed.hour || '09'
    const minute = part === 'minute' ? next : parsed.minute || '00'
    onChange?.(`${hour}:${minute}`)
  }

  const clear = () => {
    onChange?.('')
    setOpen(false)
  }

  const hours = useMemo(() => HOURS, [])
  const minutes = useMemo(() => MINUTES, [])

  return (
    <div
      ref={rootRef}
      className={`date-field time-field${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}${className ? ` ${className}` : ''}`}
    >
      <button
        type="button"
        className="date-field__trigger"
        aria-label={ariaLabel || placeholder}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
      >
        <span className={`date-field__value${!value ? ' is-placeholder' : ''}`}>{label || placeholder}</span>
        <HiOutlineClock className="date-field__icon" size={18} aria-hidden />
      </button>

      {open
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              className="date-field__panel time-field__panel date-field__panel--portal"
              role="dialog"
              aria-label={ariaLabel || 'اختيار الوقت'}
              style={panelStyle(coords)}
            >
              <div className="time-field__columns">
                <div className="time-field__col">
                  <p className="time-field__col-label">ساعة</p>
                  <div className="time-field__list" ref={hourListRef} role="listbox" aria-label="الساعة">
                    {hours.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        data-value={hour}
                        role="option"
                        aria-selected={parsed.hour === hour}
                        className={`time-field__option${parsed.hour === hour ? ' is-selected' : ''}`}
                        onClick={() => setPart('hour', hour)}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="time-field__col">
                  <p className="time-field__col-label">دقيقة</p>
                  <div className="time-field__list" ref={minuteListRef} role="listbox" aria-label="الدقيقة">
                    {minutes.map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        data-value={minute}
                        role="option"
                        aria-selected={parsed.minute === minute}
                        className={`time-field__option${parsed.minute === minute ? ' is-selected' : ''}`}
                        onClick={() => setPart('minute', minute)}
                      >
                        {minute}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="date-field__footer">
                {!required ? (
                  <button type="button" className="date-field__action" onClick={clear}>
                    مسح
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  className="date-field__action date-field__action--accent"
                  onClick={() => setOpen(false)}
                >
                  تم
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
