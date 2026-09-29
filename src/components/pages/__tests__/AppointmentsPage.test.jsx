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
import AppointmentsPage from '../AppointmentsPage'

const mock = new MockAdapter(apiClient)

const sampleAppointments = [
  {
    id: 5,
    company_id: 4,
    lawyer_id: 2,
    client_id: 2,
    case_id: 7,
    appointment_date: '2026-08-20T00:00:00.000000Z',
    appointment_time: '11:00:00',
    notes: 'أول مقابلة مع الموكل',
    status: 'غير معين',
    appointment_type: 'استشارة',
    company: { id: 4, name: 'Law Office three' },
    lawyer: { id: 2, name: 'أحمد علي', full_name: 'أحمد علي' },
    client: { id: 2, full_name: 'أحمد محمد', phone: '01012345677' },
    legal_case: { id: 7, title: 'قضية تعويض', case_number: '2026/1007' },
  },
  {
    id: 6,
    company_id: 4,
    lawyer_id: 2,
    client_id: 2,
    case_id: null,
    appointment_date: '2026-08-25T00:00:00.000000Z',
    appointment_time: '14:00:00',
    notes: 'اجتماع تنسيقي',
    status: 'معلق',
    appointment_type: 'اجتماع',
    company: { id: 4, name: 'Law Office three' },
    lawyer: { id: 2, name: 'أحمد علي', full_name: 'أحمد علي' },
    client: { id: 2, full_name: 'أحمد محمد', phone: '01012345677' },
    legal_case: null,
  },
]

const sampleClients = [
  { id: 2, full_name: 'أحمد محمد', name: 'أحمد محمد', phone: '01012345677' },
]

const sampleLawyers = [
  { id: 2, full_name: 'أحمد علي', name: 'أحمد علي' },
]

const sampleCases = [
  { id: 7, title: 'قضية تعويض', case_number: '2026/1007' },
]

