import { beforeEach, describe, expect, it } from 'vitest'
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
import InvoicesPage from '../InvoicesPage'

const mock = new MockAdapter(apiClient)

const sampleInvoices = [
  {
    id: 2,
    company_id: 4,
    invoice_number: 'INV-2026-002',
    client_id: 2,
    case_id: 7,
    issue_date: '2026-07-23T00:00:00.000000Z',
    due_date: '2026-08-23T00:00:00.000000Z',
    description: 'أتعاب القضية الجنائية',
    total_amount: '5000.00',
    paid_amount: '1000.00',
    remaining_amount: '4000.00',
    status: 'paid',
    payment_method: 'cash',
    notes: 'تم دفع جزء من المبلغ',
    created_at: '2026-07-27T06:43:56.000000Z',
    updated_at: '2026-07-27T06:43:56.000000Z',
    company: { id: 4, name: 'Law Office three' },
    client: { id: 2, full_name: 'أحمد محمد', phone: '01012345677' },
    legal_case: { id: 7, title: 'قضية تعويض', case_number: '2026/1007' },
  },
  {
    id: 3,
    company_id: 4,
    invoice_number: 'INV-2026-003',
    client_id: 2,
    case_id: null,
    issue_date: '2026-08-01T00:00:00.000000Z',
    due_date: '2026-09-01T00:00:00.000000Z',
    description: 'استشارة قانونية وتوثيق عقود',
    total_amount: '2000.00',
    paid_amount: '0.00',
    remaining_amount: '2000.00',
    status: 'unpaid',
    payment_method: 'bank_transfer',
    notes: '',
    created_at: '2026-08-01T08:00:00.000000Z',
    updated_at: '2026-08-01T08:00:00.000000Z',
    company: { id: 4, name: 'Law Office three' },
    client: { id: 2, full_name: 'أحمد محمد', phone: '01012345677' },
    legal_case: null,
  },
]

const sampleClients = [
  { id: 2, full_name: 'أحمد محمد', name: 'أحمد محمد', phone: '01012345677' },
]

const sampleCases = [
  { id: 7, title: 'قضية تعويض', case_number: '2026/1007' },
]

