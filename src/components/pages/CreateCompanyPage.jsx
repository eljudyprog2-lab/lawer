import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BrandLogo } from '../ui/BrandLogo'
import { CreateCompanyForm } from '../companies/CreateCompanyForm'

const navLinks = [
  { href: '#features', label: 'المميزات' },
  { href: '#pricing', label: 'الأسعار' },
  { href: '#contact', label: 'تواصل معنا' },
]

export default function CreateCompanyPage() {
  return (
    <div className="register-page">
      <header className="register-header">
        <div className="register-header__inner">
          <Link to="/register-company" className="register-header__brand">
            <span className="register-header__logo" aria-hidden>
              <BrandLogo size={36} />
            </span>
            <span className="register-header__name">منصة إدارة مكاتب المحاماة</span>
          </Link>

          <nav className="register-header__nav" aria-label="روابط المنصة">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <Link to="/login" className="register-header__login">
            تسجيل الدخول
          </Link>
        </div>
      </header>

      <main className="register-main">
        <motion.div
          className="register-hero"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <h1>سجّل مكتبك وابدأ تجربتك المجانية</h1>
          <p>
            إدارة القضايا والعملاء والجلسات في مكان واحد — بدون بطاقة ائتمان، وبدون التزام
          </p>
        </motion.div>

        <CreateCompanyForm />
      </main>
    </div>
  )
}
