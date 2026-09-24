import firmLogoImg from '../../assets/d.png'
import { firm } from '../../data/dashboard'

export function FirmBrand({ variant = 'sidebar', showName = true, className = '' }) {
  const rootClass = ['firm-brand', `firm-brand--${variant}`, className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      <img
        className="firm-brand__logo"
        src={firmLogoImg}
        alt="شعار مكتب الدوسري"
        decoding="async"
      />
      {showName ? <div className="firm-brand__name">{firm.shortName}</div> : null}
    </div>
  )
}