function renderInvoicesPage({ userRole = 'admin' } = {}) {
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
      <MemoryRouter initialEntries={['/invoices']}>
        <ToastProvider>
          <AuthProvider>
            <InvoicesPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('InvoicesPage Feature Tests', () => {
  beforeEach(() => {
    mock.reset()
    mock.onGet('/invoices/payments-dashboard').reply(200, {
      status: true,
      summary: {
        total_invoices: '7000.00',
        total_paid: '1000.00',
        total_remaining: '6000.00',
        total_overdue: '4000.00',
      },
      counts: { all: 2, unpaid: 1, paid: 1, overdue: 1, partial: 0 },
      data: sampleInvoices,
    })
    mock.onGet('/clients').reply(200, { status: true, data: sampleClients })
    mock.onGet('/cases').reply(200, { status: true, data: sampleCases })
  })

  it('renders invoices list fetched from real API shape', async () => {
    mock.onGet('/invoices').reply(200, { status: true, data: sampleInvoices })
    renderInvoicesPage()

    expect(await screen.findByText('INV-2026-002')).toBeInTheDocument()
    expect(screen.getByText('أتعاب القضية الجنائية')).toBeInTheDocument()
    expect(screen.getByText('INV-2026-003')).toBeInTheDocument()
    expect(screen.getByText('استشارة قانونية وتوثيق عقود')).toBeInTheDocument()
    expect(screen.getAllByText('أحمد محمد').length).toBeGreaterThan(0)
  })

  it('shows loading state while fetching invoices', async () => {
    let resolveRequest
    const pending = new Promise((resolve) => {
      resolveRequest = () => resolve([200, { status: true, data: sampleInvoices }])
    })
    mock.onGet('/invoices').reply(() => pending)

    renderInvoicesPage()
    expect(await screen.findByText('جاري تحميل الفواتير...')).toBeInTheDocument()
    resolveRequest()
  })

  it('handles error state with retry button', async () => {
    mock.onGet('/invoices').replyOnce(500, { message: 'Server Error' })
    renderInvoicesPage()

    expect(await screen.findByText('تعذر تحميل الفواتير')).toBeInTheDocument()
    const retryBtn = screen.getByRole('button', { name: /إعادة المحاولة/ })
    expect(retryBtn).toBeInTheDocument()

    mock.onGet('/invoices').reply(200, { status: true, data: sampleInvoices })
    const user = userEvent.setup()
    await user.click(retryBtn)

    expect(await screen.findByText('INV-2026-002')).toBeInTheDocument()
  })

  it('shows empty state when no invoices exist', async () => {
    mock.onGet('/invoices').reply(200, { status: true, data: [] })
    renderInvoicesPage()

    expect(await screen.findByText('لا توجد فواتير')).toBeInTheDocument()
  })

  it('filters invoices by search query', async () => {
    mock.onGet('/invoices').reply(200, { status: true, data: sampleInvoices })
    renderInvoicesPage()

    expect(await screen.findByText('INV-2026-002')).toBeInTheDocument()
    expect(screen.getByText('INV-2026-003')).toBeInTheDocument()

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText('بحث في الفواتير...')
    await user.type(searchInput, 'عقود')

    expect(screen.queryByText('INV-2026-002')).not.toBeInTheDocument()
    expect(screen.getByText('INV-2026-003')).toBeInTheDocument()
  })

  it('validates required fields when creating an invoice', async () => {
    mock.onGet('/invoices').reply(200, { status: true, data: sampleInvoices })
    renderInvoicesPage()

    const user = userEvent.setup()
    const addBtn = await screen.findByRole('button', { name: /إضافة فاتورة/ })
    await user.click(addBtn)

    expect(await screen.findByRole('heading', { name: 'إضافة فاتورة جديدة' })).toBeInTheDocument()

    const form = document.getElementById('invoice-form')
    fireEvent.submit(form)

    const clientErrors = await screen.findAllByText('الموكل مطلوب')
    expect(clientErrors.length).toBeGreaterThan(0)
    const descErrors = screen.getAllByText('وصف الفاتورة مطلوب')
    expect(descErrors.length).toBeGreaterThan(0)
    const totalErrors = screen.getAllByText('المبلغ الإجمالي مطلوب')
    expect(totalErrors.length).toBeGreaterThan(0)
  })

  it('submits new invoice to API', async () => {
    mock.onGet('/invoices').reply(200, { status: true, data: sampleInvoices })
    mock.onPost('/invoices').reply(200, {
      status: true,
      message: 'Invoice created successfully',
      data: {
        id: 11,
        company_id: 4,
        invoice_number: 'INV-2026-999',
        client_id: 2,
        case_id: 7,
        issue_date: '2026-09-28',
        due_date: '2026-10-28',
        description: 'فاتورة صياغة مذكرة دفاع',
        total_amount: 3000,
        paid_amount: 0,
        remaining_amount: 3000,
        status: 'unpaid',
      },
    })

    renderInvoicesPage()
    const user = userEvent.setup()

    const addBtn = await screen.findByRole('button', { name: /إضافة فاتورة/ })
    await user.click(addBtn)

    expect(await screen.findByRole('heading', { name: 'إضافة فاتورة جديدة' })).toBeInTheDocument()

    // Select client
    const clientSelect = screen.getByLabelText('الموكل')
    await user.click(clientSelect)
    const clientOption = await screen.findByRole('option', { name: 'أحمد محمد' })
    await user.click(clientOption)

    // Description
    const descInput = screen.getByPlaceholderText(/أتعاب قانونية، استشارة/)
    await user.type(descInput, 'فاتورة صياغة مذكرة دفاع')

    // Total amount
    const totalInput = screen.getByPlaceholderText('0.00')
    await user.clear(totalInput)
    await user.type(totalInput, '3000')

    const form = document.getElementById('invoice-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mock.history.post.length).toBe(1)
      expect(mock.history.post[0].url).toBe('/invoices')
      const sent = JSON.parse(mock.history.post[0].data)
      expect(sent.total_amount).toBe(3000)
      expect(sent.description).toBe('فاتورة صياغة مذكرة دفاع')
      expect(sent.client_id).toBe(2)
    })
  })

  it('records payment on an invoice via API update', async () => {
    mock.onGet('/invoices').reply(200, { status: true, data: sampleInvoices })
    mock.onPut('/invoices/2').reply(200, {
      status: true,
      message: 'Payment recorded',
      data: { id: 2, paid_amount: 2000, status: 'partial' },
    })

    renderInvoicesPage()
    const user = userEvent.setup()

    const payBtns = await screen.findAllByTitle('تسجيل دفعة')
    await user.click(payBtns[0])

    expect(await screen.findByRole('heading', { name: 'تسجيل دفعة على الفاتورة' })).toBeInTheDocument()

    const amountInput = screen.getByLabelText(/المبلغ المدفوع/)
    await user.clear(amountInput)
    await user.type(amountInput, '1000')

    const form = document.getElementById('payment-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mock.history.put.length).toBe(1)
      expect(mock.history.put[0].url).toBe('/invoices/2')
      const sent = JSON.parse(mock.history.put[0].data)
      expect(sent.paid_amount).toBe(2000)
    })
  })

  it('deletes invoice via confirm delete modal', async () => {
    mock.onGet('/invoices').reply(200, { status: true, data: sampleInvoices })
    mock.onDelete('/invoices/2').reply(200, {
      status: true,
      message: 'Invoice deleted successfully',
    })

    renderInvoicesPage()
    const user = userEvent.setup()

    const deleteBtns = await screen.findAllByTitle('حذف')
    await user.click(deleteBtns[0])

    expect(await screen.findByRole('heading', { name: 'تأكيد حذف الفاتورة' })).toBeInTheDocument()

    const confirmBtn = screen.getByRole('button', { name: /تأكيد الحذف/ })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(mock.history.delete.length).toBe(1)
      expect(mock.history.delete[0].url).toBe('/invoices/2')
    })
  })
})
