import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'

export function DocumentNotesModal({ open, document: doc, onClose, onSave }) {
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open && doc) setNotes(doc.notes || '')
  }, [open, doc])

  if (!doc) return null

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await onSave?.(doc.id, notes.trim())
      onClose()
    } catch {
      /* parent surfaces error */
    }
  }

  const header = (
    <div className="details-header">
      <h2 className="details-header__title details-header__title--with-icon">
        <Icon name="notes" size={22} />
        ملاحظات المستند
      </h2>
      <div className="details-header__meta">
        <span>{doc.description || doc.fileName}</span>
      </div>
    </div>
  )

  return (
    <Modal
      open={open}
      title="ملاحظات المستند"
      header={header}
      onClose={onClose}
      footer={
        <>
          <button type="submit" form="doc-notes-form" className="btn btn--primary">
            حفظ الملاحظة
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            إغلاق
          </button>
        </>
      }
    >
      <form id="doc-notes-form" className="doc-notes-form" onSubmit={handleSave}>
        <label className="field field--full">
          <span className="field__label">الملاحظة</span>
          <textarea
            className="input input--area doc-notes-form__area"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="اكتب ملاحظة على المستند..."
          />
        </label>
      </form>
    </Modal>
  )
}
