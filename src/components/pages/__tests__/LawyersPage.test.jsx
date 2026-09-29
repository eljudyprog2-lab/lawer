import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MockAdapter from 'axios-mock-adapter'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { apiClient } from '../../../api/client'
import { createTestQueryClient } from '../../../test/testUtils'
import { AuthProvider } from '../../../context/AuthContext'
import { ToastProvider } from '../../../context/ToastContext'
import { writeAuthSession } from '../../../data/auth'
import LawyersPage from '../LawyersPage'
import LawyerDetailPage from '../LawyerDetailPage'

const mock = new MockAdapter(apiClient)

const sampleLawyers = [
  {
    id: 1,
    company_id: 4,
    user_id: 10,
    national_id: '12345678901234',
    bar_number: 'BAR-2026-001',
    specialization: 'جنائي',
    address: 'القاهرة',
    notes: 'محامي أول',
    user: {
      id: 10,
      full_name: 'أحمد علي',
      email: 'ahmed.ali@law.com',
      phone: '01012345678',
      role: 'lawyer',
      status: 'active',
    },
  },
  {
    id: 2,
    company_id: 4,
    user_id: 11,
    national_id: '98765432109876',
    bar_number: 'BAR-2026-002',
    specialization: 'تجاري',
    address: 'الجيزة',
    notes: 'مستشار تجاري',
    user: {
      id: 11,
      full_name: 'خالد مصطفى',
      email: 'khaled@law.com',
      phone: '01098765432',
      role: 'lawyer',
      status: 'inactive',
    },
  },
]

