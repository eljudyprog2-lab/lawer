import {
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineOfficeBuilding,
  HiOutlineSparkles,
} from 'react-icons/hi'
import { EXPIRING_WINDOW_DAYS } from '../../api/companies'

const cards = [
  {
    key: 'total',
    label: 'إجمالي المكاتب',
    hint: 'كل المستأجرين على المنصة',
    icon: HiOutlineOfficeBuilding,
    accent: 'from-[#1e3a3c] to-[#2a4f52]',
    iconBg: 'bg-white/15 text-white',
  },
  {
    key: 'active',
    label: 'اشتراكات نشطة',
    hint: 'حالة active',
    icon: HiOutlineCheckCircle,
    accent: 'from-emerald-600 to-emerald-500',
    iconBg: 'bg-white/15 text-white',
  },
  {
    key: 'trial',
    label: 'حسابات تجريبية',
    hint: 'خطة trial',
    icon: HiOutlineSparkles,
    accent: 'from-orange-500 to-amber-500',
    iconBg: 'bg-white/15 text-white',
  },
  {
    key: 'expiring',
    label: 'اشتراكات قاربت الانتهاء',
    hint: `خلال ${EXPIRING_WINDOW_DAYS} يوماً`,
    icon: HiOutlineClock,
    accent: 'from-rose-600 to-rose-500',
    iconBg: 'bg-white/15 text-white',
  },
]

export function SaaSMetricsCards({ metrics, loading = false }) {
  return (
    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        const value = metrics?.[card.key] ?? 0

        return (
          <article
            key={card.key}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.accent} p-4 text-white shadow-[0_14px_32px_rgba(30,58,60,0.14)]`}
          >
            <div
              className="pointer-events-none absolute -start-6 -top-8 size-28 rounded-full bg-white/10"
              aria-hidden
            />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-white/80">{card.label}</p>
                <p className="mt-1 font-display text-3xl font-extrabold tracking-tight">
                  {loading ? '—' : value}
                </p>
                <p className="mt-1 text-[11px] text-white/70">{card.hint}</p>
              </div>
              <span className={`grid size-11 place-items-center rounded-xl ${card.iconBg}`}>
                <Icon size={22} aria-hidden />
              </span>
            </div>
          </article>
        )
      })}
    </div>
  )
}
