import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { formatFileSize } from '../../utils/formatDisplay'

function display(value) {
  if (value === 0) return '0'
  return value || '—'
}

export function DocumentDetailsModal({
  open,
  document: doc,
  onClose,
  onDownload,
  onDelete,
  canDelete = true,
}) {
  if (!doc) return null

  const caseLabel = doc.caseTitle
    ? `${doc.caseTitle}${doc.caseNumber ? ` (#${doc.caseNumber})` : ''}`
    : '—'

  const rows = [
    { label: 'اسم الملف', value: doc.fileName },
    { label: 'الوصف', value: doc.description },
    { label: 'نوع المستند', value: doc.docType },
    { label: 'الحجم', value: formatFileSize(doc.sizeBytes) },
    { label: 'القضية المرتبطة', value: caseLabel, link: Boolean(doc.caseId) },
    { label: 'رفع بواسطة', value: doc.uploadedBy },
    { label: 'تاريخ الرفع', value: doc.uploadedAt },
  ]

  const header = (
    <div className="details-header">
      <h2 className="details-header__title details-header__title--with-icon">
        <Icon name="documents" size={22} />
        تفاصيل المستند
      </h2>
      <div className="details-header__meta">
        <span>بيانات المستند والملف المرتبط به في النظام</span>
      </div>
    </div>
  )

  return (
    <Modal
      open={open}
      title="تفاصيل المستند"
      header={header}
      onClose={onClose}
      wide
      footer={
        <>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onDownload?.(doc)}
          >
            <Icon name="download" size={18} />
            تحميل المستند
          </button>
          {canDelete ? (
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                onDelete?.(doc.id)
                onClose()
              }}
            >
              <Icon name="trash" size={18} />
              حذف المستند
            </button>
          ) : null}
        </>
      }
    >
      <section className="doc-details">
        <header className="doc-details__head">
          <span className="doc-details__icon">
            <Icon name="documents" size={18} />
          </span>
          <h3>معلومات المستند</h3>
        </header>
        <dl className="doc-details__list">
          {rows.map((row) => (
            <div key={row.label} className="doc-details__row">
              <dt>{row.label}</dt>
              <dd className={row.link ? 'doc-details__link' : undefined}>
                {display(row.value)}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </Modal>
  )
}
