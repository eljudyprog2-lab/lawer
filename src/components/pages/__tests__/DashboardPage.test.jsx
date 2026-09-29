import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import MockAdapter from 'axios-mock-adapter'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { apiClient } from '../../../api/client'
import { createTestQueryClient } from '../../../test/testUtils'
import { AuthProvider } from '../../../context/AuthContext'
import { ToastProvider } from '../../../context/ToastContext'
import { writeAuthSession } from '../../../data/auth'
import DashboardPage from '../DashboardPage'

const mock = new MockAdapter(apiClient)

const sampleDashboardData = {
  statistics: {
    clients: 5,
    active_cases: 2,
    today_appointments: 1,
    success_rate: 95,
  },
  upcoming_appointments: [],
  latest_cases: [],
  latest_activities: [
    {
      id: 1,
      title: 'تم إنشاء قضية جديدة',
      description: 'تم إنشاء القضية بنجاح',
      type: 'case',
      reference_id: '10',
      created_at: new Date().toISOString(),
    },
  ],
}

const sampleCases = [
  { id: 1, case_number: '2026/101', title: 'قضية تعويض', status: 'active', created_at: '2026-08-01' },
  { id: 2, case_number: '2026/102', title: 'قضية عمالية', status: 'closed', created_at: '2026-08-05' },
]

const sampleAppointments = [
  { id: 1, appointment_date: new Date().toISOString(), status: 'مؤكد' },
]

const sampleSessions = [
  { id: 1, session_date: new Date().toISOString(), status: 'مجدولة' },
]

const sampleInvoices = [
  { id: 1, total_amount: 10000, paid_amount: 4000, status: 'partial' },
]

function renderDashboardPage({ userRole = 'admin' } = {}) {
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
      <MemoryRouter initialEntries={['/']}>
        <ToastProvider>
          <AuthProvider>
            <DashboardPage />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DashboardPage Feature Tests', () => {
  beforeEach(() => {
    mock.reset()
    mock.onGet('/dashboard').reply(200, { status: true, data: sampleDashboardData })
    mock.onGet('/clients').reply(200, { status: true, data: [] })
    mock.onGet('/cases').reply(200, { status: true, data: sampleCases })
    mock.onGet('/appointments').reply(200, { status: true, data: sampleAppointments })
    mock.onGet('/court-sessions').reply(200, { status: true, data: sampleSessions })
    mock.onGet('/invoices').reply(200, { status: true, data: sampleInvoices })
  })

  it('renders KPI stat cards calculated from real API records', async () => {
    renderDashboardPage()

    expect(await screen.findByText('قضايا')).toBeInTheDocument()
    expect(screen.getByText('مواعيدي')).toBeInTheDocument()
    expect(screen.getByText('مواعيد اليوم')).toBeInTheDocument()
    expect(screen.getByText('الرصيد')).toBeInTheDocument()
    expect(screen.getByText('إجمالي القضايا')).toBeInTheDocument()
    expect(screen.getByText('قضايا منتهية')).toBeInTheDocument()
  })

  it('renders panels: activities, cases, appointments', async () => {
    renderDashboardPage()

    expect(await screen.findByText('آخر الأنشطة')).toBeInTheDocument()
    expect(screen.getByText('تم إنشاء قضية جديدة')).toBeInTheDocument()
    expect(screen.getByText('آخر تحديثات القضايا')).toBeInTheDocument()
    expect(screen.getByText('قضية تعويض')).toBeInTheDocument()
  })

  it('renders error state on API failure and retries successfully', async () => {
    mock.reset()
    mock.onGet('/dashboard').reply(500, { message: 'Server error' })
    mock.onGet('/clients').reply(500, { message: 'Server error' })
    mock.onGet('/cases').reply(500, { message: 'Server error' })
    mock.onGet('/appointments').reply(500, { message: 'Server error' })

    renderDashboardPage()

    expect(await screen.findByText('تعذر تحميل البيانات')).toBeInTheDocument()

    mock.onGet('/dashboard').reply(200, { status: true, data: sampleDashboardData })
    mock.onGet('/clients').reply(200, { status: true, data: [] })
    mock.onGet('/cases').reply(200, { status: true, data: sampleCases })
    mock.onGet('/appointments').reply(200, { status: true, data: sampleAppointments })
    mock.onGet('/court-sessions').reply(200, { status: true, data: sampleSessions })
    mock.onGet('/invoices').reply(200, { status: true, data: sampleInvoices })

    const retryBtn = screen.getByRole('button', { name: /إعادة المحاولة/i })
    fireEvent.click(retryBtn)

    expect(await screen.findByText('قضايا')).toBeInTheDocument()
  })

  it('renders client role dashboard view when logged in as client', async () => {
    renderDashboardPage({ userRole: 'client' })

    expect(await screen.findByText('آخر الأنشطة')).toBeInTheDocument()
  })

  it('renders lawyer role dashboard view when logged in as lawyer', async () => {
    renderDashboardPage({ userRole: 'lawyer' })

    expect(await screen.findByText('آخر الأنشطة')).toBeInTheDocument()
  })
})
