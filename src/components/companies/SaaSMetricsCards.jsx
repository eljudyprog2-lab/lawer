import { StatCard } from '../dashboard/StatCard'

export function SaaSMetricsCards({ metrics, loading = false }) {
  return (
    <section className="stats-grid" style={{ marginBottom: '1.25rem' }}>
      <StatCard
        value={loading ? '—' : (metrics?.total ?? 0)}
        label="إجمالي المكاتب"
        tone="gold"
        icon="home"
        index={0}
      />
      <StatCard
        value={loading ? '—' : (metrics?.active ?? 0)}
        label="اشتراكات نشطة"
        tone="success"
        icon="check"
        index={1}
      />
      <StatCard
        value={loading ? '—' : (metrics?.trial ?? 0)}
        label="حسابات تجريبية"
        tone="teal"
        icon="lawyers"
        index={2}
      />
      <StatCard
        value={loading ? '—' : (metrics?.expiring ?? 0)}
        label="اشتراكات قاربت الانتهاء"
        tone="muted"
        icon="calendar"
        index={3}
      />
    </section>
  )
}