function renderAppointmentsPage({ userRole = 'admin' } = {}) {
  const queryClient = createTestQueryClient()
  writeAuthSession({
    name: 'مدير النظام',
    email: 'admin@test.com',
    roleId: userRole,
    role: 'المستشار العام',
    company_id: 4,
    company_name: 'مكتب المحاماة',
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/appointments']}>
        <ToastProvider>
          <AuthProvider>
            <AppointmentsPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AppointmentsPage Feature Tests', () => {
  beforeEach(() => {
    mock.reset()
    mock.onGet('/clients').reply(200, { status: true, data: sampleClients })
    mock.onGet('/lawyers').reply(200, { status: true, data: sampleLawyers })
    mock.onGet('/cases').reply(200, { status: true, data: sampleCases })
  })

  it('renders appointments list fetched from real API shape', async () => {
    mock.onGet('/appointments').reply(200, { status: true, data: sampleAppointments })
    renderAppointmentsPage()

    expect(await screen.findByText('أول مقابلة مع الموكل')).toBeInTheDocument()
    expect(screen.getByText('اجتماع تنسيقي')).toBeInTheDocument()
    expect(screen.getAllByText('أحمد محمد').length).toBeGreaterThan(0)
    expect(screen.getByText('قضية تعويض')).toBeInTheDocument()
  })

  it('shows loading state while fetching appointments', async () => {
    let resolveRequest
    const pending = new Promise((resolve) => {
      resolveRequest = () => resolve([200, { status: true, data: sampleAppointments }])
    })
    mock.onGet('/appointments').reply(() => pending)

    renderAppointmentsPage()
    expect(await screen.findByText('جاري تحميل المواعيد...')).toBeInTheDocument()
    resolveRequest()
  })

  it('handles error state with retry button', async () => {
    mock.onGet('/appointments').replyOnce(500, { message: 'Server Error' })
    renderAppointmentsPage()

    expect(await screen.findByText('تعذر تحميل البيانات')).toBeInTheDocument()
    const retryBtn = screen.getByRole('button', { name: /إعادة المحاولة/ })
    expect(retryBtn).toBeInTheDocument()

    mock.onGet('/appointments').reply(200, { status: true, data: sampleAppointments })
    const user = userEvent.setup()
    await user.click(retryBtn)

    expect(await screen.findByText('أول مقابلة مع الموكل')).toBeInTheDocument()
  })

  it('shows empty state when no appointments exist', async () => {
    mock.onGet('/appointments').reply(200, { status: true, data: [] })
    renderAppointmentsPage()

    expect(await screen.findByText('لا توجد مواعيد مطابقة')).toBeInTheDocument()
  })

  it('filters appointments by search query', async () => {
    mock.onGet('/appointments').reply(200, { status: true, data: sampleAppointments })
    renderAppointmentsPage()

    expect(await screen.findByText('أول مقابلة مع الموكل')).toBeInTheDocument()
    expect(screen.getByText('اجتماع تنسيقي')).toBeInTheDocument()

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(/اسم الموكل، الهاتف، القضية/)
    await user.type(searchInput, 'تنسيقي')

    expect(screen.queryByText('أول مقابلة مع الموكل')).not.toBeInTheDocument()
    expect(screen.getByText('اجتماع تنسيقي')).toBeInTheDocument()
  })

  it('validates required fields when booking a new appointment', async () => {
    mock.onGet('/appointments').reply(200, { status: true, data: sampleAppointments })
    renderAppointmentsPage()

    const user = userEvent.setup()
    const bookBtn = await screen.findByRole('button', { name: /حجز موعد/ })
    await user.click(bookBtn)

    expect(await screen.findByRole('heading', { name: 'حجز موعد جديد' })).toBeInTheDocument()

    const form = document.getElementById('appointment-form')
    fireEvent.submit(form)

    const clientErrors = await screen.findAllByText('الموكل مطلوب')
    expect(clientErrors.length).toBeGreaterThan(0)
    expect(screen.getAllByText('هذا الحقل مطلوب').length).toBeGreaterThan(0)
  })

  it('submits updated appointment form to API', async () => {
    mock.onGet('/appointments').reply(200, { status: true, data: sampleAppointments })
    mock.onPut('/appointments/5').reply(200, {
      status: true,
      message: 'Appointment updated successfully',
      data: {
        id: 5,
        company_id: 4,
        client_id: 2,
        lawyer_id: 2,
        appointment_date: '2026-08-20',
        appointment_time: '11:00:00',
        appointment_type: 'استشارة',
        status: 'غير معين',
        notes: 'ملاحظات محدثة',
      },
    })

    renderAppointmentsPage()
    const user = userEvent.setup()

    const editBtns = await screen.findAllByTitle('تعديل الموعد')
    await user.click(editBtns[0])

    expect(await screen.findByRole('heading', { name: 'تعديل الموعد' })).toBeInTheDocument()

    const notesTextarea = screen.getByPlaceholderText('اكتب أي ملاحظات عن الموعد...')
    await user.clear(notesTextarea)
    await user.type(notesTextarea, 'ملاحظات محدثة')

    const form = document.getElementById('appointment-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mock.history.put.length).toBe(1)
      const sent = JSON.parse(mock.history.put[0].data)
      expect(sent.notes).toBe('ملاحظات محدثة')
      expect(mock.history.put[0].url).toBe('/appointments/5')
    })
  })

  it('confirms appointment status via API update', async () => {
    mock.onGet('/appointments').reply(200, { status: true, data: sampleAppointments })
    mock.onPut('/appointments/5').reply(200, {
      status: true,
      message: 'Updated successfully',
      data: { id: 5, status: 'مؤكد' },
    })

    renderAppointmentsPage()
    const user = userEvent.setup()

    const confirmActionBtns = await screen.findAllByTitle('تأكيد الموعد')
    await user.click(confirmActionBtns[0])

    expect(await screen.findByRole('heading', { name: 'تأكيد الموعد' })).toBeInTheDocument()
    const confirmModalBtn = screen.getByRole('button', { name: 'نعم، تأكيد الموعد' })
    await user.click(confirmModalBtn)

    await waitFor(() => {
      expect(mock.history.put.length).toBe(1)
      const putData = JSON.parse(mock.history.put[0].data)
      expect(putData.status).toBe('مؤكد')
    })
  })

  it('deletes appointment via confirm delete modal', async () => {
    mock.onGet('/appointments').reply(200, { status: true, data: sampleAppointments })
    mock.onDelete('/appointments/5').reply(200, {
      status: true,
      message: 'Appointment deleted successfully',
    })

    renderAppointmentsPage()
    const user = userEvent.setup()

    const deleteBtns = await screen.findAllByTitle('حذف الموعد')
    await user.click(deleteBtns[0])

    expect(await screen.findByRole('heading', { name: 'تأكيد حذف الموعد' })).toBeInTheDocument()
    const confirmDeleteBtn = screen.getByRole('button', { name: 'تأكيد الحذف النهائي' })
    await user.click(confirmDeleteBtn)

    await waitFor(() => {
      expect(mock.history.delete.length).toBe(1)
      expect(mock.history.delete[0].url).toBe('/appointments/5')
    })
  })
})
