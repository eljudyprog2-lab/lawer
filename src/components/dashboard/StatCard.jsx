import { motion } from 'framer-motion'
import { Icon } from '../ui/Icon'

const toneIcons = {
  gold: 'clients',
  teal: 'cases',
  muted: 'calendar',
  success: 'sessions',
}

export function StatCard({ value, label, tone = 'gold', index = 0, icon }) {
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
          <div className="stat-card__value">{value}</div>
          <div className="stat-card__label">{label}</div>
        </div>
        <div className="stat-card__icon" aria-hidden>
          <Icon name={icon || toneIcons[tone] || 'home'} />
        </div>
      </div>
    </motion.article>
  )
}
