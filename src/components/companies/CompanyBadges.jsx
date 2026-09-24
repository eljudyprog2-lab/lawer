import { useState } from 'react'
import { planBadgeClass, planLabel, statusBadgeClass, statusLabel } from '../../api/companies'

export function PlanBadge({ plan }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${planBadgeClass(plan)}`}
    >
      {planLabel(plan)}
    </span>
  )
}

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${statusBadgeClass(status)}`}
    >
      {statusLabel(status)}
    </span>
  )
}

export function CompanyLogo({ company, size = 'md' }) {
  const [broken, setBroken] = useState(false)
  const initial = (company?.name || '?').trim().charAt(0)
  const sizeClass = size === 'lg' ? 'size-16 rounded-2xl text-xl' : 'size-10 rounded-xl text-sm'

  if (!company?.logo || broken) {
    return (
      <span
        className={`grid shrink-0 place-items-center bg-brand font-bold text-white ${sizeClass}`}
        aria-hidden
      >
        {initial}
      </span>
    )
  }

  return (
    <img
      src={company.logo}
      alt=""
      className={`shrink-0 border border-[#d5e0e0] bg-white object-cover ${sizeClass}`}
      onError={() => setBroken(true)}
    />
  )
}