function renderLawyersPage() {
  const queryClient = createTestQueryClient()
  writeAuthSession({
    name: 'مدير النظام',
    email: 'admin@test.com',
    roleId: 'admin',
    role: 'المستشار العام',
    company_id: 4,
    company_name: 'مكتب المحاماة',
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/lawyers']}>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/lawyers" element={<LawyersPage />} />
              <Route path="/lawyers/:id" element={<LawyerDetailPage />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('LawyersPage Feature Tests', () => {
  beforeEach(() => {
    mock.reset()
  })

  it('renders lawyers list fetched from API', async () => {
    mock.onGet('/lawyers').reply(200, { status: true, data: sampleLawyers })
    renderLawyersPage()

    expect(await screen.findByText('أحمد علي')).toBeInTheDocument()
    expect(screen.getByText('khaled@law.com')).toBeInTheDocument()
    expect(screen.getAllByText('جنائي').length).toBeGreaterThan(0)
    expect(screen.getAllByText('تجاري').length).toBeGreaterThan(0)
  })

  it('renders empty state when no lawyers exist', async () => {
    mock.onGet('/lawyers').reply(200, { status: true, data: [] })
    renderLawyersPage()

    expect(await screen.findByText('لا يوجد محامون مسجلون بعد')).toBeInTheDocument()
  })

  it('renders error state on API failure and retries successfully', async () => {
    mock.onGet('/lawyers').replyOnce(500, { message: 'Server error loading lawyers' })
    mock.onGet('/lawyers').reply(200, { status: true, data: sampleLawyers })

    renderLawyersPage()

    expect(await screen.findByText('تعذر تحميل البيانات')).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /إعادة المحاولة/i })
    fireEvent.click(retryBtn)

    expect(await screen.findByText('أحمد علي')).toBeInTheDocument()
  })

  it('filters lawyers by search query', async () => {
    const user = userEvent.setup()
    mock.onGet('/lawyers').reply(200, { status: true, data: sampleLawyers })
    renderLawyersPage()

    expect(await screen.findByText('أحمد علي')).toBeInTheDocument()

    const searchInput = screen.getByRole('searchbox', { name: 'بحث في المحامين' })
    await user.type(searchInput, 'خالد')

    expect(screen.queryByText('أحمد علي')).not.toBeInTheDocument()
    expect(screen.getByText('خالد مصطفى')).toBeInTheDocument()

    const clearBtn = screen.getByRole('button', { name: 'مسح الفلاتر' })
    await user.click(clearBtn)

    expect(screen.getByText('أحمد علي')).toBeInTheDocument()
  })

  it('validates required fields before submitting create', async () => {
    mock.onGet('/lawyers').reply(200, { status: true, data: sampleLawyers })
    renderLawyersPage()

    const addBtn = await screen.findByRole('button', { name: 'إضافة محامي' })
    fireEvent.click(addBtn)

    expect(screen.getByRole('heading', { name: 'إضافة محامي جديد' })).toBeInTheDocument()

    const form = document.getElementById('lawyer-form')
    fireEvent.submit(form)

    const nameErrors = await screen.findAllByText('الاسم الكامل مطلوب')
    expect(nameErrors.length).toBeGreaterThan(0)
    expect(screen.getAllByText('البريد الإلكتروني مطلوب').length).toBeGreaterThan(0)
    expect(screen.getAllByText('كلمة المرور مطلوبة').length).toBeGreaterThan(0)
  })

  it('submits new lawyer creation successfully', async () => {
    const user = userEvent.setup()
    mock.onGet('/lawyers').reply(200, { status: true, data: sampleLawyers })
    mock.onPost('/users').reply(201, {
      status: true,
      data: {
        id: 12,
        full_name: 'سعيد ابراهيم',
        email: 'saeed@law.com',
        phone: '01011122233',
        role: 'lawyer',
        status: 'active',
      },
    })
    mock.onPost('/lawyers').reply(201, {
      status: true,
      data: {
        id: 3,
        company_id: 4,
        user_id: 12,
        national_id: '12345678901234',
        bar_number: 'BAR-300',
        specialization: 'جنائي',
        user: {
          id: 12,
          full_name: 'سعيد ابراهيم',
          email: 'saeed@law.com',
          phone: '01011122233',
          role: 'lawyer',
          status: 'active',
        },
      },
    })

    renderLawyersPage()

    const addBtn = await screen.findByRole('button', { name: 'إضافة محامي' })
    await user.click(addBtn)

    await user.type(screen.getByPlaceholderText('اسم المحامي بالكامل'), 'سعيد ابراهيم')
    const emailInput = document.querySelector('#lawyer-form input[type="email"]')
    await user.type(emailInput, 'saeed@law.com')
    await user.type(screen.getByPlaceholderText('05xxxxxxxx'), '01011122233')
    await user.type(screen.getByPlaceholderText('رقم الهوية للمحامي'), '12345678901234')
    await user.type(screen.getByLabelText(/رقم القيد بالنقابة/), 'BAR-300')
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123')

    const form = document.getElementById('lawyer-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mock.history.post.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('opens edit modal and submits update', async () => {
    const user = userEvent.setup()
    mock.onGet('/lawyers').reply(200, { status: true, data: sampleLawyers })
    mock.onPut('/lawyers/1').reply(200, {
      status: true,
      data: { ...sampleLawyers[0], bar_number: 'BAR-UPDATED' },
    })
    mock.onPut('/users/10').reply(200, {
      status: true,
      data: sampleLawyers[0].user,
    })

    renderLawyersPage()

    const editBtn = await screen.findByRole('button', { name: 'تعديل أحمد علي' })
    await user.click(editBtn)

    expect(screen.getByRole('heading', { name: 'تعديل المحامي' })).toBeInTheDocument()

    const barInput = screen.getByLabelText(/رقم القيد بالنقابة/)
    expect(barInput).toHaveValue('BAR-2026-001')

    await user.clear(barInput)
    await user.type(barInput, 'BAR-UPDATED')

    const form = document.getElementById('lawyer-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mock.history.put.length).toBeGreaterThanOrEqual(1)
    })
    expect(mock.history.put[0].url).toBe('/lawyers/1')
  })

  it('deletes a lawyer after confirmation', async () => {
    const user = userEvent.setup()
    mock.onGet('/lawyers').reply(200, { status: true, data: sampleLawyers })
    mock.onDelete('/lawyers/1').reply(200, { status: true, message: 'Deleted' })

    renderLawyersPage()

    const deleteBtn = await screen.findByRole('button', { name: 'حذف أحمد علي' })
    await user.click(deleteBtn)

    expect(screen.getByText('تأكيد حذف المحامي')).toBeInTheDocument()

    const confirmBtn = screen.getByRole('button', { name: 'تأكيد الحذف النهائي' })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(mock.history.delete.length).toBe(1)
    })
    expect(mock.history.delete[0].url).toBe('/lawyers/1')
  })

  it('navigates to lawyer detail page', async () => {
    const user = userEvent.setup()
    mock.onGet('/lawyers').reply(200, { status: true, data: sampleLawyers })
    mock.onGet('/lawyers/1').reply(200, { status: true, data: sampleLawyers[0] })
    mock.onGet('/cases').reply(200, { status: true, data: [] })
    mock.onGet('/appointments').reply(200, { status: true, data: [] })

    renderLawyersPage()

    const viewBtn = await screen.findByRole('button', { name: 'تفاصيل أحمد علي' })
    await user.click(viewBtn)

    expect(await screen.findByText('رقم القيد بالنقابة')).toBeInTheDocument()
    expect(screen.getByText('BAR-2026-001')).toBeInTheDocument()
  })
})
