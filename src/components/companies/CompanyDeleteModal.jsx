import { useState } from 'react'
import { ConfirmModal } from '../ui/ConfirmModal'
import { deleteCompany, parseApiError } from '../../api/companies'
import { CompanyLogo } from './CompanyBadges'

export function CompanyDeleteModal({ open, company, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!company) return null

  const handleClose = () => {
    if (loading) return
    setError(null)
    onClose()
  }

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    try {
      await deleteCompany(company.id)
      onDeleted?.(company)
      onClose()
    } catch (err) {
      const parsed = parseApiError(err)
      setError(parsed.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ConfirmModal
      open={open}
      onClose={handleClose}
      onConfirm={handleDelete}
      title="حذف المكتب"
      message="هل أنت متأكد من رغبتك في حذف هذا المكتب نهائياً من المنصة؟"
      itemName={company.name}
      itemDetails={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CompanyLogo company={company} />
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--brand-teal)' }}>{company.name}</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }} dir="ltr">
              {company.email}
            </p>
          </div>
        </div>
      }
      warning="سيتم حذف المكتب المستأجر نهائياً من المنصة مع كافة البيانات المرتبطة به. لا يمكن التراجع عن هذا الإجراء."
      confirmText="تأكيد الحذف"
      cancelText="إلغاء"
      variant="danger"
      isLoading={loading}
    />
  )
}
