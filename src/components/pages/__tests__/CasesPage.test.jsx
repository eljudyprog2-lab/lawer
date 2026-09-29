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
import CasesPage from '../CasesPage'
import { validateCaseForm } from '../../../api/cases'

const mock = new MockAdapter(apiClient)

const sampleCases = [
  {
    id: 1,
    company_id: 4,
    case_number: '2026/1001',
    title: 'قضية تعويض عمالي',
    short_description: 'دعوى تعويض',
    description: 'تفاصيل دعوى التعويض',
    type_id: 1,
    category_id: 1,
    client_id: 10,
    lawyer_id: 20,
    court_name: 'محكمة شمال القاهرة',
    court_circuit: 'الدائرة الثالثة',
    judge_name: 'المستشار سامح',
    court_case_number: '300/2026',
    first_session_date: '2026-08-01',
    next_session_date: '2026-09-15',
    priority: 'high',
    stage: 'court',
    status: 'active',
    client: { id: 10, full_name: 'محمد عبدالله', name: 'محمد عبدالله', phone: '01012345678' },
    lawyer: { id: 20, name: 'أحمد علي', user: { full_name: 'أحمد علي', email: 'lawyer@test.com' } },
    type: { id: 1, name: 'عمالي' },
    category: { id: 1, name: 'تعويضات' },
    events: [],
    documents: [],
  },
  {
    id: 2,
    company_id: 4,
    case_number: '2026/1002',
    title: 'نزاع تجاري',
    short_description: 'نزاع عقود',
    description: 'تفاصيل النزاع التجاري',
    type_id: 2,
    category_id: 2,
    client_id: 11,
    lawyer_id: 20,
    court_name: 'محكمة الاستئناف',
    priority: 'normal',
    stage: 'appeal',
    status: 'closed',
    client: { id: 11, full_name: 'شركة الأمل', name: 'شركة الأمل' },
    lawyer: { id: 20, name: 'أحمد علي' },
    type: { id: 2, name: 'تجاري' },
    category: { id: 2, name: 'عقود' },
    events: [],
    documents: [],
  },
]

const sampleClients = [
  { id: 10, full_name: 'محمد عبدالله', name: 'محمد عبدالله' },
  { id: 11, full_name: 'شركة الأمل', name: 'شركة الأمل' },
]

const sampleLawyers = [
  { id: 20, name: 'أحمد علي', full_name: 'أحمد علي' },
]

const sampleTypes = [
  { id: 1, name: 'عمالي' },
  { id: 2, name: 'تجاري' },
]

const sampleCategories = [
  { id: 1, name: 'تعويضات' },
  { id: 2, name: 'عقود' },
]

