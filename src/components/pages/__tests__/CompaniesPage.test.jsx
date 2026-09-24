import { beforeEach, describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MockAdapter from 'axios-mock-adapter'
import { apiClient } from '../../../api/client'
import CompaniesPage from '../CompaniesPage'
import { renderWithQuery } from '../../../test/testUtils'

const mock = new MockAdapter(apiClient)

const companies = [
  {
    id: 4,
    name: 'Law Office three',
    email: 'lawofficethree@test.com',
    phone: '01011121133',
    address: 'Cairo',
    logo: null,
    subscription_plan: 'professional',
    subscription_start: '2026-07-15T00:00:00.000000Z',
    subscription_end: '2027-07-15T00:00:00.000000Z',
    status: 'active',
  },
  {
    id: 2,
    name: 'Law Office',
    email: 'lawup@test.com',
    phone: '01011111112',
    address: 'Cairo',
    logo: null,
    subscription_plan: 'basic',
    subscription_start: '2026-07-17T00:00:00.000000Z',
    subscription_end: '2027-07-17T00:00:00.000000Z',
    status: 'active',
  },
]

describe('Section Company — CompaniesPage', () => {
  beforeEach(() => {
    mock.reset()
  })

  it('fetches and renders list from API', async () => {
    mock.onGet('/companies').reply(200, { status: true, data: companies })
    renderWithQuery(<CompaniesPage />)

    expect(await screen.findByText('Law Office three')).toBeInTheDocument()
    expect(screen.getByText('Law Office')).toBeInTheDocument()
    expect(screen.getByText(/عرض 2 من أصل 2 مكتب/)).toBeInTheDocument()
  })

  it('shows loading state while fetching', async () => {
    let resolveRequest
    const pending = new Promise((resolve) => {
      resolveRequest = () => resolve([200, { status: true, data: companies }])
    })
    mock.onGet('/companies').reply(() => pending)

    renderWithQuery(<CompaniesPage />)
    expect(await screen.findByText('جاري تحميل بيانات المستأجرين...')).toBeInTheDocument()

    resolveRequest()
    expect(await screen.findByText('Law Office three')).toBeInTheDocument()
  })

  it('shows empty state when list is empty', async () => {
    mock.onGet('/companies').reply(200, { status: true, data: [] })
    renderWithQuery(<CompaniesPage />)

    expect(await screen.findByText('لا توجد مكاتب مسجّلة بعد')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /إضافة أول مكتب/ })).toBeInTheDocument()
  })

  it('shows error message on API failure', async () => {
    mock.onGet('/companies').reply(500, { message: 'Server error' })
    renderWithQuery(<CompaniesPage />)

    expect(await screen.findByText('تعذر تحميل البيانات')).toBeInTheDocument()
    expect(screen.getByText('Server error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /إعادة المحاولة/ })).toBeInTheDocument()
  })

  it('create form submits correct payload to API', async () => {
    const user = userEvent.setup()
    mock.onGet('/companies').reply(200, { status: true, data: [] })
    mock.onPost('/companies').reply((config) => {
      expect(config.data).toBeInstanceOf(FormData)
      expect(config.data.get('name')).toBe('مكتب الاختبار')
      expect(config.data.get('email')).toBe('test@firm.com')
      expect(config.data.get('phone')).toBe('0500000000')
      expect(config.data.get('address')).toBe('الرياض')
      expect(config.data.get('subscription_plan')).toBe('basic')
      expect(config.data.get('status')).toBe('active')
      return [
        201,
        {
          status: true,
          data: {
            id: 10,
            name: 'مكتب الاختبار',
            email: 'test@firm.com',
            phone: '0500000000',
            address: 'الرياض',
            logo: null,
            subscription_plan: 'basic',
            subscription_start: '2026-01-01T00:00:00.000000Z',
            subscription_end: '2027-01-01T00:00:00.000000Z',
            status: 'active',
          },
        },
      ]
    })

    renderWithQuery(<CompaniesPage />)
    await screen.findByText('لا توجد مكاتب مسجّلة بعد')

    await user.click(screen.getByRole('button', { name: /إضافة مكتب/i }))
    expect(await screen.findByText('إضافة شركة جديدة')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/اسم الشركة/), 'مكتب الاختبار')
    await user.type(screen.getByLabelText(/البريد الإلكتروني/), 'test@firm.com')
    await user.type(screen.getByLabelText(/رقم الهاتف/), '0500000000')
    await user.type(screen.getByLabelText(/العنوان/), 'الرياض')

    await user.click(screen.getByRole('button', { name: /إنشاء الشركة/ }))

    await waitFor(() => {
      expect(mock.history.post.length).toBeGreaterThan(0)
    })
  })

  it('update form pre-fills existing data and submits updated payload', async () => {
    const user = userEvent.setup()
    mock.onGet('/companies').reply(200, { status: true, data: [companies[0]] })
    mock.onPost('/companies/4').reply((config) => {
      expect(config.data.get('_method')).toBe('PUT')
      expect(config.data.get('name')).toBe('Law Office three Updated')
      return [
        200,
        { status: true, data: { ...companies[0], name: 'Law Office three Updated' } },
      ]
    })

    renderWithQuery(<CompaniesPage />)
    await screen.findByText('Law Office three')

    await user.click(screen.getByLabelText('تعديل Law Office three'))
    expect(await screen.findByText('تعديل الشركة')).toBeInTheDocument()

    const nameInput = screen.getByLabelText(/اسم الشركة/)
    expect(nameInput).toHaveValue('Law Office three')
    expect(screen.getByLabelText(/البريد الإلكتروني/)).toHaveValue('lawofficethree@test.com')

    await user.clear(nameInput)
    await user.type(nameInput, 'Law Office three Updated')
    await user.click(screen.getByRole('button', { name: /حفظ التعديلات/ }))

    await waitFor(() => {
      expect(mock.history.post.some((r) => r.url === '/companies/4')).toBe(true)
    })
  })

  it('delete triggers confirmation then API call then list refresh', async () => {
    const user = userEvent.setup()
    let listPayload = [companies[0]]
    mock.onGet('/companies').reply(() => [200, { status: true, data: listPayload }])
    mock.onDelete('/companies/4').reply(() => {
      listPayload = []
      return [200, { status: true }]
    })

    renderWithQuery(<CompaniesPage />)
    await screen.findByText('Law Office three')

    await user.click(screen.getByLabelText('حذف Law Office three'))
    expect(await screen.findByText('حذف المكتب')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /تأكيد الحذف/ }))

    await waitFor(() => {
      expect(mock.history.delete.some((r) => r.url === '/companies/4')).toBe(true)
    })

    await waitFor(() => {
      expect(screen.getByText('لا توجد مكاتب مسجّلة بعد')).toBeInTheDocument()
    })
  })
})
