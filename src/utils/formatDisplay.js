/** Shared display helpers — keep UI formatters out of mock data modules. */

export function toDateInputValue(value) {
  if (!value) return ''
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function toTimeInputValue(value) {
  if (!value) return ''
  const text = String(value)
  const match = text.match(/(\d{2}):(\d{2})/)
  if (match) return `${match[1]}:${match[2]}`
  return text.slice(0, 5)
}

export function formatDisplayDate(value) {
  const iso = toDateInputValue(value)
  if (!iso) return '—'
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

/** Format HH:mm for display (drops useless :00 seconds). */
export function formatDisplayTime(value) {
  const text = toTimeInputValue(value)
  if (!text) return ''
  return text
}

/**
 * Replace raw timestamps inside API activity strings, e.g.
 * "26-07-2026 00:00:00" → "٢٦‏/٧‏/٢٠٢٦"
 */
export function prettifyEmbeddedDates(text) {
  if (!text) return ''
  let out = String(text)

  out = out.replace(
    /(\d{2})-(\d{2})-(\d{4})(?:[ T](\d{2}):(\d{2})(?::\d{2})?)?/g,
    (_, d, m, y, h, min) => {
      const dateLabel = formatDisplayDate(`${y}-${m}-${d}`)
      if (h == null || (h === '00' && (min === '00' || min == null))) return dateLabel
      return `${dateLabel} الساعة ${h}:${min}`
    },
  )

  out = out.replace(
    /(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::\d{2})?)?/g,
    (_, y, m, d, h, min) => {
      const dateLabel = formatDisplayDate(`${y}-${m}-${d}`)
      if (h == null || (h === '00' && (min === '00' || min == null))) return dateLabel
      return `${dateLabel} الساعة ${h}:${min}`
    },
  )

  out = out.replace(/\s{2,}/g, ' ').trim()
  return out
}

/** Pick an activity icon from title/type keywords. */
export function activityIconFor(item = {}) {
  const blob = `${item.type ?? ''} ${item.title ?? ''} ${item.description ?? ''}`.toLowerCase()
  if (/موعد|appointment|meeting/.test(blob)) return 'appointments'
  if (/جلسة|session|court/.test(blob)) return 'sessions'
  if (/مستند|document|ملف/.test(blob)) return 'documents'
  if (/فاتورة|دفع|invoice|payment/.test(blob)) return 'invoices'
  if (/موكل|client/.test(blob)) return 'clients'
  if (/محام|lawyer/.test(blob)) return 'lawyers'
  if (/قضية|case/.test(blob)) return 'cases'
  return 'bell'
}

/** Drop repeated lead phrase when API echoes the title inside description. */
export function stripRedundantActivityLead(title, description) {
  if (!title || !description) return description || ''
  let desc = String(description).trim()
  const leads = [
    title,
    title.replace(/[:：]\s*$/, ''),
    title.replace(/موعد(?!\s*ال)/, 'الموعد'),
    title.replace(/الموعد/, 'موعد'),
  ]
  for (const lead of leads) {
    const cleaned = String(lead || '').trim()
    if (!cleaned) continue
    if (desc.startsWith(cleaned)) {
      desc = desc.slice(cleaned.length).replace(/^[:：\s\-]+/, '')
      break
    }
  }
  return desc.trim()
}

export function formatMoney(amount, currency = 'ج.م') {
  const num = Number(amount)
  if (Number.isNaN(num)) return `0.00 ${currency}`
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

export function formatFileSize(bytes) {
  const size = Number(bytes) || 0
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function formatRelativeTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} د`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `منذ ${hours} س`
  const days = Math.floor(hours / 24)
  if (days < 30) return `منذ ${days} يوم`
  const months = Math.floor(days / 30)
  return `منذ ${months} شهر`
}
