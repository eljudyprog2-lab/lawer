import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MockAdapter from 'axios-mock-adapter'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { apiClient } from '../../../api/client'
import { createTestQueryClient } from '../../../test/testUtils'
import { AuthProvider } from '../../../context/AuthContext'
import { ToastProvider } from '../../../context/ToastContext'
import { writeAuthSession } from '../../../data/auth'
import DocumentsPage from '../DocumentsPage'

const mock = new MockAdapter(apiClient)

const sampleDocuments = [
  {
    id: 2,
    company_id: 4,
    case_id: 7,
    uploaded_by: 2,
    title: 'عقد بيع',
    description: 'نسخة من عقد البيع',
    document_type: 'Contract',
    original_name: 'عرض_سعر_1779100980684.pdf',
    file_name: '1785139220_عرض_سعر_1779100980684.pdf',
    file_path: 'uploads/documents/1785139220_عرض_سعر_1779100980684.pdf',
    file_extension: 'pdf',
    file_size: 352410,
    notes: 'نسخة أصلية',
    created_at: '2026-07-27T08:00:20.000000Z',
    updated_at: '2026-07-27T08:00:20.000000Z',
    company: { id: 4, name: 'Law Office three' },
    legal_case: { id: 7, title: 'قضية تعويض', case_number: '2026/1007' },
    user: { id: 2, full_name: 'أحمد محمد' },
  },
  {
    id: 3,
    company_id: 4,
    case_id: null,
    uploaded_by: 2,
    title: 'بطاقة هوية الموكل',
    description: 'صورة بطاقة الرقم القومي',
    document_type: 'هوية',
    original_name: 'national_id.jpg',
    file_name: '1785139999_national_id.jpg',
    file_path: 'uploads/documents/1785139999_national_id.jpg',
    file_extension: 'jpg',
    file_size: 154200,
    notes: 'سارية المفعول',
    created_at: '2026-08-01T10:00:00.000000Z',
    updated_at: '2026-08-01T10:00:00.000000Z',
    company: { id: 4, name: 'Law Office three' },
    legal_case: null,
    user: { id: 2, full_name: 'أحمد محمد' },
  },
]

const sampleCases = [
  { id: 7, title: 'قضية تعويض', case_number: '2026/1007' },
]