function renderCasesPage({ userRole = 'admin' } = {}) {
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
      <MemoryRouter initialEntries={['/cases']}>
        <ToastProvider>
          <AuthProvider>
            <CasesPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CasesPage Feature Tests', () => {
  beforeEach(() => {
    mock.reset()
    mock.onGet('/clients').reply(200, { status: true, data: sampleClients })
    mock.onGet('/lawyers').reply(200, { status: true, data: sampleLawyers })
    mock.onGet('/case-types').reply(200, { status: true, data: sampleTypes })
    mock.onGet('/case-categories').reply(200, { status: true, data: sampleCategories })
  })

  it('renders cases list fetched from real API shape', async () => {
    mock.onGet('/cases').reply(200, { status: true, data: sampleCases })
    renderCasesPage()

    expect(await screen.findByText('قضية تعويض عمالي')).toBeInTheDocument()
    expect(screen.getByText('نزاع تجاري')).toBeInTheDocument()
    expect(screen.getByText('2026/1001')).toBeInTheDocument()
    expect(screen.getByText('محمد عبدالله')).toBeInTheDocument()
  })

  it('renders empty state when no cases exist', async () => {
    mock.onGet('/cases').reply(200, { status: true, data: [] })
    renderCasesPage()

    expect(await screen.findByText('لا توجد قضايا مسجلة بعد')).toBeInTheDocument()
  })

  it('renders error state on API failure and retries successfully', async () => {
    mock.onGet('/cases').replyOnce(500, { message: 'Server error loading cases' })
    mock.onGet('/cases').reply(200, { status: true, data: sampleCases })

    renderCasesPage()

    expect(await screen.findByText('تعذر تحميل البيانات')).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /إعادة المحاولة/i })
    fireEvent.click(retryBtn)

    expect(await screen.findByText('قضية تعويض عمالي')).toBeInTheDocument()
  })

  it('filters cases by search query', async () => {
    const user = userEvent.setup()
    mock.onGet('/cases').reply(200, { status: true, data: sampleCases })
    renderCasesPage()

    expect(await screen.findByText('قضية تعويض عمالي')).toBeInTheDocument()

    const searchInput = screen.getByRole('searchbox', { name: 'بحث في القضايا' })
    await user.type(searchInput, 'نزاع')

    expect(screen.queryByText('قضية تعويض عمالي')).not.toBeInTheDocument()
    expect(screen.getByText('نزاع تجاري')).toBeInTheDocument()

    const clearBtn = screen.getByRole('button', { name: 'مسح الفلاتر' })
    await user.click(clearBtn)

    expect(screen.getByText('قضية تعويض عمالي')).toBeInTheDocument()
  })

  it('validates required fields before submitting create', async () => {
    mock.onGet('/cases').reply(200, { status: true, data: sampleCases })
    renderCasesPage()

    const addBtn = await screen.findByRole('button', { name: 'إضافة قضية' })
    fireEvent.click(addBtn)

    expect(screen.getByRole('heading', { name: 'إضافة قضية جديدة' })).toBeInTheDocument()

    const form = document.getElementById('add-case-form')
    fireEvent.submit(form)

    const numberErrors = await screen.findAllByText('رقم القضية مطلوب')
    expect(numberErrors.length).toBeGreaterThan(0)
    expect(screen.getAllByText('عنوان القضية مطلوب').length).toBeGreaterThan(0)
    expect(screen.getAllByText('نوع القضية مطلوب').length).toBeGreaterThan(0)
    expect(screen.getAllByText('الموكل مطلوب').length).toBeGreaterThan(0)
    expect(screen.getAllByText('المحامي مطلوب').length).toBeGreaterThan(0)
    expect(screen.getAllByText('اسم المحكمة مطلوب').length).toBeGreaterThan(0)
  })

  it('submits new case creation successfully', async () => {
    const user = userEvent.setup()
    mock.onGet('/cases').reply(200, { status: true, data: sampleCases })
    mock.onPost('/cases').reply(201, {
      status: true,
      data: {
        id: 3,
        company_id: 4,
        case_number: '2026/1003',
        title: 'قضية تعويض جديدة',
        court_name: 'محكمة الجيزة',
        client_id: 10,
        lawyer_id: 20,
        type_id: 1,
      },
    })

    renderCasesPage()

    const addBtn = await screen.findByRole('button', { name: 'إضافة قضية' })
    await user.click(addBtn)

    await user.type(screen.getByPlaceholderText('مثال: 2024/1234'), '2026/1003')
    await user.type(screen.getByPlaceholderText('وصف مختصر للقضية'), 'قضية تعويض جديدة')
    await user.type(screen.getByPlaceholderText('مثال: محكمة الرياض العامة'), 'محكمة الجيزة')

    await user.click(screen.getByRole('button', { name: 'نوع القضية' }))
    await user.click(await screen.findByRole('option', { name: 'عمالي' }))

    await user.click(screen.getByRole('button', { name: 'الموكل' }))
    await user.click(await screen.findByRole('option', { name: 'محمد عبدالله' }))

    await user.click(screen.getByRole('button', { name: 'المحامي المسؤول' }))
    await user.click(await screen.findByRole('option', { name: 'أحمد علي' }))

    const form = document.getElementById('add-case-form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mock.history.post.length).toBe(1)
    })

    const payload = JSON.parse(mock.history.post[0].data)
    expect(payload.case_number).toBe('2026/1003')
    expect(payload.title).toBe('قضية تعويض جديدة')
    expect(payload.court_name).toBe('محكمة الجيزة')
    expect(payload.type_id).toBe(1)
    expect(payload.client_id).toBe(10)
    expect(payload.lawyer_id).toBe(20)
  })

  it('handles API 422 validation errors with inline error display', async () => {
    const user = userEvent.setup()
    mock.onGet('/cases').reply(200, { status: true, data: sampleCases })
    mock.onPost('/cases').reply(422, {
      message: 'The given data was invalid.',
      errors: {
        case_number: ['رقم القضية مستخدم من قبل'],
      },
    })

    renderCasesPage()

    const addBtn = await screen.findByRole('button', { name: 'إضافة قضية' })
    await user.click(addBtn)

    await user.type(screen.getByPlaceholderText('مثال: 2024/1234'), '2026/1001')
    await user.type(screen.getByPlaceholderText('وصف مختصر للقضية'), 'قضية مكررة')
    await user.type(screen.getByPlaceholderText('مثال: محكمة الرياض العامة'), 'محكمة الجيزة')

    await user.click(screen.getByRole('button', { name: 'نوع القضية' }))
    await user.click(await screen.findByRole('option', { name: 'عمالي' }))

    await user.click(screen.getByRole('button', { name: 'الموكل' }))
    await user.click(await screen.findByRole('option', { name: 'محمد عبدالله' }))

    await user.click(screen.getByRole('button', { name: 'المحامي المسؤول' }))
    await user.click(await screen.findByRole('option', { name: 'أحمد علي' }))

    const form = document.getElementById('add-case-form')
    fireEvent.submit(form)

    const errors = await screen.findAllByText('رقم القضية مستخدم من قبل')
    expect(errors.length).toBeGreaterThan(0)
  })

  it('opens edit modal and submits update', async () => {
    const user = userEvent.setup()
    mock.onGet('/cases').reply(200, { status: true, data: sampleCases })
    mock.onPut('/cases/1').reply(200, {
      status: true,
      data: { ...sampleCases[0], title: 'قضية تعويض عمالي محدثة' },
    })

    renderCasesPage()

    const editBtn = await screen.findByRole('button', { name: 'تعديل قضية تعويض عمالي' })
    await user.click(editBtn)

    expect(screen.getByRole('heading', { name: 'تعديل قضية' })).toBeInTheDocument()

    const titleInput = screen.getByPlaceholderText('وصف مختصر للقضية')
    expect(titleInput).toHaveValue('قضية تعويض عمالي')

    await user.clear(titleInput)
    await user.type(titleInput, 'قضية تعويض عمالي محدثة')

    const saveBtn = screen.getByRole('button', { name: 'حفظ التعديلات' })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(mock.history.put.length).toBe(1)
    })
    expect(mock.history.put[0].url).toBe('/cases/1')
    const payload = JSON.parse(mock.history.put[0].data)
    expect(payload.title).toBe('قضية تعويض عمالي محدثة')
  })

  it('deletes a case after confirmation', async () => {
    const user = userEvent.setup()
    mock.onGet('/cases').reply(200, { status: true, data: sampleCases })
    mock.onDelete('/cases/1').reply(200, { status: true, message: 'Deleted' })

    renderCasesPage()

    const deleteBtn = await screen.findByRole('button', { name: 'حذف قضية تعويض عمالي' })
    await user.click(deleteBtn)

    expect(screen.getByText('تأكيد حذف القضية')).toBeInTheDocument()

    const confirmBtn = screen.getByRole('button', { name: 'تأكيد الحذف النهائي' })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(mock.history.delete.length).toBe(1)
    })
    expect(mock.history.delete[0].url).toBe('/cases/1')
  })

  it('opens case details modal and views tabs', async () => {
    const user = userEvent.setup()
    mock.onGet('/cases').reply(200, { status: true, data: sampleCases })
    mock.onGet('/case-documents').reply(200, { status: true, data: [] })

    renderCasesPage()

    const viewBtn = await screen.findByRole('button', { name: 'عرض قضية تعويض عمالي' })
    await user.click(viewBtn)

    expect(screen.getByText('معلومات المحكمة')).toBeInTheDocument()
    expect(screen.getByText('محكمة شمال القاهرة')).toBeInTheDocument()

    const partiesTab = screen.getByRole('tab', { name: /الأطراف/i })
    await user.click(partiesTab)
    expect(screen.getByText('الطرف الآخر — الخصم')).toBeInTheDocument()

    const docsTab = screen.getByRole('tab', { name: /المستندات/i })
    await user.click(docsTab)
    expect(await screen.findByText('لا توجد مستندات مرفوعة')).toBeInTheDocument()
  })

  it('rejects letters in court_case_number and validates numeric-only format', () => {
    const resultWithLetters = validateCaseForm({
      number: '2026/100',
      title: 'قضية',
      courtName: 'محكمة القاهرة',
      type: '1',
      client: '1',
      lawyer: '1',
      courtCaseNumber: 'تهتتتست',
    })
    expect(resultWithLetters.ok).toBe(false)
    expect(resultWithLetters.fieldErrors.courtCaseNumber).toBe('رقم الدعوى بالمحكمة يجب أن يتكون من أرقام فقط')

    const resultWithNumbers = validateCaseForm({
      number: '2026/100',
      title: 'قضية',
      courtName: 'محكمة القاهرة',
      type: '1',
      client: '1',
      lawyer: '1',
      courtCaseNumber: '12345/2026',
    })
    expect(resultWithNumbers.fieldErrors.courtCaseNumber).toBeUndefined()
  })

  it('validates incident date must be before power of attorney date with specific field names', () => {
    const res = validateCaseForm({
      number: '2026/100',
      title: 'قضية',
      courtName: 'محكمة القاهرة',
      type: '1',
      client: '1',
      lawyer: '1',
      incidentDate: '2026-10-04',
      powerOfAttorneyDate: '2026-09-07',
    })
    expect(res.ok).toBe(false)
    expect(res.fieldErrors.powerOfAttorneyDate).toBe('تاريخ الواقعة يجب أن يكون قبل تاريخ التوكيل أو يساويه')
  })
})
