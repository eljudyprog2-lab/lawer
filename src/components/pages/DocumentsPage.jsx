import { useEffect, useMemo, useState } from 'react'
import { HiOutlineExclamationCircle, HiOutlineRefresh } from 'react-icons/hi'
import { Icon } from '../ui/Icon'
import { FilterSelect } from '../ui/FilterSelect'
import { StatCard } from '../dashboard/StatCard'
import { UploadDocumentModal } from '../documents/UploadDocumentModal'
import { DocumentDetailsModal } from '../documents/DocumentDetailsModal'
import { DocumentNotesModal } from '../documents/DocumentNotesModal'
import { useAuth } from '../../context/AuthContext'
import { useDocuments, useDocumentMutations } from '../../hooks/useDocuments'
import { useCases } from '../../hooks/useCases'
import { getStoredCompanyId } from '../../api/client'
import {
  buildDocumentFormData,
  documentTypeOptions,
  downloadDocumentFile,
  formatFileSize,
  formatMimeLabel,
  parseApiError,
} from '../../api/documents'

function calcPageDocumentsStats(documents) {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()

  const linked = documents.filter((doc) => doc.caseId).length
  const thisMonth = documents.filter((doc) => {
    const iso = String(doc.uploadedAt || '')
    if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return false
    const [y, m] = iso.slice(0, 10).split('-').map(Number)
    return y === year && m - 1 === month
  }).length
  const totalBytes = documents.reduce((sum, doc) => sum + (doc.sizeBytes || 0), 0)

  return {
    total: documents.length,
    linked,
    thisMonth,
    spaceUsed: formatFileSize(totalBytes),
  }
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const isLawyer = user?.roleId === 'lawyer'
  const isClient = user?.roleId === 'client'
  const isAdmin = !isLawyer && !isClient
  const { documents, isLoading, error, refetch, isFetching } = useDocuments()
  const { cases } = useCases()
  const { create, update, remove } = useDocumentMutations()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [caseFilter, setCaseFilter] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [detailsId, setDetailsId] = useState(null)
  const [notesId, setNotesId] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const id = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(id)
  }, [toast])

  const showToast = (text, tone = 'success') => setToast({ text, tone })

  const caseOptions = useMemo(
    () =>
      cases.map((item) => ({
        id: String(item.id),
        title: item.title,
        number: item.number || item.case_number,
      })),
    [cases],
  )

  const stats = useMemo(() => {
    const base = calcPageDocumentsStats(documents)
    const images = documents.filter((doc) =>
      String(doc.mimeType || '').startsWith('image/'),
    ).length
    return { ...base, images }
  }, [documents])

  const hasActiveFilters = Boolean(query.trim() || typeFilter || caseFilter)

  const clearFilters = () => {
    setQuery('')
    setTypeFilter('')
    setCaseFilter('')
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return documents.filter((doc) => {
      if (typeFilter && doc.docType !== typeFilter) return false
      if (caseFilter === 'none' && doc.caseId) return false
      if (caseFilter && caseFilter !== 'none' && doc.caseId !== caseFilter) return false
      if (!q) return true
      return [doc.fileName, doc.description, doc.docType, doc.caseTitle, doc.mimeType]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [documents, query, typeFilter, caseFilter])

  const detailsDoc = documents.find((item) => item.id === detailsId) || null
  const notesDoc = documents.find((item) => item.id === notesId) || null

  const handleUpload = async (form) => {
    const fd = buildDocumentFormData(form, {
      companyId: getStoredCompanyId(),
      uploadedBy: user?.id,
    })
    try {
      await create.mutateAsync(fd)
      showToast('تم رفع المستند بنجاح')
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
      throw err
    }
  }

  const handleDelete = async (id) => {
    try {
      await remove.mutateAsync(id)
      if (detailsId === id) setDetailsId(null)
      if (notesId === id) setNotesId(null)
      showToast('تم حذف المستند')
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
    }
  }

  const handleSaveNotes = async (id, notes) => {
    try {
      await update.mutateAsync({ id, values: { notes } })
      showToast('تم حفظ الملاحظة')
    } catch (err) {
      showToast(parseApiError(err).message, 'error')
      throw err
    }
  }

  const handleDownload = async (doc) => {
    try {
      await downloadDocumentFile(doc)
      showToast('جاري تحميل الملف...')
    } catch (err) {
      showToast(err?.message || parseApiError(err).message || 'تعذر تحميل الملف', 'error')
    }
  }

  const handleExportCsv = () => {
    const lines = [
      'اسم الملف,الوصف,النوع,الحجم,القضية,تاريخ الرفع',
      ...filtered.map((doc) =>
        [
          doc.fileName,
          doc.description,
          doc.docType,
          formatFileSize(doc.sizeBytes),
          doc.caseTitle || '—',
          doc.uploadedAt,
        ].join(','),
      ),
    ].join('\n')
    const blob = new Blob(['\ufeff' + lines], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'documents.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    showToast('تم تصدير القائمة')
  }

  return (
    <div className="documents-page">
      {toast ? (
        <div
          className={`toast toast--${toast.tone === 'error' ? 'error' : 'success'}`}
          role="status"
        >
          {toast.text}
        </div>
      ) : null}

      <div className="stats-grid">
        <StatCard
          value={stats.total}
          label="إجمالي المستندات"
          tone="gold"
          icon="documents"
          index={0}
        />
        <StatCard
          value={stats.linked}
          label="مرتبطة بقضايا"
          tone="teal"
          icon="cases"
          index={1}
        />
        <StatCard
          value={isLawyer ? stats.images : stats.thisMonth}
          label={isLawyer ? 'عدد الصور' : 'هذا الشهر'}
          tone="muted"
          icon={isLawyer ? 'documents' : 'calendar'}
          index={2}
        />
        <StatCard
          value={stats.spaceUsed}
          label="المساحة المستخدمة"
          tone="success"
          icon="folder"
          index={3}
        />
      </div>

      <div className="cases-toolbar">
        <h2 className="cases-toolbar__title">المستندات</h2>
        <div className="cases-toolbar__actions documents-toolbar__actions">
          <button
            type="button"
            className="btn btn--ghost inline-flex items-center gap-2"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            title="تحديث"
          >
            <HiOutlineRefresh
              size={18}
              className={isFetching ? 'animate-spin' : undefined}
              aria-hidden
            />
            تحديث
          </button>
          <div className="search-field">
            <Icon name="search" className="search-field__icon" />
            <input
              className="search-field__input"
              type="search"
              placeholder="بحث في المستندات..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="بحث في المستندات"
            />
          </div>
          <FilterSelect
            value={typeFilter}
            onChange={setTypeFilter}
            aria-label="تصفية حسب النوع"
            options={[
              { value: '', label: 'كل الأنواع' },
              ...documentTypeOptions.map((opt) => ({ value: opt, label: opt })),
            ]}
          />
          <FilterSelect
            value={caseFilter}
            onChange={setCaseFilter}
            aria-label="تصفية حسب القضية"
            options={[
              { value: '', label: 'كل القضايا' },
              { value: 'none', label: 'بدون قضية' },
              ...caseOptions.map((item) => ({ value: item.id, label: item.title })),
            ]}
          />
          {hasActiveFilters ? (
            <button type="button" className="btn btn--ghost" onClick={clearFilters}>
              مسح الفلاتر
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setUploadOpen(true)}
          >
            <Icon name="upload" size={18} />
            رفع مستند
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleExportCsv}
          >
            <Icon name="download" size={18} />
            تصدير
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="table-card flex flex-col items-center gap-4 px-6 py-12 text-center">
          <HiOutlineRefresh size={28} className="animate-spin text-gold" aria-hidden />
          <p>جاري تحميل المستندات...</p>
        </div>
      ) : null}

      {!isLoading && error ? (
        <div className="table-card flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <HiOutlineExclamationCircle size={28} aria-hidden />
          </span>
          <div>
            <p className="font-display text-base font-bold text-brand">تعذر تحميل المستندات</p>
            <p className="mt-1 text-sm text-[#6b7f80]">{error}</p>
          </div>
          <button
            type="button"
            className="btn btn--primary inline-flex items-center gap-2"
            onClick={() => refetch()}
          >
            <HiOutlineRefresh size={18} aria-hidden />
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="table-card">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>اسم الملف</th>
                  <th>الحجم</th>
                  <th>النوع</th>
                  <th>القضية</th>
                  <th>تاريخ الرفع</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="data-table__empty">
                      لا توجد مستندات مطابقة لبحثك
                    </td>
                  </tr>
                ) : (
                  filtered.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <div className="doc-file-cell">
                          <span className="doc-file-cell__name">{doc.fileName}</span>
                          <span className="doc-file-cell__desc">{doc.description}</span>
                        </div>
                      </td>
                      <td>{formatFileSize(doc.sizeBytes)}</td>
                      <td>
                        <span className="doc-mime">
                          {formatMimeLabel(doc.mimeType, doc.fileName)}
                        </span>
                      </td>
                      <td>{doc.caseTitle || '—'}</td>
                      <td>{doc.uploadedAt}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="action-btn action-btn--download"
                            title="تحميل"
                            aria-label={`تحميل ${doc.fileName}`}
                            onClick={() => handleDownload(doc)}
                          >
                            <Icon name="download" size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-btn action-btn--view-gold"
                            title="تفاصيل"
                            aria-label={`تفاصيل ${doc.fileName}`}
                            onClick={() => setDetailsId(doc.id)}
                          >
                            <Icon name="eye" size={16} />
                          </button>
                          {!isClient && (
                            <button
                              type="button"
                              className="action-btn action-btn--notes"
                              title="ملاحظات"
                              aria-label={`ملاحظات ${doc.fileName}`}
                              onClick={() => setNotesId(doc.id)}
                            >
                              <Icon name="annotation" size={16} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              className="action-btn action-btn--delete"
                              title="حذف"
                              aria-label={`حذف ${doc.fileName}`}
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Icon name="trash" size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSave={handleUpload}
        caseOptions={caseOptions}
      />

      <DocumentDetailsModal
        open={Boolean(detailsDoc)}
        document={detailsDoc}
        onClose={() => setDetailsId(null)}
        onDownload={handleDownload}
        onDelete={isAdmin ? handleDelete : undefined}
        canDelete={isAdmin}
      />

      <DocumentNotesModal
        open={Boolean(notesDoc)}
        document={notesDoc}
        onClose={() => setNotesId(null)}
        onSave={handleSaveNotes}
      />
    </div>
  )
}
