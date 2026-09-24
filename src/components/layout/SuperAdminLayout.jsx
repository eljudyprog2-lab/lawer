import { Link, Outlet } from 'react-router-dom'
import { HiOutlineLogin, HiOutlineOfficeBuilding } from 'react-icons/hi'

/**
 * Standalone platform shell — NOT the tenant (Dosari) dashboard.
 * Used for Super-Admin SaaS tenant management.
 */
export function SuperAdminLayout() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(145deg, rgba(196,163,90,0.14) 0%, transparent 42%), linear-gradient(320deg, rgba(30,58,60,0.1) 0%, transparent 48%), linear-gradient(180deg, #f5f8f8 0%, #e8eeee 100%)',
      }}
    >
      <header className="sticky top-0 z-30 border-b border-[#d5e0e0]/80 bg-white/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-gold">
              <HiOutlineOfficeBuilding size={22} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-display text-base font-extrabold text-brand sm:text-lg">
                منصة المكاتب القانونية
              </p>
              <p className="truncate text-xs text-[#6b7f80] sm:text-sm">
                لوحة Super Admin — إدارة المستأجرين والاشتراكات
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/register-company"
              className="hidden rounded-xl border border-[#d5e0e0] bg-white px-3 py-2 text-sm font-semibold text-brand transition hover:border-gold sm:inline-flex"
            >
              تسجيل مكتب
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-soft"
            >
              <HiOutlineLogin size={18} aria-hidden />
              دخول المكتب
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-[#d5e0e0]/70 px-4 py-5 text-center text-xs text-[#6b7f80]">
        منصة SaaS لإدارة مكاتب المحاماة — خارج لوحات المكاتب المستأجرة
      </footer>
    </div>
  )
}
