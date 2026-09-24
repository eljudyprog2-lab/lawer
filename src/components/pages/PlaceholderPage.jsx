import { Icon } from '../ui/Icon'

export default function PlaceholderPage({ title, icon = 'home', description }) {
  return (
    <div className="placeholder-page">
      <Icon name={icon} className="placeholder-page__icon" size={42} />
      <h2>{title}</h2>
      <p>
        {description ||
          'هذه الصفحة جاهزة للتطوير ضمن نفس هيكل النظام. المحتوى سيُضاف لاحقاً مع ربط البيانات.'}
      </p>
    </div>
  )
}
