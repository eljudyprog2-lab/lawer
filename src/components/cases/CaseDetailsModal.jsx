import { useCallback, useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { AddEventModal } from './AddEventModal'
import { UploadDocumentModal } from './UploadDocumentModal'
import {
  buildDocumentFormData,
  createCaseDocument,
  downloadDocumentFile,
  fetchCaseDocuments,
  normalizeDocument,
  parseApiError as parseDocError,
} from '../../api/documents'
import { getStoredCompanyId } from '../../api/client'
import { formatDisplayDate } from '../../utils/formatDisplay'

const tabs = [
  { id: 'overview', label: 'نظرة عامة', icon: 'info' },
  { id: 'parties', label: 'الأطراف', icon: 'clients' },
  { id: 'events', label: 'الإجراءات القانونية', icon: 'clock' },
  { id: 'documents', label: 'المستندات', icon: 'documents' },
]

function statusClass(status) {
  if (status === 'closed' || status === 'منتهي') {
    return 'status-pill status-pill--done'
  }
  if (status === 'postponed' || status === 'مؤجل') return 'status-pill status-pill--hold'
  return 'status-pill status-pill--active'
}

function priorityClass(priority) {
  if (priority === 'عاجل' || priority === 'مرتفع' || priority === 'عالي') {
    return 'status-pill status-pill--hold'
  }
  return 'status-pill status-pill--done'
}

function DetailCard({ icon, title, tone, children }) {
  return (
    <section className={`detail-card${tone ? ` detail-card--${tone}` : ''}`}>
      <header className="detail-card__header">
        <span className="detail-card__icon">
          <Icon name={icon} />
        </span>
        <h3>{title}</h3>
      </header>
      <div className="detail-card__body">{children}</div>
    </section>
  )
}

function MetaGrid({ items, cols = 2 }) {
  return (
    <div className={`meta-grid meta-grid--${cols}`}>
      {items.map((item) => (
        <div key={item.label} className="meta-item">
          <span className="meta-item__label">{item.label}</span>
          <span className={`meta-item__value${item.accent ? ' meta-item__value--accent' : ''}`}>
            {item.value || '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

function mapDocForList(doc) {
  return {
    id: doc.id,
    name: doc.description || doc.title || doc.fileName,
    type: doc.docType || '—',
    fileName: doc.fileName,
    filePath: doc.filePath,
    uploadedAt: doc.uploadedAt ? formatDisplayDate(doc.uploadedAt) : '—',
    notes: doc.notes,
    raw: doc.raw,
  }
}

export function CaseDetailsModal({ open, caseData, onClose, onUpdate, readOnly = false }) {
  const [tab, setTab] = useState('overview')
  const [eventOpen, setEventOpen] = useState(false)
  const [docOpen, setDocOpen] = useState(false)
  const [events, setEvents] = useState([])
  const [documents, setDocuments] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [docError, setDocError] = useState(null)

  const loadDocuments = useCallback(async () => {
    if (!caseData?.id) return
    setDocsLoading(true)
    setDocError(null)
    try {
      const list = await fetchCaseDocuments({ case_id: caseData.id })
      setDocuments(list.map(normalizeDocument).map(mapDocForList))
    } catch (err) {
      setDocError(parseDocError(err).message)
      setDocuments([])
    } finally {
      setDocsLoading(false)
    }
  }, [caseData?.id])

  useEffect(() => {
    if (!open || !caseData?.id) return
    setEvents(Array.isArray(caseData.events) ? caseData.events : [])
    loadDocuments()
  }, [open, caseData?.id, caseData?.events, loadDocuments])

  if (!caseData) return null

  const displayStatus =
    caseData.statusUi ??
    (caseData.status === 'قيد' || caseData.status === 'نشطة' ? 'نشط' : caseData.statusLabel ?? caseData.status)

  const statusForPill = caseData.statusUi ?? caseData.statusLabel ?? caseData.status
  const typeLabel = caseData.typeName ?? caseData.type?.name ?? caseData.type ?? '—'
  const priorityDisplay = caseData.priorityLabel ?? caseData.priority
  const stageDisplay = caseData.stageLabel ?? caseData.stage

  const handleAddEvent = (event) => {
    if (readOnly || !onUpdate) return
    setEvents((prev) => [event, ...prev])
    onUpdate()
  }

  const handleAddDocument = async (docForm) => {
    if (readOnly || !onUpdate || !caseData?.id) return
    const companyId = getStoredCompanyId()
    const fd = buildDocumentFormData(
      {
        description: docForm.name,
        fileName: docForm.fileName,
        docType: docForm.type,
        notes: docForm.notes,
        caseId: String(caseData.id),
        file: docForm.file,
      },
      { companyId },
    )
    try {
      await createCaseDocument(fd)
      await loadDocuments()
      onUpdate()
    } catch (err) {
      setDocError(parseDocError(err).message)
      throw err
    }
  }

  const handleDownloadDoc = async (doc) => {
    try {
      await downloadDocumentFile(doc)
    } catch (err) {
      setDocError(err?.message || parseDocError(err).message || 'تعذر تحميل الملف')
    }
  }

  const header = (
    <div className="details-header">
      <h2 className="details-header__title">{caseData.title}</h2>
      <div className="details-header__meta">
        <span>رقم القضية: {caseData.number ?? caseData.case_number}</span>
        <span>النوع: {typeLabel}</span>
        <span className="details-header__status">
          الحالة:{' '}
          <span className={statusClass(statusForPill)}>{displayStatus}</span>
        </span>
      </div>
    </div>
  )

  return (
    <>
      <Modal
        open={open}
        title={caseData.title}
        header={header}
        onClose={() => {
          setTab('overview')
          onClose()
        }}
        xwide
        className="modal-dialog--details"
      >
        <div className="details-tabs" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`details-tab${tab === item.id ? ' details-tab--active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="details-content" role="tabpanel">
          {tab === 'overview' && (
            <div className="details-stack">
              <DetailCard icon="cases" title="معلومات المحكمة">
                <MetaGrid
                  cols={2}
                  items={[
                    { label: 'المحكمة', value: caseData.courtName },
                    { label: 'الدائرة', value: caseData.circuit },
                    { label: 'القاضي', value: caseData.judgeName },
                    { label: 'رقم الدعوى', value: caseData.courtCaseNumber },
                  ]}
                />
              </DetailCard>

              <DetailCard icon="calendar" title="التواريخ المهمة">
                <MetaGrid
                  cols={3}
                  items={[
                    { label: 'تاريخ الواقعة', value: caseData.incidentDate },
                    { label: 'تاريخ التوكيل', value: caseData.powerOfAttorneyDate },
                    { label: 'أول جلسة', value: caseData.firstSession },
                    {
                      label: 'الجلسة القادمة',
                      value: caseData.nextSession,
                      accent: true,
                    },
                    { label: 'انتهاء التقادم', value: caseData.limitationExpiry },
                    { label: 'موعد الحكم', value: caseData.judgmentDeadline },
                  ]}
                />
              </DetailCard>

              <DetailCard icon="tag" title="التصنيف والأولوية">
                <MetaGrid
                  cols={2}
                  items={[
                    {
                      label: 'الأولوية',
                      value: (
                        <span className={priorityClass(priorityDisplay)}>
                          {priorityDisplay}
                        </span>
                      ),
                    },
                    { label: 'التصنيف', value: caseData.classification },
                    { label: 'المرحلة الحالية', value: stageDisplay },
                    { label: 'تاريخ البدء', value: caseData.startDate },
                  ]}
                />
              </DetailCard>

              <DetailCard icon="notes" title="الوصف والملاحظات">
                <p className="detail-text">
                  <strong>وصف القضية:</strong> {caseData.description}
                </p>
                {caseData.internalNotes || caseData.internal_notes ? (
                  <p className="detail-text">
                    <strong>ملاحظات داخلية:</strong>{' '}
                    {caseData.internalNotes ?? caseData.internal_notes}
                  </p>
                ) : null}
              </DetailCard>
            </div>
          )}

          {tab === 'parties' && (
            <div className="details-stack">
              <DetailCard icon="person" title="الموكل">
                <MetaGrid
                  cols={2}
                  items={[
                    {
                      label: 'الاسم',
                      value: caseData.clientDetails?.name || caseData.clientName || caseData.client,
                    },
                    { label: 'رقم الهوية', value: caseData.clientDetails?.nationalId },
                    { label: 'الهاتف', value: caseData.clientDetails?.phone },
                    { label: 'العنوان', value: caseData.clientDetails?.address },
                  ]}
                />
              </DetailCard>

              <DetailCard icon="lawyers" title="المحامي المسؤول">
                <MetaGrid
                  cols={2}
                  items={[
                    {
                      label: 'الاسم',
                      value: caseData.lawyerDetails?.name || caseData.lawyerName || caseData.lawyer,
                    },
                    { label: 'الهاتف', value: caseData.lawyerDetails?.phone },
                    { label: 'البريد', value: caseData.lawyerDetails?.email },
                  ]}
                />
              </DetailCard>

              <DetailCard icon="opponent" title="الطرف الآخر — الخصم" tone="danger">
                <MetaGrid
                  cols={2}
                  items={[
                    { label: 'اسم الخصم', value: caseData.opponent },
                    { label: 'محامي الخصم', value: caseData.opponentLawyer },
                    { label: 'هاتف محامي الخصم', value: caseData.opponentLawyerPhone },
                  ]}
                />
              </DetailCard>
            </div>
          )}

          {tab === 'events' && (
            <div className="tab-panel">
              {!readOnly ? (
                <div className="tab-panel__toolbar">
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setEventOpen(true)}
                  >
                    <Icon name="plus" size={18} />
                    إضافة إجراء
                  </button>
                </div>
              ) : null}
              {events.length === 0 ? (
                <div className="empty-panel">
                  <Icon name="clock" className="empty-panel__icon" />
                  <p>لا توجد أحداث مسجلة</p>
                </div>
              ) : (
                <div className="timeline">
                  {events.map((event) => (
                    <article key={event.id} className="timeline-item">
                      <div className="timeline-item__icon">
                        <Icon name="clock" />
                      </div>
                      <div className="timeline-item__body">
                        <div className="timeline-item__top">
                          <h4>{event.title}</h4>
                          <span className={priorityClass(event.importance)}>
                            {event.importance}
                          </span>
                        </div>
                        <div className="timeline-item__meta">
                          <span>{event.type}</span>
                          <span>{event.date}</span>
                          {event.reminder ? <span>تذكير مفعّل</span> : null}
                        </div>
                        {event.details ? (
                          <p className="timeline-item__details">{event.details}</p>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'documents' && (
            <div className="tab-panel">
              {!readOnly ? (
                <div className="tab-panel__toolbar">
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setDocOpen(true)}
                  >
                    <Icon name="upload" size={18} />
                    رفع مستند
                  </button>
                </div>
              ) : null}
              {docError ? (
                <p className="mb-3 text-sm text-rose-600" role="alert">
                  {docError}
                </p>
              ) : null}
              {docsLoading ? (
                <div className="empty-panel">
                  <p>جاري تحميل المستندات...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="empty-panel">
                  <Icon name="documents" className="empty-panel__icon" />
                  <p>لا توجد مستندات مرفوعة</p>
                </div>
              ) : (
                <div className="docs-list">
                  {documents.map((doc) => (
                    <article key={doc.id} className="doc-item">
                      <div className="doc-item__icon">
                        <Icon name="folder" />
                      </div>
                      <div className="doc-item__body">
                        <h4>{doc.name}</h4>
                        <div className="doc-item__meta">
                          <span>{doc.type}</span>
                          <span>{doc.fileName}</span>
                          <span>{doc.uploadedAt}</span>
                        </div>
                        {doc.notes ? <p>{doc.notes}</p> : null}
                      </div>
                      <button
                        type="button"
                        className="action-btn action-btn--download"
                        title="تحميل"
                        aria-label={`تحميل ${doc.fileName || doc.name}`}
                        onClick={() => handleDownloadDoc(doc)}
                      >
                        <Icon name="download" size={16} />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <AddEventModal
        open={eventOpen}
        onClose={() => setEventOpen(false)}
        onSave={handleAddEvent}
      />
      <UploadDocumentModal
        open={docOpen}
        onClose={() => setDocOpen(false)}
        onSave={handleAddDocument}
        caseLabel={`${caseData.number ?? caseData.case_number} — ${caseData.title}`}
      />
    </>
  )
}
