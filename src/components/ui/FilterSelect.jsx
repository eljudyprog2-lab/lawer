import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HiChevronDown } from 'react-icons/hi'

function menuStyle(coords, minWidth = 0) {
  if (!coords) return { display: 'none' }
  return {
    position: 'fixed',
    top: coords.top,
    left: coords.left,
    width: Math.max(coords.width, minWidth),
    zIndex: 2200,
  }
}

/**
 * Custom styled dropdown — filters + forms (native <select> menus can't be themed).
 */
export function FilterSelect({
  value,
  onChange,
  options = [],
  'aria-label': ariaLabel,
  className = '',
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState(null)
  const rootRef = useRef(null)
  const panelRef = useRef(null)
  const listId = useId()
  const selected =
    options.find((opt) => String(opt.value) === String(value ?? '')) ?? options[0]
  const isPlaceholder = selected != null && String(selected.value) === ''

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return undefined
    const update = () => {
      const rect = rootRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      })
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

  const pick = (next) => {
    onChange(String(next))
    setOpen(false)
  }

  return (
    <div
      ref={rootRef}
      className={`filter-select-wrap filter-dropdown${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}${className ? ` ${className}` : ''}`}
    >
      <button
        type="button"
        className="filter-dropdown__trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
      >
        <span className={`filter-dropdown__label${isPlaceholder ? ' is-placeholder' : ''}`}>
          {selected?.label ?? ''}
        </span>
        <HiChevronDown className="filter-dropdown__chevron" size={18} aria-hidden />
      </button>

      {open
        ? createPortal(
            <ul
              ref={panelRef}
              id={listId}
              className="filter-dropdown__menu filter-dropdown__menu--portal"
              role="listbox"
              aria-label={ariaLabel}
              style={menuStyle(coords)}
            >
              {options.map((opt) => {
                const active = String(opt.value) === String(value ?? '')
                return (
                  <li key={`${opt.value}::${opt.label}`} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`filter-dropdown__option${active ? ' is-active' : ''}`}
                      onClick={() => pick(opt.value)}
                    >
                      {opt.label}
                    </button>
                  </li>
                )
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  )
}