function renderDocumentsPage({ userRole = 'admin' } = {}) {
  const queryClient = createTestQueryClient()
  writeAuthSession({
    id: 2,
    name: 'أحمد محمد',
    email: 'admin@test.com',
    roleId: userRole,
    role: 'المستشار العام',
    company_id: 4,
    company_name: 'Law Office three',
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/documents']}>
        <ToastProvider>
          <AuthProvider>
            <DocumentsPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DocumentsPage Feature Tests', () => {
  beforeEach(() => {
    mock.reset()
    mock.onGet('/cases').reply(200, { status: true, data: sampleCases })
  })

  it('renders documents list fetched from real API shape', async () => {
    mock.onGet('/documents').reply(200, { status: true, data: sampleDocuments })
    renderDocumentsPage()

    expect(await screen.findByText('عرض_سعر_1779100980684.pdf')).toBeInTheDocument()
    expect(screen.getByText('نسخة من عقد البيع')).toBeInTheDocument()
    expect(screen.getByText('national_id.jpg')).toBeInTheDocument()
    expect(screen.getByText('صورة بطاقة الرقم القومي')).toBeInTheDocument()
    expect(screen.getByText('قضية تعويض')).toBeInTheDocument()
  })

  it('shows loading state while fetching documents', async () => {
    let resolveRequest
    const pending = new Promise((resolve) => {
      resolveRequest = () => resolve([200, { status: true, data: sampleDocuments }])
    })
    mock.onGet('/documents').reply(() => pending)

    renderDocumentsPage()
    expect(await screen.findByText('جاري تحميل المستندات...')).toBeInTheDocument()
    resolveRequest()
  })

  it('handles error state with retry button', async () => {
    mock.onGet('/documents').replyOnce(500, { message: 'Server Error' })
    renderDocumentsPage()

    expect(await screen.findByText('تعذر تحميل المستندات')).toBeInTheDocument()
    const retryBtn = screen.getByRole('button', { name: /إعادة المحاولة/ })
    expect(retryBtn).toBeInTheDocument()

    mock.onGet('/documents').reply(200, { status: true, data: sampleDocuments })
    const user = userEvent.setup()
    await user.click(retryBtn)

    expect(await screen.findByText('عرض_سعر_1779100980684.pdf')).toBeInTheDocument()
  })

  it('shows empty state when no documents exist', async () => {
    mock.onGet('/documents').reply(200, { status: true, data: [] })
    renderDocumentsPage()

    expect(await screen.findByText('لا توجد مستندات مطابقة لبحثك')).toBeInTheDocument()
  })

  it('filters documents by search query', async () => {
    mock.onGet('/documents').reply(200, { status: true, data: sampleDocuments })
    renderDocumentsPage()

    expect(await screen.findByText('عرض_سعر_1779100980684.pdf')).toBeInTheDocument()
    expect(screen.getByText('national_id.jpg')).toBeInTheDocument()

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText('بحث في المستندات...')
    await user.type(searchInput, 'هوية')

    expect(screen.queryByText('عرض_سعر_1779100980684.pdf')).not.toBeInTheDocument()
    expect(screen.getByText('national_id.jpg')).toBeInTheDocument()
  })

  it('validates required fields when uploading a document', async () => {
    mock.onGet('/documents').reply(200, { status: true, data: sampleDocuments })
    renderDocumentsPage()

    const user = userEvent.setup()
    const uploadBtn = await screen.findByRole('button', { name: /رفع مستند/ })
    await user.click(uploadBtn)

    expect(await screen.findByRole('heading', { name: 'رفع مستند جديد' })).toBeInTheDocument()

    const form = document.getElementById('docs-upload-form')
    fireEvent.submit(form)

    const fileErrors = await screen.findAllByText('يرجى اختيار ملف لرفعه')
    expect(fileErrors.length).toBeGreaterThan(0)
    const descErrors = screen.getAllByText('اسم أو وصف المستند مطلوب')
    expect(descErrors.length).toBeGreaterThan(0)
  })

  it('submits new document with FormData to API', async () => {
    mock.onGet('/documents').reply(200, { status: true, data: sampleDocuments })
    mock.onPost('/documents').reply(200, {
      status: true,
      message: 'Document uploaded successfully',
      data: {
        id: 10,
        company_id: 4,
        case_id: 7,
        title: 'عقد استشارة قانونية',
        description: 'عقد استشارة قانونية',
        document_type: 'Contract',
        original_name: 'consulting_contract.pdf',
        file_name: 'consulting_contract.pdf',
        file_path: 'uploads/documents/consulting_contract.pdf',
        file_size: 50000,
      },
    })

    renderDocumentsPage()
    const user = userEvent.setup()

    const uploadBtn = await screen.findByRole('button', { name: /رفع مستند/ })
    await user.click(uploadBtn)

    expect(await screen.findByRole('heading', { name: 'رفع مستند جديد' })).toBeInTheDocument()

    const fileInput = document.querySelector('input[type="file"]')
    const testFile = new File(['test file content'], 'consulting_contract.pdf', {
      type: 'application/pdf',
    })
    fireEvent.change(fileInput, { target: { files: [testFile] } })

    const descInput = screen.getByPlaceholderText(/مثال: عقد الإيجار/)
    await user.clear(descInput)
    await user.type(descInput, 'عقد استشارة قانونية')

    const form = document.getElementById('docs-upload-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mock.history.post.length).toBe(1)
      expect(mock.history.post[0].url).toBe('/documents')
      expect(mock.history.post[0].data).toBeInstanceOf(FormData)
    })
  })

  it('saves updated notes via PUT request to API', async () => {
    mock.onGet('/documents').reply(200, { status: true, data: sampleDocuments })
    mock.onPut('/documents/2').reply(200, {
      status: true,
      message: 'Document updated successfully',
      data: { id: 2, notes: 'ملاحظة محدثة من التيست' },
    })

    renderDocumentsPage()
    const user = userEvent.setup()

    const notesBtn = await screen.findByLabelText('ملاحظات عرض_سعر_1779100980684.pdf')
    await user.click(notesBtn)

    expect(await screen.findByRole('heading', { name: 'ملاحظات المستند' })).toBeInTheDocument()

    const notesTextarea = screen.getByPlaceholderText('اكتب ملاحظة على المستند...')
    await user.clear(notesTextarea)
    await user.type(notesTextarea, 'ملاحظة محدثة من التيست')

    const saveNotesBtn = screen.getByRole('button', { name: /حفظ الملاحظة/ })
    await user.click(saveNotesBtn)

    await waitFor(() => {
      expect(mock.history.put.length).toBe(1)
      expect(mock.history.put[0].url).toBe('/documents/2')
      const payload = JSON.parse(mock.history.put[0].data)
      expect(payload.notes).toBe('ملاحظة محدثة من التيست')
    })
  })

  it('deletes document via confirm delete modal', async () => {
    mock.onGet('/documents').reply(200, { status: true, data: sampleDocuments })
    mock.onDelete('/documents/2').reply(200, {
      status: true,
      message: 'Document deleted successfully',
    })

    renderDocumentsPage()
    const user = userEvent.setup()

    const deleteBtn = await screen.findByLabelText('حذف عرض_سعر_1779100980684.pdf')
    await user.click(deleteBtn)

    expect(await screen.findByRole('heading', { name: 'تأكيد حذف المستند' })).toBeInTheDocument()

    const confirmBtn = screen.getByRole('button', { name: /تأكيد الحذف/ })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(mock.history.delete.length).toBe(1)
      expect(mock.history.delete[0].url).toBe('/documents/2')
    })
  })
})
