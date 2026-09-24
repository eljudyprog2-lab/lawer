import { useState } from 'react'
import { HiOutlineExclamationCircle, HiOutlineRefresh, HiOutlineTrash } from 'react-icons/hi'
import { Modal } from '../ui/Modal'
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
    <Modal
      open={open}
      title="حذف المكتب"
      onClose={handleClose}
      footer={
        <>
          <button
            type="button"
            className="btn inline-flex items-center gap-2 border-0 bg-[#c44545] text-white hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <HiOutlineRefresh size={18} className="animate-spin" aria-hidden />
                جاري الحذف...
              </>
            ) : (
              <>
                <HiOutlineTrash size={18} aria-hidden />
                تأكيد الحذف
              </>
            )}
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleClose} disabled={loading}>
            إلغاء
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <HiOutlineExclamationCircle size={22} className="mt-0.5 shrink-0" />
          <p>
            سيتم حذف المكتب المستأجر نهائياً من المنصة. لا يمكن التراجع عن هذا الإجراء.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#d5e0e0] bg-white p-3">
          <CompanyLogo company={company} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-brand">{company.name}</p>
            <p className="truncate text-xs text-[#6b7f80]" dir="ltr">
              {company.email}
            </p>
          </div>
        </div>

        {error ? (
          <p className="text-sm font-medium text-[#c44545]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
