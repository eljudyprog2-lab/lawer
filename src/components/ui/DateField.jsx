import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HiChevronLeft, HiChevronRight, HiOutlineCalendar } from 'react-icons/hi'
import { formatDisplayDate, toDateInputValue } from '../../utils/formatDisplay'

const WEEKDAYS = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج']
const MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

function parseIso(value) {
  const iso = toDateInputValue(value)
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? null : date
}

function toIso(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function sameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function weekdayIndex(date) {
  return (date.getDay() + 1) % 7
}

function buildMonthCells(viewDate) {
  const first = startOfMonth(viewDate)
  const startOffset = weekdayIndex(first)
  const cells = []
  const cursor = new Date(first)
  cursor.setDate(1 - startOffset)

  for (let i = 0; i < 42; i += 1) {
    cells.push({
      date: new Date(cursor),
      inMonth: cursor.getMonth() === viewDate.getMonth(),
      iso: toIso(cursor),
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return cells
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
 * Custom Arabic RTL date field — replaces native <input type="date">.
 * Value / onChange use YYYY-MM-DD.
 */
export function DateField({
  value = '',
  onChange,
  'aria-label': ariaLabel,
  placeholder = 'اختر التاريخ',
  className = '',
  disabled = false,
  required = false,
  name,
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState(null)
  const selected = parseIso(value)
  const [view, setView] = useState(() => startOfMonth(selected || new Date()))
  const rootRef = useRef(null)
  const panelRef = useRef(null)
  const panelId = useId()
  const today = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [open])

  useEffect(() => {
    if (open) setView(startOfMonth(selected || new Date()))
  }, [open, value])

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return undefined
    const update = () => {
      const rect = rootRef.current.getBoundingClientRect()
      const width = Math.max(rect.width, 300)
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

  const cells = useMemo(() => buildMonthCells(view), [view])
  const label = selected ? formatDisplayDate(toIso(selected)) : placeholder

  const pick = (iso) => {
    onChange?.(iso)
    setOpen(false)
  }

  const clear = () => {
    onChange?.('')
    setOpen(false)
  }

  const pickToday = () => pick(toIso(today))

  return (
    <div
      ref={rootRef}
      className={`date-field${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}${className ? ` ${className}` : ''}`}
    >
      {name ? <input type="hidden" name={name} value={value || ''} readOnly /> : null}
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
        <span className={`date-field__value${!selected ? ' is-placeholder' : ''}`}>{label}</span>
        <HiOutlineCalendar className="date-field__icon" size={18} aria-hidden />
      </button>

      {open
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              className="date-field__panel date-field__panel--portal"
              role="dialog"
              aria-label={ariaLabel || 'اختيار التاريخ'}
              style={panelStyle(coords)}
            >
              <div className="date-field__header">
                <button
                  type="button"
                  className="date-field__nav"
                  aria-label="الشهر السابق"
                  onClick={() => setView((prev) => addMonths(prev, -1))}
                >
                  <HiChevronRight size={18} aria-hidden />
                </button>
                <p className="date-field__month">
                  {MONTHS[view.getMonth()]} {view.getFullYear()}
                </p>
                <button
                  type="button"
                  className="date-field__nav"
                  aria-label="الشهر التالي"
                  onClick={() => setView((prev) => addMonths(prev, 1))}
                >
                  <HiChevronLeft size={18} aria-hidden />
                </button>
              </div>

              <div className="date-field__weekdays" aria-hidden>
                {WEEKDAYS.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="date-field__grid" role="grid">
                {cells.map((cell) => {
                  const isSelected = sameDay(cell.date, selected)
                  const isToday = sameDay(cell.date, today)
                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      role="gridcell"
                      aria-selected={isSelected}
                      className={[
                        'date-field__day',
                        cell.inMonth ? '' : ' is-outside',
                        isSelected ? ' is-selected' : '',
                        isToday ? ' is-today' : '',
                      ].join('')}
                      onClick={() => pick(cell.iso)}
                    >
                      {cell.date.getDate()}
                    </button>
                  )
                })}
              </div>

              <div className="date-field__footer">
                {!required ? (
                  <button type="button" className="date-field__action" onClick={clear}>
                    مسح
                  </button>
                ) : (
                  <span />
                )}
                <button type="button" className="date-field__action date-field__action--accent" onClick={pickToday}>
                  اليوم
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
