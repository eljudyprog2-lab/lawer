import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { CompanyLogo, PlanBadge, StatusBadge } from './CompanyBadges'
import {
  daysUntil,
  formatDisplayDate,
  isExpiringSoon,
} from '../../api/companies'

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#e8eeee] py-3 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-sm font-semibold text-[#6b7f80]">{label}</dt>
      <dd className="min-w-0 text-sm font-medium text-brand sm:text-end">{children}</dd>
    </div>
  )
}

export function CompanyDetailsModal({ open, company, onClose, onEdit }) {
  if (!company) return null

  const days = daysUntil(company.subscription_end)
  const expiring = isExpiringSoon(company)

  return (
    <Modal
      open={open}
      title="تفاصيل المكتب"
      onClose={onClose}
      wide
      footer={
        <>
          <button
            type="button"
            className="btn btn--primary inline-flex items-center gap-2"
            onClick={() => {
              onClose()
              onEdit?.(company)
            }}
          >
            <Icon name="edit" size={16} />
            تعديل
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            إغلاق
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#d5e0e0] bg-[#f7faf9] p-4 sm:flex-row sm:items-center">
          <CompanyLogo company={company} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl font-extrabold text-brand">{company.name}</h3>
            <p className="mt-1 truncate text-sm text-[#6b7f80]">{company.address || '—'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <PlanBadge plan={company.subscription_plan} />
              <StatusBadge status={company.status} />
              {expiring ? (
                <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                  ينتهي خلال {days} يوماً
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <dl>
          <Row label="البريد الإلكتروني">
            <a href={`mailto:${company.email}`} className="hover:underline" dir="ltr">
              {company.email || '—'}
            </a>
          </Row>
          <Row label="الهاتف">
            <span dir="ltr">{company.phone || '—'}</span>
          </Row>
          <Row label="العنوان">{company.address || '—'}</Row>
          <Row label="بداية الاشتراك">{formatDisplayDate(company.subscription_start)}</Row>
          <Row label="نهاية الاشتراك">{formatDisplayDate(company.subscription_end)}</Row>
          <Row label="معرّف المستأجر">
            <span className="font-mono" dir="ltr">
              #{company.id}
            </span>
          </Row>
        </dl>
      </div>
    </Modal>
  )
}
