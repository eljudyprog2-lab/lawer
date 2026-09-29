import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'

export function DeleteOptionModal({
  open,
  onClose,
  onConfirm,
  option,
  groupTitle = '',
  referenceInfo = { isReferenced: false, count: 0, cases: [] },
  isLoading = false,
}) {
  if (!option) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تأكيد حذف خيار من القائمة"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Warning Icon & Heading */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: referenceInfo.isReferenced ? '#fef3c7' : '#fee2e2',
              color: referenceInfo.isReferenced ? '#b45309' : '#dc2626',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="alert" size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              هل أنت متأكد من رغبتك في حذف هذا الخيار؟
            </h3>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
              سيتم إزالة خيار <strong>«{option.name}»</strong> نهائياً من قائمة <strong>«{groupTitle}»</strong>.
            </p>
          </div>
        </div>

        {/* Target Details Card */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            fontSize: '0.82rem',
          }}
        >
          <div>
            <span style={{ color: '#64748b' }}>اسم الخيار المستهدف:</span>
            <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '0.15rem' }}>{option.name}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>المعرف الرقمي للسجل:</span>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)', marginTop: '0.15rem' }}>
              #{option.id}
            </div>
          </div>
        </div>

        {/* Reference warning if associated with cases */}
        {referenceInfo.isReferenced ? (
          <div
            style={{
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#b45309', fontWeight: 800, fontSize: '0.86rem' }}>
              <Icon name="alert" size={16} />
              <span>تنبيه ارتباط السجلات في النظام</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5 }}>
              هذا الخيار مستخدم حالياً في <strong>{referenceInfo.count}</strong> ملف قضية مسجل في النظام
              {referenceInfo.cases.length > 0 ? (
                <> (مثل: {referenceInfo.cases.slice(0, 2).map((c) => c.case_number || c.title).join('، ')})</>
              ) : null}.
              لا يمكن حذف هذا الخيار لارتباطه بقضايا نشطة، لحماية سلامة السجلات في قاعدة البيانات.
            </p>
            <div
              style={{
                marginTop: '0.25rem',
                padding: '0.5rem 0.75rem',
                background: '#fef3c7',
                borderRadius: '8px',
                fontSize: '0.78rem',
                color: '#78350f',
                border: '1px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Icon name="info" size={14} />
              <span>لحذف هذا الخيار: يُرجى تعديل تلك القضايا واختيار تصنيف أو نوع آخر أولاً لفك الارتباط.</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              fontSize: '0.8rem',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Icon name="check" size={16} />
            <span>لم يتم رصد أي ملفات قضايا حالية مرتبطة بهذا الخيار مباشرة.</span>
          </div>
        )}

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            إلغاء التراجع
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onConfirm(option.id)}
            disabled={isLoading || referenceInfo.isReferenced}
            title={referenceInfo.isReferenced ? 'الحذف غير متاح لوجود قضايا مرتبطة بهذا الخيار' : 'تأكيد الحذف النهائي'}
            style={{
              background: referenceInfo.isReferenced ? 'var(--text-muted, #94a3b8)' : 'var(--danger, #c44545)',
              borderColor: referenceInfo.isReferenced ? 'var(--text-muted, #94a3b8)' : 'var(--danger, #c44545)',
              color: '#ffffff',
              minWidth: '140px',
              justifyContent: 'center',
              cursor: referenceInfo.isReferenced ? 'not-allowed' : 'pointer',
              opacity: referenceInfo.isReferenced ? 0.75 : 1,
            }}
          >
            {isLoading ? (
              <>
                <Icon name="refresh" size={16} className="animate-spin" />
                جاري الحذف...
              </>
            ) : referenceInfo.isReferenced ? (
              <>
                <Icon name="lock" size={16} />
                الحذف غير متاح (مرتبط بسجلات)
              </>
            ) : (
              <>
                <Icon name="trash" size={16} />
                تأكيد الحذف النهائي
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
