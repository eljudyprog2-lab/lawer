import { motion } from 'framer-motion'
import { Icon } from '../ui/Icon'

const toneIcons = {
  gold: 'clients',
  teal: 'cases',
  muted: 'calendar',
  success: 'sessions',
}

export function StatCard({
  value,
  label,
  tone = 'gold',
  index = 0,
  icon,
  badge,
  sub,
  trend,
  badgeTone,
}) {
  return (
    <motion.article
      className={`stat-card stat-card--${tone}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.015 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="stat-card__head">
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', flexWrap: 'wrap' }}>
            <div className="stat-card__value">{value}</div>
            {trend && <span className="stat-card__trend">{trend}</span>}
          </div>
          <div className="stat-card__label">{label}</div>
        </div>
        <div className="stat-card__icon" aria-hidden>
          <Icon name={icon || toneIcons[tone] || 'home'} />
        </div>
      </div>
      {(badge || sub) && (
        <div className="stat-card__meta" style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {badge && (
            <span className={`stat-card__badge stat-card__badge--${badgeTone || tone}`}>
              {badge}
            </span>
          )}
          {sub && <span className="stat-card__sub">{sub}</span>}
        </div>
      )}
    </motion.article>
  )
}
